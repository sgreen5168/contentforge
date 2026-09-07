import { useState, useEffect } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const API  = (typeof window !== 'undefined' && window.__CF_API__) || 'https://contentforge-production-6e13.up.railway.app';

const PLATFORMS = [
  { id:'youtube',   label:'YouTube Shorts', icon:'▶', color:'#EF4444', url:'https://studio.youtube.com', autoPost:false, note:'Use AI Video Engine tab for auto-upload with metadata' },
  { id:'tiktok',    label:'TikTok',         icon:'🎵', color:'#010101', url:'https://www.tiktok.com/upload', autoPost:false, note:'Copy caption → open TikTok → upload video → paste caption' },
  { id:'instagram', label:'Instagram Reels',icon:'📸', color:'#E1306C', url:'https://www.instagram.com/', autoPost:true,  note:'Auto-post available when token is valid' },
  { id:'pinterest', label:'Pinterest',       icon:'📌', color:'#E60023', url:'https://pinterest.com/pin-builder/', autoPost:false, note:'Copy fields → open Pinterest → create pin' },
  { id:'reddit',    label:'Reddit',          icon:'🔴', color:'#FF4500', url:'https://www.reddit.com/submit', autoPost:false, note:'Use Reddit Finder in Grow zone to find the right community' },
  { id:'facebook',  label:'Facebook',        icon:'📘', color:'#1877F2', url:'https://www.facebook.com/', autoPost:true,  note:'Auto-post to your page when token is valid' },
];

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, ...extra };
}
function inp(extra) {
  return { width:'100%', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:8, padding:'9px 12px', fontSize:12, color:TXT, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra };
}

