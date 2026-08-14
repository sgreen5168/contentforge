import { useState, useEffect, useRef } from 'react';

const API = (typeof window !== 'undefined' && window.__CF_API__) || 'https://contentforge-production-6e13.up.railway.app';
const VB_API = 'https://contentforge-production-c8d9.up.railway.app';

const BG2  = '#112240';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';
const ACCH = '#5DCAA5';

const TOPICS = [
  { id:'home-bakery',    cat:'baking',       label:'Home Bakery Business',        icon:'🧁', hook:"Starting a home bakery is simpler than most people think." },
  { id:'wfh-income',     cat:'home-income',  label:'Earning from Home',           icon:'🏠', hook:"People are building real income from their kitchens and home offices." },
  { id:'meal-prep',      cat:'meal-prep',    label:'Meal Prep & Food Planning',   icon:'🥗', hook:"Two hours of prep saves hours of stress all week." },
  { id:'side-hustle',    cat:'side-hustle',  label:'Side Hustle Ideas',           icon:'💰', hook:"Most people are sitting on income they have not tapped yet." },
  { id:'mindset',        cat:'mindset',      label:'Success Mindset',             icon:'💡', hook:"The difference between those who succeed and those who quit is smaller than you think." },
  { id:'live-commerce',  cat:'live-commerce',label:'Live Selling on Facebook',    icon:'📱', hook:"Live selling is the fastest growing income stream right now." },
  { id:'cooking-biz',    cat:'cooking-biz',  label:'Cooking as a Business',       icon:'🍳', hook:"Skills you take for granted are worth money to other people." },
  { id:'niche',          cat:'niche',        label:'Finding Your Niche',          icon:'🎯', hook:"Most people try to appeal to everyone — and reach no one." },
  { id:'entrepreneur',   cat:'entrepreneur', label:'Entrepreneurship',            icon:'🚀', hook:"The truth about starting a business nobody tells you." },
  { id:'remote-work',    cat:'remote-work',  label:'Remote Work Tips',            icon:'💻', hook:"Working from home changed everything — but only after the right setup." },
];

const PIPELINE_STEPS = [
  { id:'post',    icon:'📝', label:'Facebook post',    color:'#1877F2' },
  { id:'script',  icon:'🎬', label:'Video script',     color:'#EF4444' },
  { id:'video',   icon:'▶',  label:'Video (MP4)',      color:'#EF4444' },
  { id:'link',    icon:'🔗', label:'Affiliate link',   color:'#1D9E75' },
  { id:'landing', icon:'🌐', label:'Landing page',     color:'#8B5CF6' },
];

