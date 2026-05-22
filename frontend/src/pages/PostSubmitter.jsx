import React, { useState, useEffect } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const PLATFORMS = {
  facebook:  { label:'Facebook',  icon:'📘', color:'#1877F2', desc:'Make Money from Home page' },
  instagram: { label:'Instagram', icon:'📷', color:'#E1306C', desc:'@sgreen5168' },
  youtube:   { label:'YouTube',   icon:'▶',  color:'#FF0000', desc:'Your YouTube channel' },
};

const COMPLIANCE_RULES = [
  { re:/\$\d+\s*(per|a|\/)\s*(day|week|month)/gi, label:'Income claim' },
  { re:/guaranteed|100%\s*free|no\s*risk/gi,       label:'False guarantee' },
  { re:/secret\s*(method|formula|trick)/gi,         label:'Misleading claim' },
  { re:/get\s*rich\s*quick/gi,                      label:'Get rich claim' },
  { re:/click\s*here\s*now|act\s*now/gi,            label:'Urgency language' },
];

export default function PostSubmitter() {
  const [step, setStep]         = useState(1);
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMType]   = useState('image');
  const [plats, setPlats]       = useState({ facebook:true, instagram:false, youtube:false });
  const [sched, setSched]       = useState('now');
  const [schedDate, setSchedD]  = useState('');
  const [schedTime, setSchedT]  = useState('');
  const [submitting, setSub]    = useState(false);
  const [results, setResults]   = useState([]);
  const [connected, setConn]    = useState({});
  const [compliance, setComp]   = useState(null);
  const [charCount, setChar]    = useState(0);

  useEffect(() => { checkConnections(); }, []);

  async function checkConnections() {
    const checks = {};
    for (const plat of ['facebook','instagram','youtube']) {
      try {
        const r = await fetch(`${API}/api/${plat}/verify`).then(r=>r.json()).catch(()=>({connected:false}));
        checks[plat] = r.connected;
      } catch {}
    }
    setConn(checks);
  }

  function checkCompliance(text) {
    const issues = COMPLIANCE_RULES.filter(r => text.match(r.re)).map(r => r.label);
    const score = Math.max(0, 100 - issues.length * 20);
    setComp({ score, issues, safe: issues.length === 0 });
  }

  function handleContentChange(val) {
    setContent(val);
    setChar(val.length);
    if (val.length > 20) checkCompliance(val);
    else setComp(null);
  }

  async function submit() {
    const active = Object.keys(plats).filter(p => plats[p]);
    if (!content.trim() || !active.length) return;
    setSub(true); setResults([]);

    for (const plat of active) {
      try {
        let res, data;
        if (plat === 'facebook') {
          res = await fetch(`${API}/api/facebook/post-${mediaUrl && mediaType==='video' ? 'video' : 'text'}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ message:content, title:title||content.slice(0,80), videoUrl:mediaUrl, description:content }),
          });
        } else if (plat === 'instagram') {
          res = await fetch(`${API}/api/instagram/post-${mediaUrl && mediaType==='video' ? 'video' : 'image'}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ caption:content, videoUrl:mediaUrl, imageUrl:mediaUrl }),
          });
        } else if (plat === 'youtube') {
          res = await fetch(`${API}/api/youtube/${mediaType==='video'?'upload':'upload-short'}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ videoUrl:mediaUrl, title:title||content.slice(0,80), description:content, privacy:'public' }),
          });
        }
        data = await res.json();
        setResults(prev => [...prev, { platform:plat, success:!!data.success || res.ok, url:data.url, error:data.error }]);
      } catch(e) {
        setResults(prev => [...prev, { platform:plat, success:false, error:e.message }]);
      }
    }
    setSub(false);
    setStep(3);
  }

  const S = {
    card: { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:12 },
    hdr:  { padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
    body: { padding:'14px 15px' },
    inp:  { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:10, boxSizing:'border-box' },
    lbl:  { fontSize:10, color:'#4A7A72', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:5 },
  };

  return (
    <div style={{ padding:20, maxWidth:760, fontFamily:'inherit' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:600, color:'#E8F4F0' }}>📤 Post <span style={{color:'#5DCAA5'}}>Submitter</span></div>
        <div style={{ fontSize:12, color:'#7BAAA0', marginTop:3 }}>Publish directly to your connected social accounts</div>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:20 }}>
        {[['1','Content'],['2','Platforms'],['3','Results']].map(([n,label],i) => (
          <React.Fragment key={n}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,
                background:step>=parseInt(n)?'#1D9E75':'rgba(29,158,117,.15)',
                color:step>=parseInt(n)?'white':'#4A7A72' }}>{n}</div>
              <span style={{ fontSize:12, color:step>=parseInt(n)?'#E8F4F0':'#4A7A72' }}>{label}</span>
            </div>
            {i<2 && <div style={{ flex:1, height:1, background:step>i+1?'#1D9E75':'rgba(29,158,117,.15)', margin:'0 8px' }}/>}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 */}
      {step===1 && (
        <div>
          <div style={S.card}>
            <div style={S.hdr}>✦ Post content</div>
            <div style={S.body}>
              <span style={S.lbl}>Title (YouTube & Pinterest)</span>
              <input style={S.inp} placeholder="Enter post title..." value={title} onChange={e=>setTitle(e.target.value)} />

              <span style={S.lbl}>Caption / Post text</span>
              <textarea style={{ ...S.inp, minHeight:130, resize:'vertical', lineHeight:1.7 }}
                placeholder="Write your post here or paste from AI Composer..."
                value={content} onChange={e => handleContentChange(e.target.value)}
              />

              {/* Char count + compliance */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, color:'#4A7A72' }}>{charCount} characters</span>
                {compliance && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ height:4, width:50, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:compliance.score+'%', background:compliance.safe?'#1D9E75':'#F5A623', borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:11, color:compliance.safe?'#5DCAA5':'#FAC775' }}>
                      {compliance.safe?'✓ Compliant':`⚠ ${compliance.issues[0]}`}
                    </span>
                  </div>
                )}
              </div>

              <span style={S.lbl}>Media URL (optional)</span>
              <input style={S.inp} placeholder="https://your-image-or-video-url.mp4" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} />
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {['image','video'].map(t => (
                  <button key={t} onClick={() => setMType(t)}
                    style={{ padding:'5px 14px', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:12,
                      border:`1px solid ${mediaType===t?'#1D9E75':'rgba(29,158,117,.2)'}`,
                      background:mediaType===t?'rgba(29,158,117,.15)':'transparent',
                      color:mediaType===t?'#5DCAA5':'#7BAAA0' }}>
                    {t==='image'?'🖼 Image':'🎬 Video'}
                  </button>
                ))}
              </div>

              <span style={S.lbl}>Schedule</span>
              <div style={{ display:'flex', gap:6, marginBottom: sched==='later'?10:0 }}>
                {[['now','Post now'],['later','Schedule for later']].map(([id,label]) => (
                  <button key={id} onClick={() => setSched(id)}
                    style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12,
                      border:`1px solid ${sched===id?'#1D9E75':'rgba(29,158,117,.2)'}`,
                      background:sched===id?'rgba(29,158,117,.15)':'transparent',
                      color:sched===id?'#5DCAA5':'#7BAAA0' }}>
                    {label}
                  </button>
                ))}
              </div>
              {sched==='later' && (
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <input type="date" style={{ ...S.inp, marginBottom:0, flex:1 }} value={schedDate} onChange={e=>setSchedD(e.target.value)} />
                  <input type="time" style={{ ...S.inp, marginBottom:0, flex:1 }} value={schedTime} onChange={e=>setSchedT(e.target.value)} />
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!content.trim()}
            style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:!content.trim()?0.5:1 }}>
            Next — Choose Platforms →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step===2 && (
        <div>
          <div style={S.card}>
            <div style={S.hdr}>📤 Select platforms</div>
            <div style={S.body}>
              {Object.entries(PLATFORMS).map(([k,v]) => {
                const isConn = connected[k];
                const isSel  = plats[k];
                return (
                  <div key={k} onClick={() => isConn && setPlats(p=>({...p,[k]:!p[k]}))}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, marginBottom:8,
                      cursor:isConn?'pointer':'not-allowed',
                      border:`1px solid ${isSel&&isConn?v.color+'66':'rgba(29,158,117,.15)'}`,
                      background:isSel&&isConn?`${v.color}11`:'rgba(22,61,106,.3)',
                      opacity:isConn?1:0.5 }}>
                    <span style={{ fontSize:22 }}>{v.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:8 }}>
                        {v.label}
                        <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:isConn?'rgba(29,158,117,.15)':'rgba(255,255,255,.05)', color:isConn?'#1D9E75':'#7BAAA0' }}>
                          {isConn?'✓ Connected':'Not connected'}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:'#7BAAA0' }}>{v.desc}</div>
                      {!isConn && <div style={{ fontSize:10, color:'#4A7A72', marginTop:2 }}>Add token to Railway to enable</div>}
                    </div>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${isSel&&isConn?v.color:'rgba(29,158,117,.3)'}`, background:isSel&&isConn?v.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {isSel && isConn && <span style={{ fontSize:10, color:'white' }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div style={S.card}>
            <div style={S.hdr}>📋 Preview</div>
            <div style={S.body}>
              {title && <div style={{ fontSize:14, fontWeight:600, color:'#E8F4F0', marginBottom:6 }}>{title}</div>}
              <div style={{ fontSize:13, color:'#7BAAA0', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{content}</div>
              {mediaUrl && <div style={{ marginTop:8, fontSize:11, color:'#5DCAA5' }}>{mediaType==='video'?'🎬':'🖼'} Media attached</div>}
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setStep(1)} style={{ padding:'11px 18px', borderRadius:10, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
            <button onClick={submit} disabled={submitting || !Object.values(plats).some(Boolean)}
              style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                opacity:submitting||!Object.values(plats).some(Boolean)?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {submitting?<><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/>Posting...</>:'📤 Publish Now'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3 && (
        <div>
          <div style={S.card}>
            <div style={S.hdr}>📊 Results</div>
            <div style={S.body}>
              {results.map((r,i) => {
                const meta = PLATFORMS[r.platform];
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, marginBottom:8,
                    background:r.success?'rgba(29,158,117,.08)':'rgba(226,75,74,.08)',
                    border:`1px solid ${r.success?'rgba(29,158,117,.2)':'rgba(226,75,74,.2)'}` }}>
                    <span style={{ fontSize:22 }}>{meta?.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>
                        {meta?.label} — {r.success?'✅ Posted!':'❌ Failed'}
                      </div>
                      {r.success && r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#5DCAA5' }}>View post ↗</a>}
                      {!r.success && <div style={{ fontSize:11, color:'#F09595', marginTop:2 }}>{r.error}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={() => { setStep(1); setResults([]); setContent(''); setTitle(''); setMediaUrl(''); }}
            style={{ width:'100%', padding:'11px', borderRadius:10, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#5DCAA5', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            ↻ Create another post
          </button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