export default function PublishHub({ onNavigate }) {
  const [session, setSession] = useState(null);
  const [topic, setTopic] = useState(null);
  const [activePlatform, setActivePlatform] = useState('youtube');
  const [copied, setCopied] = useState('');
  const [fbPosting, setFbPosting] = useState(false);
  const [fbResult, setFbResult] = useState(null);
  const [igPosting, setIgPosting] = useState(false);
  const [igResult, setIgResult] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [thumbLoading, setThumbLoading] = useState(false);

  useEffect(function() {
    try {
      const s = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const t = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      setSession(s);
      setTopic(t);
    } catch(e) {}
  }, []);

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  async function postToFacebook() {
    if (!session?.post) return;
    setFbPosting(true); setFbResult(null);
    try {
      const r = await fetch(API + '/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: session.post, link: session.landingUrl || '' }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setFbResult({ success:true, id:d.id });
    } catch(e) { setFbResult({ success:false, error:e.message }); }
    setFbPosting(false);
  }

  async function postToInstagram() {
    if (!session?.igCaption) return;
    setIgPosting(true); setIgResult(null);
    try {
      const r = await fetch(API + '/api/instagram/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: session.igCaption, videoUrl: session.videoUrl || null }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setIgResult({ success:true, id:d.id });
    } catch(e) { setIgResult({ success:false, error:e.message }); }
    setIgPosting(false);
  }

  async function generateThumbnail() {
    setThumbLoading(true);
    try {
      const r = await fetch(API + '/api/thumbnail/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title: session?.youtubeTitle || topic?.label || '', topic: topic?.label || '', category: topic?.cat || '' }),
      });
      const d = await r.json();
      if (d.bgImageUrl) {
        const canvas = document.createElement('canvas');
        canvas.width = 1280; canvas.height = 720;
        const ctx = canvas.getContext('2d');
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise(function(res, rej){ img.onload=res; img.onerror=rej; img.src=d.bgImageUrl; });
        ctx.drawImage(img, 0, 0, 1280, 720);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 64px Arial'; ctx.textAlign = 'center';
        const words = (d.title||'').split(' '); let lines = []; let line = '';
        words.forEach(function(w){ const t = line + (line?' ':'')+w; if(ctx.measureText(t).width>1100){lines.push(line);line=w;}else line=t; });
        lines.push(line);
        const startY = 360 - (lines.length*76)/2;
        lines.forEach(function(l,i){ ctx.fillText(l, 640, startY+i*76); });
        setThumbUrl(canvas.toDataURL('image/jpeg', 0.92));
      }
    } catch(e) { console.warn(e); }
    setThumbLoading(false);
  }

  const pp = PLATFORMS.find(function(p){ return p.id === activePlatform; });

  const platformContent = {
    youtube:   { title: session?.youtubeTitle || '', desc: session?.youtubeDescription || '', tags: session?.youtubeTags || '', extra: session?.landingUrl || '' },
    tiktok:    { title: session?.youtubeTitle || '', desc: session?.tikTokCaption || '', tags: '', extra: session?.landingUrl || '' },
    instagram: { title: session?.youtubeTitle || '', desc: session?.igCaption || '', tags: '', extra: session?.landingUrl || '' },
    pinterest: { title: session?.youtubeTitle || topic?.label || '', desc: (session?.post||'').slice(0,300) + '\n\nFull details at the link below 🔗', tags: '', extra: session?.landingUrl || '' },
    reddit:    { title: session?.youtubeTitle || topic?.label || '', desc: session?.post || '', tags: '', extra: session?.landingUrl || '' },
    facebook:  { title: '', desc: session?.post || '', tags: '', extra: session?.landingUrl || '' },
  };
  const pc = platformContent[activePlatform] || {};

  return (
    <div style={{ minHeight:'100vh', background:BG, color:TXT, fontFamily:'system-ui,sans-serif', padding:'24px 20px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* Zone header */}
        <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#EF4444' }}>📤 Publish Zone</div>
            <div style={{ fontSize:11, color:TXT3 }}>All content auto-filled from your last Command Center session</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {PLATFORMS.map(function(p){
              return (
                <span key={p.id} style={{ fontSize:10, display:'flex', alignItems:'center', gap:4, color:p.autoPost?'#34D399':TXT3 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:p.autoPost?'#34D399':'rgba(255,255,255,.2)', display:'inline-block' }} />
                  {p.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Session loaded indicator */}
        {session ? (
          <div style={{ marginBottom:16, padding:'8px 12px', background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:GRN, fontSize:14 }}>✓</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:GRN }}>Session loaded — {topic?.label || 'Last generated topic'}</div>
              <div style={{ fontSize:11, color:TXT3 }}>All fields below are auto-filled. Go to Create zone to generate new content.</div>
            </div>
            <button onClick={function(){ onNavigate && onNavigate('dashboard'); }}
              style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
              ← Create new
            </button>
          </div>
        ) : (
          <div style={{ marginBottom:16, padding:'12px 14px', background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', borderRadius:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#FC8F8F', marginBottom:4 }}>No session loaded</div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:8 }}>Generate content in the Create zone first — everything here auto-fills from your last session.</div>
            <button onClick={function(){ onNavigate && onNavigate('dashboard'); }}
              style={{ padding:'6px 14px', borderRadius:7, border:'none', background:GRN, color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              ⚡ Go to Create zone
            </button>
          </div>
        )}

        {/* Thumbnail generator */}
        {session && (
          <div style={{ ...card({ marginBottom:16 }) }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:thumbUrl?10:0 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:TXT }}>🖼 Thumbnail — use on all platforms</div>
                <div style={{ fontSize:11, color:TXT3, marginTop:2 }}>Generated from your topic with Pexels background — download once, use everywhere</div>
              </div>
              <button onClick={generateThumbnail} disabled={thumbLoading}
                style={{ padding:'7px 14px', borderRadius:7, border:`1px solid ${BORD}`, background:thumbLoading?'transparent':GRN, color:thumbLoading?TXT3:'white', fontSize:11, fontWeight:700, cursor:thumbLoading?'default':'pointer', fontFamily:'inherit' }}>
                {thumbLoading?'⏳ Generating...':'🖼 Generate thumbnail'}
              </button>
            </div>
            {thumbUrl && (
              <div>
                <img src={thumbUrl} alt="Thumbnail" style={{ width:'100%', borderRadius:8, marginBottom:8 }} />
                <a href={thumbUrl} download="thumbnail.jpg"
                  style={{ display:'block', padding:'7px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                  ⬇ Download thumbnail (1280×720px)
                </a>
              </div>
            )}
          </div>
        )}

        {/* Platform tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          {PLATFORMS.map(function(p){
            const active = activePlatform === p.id;
            return (
              <button key={p.id} onClick={function(){ setActivePlatform(p.id); }}
                style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${active?p.color+'80':BORD}`, background:active?p.color+'18':'transparent', color:active?p.color:TXT3, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                <span>{p.icon}</span> {p.label}
                {p.autoPost && <span style={{ fontSize:9, background:'rgba(29,158,117,.2)', color:GRN, padding:'1px 5px', borderRadius:4 }}>auto</span>}
              </button>
            );
          })}
        </div>

        {/* Platform panel */}
        {pp && (
          <div style={{ ...card() }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:pp.color }}>{pp.icon} {pp.label}</div>
                <div style={{ fontSize:11, color:TXT3, marginTop:2 }}>{pp.note}</div>
              </div>
              <a href={pp.url} target="_blank" rel="noreferrer"
                style={{ padding:'7px 14px', borderRadius:7, border:`1px solid ${pp.color}50`, background:pp.color+'18', color:pp.color, fontSize:11, fontWeight:700, textDecoration:'none' }}>
                Open {pp.label} →
              </a>
            </div>

            {/* Auto-post buttons for Facebook and Instagram */}
            {activePlatform === 'facebook' && (
              <div style={{ marginBottom:12 }}>
                <button onClick={postToFacebook} disabled={fbPosting||!session}
                  style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:fbPosting?'rgba(24,119,242,.3)':'#1877F2', color:'white', fontSize:12, fontWeight:700, cursor:(fbPosting||!session)?'default':'pointer', fontFamily:'inherit', marginBottom:6 }}>
                  {fbPosting?'⏳ Posting to Facebook...':'⚡ Auto-Post to Facebook Now'}
                </button>
                {fbResult && (
                  <div style={{ padding:'7px 10px', borderRadius:7, background:fbResult.success?'rgba(5,150,105,.08)':'rgba(239,68,68,.08)', border:`1px solid ${fbResult.success?'rgba(5,150,105,.2)':'rgba(239,68,68,.2)'}`, fontSize:11, color:fbResult.success?'#34D399':'#FC8F8F' }}>
                    {fbResult.success?'✅ Posted to Facebook! Post ID: '+fbResult.id:'❌ '+fbResult.error}
                  </div>
                )}
              </div>
            )}

            {activePlatform === 'instagram' && (
              <div style={{ marginBottom:12 }}>
                <button onClick={postToInstagram} disabled={igPosting||!session}
                  style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:igPosting?'rgba(225,48,108,.3)':'#E1306C', color:'white', fontSize:12, fontWeight:700, cursor:(igPosting||!session)?'default':'pointer', fontFamily:'inherit', marginBottom:6 }}>
                  {igPosting?'⏳ Posting to Instagram...':'📸 Auto-Post to Instagram Now'}
                </button>
                {igResult && (
                  <div style={{ padding:'7px 10px', borderRadius:7, background:igResult.success?'rgba(5,150,105,.08)':'rgba(239,68,68,.08)', border:`1px solid ${igResult.success?'rgba(5,150,105,.2)':'rgba(239,68,68,.2)'}`, fontSize:11, color:igResult.success?'#34D399':'#FC8F8F' }}>
                    {igResult.success?'✅ Posted to Instagram! ID: '+igResult.id:'❌ '+igResult.error}
                  </div>
                )}
              </div>
            )}

            {/* Auto-filled content fields */}
            <div style={{ fontSize:11, fontWeight:700, color:TXT2, marginBottom:8 }}>
              ✨ Auto-filled from Command Center — copy each field
            </div>

            {[
              pc.title && { label:'Title', value:pc.title, id:'title' },
              pc.desc  && { label:activePlatform==='facebook'?'Post':'Caption / Description', value:pc.desc, id:'desc', rows:5 },
              pc.tags  && { label:'Tags', value:pc.tags, id:'tags' },
              pc.extra && { label:'Landing page URL', value:pc.extra, id:'url' },
              session?.link?.url && { label:'Affiliate link', value:session.link.url, id:'aff' },
            ].filter(Boolean).map(function(f){
              return (
                <div key={f.id} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ fontSize:11, color:TXT3 }}>{f.label}</div>
                    <button onClick={function(){ copy(f.value, f.id); }}
                      style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                      {copied===f.id?'✓ Copied!':'📋 Copy'}
                    </button>
                  </div>
                  {f.rows ? (
                    <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6, maxHeight:120, overflowY:'auto' }}>{f.value}</div>
                  ) : (
                    <div style={{ fontSize:11, color:TXT2, padding:'6px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.value || '—'}</div>
                  )}
                </div>
              );
            })}

            {/* Copy all button */}
            <button onClick={function(){
              const all = [pc.title, pc.desc, pc.extra, session?.link?.url].filter(Boolean).join('\n\n');
              copy(all, 'all');
              setTimeout(function(){ window.open(pp.url, '_blank'); }, 400);
            }}
              style={{ width:'100%', padding:'9px', borderRadius:8, border:'none', background:pp.color, color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {copied==='all'?'✓ Copied! Opening '+pp.label+'...':'📋 Copy all content + Open '+pp.label}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
