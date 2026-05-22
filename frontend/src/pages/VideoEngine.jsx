import React, { useState, useEffect, useRef } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const VIDEO_TYPES = [
  { id:'ugc-persona',  icon:'👤', label:'UGC Persona',    desc:'Authentic first-person review' },
  { id:'ai-vsl',       icon:'💰', label:'AI VSL',          desc:'Video sales letter' },
  { id:'reel-ads',     icon:'⚡', label:'Reel Ads',        desc:'Short punchy vertical ad' },
  { id:'product-ads',  icon:'🛍', label:'Product Ad',      desc:'Direct-response product' },
  { id:'commercial',   icon:'🎬', label:'Commercial',      desc:'Cinematic brand video' },
  { id:'educator',     icon:'📚', label:'Educational',     desc:'Expert tips format' },
];

const PERSONAS = [
  { id:'ugc',         label:'UGC Creator',  desc:'Authentic & raw' },
  { id:'testimonial', label:'Testimonial',  desc:'Personal experience' },
  { id:'demo',        label:'Product Demo', desc:'Step-by-step' },
  { id:'influencer',  label:'Influencer',   desc:'High energy' },
  { id:'educator',    label:'Educator',     desc:'Expert tips' },
];

const PLATFORMS = [
  { id:'tiktok',    label:'TikTok',          icon:'🎵', limit:'Max 10m' },
  { id:'instagram', label:'Instagram Reels', icon:'📷', limit:'Max 90s' },
  { id:'youtube',   label:'YouTube Shorts',  icon:'▶',  limit:'Max 60s' },
  { id:'facebook',  label:'Facebook Reels',  icon:'📘', limit:'Max 90s' },
];

const DURATIONS = ['15s','30s','45s','60s'];

const PIPELINE_STEPS = [
  { n:'1', label:'Script',    sub:'Claude AI writes hook + scenes',    icon:'✦', color:'#5DCAA5' },
  { n:'2', label:'Voiceover', sub:'OpenAI TTS persona-matched voice',  icon:'🎙', color:'#7BAAA0' },
  { n:'3', label:'Video clips',sub:'Pexels stock HD clips — FREE',     icon:'🎬', color:'#1D9E75' },
  { n:'4', label:'Complete',  sub:'Download or publish to platforms',  icon:'✅', color:'#1D9E75' },
];