export default function Dashboard({ onNavigate }) {
  const [selectedTopic, setTopic]   = useState(null);
  const [running, setRunning]       = useState(false);
  const [pipeline, setPipeline]     = useState({});   // stepId → { status, data, error }
  const [results, setResults]       = useState(null);
  const [copied, setCopied]         = useState('');
  const [stats, setStats]           = useState({ posts:0, videos:0, links:0 });
  const [history, setHistory]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_cmd_history') || '[]'); } catch { return []; }
  });
  const [viewingSession, setViewing] = useState(null);  // null = current, or index
  const [customTopic, setCustomTopic] = useState('');
  const abortRef                    = useRef(false);

  useEffect(() => {
    fetch(API + '/api/affiliate/status')
      .then(r=>r.json())
      .then(d=>setStats(s=>({...s,links:d.library||0})))
      .catch(()=>{});
    const h = JSON.parse(localStorage.getItem('cf_vb_history')||'[]');
    const p = JSON.parse(localStorage.getItem('cf_fb_scheduled')||'[]');
    setStats(s=>({...s,videos:h.filter(v=>v.status==='completed').length,posts:p.length}));
  },[]);

  function updateStep(id, update) {
    setPipeline(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...update } }));
  }

  async function runPipeline(topic) {
    if (running) return;
    setRunning(true);
    abortRef.current = false;
    setResults(null);
    setPipeline({});
    const out = {};

    // ── Step 1: Generate Facebook post ───────────────────────────────────────
    updateStep('post', { status:'running' });
    try {
      const r = await fetch(API + '/api/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode:'topic',
          topic: topic.label + ' — ' + topic.hook,
          style:'Casual', platforms:['facebook'], affiliate:false,
        }),
      });
      const d = await r.json();
      const postText = d.posts?.facebook?.text || d.post?.text || d.text || '';
      if (!postText) throw new Error('No post content returned');
      out.post = postText;
      updateStep('post', { status:'done', data: postText });
    } catch(e) {
      updateStep('post', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 2: Generate video script ─────────────────────────────────────────
    updateStep('script', { status:'running' });
    try {
      const r = await fetch(API + '/api/video/script', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode:'topic', topic: topic.label,
          style:'Casual', persona:'ugc-creator',
          duration:'30s', platforms:['youtube'], videoType:'ugc-persona',
        }),
      });
      const d = await r.json();
      const script = d.script?.fullScript || d.script?.hook || '';
      if (!script) throw new Error('No script returned');
      out.script = script;
      out.hook   = d.script?.hook || '';
      updateStep('script', { status:'done', data: script });
    } catch(e) {
      updateStep('script', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 3: Match affiliate link ──────────────────────────────────────────
    updateStep('link', { status:'running' });
    try {
      const r = await fetch(API + '/api/affiliate/match', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ topic: topic.label, category: topic.cat, count:1 }),
      });
      const d = await r.json();
      const link = d.links?.[0];
      out.link = link || null;
      updateStep('link', { status: link ? 'done' : 'warn', data: link, error: link ? null : 'No links in library yet — add one in Affiliate Library' });

      // Auto-insert link into post
      if (link && out.post) {
        const newline = String.fromCharCode(10);
        out.post = out.post + newline + newline + '\uD83D\uDD17 ' + link.name + newline + link.url + newline + newline + '#ad This post contains affiliate links.';
        updateStep('post', { status:'done', data: out.post });
      }
    } catch(e) {
      updateStep('link', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 4: Build video via Video Builder ─────────────────────────────────
    updateStep('video', { status:'running' });
    try {
      const vbR = await fetch(VB_API + '/video/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          topic:  topic.label,
          length: 30,
          format: '9:16',
          voice:  'nova',
          music:  'uplifting',
          affiliateUrl: out.link?.url || '',
          affiliateCTA: out.link?.name || '',
        }),
      });
      const vbD = await vbR.json();
      if (!vbD.id) throw new Error('Video Builder did not return a job ID');
      out.videoJobId = vbD.id;
      updateStep('video', { status:'building', data: { jobId: vbD.id } });

      // Poll until done (max 5 minutes)
      let elapsed = 0;
      while (elapsed < 300) {
        await new Promise(r=>setTimeout(r,8000));
        elapsed += 8;
        if (abortRef.current) break;
        const pollR = await fetch(VB_API + '/video/' + vbD.id);
        const pollD = await pollR.json();
        updateStep('video', { status:'building', data: pollD, progress: pollD.progress });
        if (pollD.status === 'completed') {
          out.video = pollD;
          out.videoUrl = VB_API + '/video/' + vbD.id + '/file';
          updateStep('video', { status:'done', data: pollD, url: out.videoUrl });
          break;
        }
        if (pollD.status === 'failed') {
          throw new Error(pollD.step || 'Video generation failed');
        }
      }
      if (!out.video) updateStep('video', { status:'warn', error:'Video still processing — check Video Builder tab' });
    } catch(e) {
      updateStep('video', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 5: Create public landing page on NichRoute ─────────────────────
    updateStep('landing', { status:'running' });
    try {
      const landingR = await fetch(API + '/api/nichroute/create-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:         topic.label,
          topicId:       topic.id,
          postContent:   out.post   || '',
          affiliateUrl:  out.link?.url  || '',
          affiliateName: out.link?.name || '',
          videoUrl:      out.videoUrl   || '',
          category:      topic.cat,
        }),
      });
      const landingD = await landingR.json();
      if (landingD.url) {
        out.landingUrl = landingD.url;
        out.landing    = landingD.url;
        updateStep('landing', { status:'done', data: landingD.url });
        // Update post to use landing page URL instead of raw affiliate link
        if (out.post && landingD.url) {
          const nl = String.fromCharCode(10);
          out.post = out.post.trimEnd() + nl + nl + 'Full details here: ' + landingD.url;
          updateStep('post', { status:'done', data: out.post });
        }
        throw new Error('DONE');  // skip old fallback code below
      }
    } catch(skipErr) {
      if (!out.landingUrl) {
      try {
      // Fallback: downloadable HTML if NichRoute unavailable
      const ctaLine = out.link ? 'Get the product: ' + out.link.url : '';
      const fallbackHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + topic.label + '</title></head><body style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:32px"><h1>' + topic.label + '</h1><p>' + (out.post||'').replace(/\n/g,'<br>') + '</p><p>' + ctaLine + '</p></body></html>';
      out.landing = fallbackHtml;
      out.landingUrl = null;
      updateStep('landing', { status:'warn', data: fallbackHtml, error: 'Saved as downloadable — deploy manually' });
    } catch(e) {
      updateStep('landing', { status:'error', error: e.message });
    }
    } // close if (!out.landingUrl)
    } // close catch(skipErr)

    // Save post to scheduled
    if (out.post) {
      try {
        const scheduled = JSON.parse(localStorage.getItem('cf_fb_scheduled')||'[]');
        scheduled.unshift({ id: Date.now(), topic: topic.label, cat: topic.cat, content: out.post, scheduledDate: new Date().toLocaleDateString(), time: '9:00 AM' });
        localStorage.setItem('cf_fb_scheduled', JSON.stringify(scheduled.slice(0,50)));
        setStats(s=>({...s,posts:s.posts+1}));
      } catch {}
    }

    // Save to session history
    const session = {
      id: Date.now(),
      topic: selectedTopic,
      date: new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
      post:    out.post    || null,
      script:  out.script  || null,
      link:    out.link    || null,
      landing: out.landing || null,
      videoUrl: out.videoUrl || null,
    };
    const newHistory = [session, ...history].slice(0, 20); // keep last 20
    setHistory(newHistory);
    localStorage.setItem('cf_cmd_history', JSON.stringify(newHistory));

    setResults(out);
    setRunning(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(id);
    setTimeout(()=>setCopied(''),2000);
  }

  function downloadLanding(html) {
    const blob = new Blob([html],{type:'text/html'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = (selectedTopic?.id||'page') + '-landing.html';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const stepStatus = (id) => pipeline[id]?.status || 'waiting';
  const stepIcon   = (s) => ({ waiting:'○', running:'⟳', building:'⟳', done:'✅', warn:'⚠️', error:'❌' }[s]||'○');

  return (
    <div style={{ padding:20, maxWidth:1000, fontFamily:'inherit', color:TXT }}>

      {/* Header */}
      <div style={{ marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:TXT }}>🚀 Command Center</div>
          <div style={{ fontSize:12, color:TXT3, marginTop:2 }}>Select a topic → everything generates automatically → you just post</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[{l:'Videos',v:stats.videos,i:'🎬',c:'#EF4444'},{l:'Posts saved',v:stats.posts,i:'📝',c:'#1877F2'},{l:'Links',v:stats.links,i:'🔗',c:ACC}].map(s=>(
            <div key={s.l} style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:16 }}>{s.i}</div>
              <div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:9, color:TXT3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works strip */}
      <div style={{ display:'flex', gap:0, marginBottom:16, background:BG2, border:`1px solid ${BORD}`, borderRadius:10, overflow:'hidden' }}>
        {[['1','Type or pick a topic',''],['→','',''],['2','Post + Video + Landing page',''],['→','',''],['3','Review & publish','']].map((s,i)=>(
          <div key={i} style={{ flex:s[1]?1:0, padding:s[1]?'10px 8px':'10px 4px', textAlign:'center' }}>
            {s[0]==='→' ? <div style={{ color:TXT3, fontSize:16 }}>→</div> : (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:ACCH }}>{s[0]}</div>
                <div style={{ fontSize:11, color:TXT2 }}>{s[1]}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Session History */}
      {!running && history.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:TXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>📋 Previous Sessions — click to retrieve</span>
            <button onClick={()=>{ setHistory([]); localStorage.removeItem('cf_cmd_history'); }}
              style={{ background:'none', border:'none', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
              Clear history
            </button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {history.slice(0,6).map((session, idx) => (
              <button key={session.id} onClick={()=>{
                  setResults({ post:session.post, script:session.script, link:session.link, landing:session.landing, videoUrl:session.videoUrl });
                  setTopic(session.topic);
                  setViewing(idx);
                }}
                style={{ padding:'7px 12px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', border:`1px solid ${BORD}`, background: viewingSession===idx ? 'rgba(29,158,117,.1)' : 'rgba(255,255,255,.03)', transition:'all .15s' }}>
                <div style={{ fontSize:11, fontWeight:700, color: viewingSession===idx ? ACCH : TXT }}>{session.topic?.icon} {session.topic?.label}</div>
                <div style={{ fontSize:9, color:TXT3 }}>{session.date} · {session.time}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic selector */}
      {!running && !results && (
        <div>
          {/* Free text topic input */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:TXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Type your own topic</div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={customTopic} onChange={function(e){setCustomTopic(e.target.value);}}
                onKeyDown={function(e){ if(e.key==='Enter'&&customTopic.trim()) setTopic({id:'custom',cat:'general',label:customTopic.trim(),icon:'✍️',hook:customTopic.trim()}); }}
                placeholder="e.g. how to start a home bakery in 2026, meal prep for busy families..."
                style={{ flex:1, padding:'10px 14px', borderRadius:9, border:`1px solid ${BORD}`, background:'rgba(255,255,255,.04)', color:TXT, fontSize:12, fontFamily:'inherit', outline:'none' }}
              />
              <button onClick={function(){if(customTopic.trim()) setTopic({id:'custom',cat:'general',label:customTopic.trim(),icon:'✍️',hook:customTopic.trim()});}}
                disabled={!customTopic.trim()}
                style={{ padding:'10px 18px', borderRadius:9, border:'none', background:customTopic.trim()?ACC:'rgba(29,158,117,.3)', color:'white', fontSize:12, fontWeight:700, cursor:customTopic.trim()?'pointer':'default', fontFamily:'inherit' }}>
                Use →
              </button>
            </div>
            <div style={{ fontSize:10, color:TXT3, marginTop:4 }}>Press Enter or click Use → then click ⚡ Generate Everything</div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:TXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Or choose a preset topic</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
            {TOPICS.map(t=>(
              <button key={t.id} onClick={()=>setTopic(t.id===selectedTopic?.id ? null : t)}
                style={{ padding:'12px 6px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', textAlign:'center', border: selectedTopic?.id===t.id ? `2px solid ${ACC}` : `1px solid ${BORD}`, background: selectedTopic?.id===t.id ? 'rgba(29,158,117,.15)' : 'rgba(255,255,255,.03)', transition:'all .15s', boxShadow: selectedTopic?.id===t.id ? `0 0 14px rgba(29,158,117,.3)` : 'none' }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{t.icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color: selectedTopic?.id===t.id ? ACCH : TXT2, lineHeight:1.3 }}>{t.label}</div>
              </button>
            ))}
          </div>

          {selectedTopic && (
            <div style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:28 }}>{selectedTopic.icon}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:TXT }}>{selectedTopic.label}</div>
                  <div style={{ fontSize:11, color:TXT3, fontStyle:'italic' }}>"{selectedTopic.hook}"</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:TXT2, lineHeight:1.7, marginBottom:14, padding:'10px 12px', background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', borderRadius:8 }}>
                <strong style={{ color:ACCH }}>What ContentForge will do automatically:</strong><br/>
                📝 Write a Facebook post about this topic<br/>
                🎬 Generate a 30-second video script and produce the MP4<br/>
                🔗 Find and embed the best matching affiliate link<br/>
                🌐 Build a landing page with your post and affiliate CTA<br/>
                <strong style={{ color:TXT3 }}>You just review and post.</strong>
              </div>
              <button onClick={()=>runPipeline(selectedTopic)}
                style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', background:ACC, color:'white', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 16px rgba(29,158,117,.4)' }}>
                ⚡ Generate Everything for "{selectedTopic.label}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pipeline progress */}
      {running && (
        <div style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:TXT, marginBottom:16 }}>
            ⚡ Generating everything for "{selectedTopic?.label}"…
          </div>
          {PIPELINE_STEPS.map(step=>{
            const s = stepStatus(step.id);
            const p = pipeline[step.id];
            return (
              <div key={step.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${BORD}` }}>
                <div style={{ fontSize:18, width:24, textAlign:'center', animation: s==='running'||s==='building' ? 'spin .8s linear infinite' : 'none' }}>
                  {s==='waiting' ? '○' : s==='done' ? '✅' : s==='error' ? '❌' : s==='warn' ? '⚠️' : step.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:TXT }}>{step.label}</div>
                  {s==='running' || s==='building' ? (
                    <div style={{ fontSize:10, color:ACCH }}>
                      {s==='building' && p?.data?.step ? p.data.step : 'Working…'}
                      {s==='building' && p?.progress ? ` (${p.progress}%)` : ''}
                    </div>
                  ) : s==='done' ? (
                    <div style={{ fontSize:10, color:ACCH }}>Complete ✓</div>
                  ) : s==='error' ? (
                    <div style={{ fontSize:10, color:'#F09595' }}>{p?.error}</div>
                  ) : (
                    <div style={{ fontSize:10, color:TXT3 }}>Waiting…</div>
                  )}
                </div>
                {(s==='running'||s==='building') && (
                  <div style={{ width:80, height:4, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:step.color, borderRadius:2, animation:'progress-bar 1.5s ease-in-out infinite' }} />
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={()=>{ abortRef.current=true; setRunning(false); }}
            style={{ marginTop:14, padding:'7px 14px', borderRadius:7, border:'1px solid rgba(226,75,74,.3)', background:'transparent', color:'#F09595', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Results — review and post */}
      {results && !running && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:TXT }}>✅ Everything is ready — review and post</div>
            <button onClick={()=>{ setResults(null); setTopic(null); setPipeline({}); setViewing(null); }}
              style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              ↺ Start over
            </button>
          </div>

          {/* Facebook post */}
          <div style={{ background:BG2, border:'1px solid rgba(24,119,242,.3)', borderRadius:12, marginBottom:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(24,119,242,.06)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#4FA3FF' }}>📘 Facebook Post — landing page URL included ✓</span>
              <button onClick={()=>copy(results.post||'','post')}
                style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#1877F2', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='post'?'✓ Copied!':'📋 Copy Post'}
              </button>
            </div>
            <div style={{ padding:'12px 14px', fontSize:12, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:180, overflow:'auto' }}>
              {results.post || 'Post generation failed — try again'}
            </div>
          </div>

          {/* Video script */}
          {results.script && (
            <div style={{ background:BG2, border:'1px solid rgba(239,68,68,.3)', borderRadius:12, marginBottom:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(239,68,68,.06)' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#FC8F8F' }}>🎬 Video Script (30 seconds)</span>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>copy(results.script,'script')}
                    style={{ padding:'5px 12px', borderRadius:6, border:'1px solid rgba(239,68,68,.3)', background:'transparent', color:'#FC8F8F', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied==='script'?'✓ Copied!':'📋 Copy Script'}
                  </button>
                  <button onClick={()=>onNavigate&&onNavigate('video')}
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'#EF4444', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    📺 YouTube Studio
                  </button>
                </div>
              </div>
              <div style={{ padding:'12px 14px', fontSize:11, color:TXT2, lineHeight:1.7, maxHeight:120, overflow:'auto' }}>
                {results.script}
              </div>
              {results.video ? (
                <div style={{ padding:'10px 14px', borderTop:`1px solid ${BORD}`, display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, color:ACCH, flex:1 }}>✅ Video MP4 ready</span>
                  <a href={results.videoUrl} download target="_blank" rel="noreferrer"
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'#EF4444', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', textDecoration:'none' }}>
                    ⬇ Download MP4
                  </a>
                </div>
              ) : pipeline.video?.status === 'error' ? (
                <div style={{ padding:'10px 14px', borderTop:`1px solid ${BORD}`, fontSize:11, color:'#FAC775' }}>
                  ⚠ Video could not be generated — {pipeline.video?.error}
                  <button onClick={()=>onNavigate&&onNavigate('video')} style={{ marginLeft:8, background:'none', border:'none', color:ACCH, fontSize:11, cursor:'pointer', textDecoration:'underline', fontFamily:'inherit' }}>
                    Open Video Builder →
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Affiliate link */}
          <div style={{ background:BG2, border:`1px solid rgba(29,158,117,.3)`, borderRadius:12, marginBottom:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, background:'rgba(29,158,117,.06)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:ACCH }}>🔗 Affiliate Link</span>
            </div>
            <div style={{ padding:'12px 14px' }}>
              {results.link ? (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:TXT }}>{results.link.name}</div>
                    <div style={{ fontSize:10, color:ACCH }}>Already included in your post automatically</div>
                  </div>
                  <button onClick={()=>copy(results.link.url,'link')}
                    style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied==='link'?'✓':'📋 Copy link'}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize:11, color:'#FAC775', lineHeight:1.6 }}>
                  No affiliate links in library yet — your post was generated without one.
                  <button onClick={()=>onNavigate&&onNavigate('affiliate')}
                    style={{ display:'block', marginTop:6, background:'none', border:'none', color:ACCH, fontSize:11, cursor:'pointer', textDecoration:'underline', fontFamily:'inherit', padding:0 }}>
                    → Add links in Affiliate Library
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Landing page */}
          {results.landing && (
            <div style={{ background:BG2, border:'1px solid rgba(139,92,246,.3)', borderRadius:12, marginBottom:16, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(139,92,246,.06)' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#A78BFA' }}>🌐 Landing Page — ready to deploy</span>
                {results.landingUrl && results.landingUrl !== 'downloaded' ? (
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>copy(results.landingUrl,'landing')}
                      style={{ padding:'5px 12px', borderRadius:6, border:'1px solid rgba(139,92,246,.3)', background:'transparent', color:'#A78BFA', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      {copied==='landing'?'✓ Copied!':'📋 Copy URL'}
                    </button>
                    <a href={results.landingUrl} target="_blank" rel="noreferrer"
                      style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#8B5CF6', color:'white', fontSize:10, fontWeight:700, textDecoration:'none' }}>
                      ↗ View Page
                    </a>
                  </div>
                ) : (
                  <button onClick={()=>downloadLanding(results.landing)}
                    style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#8B5CF6', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    ⬇ Download HTML
                  </button>
                )}
              </div>
              <div style={{ padding:'12px 14px' }}>
                {results.landingUrl && results.landingUrl !== 'downloaded' ? (
                  <div>
                    <div style={{ fontSize:12, color:ACCH, wordBreak:'break-all', marginBottom:6, fontWeight:600 }}>{results.landingUrl}</div>
                    <div style={{ fontSize:11, color:TXT3, lineHeight:1.6 }}>Live on NichRoute — use this URL in your Facebook post, bio link, and YouTube description.</div>
                  </div>
                ) : (
                  <div style={{ fontSize:11, color:TXT2, lineHeight:1.6 }}>
                    Landing page HTML ready to download and deploy. Contains your post, affiliate CTA, and FTC disclosure.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final post actions */}
          <div style={{ background:'rgba(24,119,242,.06)', border:'1px solid rgba(24,119,242,.2)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#4FA3FF', marginBottom:12 }}>📤 Final step — you post it</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button onClick={()=>copy(results.post||'','post2')}
                style={{ padding:'12px', borderRadius:9, border:'none', background:'#1877F2', color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='post2'?'✓ Copied!':'📘 Copy & Post to Facebook'}
              </button>
              <button onClick={()=>onNavigate&&onNavigate('video')}
                style={{ padding:'12px', borderRadius:9, border:'none', background:'#EF4444', color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                📺 Upload Video to YouTube
              </button>
              <button onClick={()=>onNavigate&&onNavigate('submitter')}
                style={{ padding:'12px', borderRadius:9, border:`1px solid ${BORD}`, background:'transparent', color:TXT2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                📅 Schedule Post
              </button>
              <button onClick={()=>onNavigate&&onNavigate('nichroute')}
                style={{ padding:'12px', borderRadius:9, border:`1px solid ${BORD}`, background:'transparent', color:TXT2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                🎯 Share in NichRoute Groups
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
      `}} />
    </div>
  );
}
