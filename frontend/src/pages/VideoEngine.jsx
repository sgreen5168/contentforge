import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoEngine.module.css';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const VIDEO_TYPES = [
  { id: 'ugc-persona',  name: 'UGC Persona',          desc: 'Influencer-style conversational review',        badge: null },
  { id: 'ai-vsl',       name: 'AI VSL',                desc: 'Long-form video sales letter',                  badge: null },
  { id: 'hybrid-vsl',   name: 'Hybrid AI VSL',         desc: 'Avatar + B-roll + product visuals',             badge: 'New' },
  { id: 'reel-ads',     name: 'Reel Ads',              desc: 'Short vertical ads for Reels & TikTok',         badge: null },
  { id: 'product-ads',  name: 'Product Ads',           desc: 'Direct-response e-commerce ads',               badge: null },
  { id: 'commercial',   name: 'Commercial Ads',        desc: 'Brand-focused cinematic format',               badge: null },
  { id: 'competitor',   name: 'Competitor Replicator', desc: 'Analyze & replicate competitor structure',      badge: 'New', wide: true },
];

const PERSONAS = [
  { id: 'testimonial', name: 'Testimonial',  desc: 'Personal experience' },
  { id: 'demo',        name: 'Product Demo', desc: 'Step-by-step showcase' },
  { id: 'influencer',  name: 'Influencer',   desc: 'Trendy high-energy' },
  { id: 'educator',    name: 'Educator',     desc: 'Expert tips & how-to' },
  { id: 'ugc',         name: 'UGC Creator',  desc: 'Authentic raw content' },
];

const STYLES    = ['ugc', 'cinematic', 'lifestyle', 'studio', 'talking_head'];
const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',          maxSec: 600 },
  { id: 'instagram', label: 'Instagram Reels', maxSec: 90  },
  { id: 'youtube',   label: 'YouTube Shorts',  maxSec: 60  },
];

const VSL_SECTIONS = ['Hook', 'Problem', 'Story', 'Solution', 'Offer', 'Guarantee', 'CTA'];

const SCRIPT_DESCS = {
  'ugc-persona':  'Conversational first-person review script with authentic UGC tone',
  'ai-vsl':       'Hook → Problem → Solution → Offer → CTA structured persuasion',
  'hybrid-vsl':   'Segmented script for AI avatar, B-roll, and overlay moments',
  'reel-ads':     'Short punchy hook with immediate CTA for scroll-stop impact',
  'product-ads':  'Benefit-driven feature highlights with urgency-driven CTA',
  'commercial':   'Brand story with emotional arc and cinematic pacing',
  'competitor':   'Original script inspired by competitor structure — new content, same flow',
};

function fmt(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}

function getScenes(s) { return Math.max(3, Math.round(s / 5)); }
function getCost(s) { return ((getScenes(s) * 5 * 0.05) + (s / 30 * 0.05) + 0.01).toFixed(2); }

