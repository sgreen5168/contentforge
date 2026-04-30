import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoEngine.module.css';

const API = import.meta.env.VITE_VIDEO_API_URL || 'http://localhost:3002';

const PERSONAS = [
  { id: 'testimonial', name: 'Testimonial',   desc: 'Personal user experience' },
  { id: 'demo',        name: 'Product Demo',  desc: 'Step-by-step showcase' },
  { id: 'influencer',  name: 'Influencer',    desc: 'Trendy high-energy style' },
  { id: 'educator',    name: 'Educator',       desc: 'Expert tips and how-to' },
  { id: 'ugc',         name: 'UGC Creator',   desc: 'Authentic raw content' },
];

const STYLES = ['ugc', 'cinematic', 'lifestyle', 'studio', 'talking_head'];

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',          maxSec: 600 },
  { id: 'instagram', label: 'Instagram Reels',  maxSec: 90  },
  { id: 'youtube',   label: 'YouTube Shorts',   maxSec: 60  },
];

// Preset quick-select durations
const PRESETS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
];

function formatDuration(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function getSceneCount(secs) {
  return Math.max(3, Math.round(secs / 5));
}

function getEstimatedCost(secs) {
  const clipCost  = (secs / 5) * 5 * 0.05;   // RunwayML ~$0.05/sec
  const voiceCost = (secs / 30) * 0.05;        // ElevenLabs ~$0.05/30s
  const aiCost    = 0.01;                       // Claude script
  return (clipCost + voiceCost + aiCost).toFixed(2);
}

function getPlatformWarnings(secs, platforms) {
  return PLATFORMS
    .filter(p => platforms.includes(p.id) && secs > p.maxSec)
    .map(p => `${p.label} max is ${formatDuration(p.maxSec)}`);
}

export default function VideoEngine() {
  const [tab, setTab]           = useState('generate');
  const [inputMode, setMode]    = useState('topic');
  const [topic, setTopic]       = useState('');
  const [url, setUrl]           = useState('');
  const [affiliateUrl, setAff]  = useState('');
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDuration] = useState(30);   // now a number in seconds
  const [style, setStyle]       = useState('ugc');
  const [platforms, setPlats]   = useState(['tiktok']);
  const [autoUpload, setAuto]   = useState(false);
  const [generating, setGen]    = useState(false);
  const [jobId, setJobId]       = useState(null);
  const [job, setJob]           = useState(null);
  const [jobs, setJobs]         = useState([]);
  const [vslDuration, setVslDur]= useState(60);
  const [vslForm, setVsl]       = useState({ product:'', price:'', audience:'', pain:'', solution:'' });
  const [vslResult, setVslRes]  = useState(null);
  const pollRef                 = useRef(null);

  function togglePlat(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  // Max allowed duration = lowest platform limit among selected platforms
  const maxDuration = platforms.length > 0
    ? Math.min(...platforms.map(id => PLATFORMS.find(p => p.id === id)?.maxSec || 600))
    : 600;

  // Clamp if user selects a more restrictive platform
  useEffect(() => {
    if (duration > maxDuration) setDuration(maxDuration);
  }, [maxDuration]);

  const warnings = getPlatformWarnings(duration, platforms);
  const sceneCount = getSceneCount(duration);
  const estimatedCost = getEstimatedCost(duration);

  async function generate() {
    if (!topic && !url && !affiliateUrl) return;
    setGen(true); setJob(null); setJobId(null);
    try {
      const body = {
        inputMode, topic, url, affiliateUrl, persona,
        duration: `${duration}s`,   // send as string e.g. "30s" for backend compat
        durationSeconds: duration,  // also send raw number
        style, platforms, autoUpload
      };
      const res = await fetch(`${API}/api/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobId(data.jobId);
      pollJob(data.jobId);
    } catch (err) {
      setGen(false);
      alert('Generation failed: ' + err.message);
    }
  }

  function pollJob(id) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/video/job/${id}`);
        const data = await res.json();
        setJob(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollRef.current);
          setGen(false);
          loadJobs();
        }
      } catch {}
    }, 2000);
  }

  async function loadJobs() {
    try {
      const res = await fetch(`${API}/api/video/jobs`);
      const data = await res.json();
      setJobs(data);
    } catch {}
  }

  async function generateVSL() {
    if (!vslForm.product || !vslForm.audience || !vslForm.pain) return;
    setGen(true);
    try {
      const res = await fetch(`${API}/api/vsl/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vslForm, duration: vslDuration, affiliateUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVslRes(data.script);
    } catch (err) {
      alert('VSL generation failed: ' + err.message);
    } finally { setGen(false); }
  }

  useEffect(() => { loadJobs(); return () => clearInterval(pollRef.current); }, []);

  const hasInput = inputMode === 'topic' ? topic.trim() : inputMode === 'url' ? url.trim() : affiliateUrl.trim();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          AI Video Engine
          <span className={styles.badge}>Phase 1 MVP</span>
        </h1>
        <p className={styles.sub}>Generate, voice, assemble and publish short-form videos from any topic, URL, or affiliate link</p>
      </div>

      <div className={styles.tabs}>
        {[['generate','Generate Video'],['vsl','VSL Builder'],['jobs','Job History'],['upload','Upload']].map(([t,l]) =>
          <button key={t} className={`${styles.tab} ${tab===t?styles.activeTab:''}`} onClick={()=>setTab(t)}>{l}</button>
        )}
      </div>

      {tab === 'generate' && (
        <div className={styles.grid}>
          <div className={styles.composer}>
            <div className={styles.inputTabs}>
              {[['topic','Topic'],['url','URL'],['affiliate','Affiliate Link']].map(([m,l]) =>
                <button key={m} className={`${styles.itab} ${inputMode===m?styles.activeItab:''}`} onClick={()=>setMode(m)}>{l}</button>
              )}
            </div>
            <div className={styles.composerBody}>
              {inputMode==='topic'    && <><label className={styles.label}>Topic or keyword</label><input className={styles.input} placeholder='"5 morning habits that changed my life"' value={topic} onChange={e=>setTopic(e.target.value)} /></>}
              {inputMode==='url'      && <><label className={styles.label}>Webpage URL</label><input className={styles.input} placeholder='https://example.com/product' value={url} onChange={e=>setUrl(e.target.value)} /></>}
              {inputMode==='affiliate'&& <><label className={styles.label}>Affiliate product link</label><input className={styles.input} placeholder='https://amazon.com/dp/...' value={affiliateUrl} onChange={e=>setAff(e.target.value)} /></>}

              <label className={styles.label}>Persona style</label>
              <div className={styles.chipGrid}>
                {PERSONAS.map(p => (
                  <button key={p.id} className={`${styles.personaChip} ${persona===p.id?styles.activeChip:''}`} onClick={()=>setPersona(p.id)}>
                    <div className={styles.chipName}>{p.name}</div>
                    <div className={styles.chipDesc}>{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* ── DURATION SLIDER ── */}
              <label className={styles.label}>Video duration</label>
              <div className={styles.sliderCard}>
                <div className={styles.sliderTop}>
                  <div className={styles.sliderDisplay}>
                    <span className={styles.sliderBig}>{formatDuration(duration)}</span>
                    <span className={styles.sliderSub}>{sceneCount} scenes · ~${estimatedCost} est. cost</span>
                  </div>
                  <div className={styles.presetRow}>
                    {PRESETS.map(p => (
                      <button
                        key={p.value}
                        className={`${styles.preset} ${duration===p.value?styles.activePreset:''}`}
                        onClick={()=>setDuration(Math.min(p.value, maxDuration))}
                      >{p.label}</button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max={maxDuration}
                  step="1"
                  value={duration}
                  onChange={e=>setDuration(Number(e.target.value))}
                  className={styles.durationSlider}
                />
                <div className={styles.sliderTicks}>
                  <span>10s</span>
                  <span>30s</span>
                  <span>1m</span>
                  {maxDuration > 60 && <span>{formatDuration(maxDuration)}</span>}
                </div>
                {warnings.length > 0 && (
                  <div className={styles.warnBox}>
                    {warnings.map((w,i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}
              </div>

              <div className={styles.row}>
                <div style={{flex:1}}>
                  <label className={styles.label}>Visual style</label>
                  <select className={styles.select} value={style} onChange={e=>setStyle(e.target.value)}>
                    {STYLES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>

              <label className={styles.label}>Publish to</label>
              <div className={styles.platRow}>
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    className={`${styles.platChip} ${platforms.includes(p.id)?styles.activePlat:''}`}
                    onClick={()=>togglePlat(p.id)}
                  >
                    <span className={styles.platName}>{p.label}</span>
                    <span className={styles.platMax}>max {formatDuration(p.maxSec)}</span>
                  </button>
                ))}
              </div>

              <div className={styles.generateBar}>
                <label className={styles.toggleRow}>
                  <div className={styles.toggle}>
                    <input type="checkbox" checked={autoUpload} onChange={e=>setAuto(e.target.checked)} />
                    <span className={styles.sliderToggle} />
                  </div>
                  Auto-upload after generation
                </label>
                <button
                  className={styles.genBtn}
                  onClick={generate}
                  disabled={generating || !hasInput || !platforms.length}
                >
                  {generating ? <><span className={styles.spinner} /> Generating…</> : 'Generate Video ⚡'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.progress}>
            {job && (
              <div className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <span className={`${styles.statusBadge} ${styles['status_'+job.status]}`}>{job.status}</span>
                  <span className={styles.jobStep}>{job.step}</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{width: job.progress + '%'}} />
                </div>
                <div className={styles.progressPct}>{Math.round(job.progress)}%</div>
                {job.status === 'completed' && job.result && (
                  <div className={styles.result}>
                    {job.result.script && (
                      <div className={styles.scriptCard}>
                        <div className={styles.scriptLabel}>Hook</div>
                        <div className={styles.scriptText}>{job.result.script.hook}</div>
                        <div className={styles.scriptLabel} style={{marginTop:8}}>Full script</div>
                        <div className={styles.scriptText}>{job.result.script.fullScript}</div>
                        <div className={styles.scriptLabel} style={{marginTop:8}}>CTA</div>
                        <div className={styles.scriptText}>{job.result.script.cta}</div>
                        {job.result.script.hashtags && (
                          <div className={styles.hashtags}>{job.result.script.hashtags.join(' ')}</div>
                        )}
                      </div>
                    )}
                    {job.result.finalVideo && (
                      <div className={styles.videoResult}>
                        <video controls style={{width:'100%',borderRadius:8,marginTop:12}}>
                          <source src={`${API}${job.result.finalVideo.url}`} type="video/mp4" />
                        </video>
                        <a className={styles.downloadBtn} href={`${API}${job.result.finalVideo.url}`} download>
                          Download Video
                        </a>
                      </div>
                    )}
                    {job.result.uploadResults?.length > 0 && (
                      <div className={styles.uploadResults}>
                        <div className={styles.scriptLabel}>Upload results</div>
                        {job.result.uploadResults.map((r,i) => (
                          <div key={i} className={`${styles.uploadRow} ${r.status==='failed'?styles.uploadFail:styles.uploadOk}`}>
                            {r.platform} — {r.status}
                            {r.error && <span style={{fontSize:11}}> ({r.error})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {job.status === 'failed' && (
                  <div className={styles.errorBox}>⚠ {job.error}</div>
                )}
              </div>
            )}
            {!job && !generating && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>▶</div>
                <div className={styles.emptyText}>Your generated video will appear here</div>
                <div className={styles.emptyHint}>Fill in the form and click Generate Video</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'vsl' && (
        <div className={styles.vslPage}>
          <div className={styles.composer}>
            <div className={styles.composerBody}>
              <label className={styles.label}>Product name</label>
              <input className={styles.input} placeholder='"ProSkin Serum"' value={vslForm.product} onChange={e=>setVsl(v=>({...v,product:e.target.value}))} />
              <div className={styles.row}>
                <div style={{flex:1}}>
                  <label className={styles.label}>Price</label>
                  <input className={styles.input} placeholder='$49.99' value={vslForm.price} onChange={e=>setVsl(v=>({...v,price:e.target.value}))} />
                </div>
                <div style={{flex:2}}>
                  <label className={styles.label}>Target audience</label>
                  <input className={styles.input} placeholder='Women 25-45 with dry skin' value={vslForm.audience} onChange={e=>setVsl(v=>({...v,audience:e.target.value}))} />
                </div>
              </div>
              <label className={styles.label}>Main pain point</label>
              <input className={styles.input} placeholder='Struggling with dry, dull skin' value={vslForm.pain} onChange={e=>setVsl(v=>({...v,pain:e.target.value}))} />
              <label className={styles.label}>Your solution</label>
              <input className={styles.input} placeholder='24-hour hydration formula' value={vslForm.solution} onChange={e=>setVsl(v=>({...v,solution:e.target.value}))} />
              <label className={styles.label}>Affiliate link (optional)</label>
              <input className={styles.input} placeholder='https://your-affiliate-link.com' value={affiliateUrl} onChange={e=>setAff(e.target.value)} />

              {/* VSL duration slider */}
              <label className={styles.label}>VSL duration</label>
              <div className={styles.sliderCard}>
                <div className={styles.sliderTop}>
                  <div className={styles.sliderDisplay}>
                    <span className={styles.sliderBig}>{formatDuration(vslDuration)}</span>
                    <span className={styles.sliderSub}>{getSceneCount(vslDuration)} scenes · ~${getEstimatedCost(vslDuration)} est. cost</span>
                  </div>
                  <div className={styles.presetRow}>
                    {[30,45,60,90].map(v => (
                      <button key={v} className={`${styles.preset} ${vslDuration===v?styles.activePreset:''}`} onClick={()=>setVslDur(v)}>{formatDuration(v)}</button>
                    ))}
                  </div>
                </div>
                <input type="range" min="15" max="90" step="1" value={vslDuration} onChange={e=>setVslDur(Number(e.target.value))} className={styles.durationSlider} />
                <div className={styles.sliderTicks}><span>15s</span><span>30s</span><span>60s</span><span>90s</span></div>
              </div>

              <button className={styles.genBtn} style={{width:'100%',marginTop:12}} onClick={generateVSL} disabled={generating||!vslForm.product||!vslForm.audience||!vslForm.pain}>
                {generating ? <><span className={styles.spinner} /> Writing VSL…</> : 'Generate VSL Script ⚡'}
              </button>
            </div>
          </div>
          {vslResult && (
            <div className={styles.scriptCard} style={{marginTop:16}}>
              {[['Hook',vslResult.hook],['Problem',vslResult.problemAgitation],['Solution',vslResult.solutionReveal],['Social proof',vslResult.socialProof],['Urgency',vslResult.urgency],['CTA',vslResult.cta]].map(([l,v]) => v && (
                <div key={l} style={{marginBottom:12}}>
                  <div className={styles.scriptLabel}>{l}</div>
                  <div className={styles.scriptText}>{v}</div>
                </div>
              ))}
              <div className={styles.scriptLabel}>Full script</div>
              <div className={styles.scriptText}>{vslResult.fullScript}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'jobs' && (
        <div>
          {jobs.length === 0 ? (
            <div className={styles.emptyState}>No jobs yet — generate your first video!</div>
          ) : jobs.map(j => (
            <div key={j.id} className={styles.jobRow} onClick={() => { setJob(j); setTab('generate'); }}>
              <span className={`${styles.statusBadge} ${styles['status_'+j.status]}`}>{j.status}</span>
              <span className={styles.jobText}>{j.data?.topic || j.data?.url || j.data?.affiliateUrl || 'Video job'}</span>
              <span className={styles.jobMeta}>{j.data?.persona} · {j.data?.duration} · {new Date(j.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'upload' && (
        <div className={styles.uploadPage}>
          <div className={styles.credCard}>
            <div className={styles.scriptLabel}>Platform connections</div>
            <div className={styles.credHint}>Add API keys to your .env file to enable auto-upload</div>
            {PLATFORMS.map(p => (
              <div key={p.id} className={styles.credRow}>
                <span className={styles.credName}>{p.label}</span>
                <span className={styles.credStatus}>Set {p.id.toUpperCase()}_ACCESS_TOKEN in .env</span>
              </div>
            ))}
          </div>
          <div className={styles.credCard} style={{marginTop:16}}>
            <div className={styles.scriptLabel}>API keys needed</div>
            {[
              ['RunwayML','RUNWAY_API_KEY','runwayml.com'],
              ['ElevenLabs','ELEVENLABS_API_KEY','elevenlabs.io'],
              ['TikTok','TIKTOK_ACCESS_TOKEN','developers.tiktok.com'],
              ['Instagram','INSTAGRAM_ACCESS_TOKEN','developers.facebook.com'],
              ['YouTube','YOUTUBE_ACCESS_TOKEN','console.cloud.google.com'],
            ].map(([name,key,url]) => (
              <div key={key} className={styles.credRow}>
                <span className={styles.credName}>{name}</span>
                <code className={styles.credKey}>{key}</code>
                <a href={`https://${url}`} target="_blank" rel="noreferrer" className={styles.credLink}>Get key →</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
