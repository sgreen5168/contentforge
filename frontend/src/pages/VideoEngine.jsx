import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoEngine.module.css';

const API = 'https://api.contentstudiohub.com';

const VIDEO_TYPES = [
  { id: 'ugc-persona',  name: 'UGC Persona',          desc: 'Authentic conversational review' },
  { id: 'ai-vsl',       name: 'AI VSL',                desc: 'Video sales letter' },
  { id: 'hybrid-vsl',   name: 'Hybrid VSL',            desc: 'Avatar + B-roll mix',             badge: 'New' },
  { id: 'reel-ads',     name: 'Reel Ads',              desc: 'Short vertical TikTok ads' },
  { id: 'product-ads',  name: 'Product Ads',           desc: 'Direct-response e-commerce' },
  { id: 'commercial',   name: 'Commercial',            desc: 'Brand cinematic format' },
  { id: 'competitor',   name: 'Competitor Replicator', desc: 'Replicate competitor structure',  badge: 'New', wide: true },
];

const PERSONAS = [
  { id: 'testimonial', name: 'Testimonial',  desc: 'Personal experience' },
  { id: 'demo',        name: 'Product Demo', desc: 'Step-by-step' },
  { id: 'influencer',  name: 'Influencer',   desc: 'High energy' },
  { id: 'educator',    name: 'Educator',     desc: 'Expert tips' },
  { id: 'ugc',         name: 'UGC Creator',  desc: 'Authentic raw' },
];

const PLATFORMS = [
  { id: 'tiktok',     label: 'TikTok',           maxSec: 600,   maxSize: '4GB',   personal: false },
  { id: 'instagram',  label: 'Instagram Reels',  maxSec: 90,    maxSize: '1GB',   personal: true  },
  { id: 'youtube',    label: 'YouTube Shorts',   maxSec: 60,    maxSize: '256GB', personal: false },
  { id: 'fb-reels',   label: 'Facebook Reels',   maxSec: 90,    maxSize: '4GB',   personal: true  },
  { id: 'fb-feed',    label: 'Facebook Feed',    maxSec: 14400, maxSize: '10GB',  personal: true  },
  { id: 'reddit',     label: 'Reddit',           maxSec: 900,   maxSize: '1GB',   personal: false },
];

const STYLES = ['ugc', 'cinematic', 'lifestyle', 'studio', 'talking_head'];

function fmt(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}
function scenes(s) { return Math.max(3, Math.round(s / 5)); }
function costRunway(s) { return (scenes(s) * 5 * 0.05).toFixed(2); }
function costEleven(s) { return (s / 30 * 0.05).toFixed(2); }
function costTotal(s) { return (parseFloat(costRunway(s)) + parseFloat(costEleven(s)) + 0.01).toFixed(2); }