export default function VideoEngine() {
  const [tab, setTab]             = useState('generate');
  const [rightTab, setRightTab]   = useState('pipeline');
  const [smartMode, setSmart]     = useState(true);
  const [videoType, setVType]     = useState('ugc-persona');
  const [inputMode, setMode]      = useState('topic');
  const [topic, setTopic]         = useState('');
  const [url, setUrl]             = useState('');
  const [affiliateUrl, setAff]    = useState('');
  const [competitorUrl, setComp]  = useState('');
  const [persona, setPersona]     = useState('ugc');
  const [duration, setDuration]   = useState(30);
  const [style, setStyle]         = useState('ugc');
  const [platforms, setPlats]     = useState(['tiktok']);
  const [autoUpload, setAuto]     = useState(false);
  const [vslSections, setVsl]     = useState(['Hook','Problem','Solution','Offer','CTA']);
  const [autoPacing, setAP]       = useState(true);
  const [trendCaptions, setTC]    = useState(true);
  const [autoScrape, setAS]       = useState(true);
  const [showPrice, setSP]        = useState(false);
  const [ctaText, setCTA]         = useState('');
  const [tagline, setTag]         = useState('');
  const [brandColor, setBC]       = useState('#534AB7');
  const [preserveStruct, setPS]   = useState(true);
  const [energyLevel, setEL]      = useState(3);
  const [personaStyle, setPStyle] = useState('Friendly reviewer');
  const [generating, setGen]      = useState(false);
  const [job, setJob]             = useState(null);
  const [jobs, setJobs]           = useState([]);
  const [vslForm, setVsl2]        = useState({ product:'', price:'', audience:'', pain:'', solution:'' });
  const [vslResult, setVR]        = useState(null);
  const pollRef                   = useRef(null);

  const maxDuration = platforms.length > 0
    ? Math.min(...platforms.map(id => PLATFORMS.find(p => p.id === id)?.maxSec || 600))
    : 600;

  useEffect(() => { if (duration > maxDuration) setDuration(maxDuration); }, [maxDuration]);

  function togglePlat(id) { setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]); }
  function toggleVsl(s)   { setVsl(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); }

  const hasInput = inputMode === 'topic' ? topic.trim() : inputMode === 'url' ? url.trim() : affiliateUrl.trim();

  async function generate() {
    if (!hasInput || !platforms.length) return;
    setGen(true); setJob(null);
    try {
      const body = {
        inputMode, topic, url, affiliateUrl, persona, duration: `${duration}s`,
        durationSeconds: duration, style, platforms, autoUpload,
        videoType: smartMode ? 'auto' : videoType,
        competitorUrl, vslSections, autoPacing, trendCaptions,
        autoScrape, showPrice, ctaText, tagline, brandColor,
        preserveStruct, energyLevel, personaStyle,
      };
      const res = await fetch(`${API}/api/video/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const warnings = PLATFORMS.filter(p => platforms.includes(p.id) && duration > p.maxSec).map(p => `${p.label} max is ${fmt(p.maxSec)}`);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Video Engine <span className={styles.badge}>2.0</span></h1>
          <p className={styles.sub}>Multi-format, smart, social-ready video generation</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusPill}>● Claude Live</div>
          <div className={styles.videoBadge}>▶ Video Engine</div>
        </div>
      </div>

      <div className={styles.mainTabs}>
        {[['generate','Generate'],['vsl','VSL Builder'],['jobs','Job History'],['upload','API Setup']].map(([t,l]) =>
          <button key={t} className={`${styles.mainTab} ${tab===t?styles.activeMainTab:''}`} onClick={()=>setTab(t)}>{l}</button>
        )}
      </div>

      {tab === 'generate' && (
        <div className={styles.split}>
          {/* ── LEFT PANEL ── */}
          <div className={styles.panel}>
            <div className={styles.panelHdr}>Source & mode</div>
            <div className={styles.panelBody}>

              <div className={styles.inputTabs}>
                {[['topic','Topic'],['url','URL'],['affiliate','Affiliate link']].map(([m,l]) =>
                  <button key={m} className={`${styles.itab} ${inputMode===m?styles.activeItab:''}`} onClick={()=>setMode(m)}>{l}</button>
                )}
              </div>

              {inputMode==='topic'    && <input className={styles.input} placeholder='"morning productivity habits that changed my life"' value={topic} onChange={e=>setTopic(e.target.value)} />}
              {inputMode==='url'      && <input className={styles.input} placeholder='https://example.com/product' value={url} onChange={e=>setUrl(e.target.value)} />}
              {inputMode==='affiliate'&& <input className={styles.input} placeholder='https://affiliate.link/product' value={affiliateUrl} onChange={e=>setAff(e.target.value)} />}

              <div className={styles.fieldLabel}>Competitor video (optional)</div>
              <input className={styles.input} placeholder='Paste competitor video URL to analyze structure' value={competitorUrl} onChange={e=>setComp(e.target.value)} />

              <div className={styles.smartRow}>
                <div className={styles.smartInfo}>
                  <div className={styles.smartTitle}>Smart mode</div>
                  <div className={styles.smartDesc}>{smartMode ? 'Auto-selects the best video type for your input' : 'Manually choose a video type below'}</div>
                </div>
                <label className={styles.tog}>
                  <input type="checkbox" checked={smartMode} onChange={e=>setSmart(e.target.checked)} />
                  <span className={styles.togS} />
                </label>
              </div>

              <div className={styles.fieldLabel}>Video type {!smartMode && <span className={styles.manualLabel}>— manual</span>}</div>
              <div className={styles.vtypeGrid}>
                {VIDEO_TYPES.map(vt => (
                  <button
                    key={vt.id}
                    className={`${styles.vtype} ${vt.wide?styles.vtypeWide:''} ${!smartMode&&videoType===vt.id?styles.vtypeSelected:''} ${smartMode?styles.vtypeDisabled:''}`}
                    onClick={() => !smartMode && setVType(vt.id)}
                  >
                    <div className={styles.vtypeName}>{vt.name} {vt.badge && <span className={styles.vtypeBadge}>{vt.badge}</span>}</div>
                    <div className={styles.vtypeDesc}>{vt.desc}</div>
                  </button>
                ))}
              </div>

              <div className={styles.fieldLabel} style={{marginTop:14}}>Persona</div>
              <div className={styles.personaGrid}>
                {PERSONAS.map(p => (
                  <button key={p.id} className={`${styles.persona} ${persona===p.id?styles.personaActive:''}`} onClick={()=>setPersona(p.id)}>
                    <div className={styles.personaName}>{p.name}</div>
                    <div className={styles.personaDesc}>{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* Duration slider */}
              <div className={styles.fieldLabel} style={{marginTop:14}}>Video duration</div>
              <div className={styles.sliderCard}>
                <div className={styles.sliderTop}>
                  <div>
                    <span className={styles.sliderBig}>{fmt(duration)}</span>
                    <span className={styles.sliderSub}>{getScenes(duration)} scenes · ~${getCost(duration)}</span>
                  </div>
                  <div className={styles.presets}>
                    {[15,30,45,60].map(v => (
                      <button key={v} className={`${styles.preset} ${duration===v?styles.presetActive:''}`} onClick={()=>setDuration(Math.min(v,maxDuration))}>{v}s</button>
                    ))}
                  </div>
                </div>
                <input type="range" min="10" max={maxDuration} step="1" value={duration} onChange={e=>setDuration(Number(e.target.value))} className={styles.slider} />
                <div className={styles.sliderTicks}><span>10s</span><span>30s</span><span>1m</span><span>{fmt(maxDuration)}</span></div>
                {warnings.length > 0 && <div className={styles.warnBox}>{warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}</div>}
              </div>

              <div className={styles.row}>
                <div style={{flex:1}}>
                  <div className={styles.fieldLabel}>Visual style</div>
                  <select className={styles.select} value={style} onChange={e=>setStyle(e.target.value)}>
                    {STYLES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.fieldLabel}>Publish to</div>
              <div className={styles.platRow}>
                {PLATFORMS.map(p => (
                  <button key={p.id} className={`${styles.platChip} ${platforms.includes(p.id)?styles.platActive:''}`} onClick={()=>togglePlat(p.id)}>
                    <span className={styles.platName}>{p.label}</span>
                    <span className={styles.platMax}>max {fmt(p.maxSec)}</span>
                  </button>
                ))}
              </div>

              <div className={styles.generateBar}>
                <label className={styles.toggleRow}>
                  <div className={styles.tog}>
                    <input type="checkbox" checked={autoUpload} onChange={e=>setAuto(e.target.checked)} />
                    <span className={styles.togS} />
                  </div>
                  Auto-upload after generation
                </label>
                <button className={styles.genBtn} onClick={generate} disabled={generating||!hasInput||!platforms.length}>
                  {generating ? <><span className={styles.spinner} /> Generating…</> : 'Generate Video ⚡'}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className={styles.panel}>
            <div className={styles.rightTabs}>
              <button className={`${styles.rtab} ${rightTab==='pipeline'?styles.activeRtab:''}`} onClick={()=>setRightTab('pipeline')}>Pipeline</button>
              <button className={`${styles.rtab} ${rightTab==='features'?styles.activeRtab:''}`} onClick={()=>setRightTab('features')}>Feature details</button>
              <button className={`${styles.rtab} ${rightTab==='result'?styles.activeRtab:''}`} onClick={()=>setRightTab('result')}>Result</button>
            </div>

            {rightTab === 'pipeline' && (
              <div className={styles.panelBody}>
                {[
                  {n:1,done:true, title:'Input layer', desc:'URL, affiliate link, or competitor video collected'},
                  {n:2,active:true,title:'Content extraction', desc:'Scrape product data, summarize content, analyze competitor', subs:['Web & product scraper','Topic summarizer','Competitor analyzer (if selected)']},
                  {n:3,title:'Script generation', desc:SCRIPT_DESCS[smartMode?'ugc-persona':videoType]},
                  {n:4,title:'Visual assembly', desc:'AI avatar, voiceover, product images, motion graphics', subs:['ElevenLabs voiceover','RunwayML video clips','Animated captions & overlays']},
                  {n:5,title:'Rendering', desc:'9:16 vertical · 1:1 square · 16:9 horizontal'},
                  {n:6,title:'Preview & actions', desc:'Play · Edit script · Edit visuals · Regenerate · Download · Export'},
                ].map(s => (
                  <div key={s.n} className={styles.step}>
                    <div className={`${styles.stepNum} ${s.done?styles.stepDone:s.active?styles.stepActive:''}`}>{s.n}</div>
                    <div>
                      <div className={styles.stepTitle}>{s.title}</div>
                      <div className={styles.stepDesc}>{s.desc}</div>
                      {s.subs?.map((sub,i) => <div key={i} className={styles.substep}>· {sub}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rightTab === 'features' && (
              <div className={styles.panelBody}>
                <div className={styles.featSection}>
                  <div className={styles.featTitle}>UGC persona style</div>
                  <div className={styles.fieldLabel}>Style</div>
                  <select className={styles.select} value={personaStyle} onChange={e=>setPStyle(e.target.value)} style={{marginBottom:10}}>
                    {['Friendly reviewer','Expert explainer','Unboxing creator','Storyteller'].map(o=><option key={o}>{o}</option>)}
                  </select>
                  <div className={styles.fieldLabel}>Energy level</div>
                  <div className={styles.energyRow}>
                    <span className={styles.energyLabel}>Calm</span>
                    <input type="range" min="1" max="5" step="1" value={energyLevel} onChange={e=>setEL(Number(e.target.value))} className={styles.slider} style={{flex:1}} />
                    <span className={styles.energyLabel} style={{textAlign:'right'}}>High energy</span>
                  </div>
                  <div className={styles.energyVal}>Level {energyLevel}/5</div>
                </div>

                <div className={styles.featSection}>
                  <div className={styles.featTitle}>VSL structure sections</div>
                  <div className={styles.checkGroup}>
                    {VSL_SECTIONS.map(s => (
                      <label key={s} className={styles.checkItem}>
                        <input type="checkbox" checked={vslSections.includes(s)} onChange={()=>toggleVsl(s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.featSection}>
                  <div className={styles.featTitle}>Reel ads</div>
                  <div className={styles.featRow}>
                    <div><div className={styles.featLabel}>Auto fast pacing</div><div className={styles.featHint}>Cut to match short-form attention patterns</div></div>
                    <label className={styles.tog}><input type="checkbox" checked={autoPacing} onChange={e=>setAP(e.target.checked)} /><span className={styles.togS} /></label>
                  </div>
                  <div className={styles.featRow}>
                    <div><div className={styles.featLabel}>Trend-style captions</div><div className={styles.featHint}>Bold animated captions synced to speech</div></div>
                    <label className={styles.tog}><input type="checkbox" checked={trendCaptions} onChange={e=>setTC(e.target.checked)} /><span className={styles.togS} /></label>
                  </div>
                </div>

                <div className={styles.featSection}>
                  <div className={styles.featTitle}>Product ads</div>
                  <div className={styles.featRow}>
                    <div><div className={styles.featLabel}>Auto product scrape</div><div className={styles.featHint}>Pull title, images, price from URL</div></div>
                    <label className={styles.tog}><input type="checkbox" checked={autoScrape} onChange={e=>setAS(e.target.checked)} /><span className={styles.togS} /></label>
                  </div>
                  <div className={styles.featRow}>
                    <div><div className={styles.featLabel}>Show price overlay</div></div>
                    <label className={styles.tog}><input type="checkbox" checked={showPrice} onChange={e=>setSP(e.target.checked)} /><span className={styles.togS} /></label>
                  </div>
                  <div className={styles.fieldLabel} style={{marginTop:8}}>CTA text</div>
                  <input className={styles.input} placeholder='e.g. Shop Now, Learn More' value={ctaText} onChange={e=>setCTA(e.target.value)} />
                </div>

                <div className={styles.featSection}>
                  <div className={styles.featTitle}>Commercial ads</div>
                  <div className={styles.fieldLabel}>Brand tagline</div>
                  <input className={styles.input} placeholder='Your brand tagline' value={tagline} onChange={e=>setTag(e.target.value)} />
                  <div className={styles.fieldLabel}>Brand color</div>
                  <input type="color" value={brandColor} onChange={e=>setBC(e.target.value)} className={styles.colorPicker} />
                </div>

                <div className={styles.featSection}>
                  <div className={styles.featTitle}>Competitor replicator</div>
                  <div className={styles.analysisBox}>
                    {[['Hook style','Pattern interrupt'],['Tone','Conversational'],['CTA pattern','Soft sell + link'],['Avg section','8 seconds']].map(([k,v])=>(
                      <div key={k} className={styles.analysisRow}><span className={styles.analysisKey}>{k}</span><span className={styles.analysisVal}>{v}</span></div>
                    ))}
                  </div>
                  <div className={styles.featRow} style={{marginTop:8}}>
                    <div><div className={styles.featLabel}>Preserve structure, change content</div><div className={styles.featHint}>Keep pacing and flow, generate original messaging</div></div>
                    <label className={styles.tog}><input type="checkbox" checked={preserveStruct} onChange={e=>setPS(e.target.checked)} /><span className={styles.togS} /></label>
                  </div>
                </div>
              </div>
            )}

            {rightTab === 'result' && (
              <div className={styles.panelBody}>
                {generating && (
                  <div className={styles.genBox}>
                    <div style={{display:'flex',gap:8,alignItems:'center',color:'#534AB7',fontSize:13}}>
                      <span className={styles.spinner} /> Claude is writing your video…
                    </div>
                    {job && (
                      <div className={styles.progWrap}>
                        <div className={styles.progBar}><div className={styles.progFill} style={{width:job.progress+'%'}} /></div>
                        <div className={styles.progInfo}>{job.step} — {Math.round(job.progress)}%</div>
                      </div>
                    )}
                  </div>
                )}
                {job?.status === 'completed' && job.result && (
                  <div className={styles.result}>
                    {job.result.script && (
                      <div className={styles.scriptCard}>
                        <div className={styles.scriptLabel}>Hook</div>
                        <div className={styles.scriptText}>{job.result.script.hook}</div>
                        <div className={styles.scriptLabel} style={{marginTop:10}}>Full script</div>
                        <div className={styles.scriptText}>{job.result.script.fullScript}</div>
                        <div className={styles.scriptLabel} style={{marginTop:10}}>CTA</div>
                        <div className={styles.scriptText}>{job.result.script.cta}</div>
                        {job.result.script.hashtags && <div className={styles.hashtags}>{job.result.script.hashtags.join(' ')}</div>}
                      </div>
                    )}
                    {job.result.finalVideo && (
                      <div>
                        <video controls style={{width:'100%',borderRadius:8,marginTop:12}}>
                          <source src={`${API}${job.result.finalVideo.url}`} type="video/mp4" />
                        </video>
                        <a className={styles.downloadBtn} href={`${API}${job.result.finalVideo.url}`} download>⬇ Download Video</a>
                      </div>
                    )}
                    {job.result.clips?.length > 0 && !job.result.finalVideo && (
                      <div className={styles.clipsBox}>
                        <div className={styles.scriptLabel}>{job.result.clips.filter(c=>c.videoUrl).length} scene clips generated</div>
                        {job.result.clips.filter(c=>c.videoUrl).map((c,i)=>(
                          <div key={i} className={styles.clipRow}>
                            <span>Scene {c.scene}</span>
                            <a href={c.videoUrl} target="_blank" rel="noreferrer" className={styles.clipLink}>View ↗</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {job?.status === 'failed' && <div className={styles.errorBox}>⚠ {job.error}</div>}
                {!job && !generating && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>▶</div>
                    <div className={styles.emptyText}>Your video will appear here</div>
                    <div className={styles.emptyHint}>Fill in the form and click Generate Video</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'vsl' && (
        <div style={{maxWidth:700}}>
          <div className={styles.panel}>
            <div className={styles.panelHdr}>VSL Builder</div>
            <div className={styles.panelBody}>
              <div className={styles.fieldLabel}>Product name</div>
              <input className={styles.input} placeholder='"ProSkin Serum"' value={vslForm.product} onChange={e=>setVsl2(v=>({...v,product:e.target.value}))} />
              <div className={styles.row}>
                <div style={{flex:1}}><div className={styles.fieldLabel}>Price</div><input className={styles.input} placeholder='$49.99' value={vslForm.price} onChange={e=>setVsl2(v=>({...v,price:e.target.value}))} /></div>
                <div style={{flex:2}}><div className={styles.fieldLabel}>Target audience</div><input className={styles.input} placeholder='Women 25-45 with dry skin' value={vslForm.audience} onChange={e=>setVsl2(v=>({...v,audience:e.target.value}))} /></div>
              </div>
              <div className={styles.fieldLabel}>Main pain point</div>
              <input className={styles.input} placeholder='Struggling with dry, dull skin' value={vslForm.pain} onChange={e=>setVsl2(v=>({...v,pain:e.target.value}))} />
              <div className={styles.fieldLabel}>Your solution</div>
              <input className={styles.input} placeholder='24-hour hydration formula' value={vslForm.solution} onChange={e=>setVsl2(v=>({...v,solution:e.target.value}))} />
              <div className={styles.fieldLabel}>Affiliate link (optional)</div>
              <input className={styles.input} placeholder='https://your-affiliate-link.com' value={affiliateUrl} onChange={e=>setAff(e.target.value)} />
              <div className={styles.fieldLabel}>Duration</div>
              <div className={styles.sliderCard}>
                <div className={styles.sliderTop}>
                  <span className={styles.sliderBig}>{fmt(duration)}</span>
                  <div className={styles.presets}>
                    {[30,45,60,90].map(v=><button key={v} className={`${styles.preset} ${duration===v?styles.presetActive:''}`} onClick={()=>setDuration(v)}>{fmt(v)}</button>)}
                  </div>
                </div>
                <input type="range" min="15" max="90" step="1" value={duration} onChange={e=>setDuration(Number(e.target.value))} className={styles.slider} />
              </div>
              <button className={styles.genBtn} style={{width:'100%',marginTop:12}} onClick={generateVSL} disabled={generating||!vslForm.product||!vslForm.audience||!vslForm.pain}>
                {generating?<><span className={styles.spinner}/> Writing VSL…</>:'Generate VSL Script ⚡'}
              </button>
            </div>
          </div>
          {vslResult && (
            <div className={styles.scriptCard} style={{marginTop:14}}>
              {[['Hook',vslResult.hook],['Problem',vslResult.problemAgitation],['Solution',vslResult.solutionReveal],['Social proof',vslResult.socialProof],['Urgency',vslResult.urgency],['CTA',vslResult.cta]].map(([l,v])=>v&&(
                <div key={l} style={{marginBottom:12}}><div className={styles.scriptLabel}>{l}</div><div className={styles.scriptText}>{v}</div></div>
              ))}
              <div className={styles.scriptLabel}>Full script</div>
              <div className={styles.scriptText}>{vslResult.fullScript}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'jobs' && (
        <div>
          {jobs.length === 0
            ? <div className={styles.emptyState}>No jobs yet — generate your first video!</div>
            : jobs.map(j => (
              <div key={j.id} className={styles.jobRow} onClick={()=>{setJob(j);setTab('generate');setRightTab('result')}}>
                <span className={`${styles.statusBadge} ${styles['s_'+j.status]}`}>{j.status}</span>
                <span className={styles.jobText}>{j.data?.topic||j.data?.url||j.data?.affiliateUrl||'Video job'}</span>
                <span className={styles.jobMeta}>{j.data?.persona} · {j.data?.duration} · {new Date(j.createdAt).toLocaleTimeString()}</span>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'upload' && (
        <div style={{maxWidth:580}}>
          <div className={styles.panel}>
            <div className={styles.panelHdr}>API keys needed</div>
            <div className={styles.panelBody}>
              {[
                ['RunwayML','RUNWAY_API_KEY','runwayml.com','Video clip generation'],
                ['ElevenLabs','ELEVENLABS_API_KEY','elevenlabs.io','Voiceover narration'],
                ['TikTok','TIKTOK_ACCESS_TOKEN','developers.tiktok.com','Auto-upload'],
                ['Instagram','INSTAGRAM_ACCESS_TOKEN','developers.facebook.com','Auto-upload'],
                ['YouTube','YOUTUBE_ACCESS_TOKEN','console.cloud.google.com','Auto-upload'],
              ].map(([name,key,url,desc])=>(
                <div key={key} className={styles.credRow}>
                  <div className={styles.credName}>{name}</div>
                  <div style={{flex:1}}>
                    <code className={styles.credKey}>{key}</code>
                    <div className={styles.credDesc}>{desc}</div>
                  </div>
                  <a href={`https://${url}`} target="_blank" rel="noreferrer" className={styles.credLink}>Get key →</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
