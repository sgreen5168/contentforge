import React, { useState, useEffect } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const PLATFORMS = {
  facebook:  { label:'Facebook',  icon:'📘', color:'#1877F2', desc:'Post to Make Money from Home page' },
  instagram: { label:'Instagram', icon:'📷', color:'#E1306C', desc:'Post Reel to @sgreen5168' },
  pinterest: { label:'Pinterest', icon:'📌', color:'#E60023', desc:'Pin to your Pinterest boards' },
  youtube:   { label:'YouTube',   icon:'▶',  color:'#FF0000', desc:'Upload to your YouTube channel' },
};

export default function PostSubmitter() {
  const [step, setStep]         = useState(1);
  const [content, setContent]   = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [title, setTitle]       = useState('');
  const [platforms, setPlatforms] = useState({ facebook:true, instagram:false });
  const [scheduling, setSched]  = useState('now');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [submitting, setSub]    = useState(false);
  const [results, setResults]   = useState([]);
  const [statuses, setStatuses] = useState({});
  const [compliance, setCompliance] = useState(null);
  const [connected, setConnected] = useState({});

  useEffect(() => { checkConnections(); }, []);

  async function checkConnections() {
    const checks = {};
    try {
      const fb = await fetch(`${API}/api/facebook/verify`).then(r => r.json()).catch(() => ({ connected:false }));
      checks.facebook = fb.connected;
    } catch {}
    try {
      const ig = await fetch(`${API}/api/instagram/verify`).then(r => r.json()).catch(() => ({ connected:false }));
      checks.instagram = ig.connected;
    } catch {}
    setConnected(checks);
  }

  function checkCompliance(text) {
    const issues = [];
    const rules = [
      { pattern:/\$\d+\s*(per|a|\/)\s*(day|week|month)/gi, label:'Income claim' },
      { pattern:/guaranteed|100%\s*free|no\s*risk/gi,       label:'False guarantee' },
      { pattern:/secret\s*(method|formula|trick)/gi,         label:'Misleading claim' },
      { pattern:/get\s*rich\s*quick/gi,                      label:'Get rich claim' },
      { pattern:/click\s*here\s*now|act\s*now/gi,            label:'Urgency language' },
    ];
    rules.forEach(r => { if (text.match(r.pattern)) issues.push(r.label); });
    const score = Math.max(0, 100 - issues.length * 20);
    setCompliance({ score, issues, safe: issues.length === 0 });
  }

  async function submit() {
    const active = Object.keys(platforms).filter(p => platforms[p]);
    if (!content.trim() || !active.length) return;
    setSub(true); setResults([]); setStatuses({});

    for (const plat of active) {
      setStatuses(prev => ({ ...prev, [plat]: 'posting' }));
      try {
        let res;
        if (plat === 'facebook') {
          const endpoint = mediaUrl && mediaType === 'video' ? '/api/facebook/post-video' : '/api/facebook/post-text';
          res = await fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: content, title: title || content.slice(0,80), videoUrl: mediaUrl, description: content }),
          });
        } else if (plat === 'instagram') {
          const endpoint = mediaUrl && mediaType === 'video' ? '/api/instagram/post-video' : '/api/instagram/post-image';
          res = await fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caption: content, videoUrl: mediaUrl, imageUrl: mediaUrl }),
          });
        } else {
          setStatuses(prev => ({ ...prev, [plat]: 'skipped' }));
          setResults(prev => [...prev, { platform: plat, success: false, error: 'API not yet connected — add token to Railway' }]);
          continue;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatuses(prev => ({ ...prev, [plat]: 'done' }));
        setResults(prev => [...prev, { platform: plat, success: true, url: data.url }]);
      } catch (e) {
        setStatuses(prev => ({ ...prev, [plat]: 'failed' }));
        setResults(prev => [...prev, { platform: plat, success: false, error: e.message }]);
      }
    }
    setSub(false);
    setStep(3);
  }

  const S = {
    card:  { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14 },
    hdr:   { padding:'12px 16px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:8 },
    body:  { padding:'16px' },
    inp:   { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:12, boxSizing:'border-box' },
    label: { fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:5, display:'block' },
  };

  return (
    <div style={{ padding:24, maxWidth:800, fontFamily:'inherit' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 }}>
          📤 Post Submitter
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>Multi-platform</span>
        </div>
        <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Publish posts and videos directly to your connected social accounts</div>
      </div>

      {/* Step indicators */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:20 }}>
        {[['1','Content'],['2','Platforms'],['3','Results']].map(([n,label], i) => (
          <React.Fragment key={n}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600,
                background: step >= parseInt(n) ? '#1D9E75' : 'rgba(29,158,117,.15)',
                color: step >= parseInt(n) ? 'white' : '#4A7A72' }}>{n}</div>
              <span style={{ fontSize:12, color: step >= parseInt(n) ? '#E8F4F0' : '#4A7A72' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:1, background: step > i+1 ? '#1D9E75' : 'rgba(29,158,117,.2)', margin:'0 10px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Content */}
      {step === 1 && (
        <div>
          <div style={S.card}>
            <div style={S.hdr}>✦ Post content</div>
            <div style={S.body}>
              <span style={S.label}>Post title (optional — for YouTube & Pinterest)</span>
              <input style={S.inp} placeholder="Enter a title for your post..." value={title} onChange={e => setTitle(e.target.value)} />

              <span style={S.label}>Post caption / text</span>
              <textarea style={{ ...S.inp, minHeight:120, resize:'vertical', lineHeight:1.6 }}
                placeholder="Write your post caption here, or paste from AI Composer..."
                value={content}
                onChange={e => { setContent(e.target.value); if(e.target.value.length > 20) checkCompliance(e.target.value); }}
              />

              {/* Compliance indicator */}
              {compliance && (
                <div style={{ marginBottom:12, padding:'8px 12px', borderRadius:8,
                  background: compliance.safe ? 'rgba(29,158,117,.08)' : 'rgba(245,166,35,.08)',
                  border: `1px solid ${compliance.safe ? 'rgba(29,158,117,.2)' : 'rgba(245,166,35,.2)'}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: compliance.issues.length ? 6 : 0 }}>
                    <div style={{ height:4, width:60, background:'rgba(255,255,255,.1)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:compliance.score+'%', background: compliance.safe ? '#1D9E75' : '#F5A623', borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:11, color: compliance.safe ? '#5DCAA5' : '#FAC775' }}>
                      {compliance.safe ? '✓ Compliant' : `${compliance.issues.length} issue${compliance.issues.length>1?'s':''} found`}
                    </span>
                  </div>
                  {compliance.issues.length > 0 && (
                    <div style={{ fontSize:11, color:'#7BAAA0' }}>⚠ {compliance.issues.join(' · ')}</div>
                  )}
                </div>
              )}

              <span style={S.label}>Media URL (image or video — optional)</span>
              <input style={S.inp} placeholder="https://your-image-or-video-url.com/file.mp4" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />

              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                {['image','video'].map(t => (
                  <button key={t} onClick={() => setMediaType(t)}
                    style={{ padding:'6px 14px', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:12,
                      border: `1px solid ${mediaType===t ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: mediaType===t ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: mediaType===t ? '#5DCAA5' : '#7BAAA0' }}>
                    {t === 'image' ? '🖼 Image' : '🎬 Video'}
                  </button>
                ))}
              </div>

              <span style={S.label}>Schedule</span>
              <div style={{ display:'flex', gap:8, marginBottom: scheduling==='later' ? 10 : 0 }}>
                {[['now','Post now'],['later','Schedule']].map(([id,label]) => (
                  <button key={id} onClick={() => setSched(id)}
                    style={{ padding:'7px 16px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12,
                      border: `1px solid ${scheduling===id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: scheduling===id ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: scheduling===id ? '#5DCAA5' : '#7BAAA0' }}>
                    {label}
                  </button>
                ))}
              </div>
              {scheduling === 'later' && (
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <input type="date" style={{ ...S.inp, marginBottom:0, flex:1 }} value={schedDate} onChange={e => setSchedDate(e.target.value)} />
                  <input type="time" style={{ ...S.inp, marginBottom:0, flex:1 }} value={schedTime} onChange={e => setSchedTime(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!content.trim()}
            style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:!content.trim()?0.5:1 }}>
            Next — Choose Platforms →
          </button>
        </div>
      )}

      {/* Step 2 — Platforms */}
      {step === 2 && (
        <div>
          <div style={S.card}>
            <div style={S.hdr}>📤 Select platforms to post to</div>
            <div style={S.body}>
              {Object.entries(PLATFORMS).map(([key, plat]) => {
                const isConnected = connected[key];
                const isSelected  = platforms[key];
                return (
                  <div key={key} onClick={() => isConnected && setPlatforms(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, marginBottom:8, cursor: isConnected ? 'pointer' : 'not-allowed',
                      border: `1px solid ${isSelected && isConnected ? plat.color+'66' : 'rgba(29,158,117,.15)'}`,
                      background: isSelected && isConnected ? `${plat.color}11` : 'rgba(22,61,106,.3)',
                      opacity: isConnected ? 1 : 0.5 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{plat.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:8 }}>
                        {plat.label}
                        {isConnected
                          ? <span style={{ fontSize:10, color:'#1D9E75', background:'rgba(29,158,117,.15)', padding:'1px 6px', borderRadius:8 }}>✓ Connected</span>
                          : <span style={{ fontSize:10, color:'#7BAAA0', background:'rgba(255,255,255,.05)', padding:'1px 6px', borderRadius:8 }}>Not connected</span>}
                      </div>
                      <div style={{ fontSize:11, color:'#7BAAA0', marginTop:2 }}>{plat.desc}</div>
                      {!isConnected && (
                        <div style={{ fontSize:10, color:'#4A7A72', marginTop:3 }}>Add token to Railway to enable auto-posting</div>
                      )}
                    </div>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${isSelected&&isConnected?plat.color:'rgba(29,158,117,.3)'}`, background: isSelected&&isConnected?plat.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isSelected && isConnected && <span style={{ fontSize:11, color:'white' }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content preview */}
          <div style={S.card}>
            <div style={S.hdr}>📋 Post preview</div>
            <div style={S.body}>
              {title && <div style={{ fontSize:14, fontWeight:600, color:'#E8F4F0', marginBottom:6 }}>{title}</div>}
              <div style={{ fontSize:13, color:'#7BAAA0', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{content}</div>
              {mediaUrl && (
                <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(22,61,106,.4)', borderRadius:6, fontSize:11, color:'#5DCAA5' }}>
                  {mediaType === 'video' ? '🎬' : '🖼'} Media attached: {mediaUrl.slice(0,60)}...
                </div>
              )}
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setStep(1)} style={{ padding:'12px 20px', borderRadius:10, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              ← Back
            </button>
            <button onClick={submit} disabled={submitting || !Object.values(platforms).some(Boolean)}
              style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                opacity: submitting||!Object.values(platforms).some(Boolean) ? 0.5 : 1,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {submitting ? <><span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block' }} />Posting...</> : '📤 Publish Now'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 3 && (
        <div>
          <div style={S.card}>
            <div style={S.hdr}>📊 Publishing results</div>
            <div style={S.body}>
              {results.map((r, i) => {
                const plat = PLATFORMS[r.platform];
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, marginBottom:8,
                    background: r.success ? 'rgba(29,158,117,.08)' : 'rgba(226,75,74,.08)',
                    border: `1px solid ${r.success ? 'rgba(29,158,117,.2)' : 'rgba(226,75,74,.2)'}` }}>
                    <span style={{ fontSize:20 }}>{plat?.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>
                        {plat?.label} — {r.success ? '✅ Posted successfully' : '❌ Failed'}
                      </div>
                      {r.success && r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#5DCAA5' }}>View post ↗</a>
                      )}
                      {!r.success && <div style={{ fontSize:11, color:'#F09595' }}>{r.error}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => { setStep(1); setResults([]); setStatuses({}); setContent(''); setMediaUrl(''); setTitle(''); }}
            style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            ↻ Create another post
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