export default function VideoEngine() {
  const [tab, setTab]           = useState('generate');
  const [rightTab, setRTab]     = useState('pipeline');
  const [smartMode, setSmart]   = useState(true);
  const [videoType, setVType]   = useState('ugc-persona');
  const [inputMode, setMode]    = useState('topic');
  const [topic, setTopic]       = useState('');
  const [url, setUrl]           = useState('');
  const [affiliateUrl, setAff]  = useState('');
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDur]      = useState(30);
  const [style, setStyle]       = useState('ugc');
  const [platforms, setPlats]   = useState(['tiktok']);
  const [autoUpload, setAuto]   = useState(false);
  const [generating, setGen]    = useState(false);
  const [job, setJob]           = useState(null);
  const [jobs, setJobs]         = useState([]);
  const [vslForm, setVsl]       = useState({ product:'', price:'', audience:'', pain:'', solution:'' });
  const [vslResult, setVR]      = useState(null);
  const pollRef                 = useRef(null);

  const maxDur = platforms.length
    ? Math.min(...platforms.map(id => PLATFORMS.find(p => p.id === id)?.maxSec || 600))
    : 600;

  useEffect(() => { if (duration > maxDur) setDur(maxDur); }, [maxDur]);

  const warnings = PLATFORMS.filter(p => platforms.includes(p.id) && duration > p.maxSec)
    .map(p => `${p.label} max is ${fmt(p.maxSec)}`);

  function togglePlat(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  const hasInput = inputMode === 'topic' ? topic.trim() : inputMode === 'url' ? url.trim() : affiliateUrl.trim();

  async function generate() {
    if (!hasInput || !platforms.length) return;
    setGen(true); setJob(null); setRTab('result');
    try {
      const res = await fetch(`${API}/api/video/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode, topic, url, affiliateUrl, persona,
          duration: `${duration}s`, durationSeconds: duration,
          style, platforms, autoUpload,
          videoType: smartMode ? 'auto' : videoType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${API}/api/video/job/${data.jobId}`);
          const j = await r.json();
          setJob(j);
          if (j.status === 'completed' || j.status === 'failed') {
            clearInterval(pollRef.current);
            setGen(false);
            loadJobs();
          }
        } catch {}
      }, 2000);
    } catch (e) { setGen(false); alert('Generation failed: ' + e.message); }
  }

  async function generateVSL() {
    if (!vslForm.product) return;
    setGen(true);
    try {
      const res = await fetch(`${API}/api/vsl/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vslForm, duration, affiliateUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVR(data.script);
    } catch (e) { alert('VSL failed: ' + e.message); }
    finally { setGen(false); }
  }

  async function loadJobs() {
    try {
      const res = await fetch(`${API}/api/video/jobs`);
      setJobs(await res.json());
    } catch {}
  }

  useEffect(() => { loadJobs(); return () => clearInterval(pollRef.current); }, []);

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandIcon}>▶</div>
          <div>
            <div className={styles.brandName}>AI Video Engine <span className={styles.brandVer}>2.0</span></div>
            <div className={styles.brandSub}>Multi-format · Smart mode · 6 platforms</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.pillLive}>● Claude live</span>
          <span className={styles.pillR2}>☁ R2</span>
          <span className={styles.pillDb}>◈ Supabase</span>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div className={styles.metrics}>
        {[
          { val: jobs.length || '0', lbl: 'Videos generated', delta: `↑ ${jobs.filter(j=>j.status==='completed').length} completed` },
          { val: `$${costTotal(duration)}`, lbl: 'Est. cost per video', delta: `${scenes(duration)} scenes · ${fmt(duration)}` },
          { val: jobs.length ? Math.round(jobs.filter(j=>j.status==='completed').length/jobs.length*100)+'%' : '—', lbl: 'Success rate', delta: 'All time' },
          { val: '~4m', lbl: 'Avg generation time', delta: 'Script + voice + clips' },
        ].map((m, i) => (
          <div key={i} className={styles.metric}>
            <div className={styles.metricVal}>{m.val}</div>
            <div className={styles.metricLbl}>{m.lbl}</div>
            <div className={styles.metricDelta}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Nav tabs ── */}
      <div className={styles.navTabs}>
        {[['generate','Generate'],['vsl','VSL Builder'],['jobs','Job History'],['upload','API Setup']].map(([t,l]) => (
          <button key={t} className={`${styles.navTab} ${tab===t?styles.navTabActive:''}`} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === 'generate' && (
        <div className={styles.grid}>
          {/* ── LEFT ── */}
          <div className={styles.panel}>
            <div className={styles.panelHdr}>
              <span className={styles.panelTitle}>Source & mode</span>
              <span className={styles.panelSub} id="smartLbl">{smartMode ? 'Smart mode on' : 'Manual mode'}</span>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.inputTabs}>
                {[['topic','Topic'],['url','URL'],['affiliate','Affiliate']].map(([m,l]) => (
                  <button key={m} className={`${styles.itab} ${inputMode===m?styles.itabActive:''}`} onClick={()=>setMode(m)}>{l}</button>
                ))}
              </div>

              {inputMode==='topic'    && <input className={styles.inp} placeholder='"morning productivity habits"' value={topic} onChange={e=>setTopic(e.target.value)} />}
              {inputMode==='url'      && <input className={styles.inp} placeholder='https://example.com/product' value={url} onChange={e=>setUrl(e.target.value)} />}
              {inputMode==='affiliate'&& <input className={styles.inp} placeholder='https://affiliate.link/product' value={affiliateUrl} onChange={e=>setAff(e.target.value)} />}

              <div className={styles.smartRow}>
                <div>
                  <div className={styles.smartTitle}>Smart mode</div>
                  <div className={styles.smartDesc}>{smartMode ? 'Auto-selects best format for your input' : 'Manually choose a video type below'}</div>
                </div>
                <label className={styles.tog}>
                  <input type="checkbox" checked={smartMode} onChange={e=>setSmart(e.target.checked)} />
                  <span className={styles.togS} />
                </label>
              </div>

              <div className={styles.fieldLbl}>Video type</div>
              <div className={styles.vtypeGrid}>
                {VIDEO_TYPES.map(vt => (
                  <button key={vt.id} className={`${styles.vtype} ${vt.wide?styles.vtypeWide:''} ${!smartMode&&videoType===vt.id?styles.vtypeSel:''} ${smartMode?styles.vtypeDim:''}`}
                    onClick={() => !smartMode && setVType(vt.id)}>
                    <div className={styles.vtypeName}>{vt.name}{vt.badge&&<span className={styles.vtypeBadge}>{vt.badge}</span>}</div>
                    <div className={styles.vtypeDesc}>{vt.desc}</div>
                  </button>
                ))}
              </div>

              <div className={styles.fieldLbl}>Persona</div>
              <div className={styles.personaGrid}>
                {PERSONAS.map(p => (
                  <button key={p.id} className={`${styles.persona} ${persona===p.id?styles.personaSel:''}`} onClick={()=>setPersona(p.id)}>
                    <div className={styles.personaName}>{p.name}</div>
                    <div className={styles.personaDesc}>{p.desc}</div>
                  </button>
                ))}
              </div>

              <div className={styles.fieldLbl}>Duration</div>
              <div className={styles.sliderCard}>
                <div className={styles.sliderTop}>
                  <div>
                    <span className={styles.durBig}>{fmt(duration)}</span>
                    <span className={styles.durSub}>{scenes(duration)} scenes</span>
                  </div>
                  <div className={styles.presets}>
                    {[15,30,45,60].map(v => (
                      <button key={v} className={`${styles.preset} ${duration===v?styles.presetOn:''}`}
                        onClick={()=>setDur(Math.min(v,maxDur))}>{v}s</button>
                    ))}
                  </div>
                </div>
                <input type="range" min="10" max={maxDur} step="1" value={duration}
                  onChange={e=>setDur(Number(e.target.value))} className={styles.slider} />
                <div className={styles.sliderTicks}><span>10s</span><span>30s</span><span>1m</span><span>{fmt(maxDur)}</span></div>
              </div>

              <div className={styles.costCard}>
                <div className={styles.costRow}><span>RunwayML clips</span><span>${costRunway(duration)}</span></div>
                <div className={styles.costRow}><span>ElevenLabs voice</span><span>${costEleven(duration)}</span></div>
                <div className={styles.costRow}><span>Claude script</span><span>$0.01</span></div>
                <div className={styles.costTotal}><span>Estimated total</span><span>${costTotal(duration)}</span></div>
              </div>

              <div className={styles.fieldLbl}>Publish to</div>
              <div className={styles.platGrid}>
                {PLATFORMS.map(p => (
                  <button key={p.id} className={`${styles.plat} ${platforms.includes(p.id)?styles.platOn:''}`} onClick={()=>togglePlat(p.id)}>
                    <div className={styles.platTop}>
                      <span className={styles.platName}>{p.label}</span>
                      <span className={`${styles.platCheck} ${platforms.includes(p.id)?styles.platCheckOn:''}`}>{platforms.includes(p.id)?'✓':''}</span>
                    </div>
                    <div className={styles.platMeta}>
                      <span>Max {fmt(p.maxSec)}</span>
                      <span>{p.maxSize}</span>
                    </div>
                    {p.personal && <span className={styles.platPersonal}>Your account</span>}
                  </button>
                ))}
              </div>

              {warnings.length > 0 && (
                <div className={styles.warnBox}>{warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}</div>
              )}

              <div className={styles.genBar}>
                <label className={styles.togRow}>
                  <label className={styles.tog}>
                    <input type="checkbox" checked={autoUpload} onChange={e=>setAuto(e.target.checked)} />
                    <span className={styles.togS} />
                  </label>
                  Auto-upload
                </label>
                <button className={styles.genBtn} onClick={generate} disabled={generating||!hasInput||!platforms.length}>
                  {generating ? <><span className={styles.spinner} /> Generating…</> : 'Generate ⚡'}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className={styles.panel}>
            <div className={styles.rightTabs}>
              {[['pipeline','Pipeline'],['features','Features'],['result','Result']].map(([t,l]) => (
                <button key={t} className={`${styles.rtab} ${rightTab===t?styles.rtabActive:''}`} onClick={()=>setRTab(t)}>{l}</button>
              ))}
            </div>

            {rightTab === 'pipeline' && (
              <div className={styles.panelBody}>
                {[
                  {n:1,done:true, title:'Script generation',  tag:'Claude AI',    desc:'Hook · problem · solution · CTA · scene descriptions'},
                  {n:2,done:true, title:'Voiceover',          tag:'ElevenLabs',   desc:'Persona-matched voice · MP3 saved to R2'},
                  {n:3,idle:true, title:'Video clips',        tag:'RunwayML',     desc:'AI scene generation · 9:16 vertical · gen4_turbo'},
                  {n:4,idle:true, title:'Cloud storage',      tag:'Cloudflare R2',desc:'Permanent video URL · zero egress fees'},
                  {n:5,idle:true, title:'Publish',            tag:'6 platforms',  desc:'TikTok · Instagram · YouTube · Facebook · Reddit'},
                ].map(s => (
                  <div key={s.n} className={styles.step}>
                    <div className={`${styles.stepNum} ${s.done?styles.stepDone:styles.stepIdle}`}>{s.n}</div>
                    <div>
                      <div className={styles.stepTitle}>
                        {s.title}
                        <span className={`${styles.stepTag} ${s.done?styles.tagDone:styles.tagWait}`}>{s.tag}</span>
                      </div>
                      <div className={styles.stepDesc}>{s.desc}</div>
                    </div>
                  </div>
                ))}

                <div className={styles.apiGrid}>
                  {[
                    {name:'Claude AI',      ok:true,  desc:'Scripts'},
                    {name:'ElevenLabs',     ok:true,  desc:'Voice'},
                    {name:'RunwayML',       ok:true,  desc:'Video'},
                    {name:'Cloudflare R2',  ok:true,  desc:'Storage'},
                    {name:'Supabase',       ok:true,  desc:'Database'},
                    {name:'Reddit',         ok:false, desc:'Not connected'},
                  ].map((a,i) => (
                    <div key={i} className={styles.apiRow}>
                      <span className={styles.apiName}>{a.name}</span>
                      <span className={`${styles.apiDot} ${a.ok?styles.apiOk:styles.apiOff}`} />
                      <span className={styles.apiDesc}>{a.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'features' && (
              <div className={styles.panelBody}>
                <div className={styles.featSection}>
                  <div className={styles.featTitle}>Visual style</div>
                  <select className={styles.sel} value={style} onChange={e=>setStyle(e.target.value)}>
                    {STYLES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className={styles.featSection}>
                  <div className={styles.featTitle}>Personal accounts</div>
                  {[
                    {name:'Facebook', handle:'Your Page', connected:true},
                    {name:'Instagram', handle:'Your account', connected:true},
                    {name:'Reddit', handle:'Not connected', connected:false},
                  ].map((a,i) => (
                    <div key={i} className={styles.socialRow}>
                      <div className={styles.socialAvatar}>{a.name.slice(0,2)}</div>
                      <div className={styles.socialInfo}>
                        <div className={styles.socialName}>{a.name}</div>
                        <div className={styles.socialHandle}>{a.handle}</div>
                      </div>
                      <span className={`${styles.socialStatus} ${a.connected?styles.statusOk:styles.statusOff}`}>
                        {a.connected ? '● Connected' : '○ Connect'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'result' && (
              <div className={styles.panelBody}>
                {generating && !job && (
                  <div className={styles.genBox}>
                    <span className={styles.spinner} style={{width:20,height:20,borderWidth:3}} />
                    <span className={styles.genBoxText}>Generating your video…</span>
                  </div>
                )}
                {job && (
                  <div className={styles.jobCard}>
                    <div className={styles.jobCardTop}>
                      <span className={`${styles.badge} ${styles['badge_'+job.status]}`}>{job.status}</span>
                      <span className={styles.jobStep}>{job.step}</span>
                    </div>
                    <div className={styles.progBar}><div className={styles.progFill} style={{width:job.progress+'%'}} /></div>
                    <div className={styles.progPct}>{Math.round(job.progress)}%</div>
                    {job.status==='completed' && job.result?.script && (
                      <div className={styles.scriptCard}>
                        <div className={styles.scriptLbl}>Hook</div>
                        <div className={styles.scriptTxt}>{job.result.script.hook}</div>
                        <div className={styles.scriptLbl} style={{marginTop:8}}>Full script</div>
                        <div className={styles.scriptTxt}>{job.result.script.fullScript}</div>
                        <div className={styles.scriptLbl} style={{marginTop:8}}>CTA</div>
                        <div className={styles.scriptTxt}>{job.result.script.cta}</div>
                        {job.result.script.hashtags && <div className={styles.hashtags}>{job.result.script.hashtags.join(' ')}</div>}
                      </div>
                    )}
                    {job.status==='completed' && job.result?.finalVideoUrl && (
                      <a className={styles.downloadBtn} href={job.result.finalVideoUrl} target="_blank" rel="noreferrer">⬇ Download Video</a>
                    )}
                    {job.status==='failed' && <div className={styles.errorBox}>⚠ {job.error}</div>}
                  </div>
                )}
                {!job && !generating && (
                  <div className={styles.emptyResult}>
                    <div className={styles.emptyIcon}>▶</div>
                    <div className={styles.emptyText}>Your video will appear here</div>
                    <div className={styles.emptySub}>Fill in the form and click Generate</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className={styles.panel} style={{maxWidth:'100%'}}>
          <div className={styles.panelHdr}><span className={styles.panelTitle}>Job history</span></div>
          <div className={styles.panelBody}>
            {jobs.length === 0
              ? <div className={styles.emptyResult}>No jobs yet — generate your first video!</div>
              : jobs.map(j => (
                <div key={j.id} className={styles.jobRow} onClick={()=>{setJob(j);setTab('generate');setRTab('result')}}>
                  <span className={`${styles.jobDot} ${styles['dot_'+j.status]}`} />
                  <span className={styles.jobText}>{j.data?.topic||j.data?.url||'Video job'}</span>
                  <div className={styles.jobProgMini}><div className={styles.jobProgFill} style={{width:j.progress+'%'}} /></div>
                  <span className={styles.jobMeta}>{j.data?.persona} · {j.data?.duration} · {j.status}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab === 'vsl' && (
        <div style={{maxWidth:680}}>
          <div className={styles.panel}>
            <div className={styles.panelHdr}><span className={styles.panelTitle}>VSL Builder</span></div>
            <div className={styles.panelBody}>
              <div className={styles.fieldLbl}>Product name</div>
              <input className={styles.inp} placeholder='"ProSkin Serum"' value={vslForm.product} onChange={e=>setVsl(v=>({...v,product:e.target.value}))} />
              <div className={styles.row}>
                <div style={{flex:1}}><div className={styles.fieldLbl}>Price</div><input className={styles.inp} placeholder='$49.99' value={vslForm.price} onChange={e=>setVsl(v=>({...v,price:e.target.value}))} /></div>
                <div style={{flex:2}}><div className={styles.fieldLbl}>Target audience</div><input className={styles.inp} placeholder='Women 25-45 with dry skin' value={vslForm.audience} onChange={e=>setVsl(v=>({...v,audience:e.target.value}))} /></div>
              </div>
              <div className={styles.fieldLbl}>Main pain point</div>
              <input className={styles.inp} placeholder='Struggling with dry, dull skin' value={vslForm.pain} onChange={e=>setVsl(v=>({...v,pain:e.target.value}))} />
              <div className={styles.fieldLbl}>Your solution</div>
              <input className={styles.inp} placeholder='24-hour hydration formula' value={vslForm.solution} onChange={e=>setVsl(v=>({...v,solution:e.target.value}))} />
              <button className={styles.genBtn} style={{width:'100%',marginTop:8}} onClick={generateVSL} disabled={generating||!vslForm.product}>
                {generating?<><span className={styles.spinner}/> Writing…</>:'Generate VSL ⚡'}
              </button>
            </div>
          </div>
          {vslResult && (
            <div className={styles.scriptCard} style={{marginTop:12}}>
              {[['Hook',vslResult.hook],['Problem',vslResult.problemAgitation],['Solution',vslResult.solutionReveal],['CTA',vslResult.cta]].map(([l,v])=>v&&(
                <div key={l} style={{marginBottom:10}}><div className={styles.scriptLbl}>{l}</div><div className={styles.scriptTxt}>{v}</div></div>
              ))}
              <div className={styles.scriptLbl}>Full script</div>
              <div className={styles.scriptTxt}>{vslResult.fullScript}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div style={{maxWidth:580}}>
          <div className={styles.panel}>
            <div className={styles.panelHdr}><span className={styles.panelTitle}>API keys needed</span></div>
            <div className={styles.panelBody}>
              {[
                ['RunwayML','RUNWAY_API_KEY','Video generation'],
                ['ElevenLabs','ELEVENLABS_API_KEY','Voiceover'],
                ['TikTok','TIKTOK_ACCESS_TOKEN','Auto-upload'],
                ['Instagram','INSTAGRAM_ACCESS_TOKEN','Reels upload'],
                ['Facebook','FACEBOOK_ACCESS_TOKEN','Feed + Reels'],
                ['Reddit','REDDIT_CLIENT_ID + SECRET','Auto-post'],
                ['YouTube','YOUTUBE_ACCESS_TOKEN','Shorts upload'],
              ].map(([name,key,desc])=>(
                <div key={key} className={styles.credRow}>
                  <span className={styles.credName}>{name}</span>
                  <div style={{flex:1}}><code className={styles.credKey}>{key}</code><div className={styles.credDesc}>{desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