export default function VideoEngine() {
  const [tab, setTab]         = useState('generate');
  const [mode, setMode]       = useState('topic');
  const [topic, setTopic]     = useState('');
  const [url, setUrl]         = useState('');
  const [affUrl, setAffUrl]   = useState('');
  const [videoType, setVType] = useState('ugc-persona');
  const [persona, setPersona] = useState('ugc');
  const [duration, setDur]    = useState('30s');
  const [platforms, setPlats] = useState(['tiktok']);
  const [loading, setLoad]    = useState(false);
  const [jobId, setJobId]     = useState(null);
  const [job, setJob]         = useState(null);
  const [error, setError]     = useState('');
  const [jobs, setJobs]       = useState([]);
  const [editScript, setEditS] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const pollRef               = useRef(null);

  useEffect(() => { if (tab==='history') loadJobs(); }, [tab]);
  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  async function loadJobs() {
    try {
      const r = await fetch(`${API}/api/video/jobs`);
      const d = await r.json();
      setJobs(Array.isArray(d) ? d : []);
    } catch {}
  }

  async function generate() {
    const input = mode==='topic'?topic:mode==='url'?url:affUrl;
    if (!input.trim()) return;
    setLoad(true); setJob(null); setError(''); setJobId(null); setShowEdit(false);
    try {
      const res = await fetch(`${API}/api/video/generate`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode: mode,
          topic: mode==='topic'?topic:undefined,
          url: mode==='url'?url:undefined,
          affiliateUrl: mode==='affiliate'?affUrl:undefined,
          videoType, persona, duration,
          platforms,
          editedScript: showEdit ? editScript : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobId(data.jobId);
      setTab('result');
      pollRef.current = setInterval(() => pollJob(data.jobId), 3000);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  }

  async function pollJob(id) {
    try {
      const r = await fetch(`${API}/api/video/job/${id}`);
      const d = await r.json();
      setJob(d);
      if (d.status === 'completed' || d.status === 'failed') {
        clearInterval(pollRef.current);
        loadJobs();
      }
    } catch {}
  }

  function togglePlatform(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p=>p!==id) : [...prev, id]);
  }

  function download(url) {
    const a = document.createElement('a');
    a.href = url; a.download = 'contentforge-video.mp4'; a.target = '_blank'; a.click();
  }

  const S = {
    card: { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:12 },
    hdr:  { padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', justifyContent:'space-between' },
    body: { padding:'12px 14px' },
    inp:  { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:10, boxSizing:'border-box' },
    lbl:  { fontSize:10, color:'#4A7A72', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:6 },
    chip: (on) => ({ padding:'5px 11px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:500, border:`1px solid ${on?'#1D9E75':'rgba(29,158,117,.2)'}`, background:on?'rgba(29,158,117,.15)':'transparent', color:on?'#5DCAA5':'#7BAAA0', margin:'0 4px 4px 0', display:'inline-block' }),
  };

  const input = mode==='topic'?topic:mode==='url'?url:affUrl;

  return (
    <div style={{ padding:20, maxWidth:1100, fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ marginBottom:16, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:600, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 }}>
            🎬 AI Video <span style={{color:'#5DCAA5'}}>Engine</span>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5', fontWeight:400 }}>3.0</span>
          </div>
          <div style={{ fontSize:12, color:'#7BAAA0', marginTop:3 }}>Script · Voiceover · FREE Pexels stock clips · Multi-platform</div>
        </div>
        {/* Cost badge */}
        <div style={{ display:'flex', gap:8 }}>
          {[['Claude','Script','#5DCAA5'],['OpenAI TTS','Voice','#7BAAA0'],['Pexels','Clips FREE','#1D9E75']].map(([name,type,color]) => (
            <div key={name} style={{ padding:'6px 10px', background:'rgba(16,45,79,.8)', border:'1px solid rgba(29,158,117,.15)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#4A7A72', marginBottom:2 }}>{type}</div>
              <div style={{ fontSize:11, fontWeight:600, color }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {[['generate','⚡ Generate'],['result','📊 Result'],['history','📋 History']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'7px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:500,
              border:`1px solid ${tab===id?'#1D9E75':'rgba(29,158,117,.2)'}`,
              background:tab===id?'rgba(29,158,117,.15)':'transparent',
              color:tab===id?'#5DCAA5':'#7BAAA0' }}>
            {label}
            {id==='result' && job && (
              <span style={{ marginLeft:6, width:7, height:7, borderRadius:'50%', background:job.status==='completed'?'#1D9E75':job.status==='failed'?'#E24B4A':'#F5A623', display:'inline-block', verticalAlign:'middle' }} />
            )}
          </button>
        ))}
      </div>

      {/* Generate tab */}
      {tab==='generate' && (
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14 }}>
          {/* Left */}
          <div>
            <div style={S.card}>
              <div style={S.hdr}>Source</div>
              <div style={S.body}>
                <div style={{ display:'flex', gap:4, marginBottom:10 }}>
                  {[['topic','Topic'],['url','URL'],['affiliate','Affiliate']].map(([id,label]) => (
                    <button key={id} onClick={() => setMode(id)} style={S.chip(mode===id)}>{label}</button>
                  ))}
                </div>
                {mode==='topic' && <input style={S.inp} placeholder='"morning productivity tips"' value={topic} onChange={e=>setTopic(e.target.value)} />}
                {mode==='url' && <input style={S.inp} placeholder="https://article-url.com" value={url} onChange={e=>setUrl(e.target.value)} />}
                {mode==='affiliate' && <input style={S.inp} placeholder="https://affiliate-link.com" value={affUrl} onChange={e=>setAffUrl(e.target.value)} />}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Video type</div>
              <div style={{ padding:'6px 8px' }}>
                {VIDEO_TYPES.map(t => (
                  <button key={t.id} onClick={() => setVType(t.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', marginBottom:3,
                      border:`1px solid ${videoType===t.id?'#1D9E75':'transparent'}`,
                      background:videoType===t.id?'rgba(29,158,117,.1)':'transparent' }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500, color:'#E8F4F0' }}>{t.label}</div>
                      <div style={{ fontSize:10, color:'#7BAAA0' }}>{t.desc}</div>
                    </div>
                    {videoType===t.id && <span style={{ marginLeft:'auto', color:'#1D9E75', fontSize:12 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Persona</div>
              <div style={{ padding:'6px 8px', display:'flex', flexWrap:'wrap', gap:4 }}>
                {PERSONAS.map(p => (
                  <button key={p.id} onClick={() => setPersona(p.id)} style={{ ...S.chip(persona===p.id), margin:0 }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Duration</div>
              <div style={{ padding:'10px 14px', display:'flex', gap:6 }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDur(d)}
                    style={{ flex:1, padding:'8px 4px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:500, textAlign:'center',
                      border:`1px solid ${duration===d?'#1D9E75':'rgba(29,158,117,.2)'}`,
                      background:duration===d?'rgba(29,158,117,.15)':'transparent',
                      color:duration===d?'#5DCAA5':'#7BAAA0' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Publish to</div>
              <div style={{ padding:'8px 10px' }}>
                {PLATFORMS.map(p => (
                  <div key={p.id} onClick={() => togglePlatform(p.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:8, cursor:'pointer', marginBottom:4,
                      background:platforms.includes(p.id)?'rgba(29,158,117,.08)':'transparent',
                      border:`1px solid ${platforms.includes(p.id)?'rgba(29,158,117,.3)':'transparent'}` }}>
                    <span style={{ fontSize:16 }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:'#E8F4F0' }}>{p.label}</div>
                      <div style={{ fontSize:10, color:'#4A7A72' }}>{p.limit}</div>
                    </div>
                    <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${platforms.includes(p.id)?'#1D9E75':'rgba(29,158,117,.3)'}`, background:platforms.includes(p.id)?'#1D9E75':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {platforms.includes(p.id) && <span style={{ fontSize:9, color:'white' }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            {/* Pipeline overview */}
            <div style={S.card}>
              <div style={S.hdr}>
                <span>Video pipeline</span>
                <span style={{ fontSize:11, color:'#1D9E75', fontWeight:500 }}>✅ FREE with Pexels API key</span>
              </div>
              <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={i} style={{ padding:'12px', background:'rgba(22,61,106,.4)', borderRadius:10, border:'1px solid rgba(29,158,117,.1)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(29,158,117,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:step.color }}>
                        {step.n}
                      </div>
                      <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{step.label}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#7BAAA0', paddingLeft:30 }}>{step.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div style={S.card}>
              <div style={S.hdr}>💰 Cost per video</div>
              <div style={S.body}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  {[
                    ['Claude script','~$0.01','per video'],
                    ['OpenAI voiceover','~$0.02','per minute'],
                    ['Pexels clips','FREE','unlimited'],
                  ].map(([name,cost,unit]) => (
                    <div key={name} style={{ padding:'10px', background:'rgba(22,61,106,.4)', borderRadius:8, textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'#7BAAA0', marginBottom:4 }}>{name}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:cost==='FREE'?'#1D9E75':'#5DCAA5' }}>{cost}</div>
                      <div style={{ fontSize:10, color:'#4A7A72' }}>{unit}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'10px 12px', background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#E8F4F0' }}>Total per video</div>
                    <div style={{ fontSize:11, color:'#7BAAA0' }}>With Pexels free tier</div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:700, color:'#1D9E75' }}>~$0.03</div>
                </div>
                <div style={{ marginTop:8, fontSize:11, color:'#4A7A72' }}>
                  ⚠ Get your free Pexels API key at <span style={{ color:'#5DCAA5' }}>pexels.com/api</span> and add PEXELS_API_KEY to Railway
                </div>
              </div>
            </div>

            {/* Script editor toggle */}
            <div style={S.card}>
              <div style={{ ...S.hdr, cursor:'pointer' }} onClick={() => setShowEdit(!showEdit)}>
                <span>✎ Custom script (optional)</span>
                <span style={{ fontSize:11, color:'#4A7A72' }}>{showEdit?'▲ Hide':'▼ Show'}</span>
              </div>
              {showEdit && (
                <div style={S.body}>
                  <div style={{ fontSize:11, color:'#7BAAA0', marginBottom:8 }}>Paste your own script — Claude will use it as a base and improve it</div>
                  <textarea value={editScript} onChange={e=>setEditS(e.target.value)}
                    placeholder="Paste your script here..."
                    style={{ ...S.inp, minHeight:100, resize:'vertical', lineHeight:1.6, marginBottom:0 }}
                  />
                </div>
              )}
            </div>

            {error && <div style={{ padding:'10px 12px', background:'rgba(226,75,74,.1)', border:'1px solid rgba(226,75,74,.2)', borderRadius:10, color:'#F09595', fontSize:12, marginBottom:10 }}>⚠ {error}</div>}

            <button onClick={generate} disabled={loading || !input.trim()}
              style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                opacity:loading||!input.trim()?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {loading ? <><span style={{width:18,height:18,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/>Queuing...</> : '⚡ Generate Video'}
            </button>
          </div>
        </div>
      )}

      {/* Result tab */}
      {tab==='result' && (
        <div style={{ maxWidth:700 }}>
          {!job && !jobId && (
            <div style={{ ...S.card, textAlign:'center', padding:'50px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎬</div>
              <div style={{ fontSize:14, color:'#E8F4F0' }}>Generate a video to see results here</div>
            </div>
          )}

          {job && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Progress */}
              <div style={S.card}>
                <div style={S.hdr}>
                  <span>Generation progress</span>
                  <span style={{ fontSize:11, fontWeight:600, color:job.status==='completed'?'#1D9E75':job.status==='failed'?'#F09595':'#F5A623' }}>
                    {job.status==='completed'?'✅ Complete':job.status==='failed'?'❌ Failed':'⏳ Processing'}
                  </span>
                </div>
                <div style={S.body}>
                  {/* Progress bar */}
                  <div style={{ height:6, background:'rgba(255,255,255,.08)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
                    <div style={{ height:'100%', width:(job.progress||0)+'%', background:job.status==='failed'?'#E24B4A':'#1D9E75', borderRadius:3, transition:'width .5s' }} />
                  </div>
                  <div style={{ fontSize:12, color:'#7BAAA0', marginBottom:12 }}>{job.step || 'Waiting...'}</div>

                  {/* Pipeline steps */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {PIPELINE_STEPS.map((step, i) => {
                      const prog = job.progress || 0;
                      const thresholds = [30, 50, 85, 100];
                      const done = prog >= thresholds[i];
                      const active = prog >= (thresholds[i-1]||0) && prog < thresholds[i];
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:done?'rgba(29,158,117,.08)':active?'rgba(29,158,117,.04)':'transparent' }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
                            background:done?'#1D9E75':active?'rgba(29,158,117,.2)':'rgba(255,255,255,.05)',
                            color:done?'white':active?'#5DCAA5':'#4A7A72' }}>
                            {done?'✓':active?<span style={{width:10,height:10,border:'1.5px solid rgba(29,158,117,.5)',borderTopColor:'#1D9E75',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/>:step.n}
                          </div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:500, color:done?'#E8F4F0':'#7BAAA0' }}>{step.label}</div>
                            <div style={{ fontSize:10, color:'#4A7A72' }}>{step.sub}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Script result */}
              {job.result?.script && (
                <div style={S.card}>
                  <div style={S.hdr}>✦ Generated script</div>
                  <div style={S.body}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#5DCAA5', marginBottom:6 }}>Hook</div>
                    <div style={{ fontSize:13, color:'#E8F4F0', marginBottom:12, padding:'8px 10px', background:'rgba(29,158,117,.06)', borderRadius:6 }}>{job.result.script.hook}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#5DCAA5', marginBottom:6 }}>Full script</div>
                    <div style={{ fontSize:12, color:'#7BAAA0', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:150, overflow:'auto', padding:'8px 10px', background:'rgba(22,61,106,.4)', borderRadius:6 }}>
                      {job.result.script.fullScript}
                    </div>
                    {job.result.script.hashtags?.length > 0 && (
                      <div style={{ marginTop:10, fontSize:12, color:'#5DCAA5' }}>{job.result.script.hashtags.join(' ')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Clips */}
              {job.result?.clips?.length > 0 && (
                <div style={S.card}>
                  <div style={S.hdr}>🎬 Video clips</div>
                  <div style={S.body}>
                    {job.result.clips.map((clip, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:6,
                        background:clip.status==='success'?'rgba(29,158,117,.08)':'rgba(226,75,74,.06)',
                        border:`1px solid ${clip.status==='success'?'rgba(29,158,117,.2)':'rgba(226,75,74,.15)'}` }}>
                        <span style={{ fontSize:18 }}>{clip.status==='success'?'✅':'❌'}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, color:'#E8F4F0' }}>Scene {clip.scene}</div>
                          {clip.status!=='success' && <div style={{ fontSize:11, color:'#F09595' }}>{clip.error}</div>}
                        </div>
                        {clip.videoUrl && (
                          <button onClick={() => download(clip.videoUrl)}
                            style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontFamily:'inherit' }}>
                            ⬇ Download
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clip error */}
              {job.clipError && (
                <div style={{ padding:'12px 14px', background:'rgba(245,166,35,.06)', border:'1px solid rgba(245,166,35,.2)', borderRadius:10 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#FAC775', marginBottom:4 }}>⚠ Video clips skipped</div>
                  <div style={{ fontSize:12, color:'#7BAAA0', marginBottom:8 }}>{job.clipError}</div>
                  <div style={{ fontSize:11, color:'#4A7A72' }}>
                    Add <span style={{color:'#5DCAA5'}}>PEXELS_API_KEY</span> to Railway for free stock video clips — get your key at pexels.com/api
                  </div>
                </div>
              )}

              {/* Final download */}
              {job.result?.finalVideoUrl && (
                <button onClick={() => download(job.result.finalVideoUrl)}
                  style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  ⬇ Download Video
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {tab==='history' && (
        <div style={{ maxWidth:700 }}>
          {jobs.length === 0 && (
            <div style={{ ...S.card, textAlign:'center', padding:'40px' }}>
              <div style={{ fontSize:13, color:'#7BAAA0' }}>No videos generated yet</div>
            </div>
          )}
          {jobs.map((j, i) => (
            <div key={i} style={S.card}>
              <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background:j.status==='completed'?'#1D9E75':j.status==='failed'?'#E24B4A':'#F5A623' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:'#E8F4F0' }}>{j.data?.topic || j.data?.url || 'Video'}</div>
                  <div style={{ fontSize:11, color:'#4A7A72' }}>{new Date(j.createdAt).toLocaleString()} · {j.status}</div>
                </div>
                {j.result?.finalVideoUrl && (
                  <button onClick={() => download(j.result.finalVideoUrl)}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontFamily:'inherit' }}>
                    ⬇
                  </button>
                )}
                <button onClick={() => { setJob(j); setTab('result'); }}
                  style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit' }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
