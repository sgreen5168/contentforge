import React, { useState } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const PLATFORMS = {
  facebook:  { label:'Facebook',  color:'#1877F2', icon:'📘', limit:63206 },
  instagram: { label:'Instagram', color:'#E1306C', icon:'📷', limit:2200  },
};

const STYLES   = ['Casual','Educational','Inspirational','Humorous','Promotional','Short'];
const NICHES   = ['Make Money Online','Health & Wellness','Fitness','Beauty','Personal Finance','Self Improvement','Home & Garden','Technology','Food','Travel'];
const TONES    = ['First person (I)','Third person','Question-based','Story-based','List format'];

const COMPLIANCE_RULES = [
  { re:/\$\d+\s*(per|a|\/)\s*(day|week|month|hour)/gi,   label:'Income claim',      fix:'Use "build additional income" instead' },
  { re:/guaranteed|100%\s*free|no\s*risk/gi,              label:'False guarantee',   fix:'Use "satisfaction guaranteed" instead' },
  { re:/secret\s*(method|formula|trick|hack)/gi,           label:'Misleading claim',  fix:'Use "simple approach" instead' },
  { re:/get\s*rich\s*quick|easy\s*money/gi,                label:'Get rich claim',    fix:'Use "build long-term income" instead' },
  { re:/click\s*here\s*now|act\s*now|limited\s*time/gi,   label:'Urgency language',  fix:'Use "learn more" instead' },
  { re:/cure[sd]?|treat[sed]?|heal[sed]?/gi,              label:'Medical claim',     fix:'Add "consult a professional" disclaimer' },
  { re:/lose\s*\d+\s*(lbs?|pounds?|kg)/gi,                label:'Weight loss claim', fix:'Add "results not typical" disclaimer' },
];

function checkCompliance(text) {
  const issues = COMPLIANCE_RULES.filter(r => text.match(r.re));
  return { score: Math.max(0, 100 - issues.length * 20), issues, safe: issues.length === 0 };
}

function embedLink(text, url, keyword, mode) {
  if (!url || !text) return text;
  if (mode === 'manual') return text;
  if (mode === 'keyword' && keyword) {
    const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    return text.replace(re, `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">${keyword}</a>`);
  }
  // Auto mode
  const avoid = new Set(['click','here','this','link','visit','check','read','more','now','get','see','go','try','and','the','for','with','that','have','from']);
  const words = text.split(/\s+/);
  let best = -1, bestScore = 0;
  words.forEach((w, i) => {
    const c = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (c.length < 4 || avoid.has(c)) return;
    const score = (1 - Math.abs(i/words.length - 0.6)) * 0.5 + Math.min(c.length/12,1) * 0.5;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  if (best === -1) return text;
  words[best] = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">${words[best]}</a>`;
  return words.join(' ');
}

export default function Composer() {
  const [tab, setTab]           = useState('topic');
  const [topic, setTopic]       = useState('');
  const [url, setUrl]           = useState('');
  const [style, setStyle]       = useState('Casual');
  const [niche, setNiche]       = useState('');
  const [tone, setTone]         = useState('First person (I)');
  const [plats, setPlats]       = useState({ facebook:true, instagram:true });
  const [affOn, setAffOn]       = useState(false);
  const [affUrl, setAffUrl]     = useState('');
  const [affMode, setAffMode]   = useState('auto');
  const [keyword, setKeyword]   = useState('');
  const [autoImg, setAutoImg]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [posts, setPosts]       = useState(null);
  const [imgs, setImgs]         = useState({});
  const [imgLoad, setImgLoad]   = useState(false);
  const [edited, setEdited]     = useState({});
  const [editing, setEditing]   = useState({});
  const [copied, setCopied]     = useState('');
  const [error, setError]       = useState('');
  const [compliance, setComp]   = useState(null);
  const [publishRes, setPubRes] = useState({});
  const [publishing, setPub]    = useState({});

  const active = Object.keys(plats).filter(p => plats[p]);
  const input  = tab === 'topic' ? topic : url;
  const effUrl = affUrl || (tab === 'affiliate' ? url : '');

  async function generate() {
    if (!input.trim() || !active.length) return;
    setLoading(true); setPosts(null); setEdited({}); setEditing({}); setError(''); setComp(null); setPubRes({});
    try {
      const res = await fetch(`${API}/api/generate`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode: tab === 'topic' ? 'topic' : 'url',
          topic: topic || url,
          url,
          style,
          niche,
          tone,
          platforms: active,
          affiliate: affOn,
          affiliateUrl: effUrl,
          keyword: affMode === 'keyword' ? keyword : '',
          linkMode: affOn ? affMode : 'none',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts);

      // Compliance check on first post
      const firstText = Object.values(data.posts)[0]?.text || '';
      setComp(checkCompliance(firstText));

      // Auto generate image
      if (autoImg) generateImage(topic || url, style);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateImage(prompt, style) {
    setImgLoad(true);
    try {
      const seed = Math.floor(Math.random() * 999999);
      const styleMap = {
        Casual:'lifestyle photography, natural light, authentic',
        Educational:'professional clean background, informative',
        Inspirational:'motivational, warm colors, uplifting',
        Humorous:'fun, bright colors, playful',
        Promotional:'marketing, polished, professional',
      };
      const seoPrompt = [prompt, styleMap[style]||'lifestyle', 'no text, no watermarks, high quality'].join(', ');
      // Standard social media post size — 1:1 square 600px (loads faster, right size for posts)
      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(seoPrompt)}?width=600&height=600&seed=${seed}&nologo=true&enhance=true`;
      const seoName = prompt.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40);
      setImgs({ url:imgUrl, alt:`${prompt} social media image`, fileName:`${seoName}-social.png` });
    } catch(e) {
      console.warn('Image gen failed:', e.message);
    } finally {
      setImgLoad(false);
    }
  }

  async function publishPost(platform, text) {
    setPub(prev => ({ ...prev, [platform]:true }));
    setPubRes(prev => ({ ...prev, [platform]:null }));
    try {
      const endpoint = platform === 'facebook' ? '/api/facebook/post-text' : '/api/instagram/post-image';
      const body = platform === 'facebook'
        ? { message: text, link: effUrl || undefined }
        : { caption: text, imageUrl: imgs?.url || undefined };
      const res = await fetch(`${API}${endpoint}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setPubRes(prev => ({ ...prev, [platform]: data.success ? { ok:true, url:data.url } : { ok:false, err:data.error } }));
    } catch(e) {
      setPubRes(prev => ({ ...prev, [platform]:{ ok:false, err:e.message } }));
    } finally {
      setPub(prev => ({ ...prev, [platform]:false }));
    }
  }

  function getText(p) { return edited[p] ?? posts[p]?.text ?? ''; }
  function getHtml(p) {
    const base = getText(p);
    return affOn && effUrl ? embedLink(base, effUrl, keyword, affMode) : base;
  }

  function copyPost(p, html=false) {
    if (html) {
      const blob = new Blob([getHtml(p)], {type:'text/html'});
      const plain = new Blob([getText(p)], {type:'text/plain'});
      navigator.clipboard.write([new ClipboardItem({'text/html':blob,'text/plain':plain})]).catch(()=>{});
    } else {
      navigator.clipboard.writeText(getText(p) + (affOn && effUrl && affMode==='manual' ? `\n\n${effUrl}` : '')).catch(()=>{});
    }
    setCopied(p + (html?'_html':''));
    setTimeout(() => setCopied(''), 2000);
  }

  const S = {
    card:  { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:12 },
    hdr:   { padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', justifyContent:'space-between' },
    body:  { padding:'12px 14px' },
    inp:   { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:10, boxSizing:'border-box' },
    lbl:   { fontSize:10, color:'#4A7A72', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:5 },
    chip:  (active) => ({ padding:'5px 11px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:500, border:`1px solid ${active?'#1D9E75':'rgba(29,158,117,.2)'}`, background:active?'rgba(29,158,117,.15)':'transparent', color:active?'#5DCAA5':'#7BAAA0', margin:'0 4px 4px 0' }),
    btn:   { padding:'9px 18px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  };

  return (
    <div style={{ padding:20, maxWidth:1100, fontFamily:'inherit' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:600, color:'#E8F4F0' }}>✦ AI Content <span style={{color:'#5DCAA5'}}>Composer</span></div>
        <div style={{ fontSize:12, color:'#7BAAA0', marginTop:3 }}>Generate platform-ready posts with compliance checking and direct publishing</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14 }}>

        {/* LEFT — Controls */}
        <div>
          {/* Mode tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:12 }}>
            {[['topic','✦ Topic'],['url','🔗 URL'],['affiliate','💰 Affiliate']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={S.chip(tab===id)}>{label}</button>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.body}>
              <span style={S.lbl}>{tab==='topic'?'Topic or keyword':tab==='url'?'Webpage URL':'Affiliate product URL'}</span>
              <input style={S.inp}
                placeholder={tab==='topic'?'"working from home productivity"':tab==='url'?'https://example.com/article':'https://yourlink.com/product'}
                value={tab==='topic'?topic:url}
                onChange={e => tab==='topic'?setTopic(e.target.value):setUrl(e.target.value)}
              />

              <span style={S.lbl}>Post style</span>
              <div style={{ display:'flex', flexWrap:'wrap', marginBottom:10 }}>
                {STYLES.map(s => <button key={s} onClick={() => setStyle(s)} style={S.chip(style===s)}>{s}</button>)}
              </div>

              <span style={S.lbl}>Niche (optional)</span>
              <select value={niche} onChange={e => setNiche(e.target.value)}
                style={{ ...S.inp, cursor:'pointer' }}>
                <option value="">Any niche</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <span style={S.lbl}>Tone</span>
              <div style={{ display:'flex', flexWrap:'wrap', marginBottom:10 }}>
                {TONES.map(t => <button key={t} onClick={() => setTone(t)} style={S.chip(tone===t)}>{t}</button>)}
              </div>

              <span style={S.lbl}>Publish to</span>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {Object.entries(PLATFORMS).map(([k,v]) => (
                  <button key={k} onClick={() => setPlats(p => ({...p,[k]:!p[k]}))}
                    style={{ flex:1, padding:'7px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12,
                      border:`1px solid ${plats[k]?v.color+'88':'rgba(29,158,117,.2)'}`,
                      background:plats[k]?`${v.color}18`:'transparent',
                      color:plats[k]?v.color:'#7BAAA0' }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Affiliate embed */}
          <div style={S.card}>
            <div style={S.hdr}>
              <span>🔗 Embed affiliate link</span>
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                <div style={{ width:36, height:20, borderRadius:10, background:affOn?'#1D9E75':'rgba(255,255,255,.1)', position:'relative', transition:'background .2s', cursor:'pointer' }}
                  onClick={() => setAffOn(!affOn)}>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:'white', position:'absolute', top:2, left:affOn?18:2, transition:'left .2s' }} />
                </div>
              </label>
            </div>
            {affOn && (
              <div style={S.body}>
                <span style={S.lbl}>Affiliate URL</span>
                <input style={S.inp} placeholder="https://yourlink.com/product?ref=code" value={affUrl} onChange={e => setAffUrl(e.target.value)} />
                <span style={S.lbl}>Embed mode</span>
                <div style={{ display:'flex', gap:4, marginBottom:10 }}>
                  {[['auto','✦ Auto'],['keyword','🔑 Keyword'],['manual','✎ Manual']].map(([m,l]) => (
                    <button key={m} onClick={() => setAffMode(m)} style={S.chip(affMode===m)}>{l}</button>
                  ))}
                </div>
                {affMode==='keyword' && (
                  <input style={S.inp} placeholder="Anchor keyword e.g. simple resource" value={keyword} onChange={e => setKeyword(e.target.value)} />
                )}
                <div style={{ fontSize:11, color:'#4A7A72', padding:'8px 10px', background:'rgba(29,158,117,.05)', borderRadius:6, borderLeft:'2px solid rgba(29,158,117,.3)' }}>
                  Example: "explore this <span style={{color:'#5DCAA5',textDecoration:'underline'}}>{affMode==='keyword'&&keyword?keyword:'simple resource'}</span> to learn more"
                </div>
              </div>
            )}
          </div>

          {/* Auto image */}
          <div style={{ ...S.card }}>
            <div style={S.hdr}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>🖼 Auto-generate image</div>
                <div style={{ fontSize:10, color:'#4A7A72', marginTop:2 }}>Free · Pollinations.ai · SEO-optimized</div>
              </div>
              <div style={{ width:36, height:20, borderRadius:10, background:autoImg?'#1D9E75':'rgba(255,255,255,.1)', position:'relative', cursor:'pointer' }}
                onClick={() => setAutoImg(!autoImg)}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'white', position:'absolute', top:2, left:autoImg?18:2, transition:'left .2s' }} />
              </div>
            </div>
          </div>

          <button onClick={generate} disabled={loading || !input.trim() || !active.length}
            style={{ ...S.btn, width:'100%', opacity:loading||!input.trim()||!active.length?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? <><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/> Generating...</> : '⚡ Generate Posts'}
          </button>
          {error && <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(226,75,74,.1)', border:'1px solid rgba(226,75,74,.2)', borderRadius:8, fontSize:12, color:'#F09595' }}>⚠ {error}</div>}
        </div>

        {/* RIGHT — Output */}
        <div>
          {/* Compliance */}
          {compliance && (
            <div style={{ ...S.card, marginBottom:12 }}>
              <div style={S.hdr}>
                <span>🛡️ Compliance check</span>
                <span style={{ fontSize:11, color:compliance.safe?'#1D9E75':'#F5A623', fontWeight:600 }}>{compliance.score}/100 — {compliance.safe?'✓ Safe to post':'Review needed'}</span>
              </div>
              {!compliance.safe && (
                <div style={S.body}>
                  {compliance.issues.map((iss,i) => (
                    <div key={i} style={{ fontSize:12, color:'#FAC775', marginBottom:4 }}>⚠ {iss.label} → {iss.fix}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image */}
          {(imgLoad || imgs?.url) && (
            <div style={{ ...S.card, marginBottom:12 }}>
              <div style={S.hdr}>
                <span>🖼 Post image</span>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => generateImage(topic||url, style)}
                    style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', cursor:'pointer', fontFamily:'inherit' }}>
                    ↻ New
                  </button>
                  {imgs?.url && (
                    <button onClick={() => { const a=document.createElement('a');a.href=imgs.url;a.download=imgs.fileName||'post-image.png';a.target='_blank';a.click(); }}
                      style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontFamily:'inherit' }}>
                      ⬇ Save
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding:'10px 12px' }}>
                {imgLoad && <div style={{ fontSize:12, color:'#5DCAA5', display:'flex', alignItems:'center', gap:8 }}><span style={{width:14,height:14,border:'2px solid rgba(29,158,117,.3)',borderTopColor:'#1D9E75',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/>Generating image...</div>}
                {imgs?.url && !imgLoad && (
                  <div>
                    <img src={imgs.url} alt={imgs.alt} style={{ width:'100%', maxHeight:160, objectFit:'cover', borderRadius:8, display:'block', marginBottom:6 }} onError={e=>e.target.style.display='none'} />
                    <div style={{ fontSize:10, color:'#4A7A72' }}>Alt: {imgs.alt} · File: {imgs.fileName}</div>
                    <div style={{ marginTop:6, display:'flex', gap:6 }}>
                      <input placeholder="Custom image prompt..." id="imgCustom"
                        style={{ flex:1, ...S.inp, marginBottom:0, fontSize:11, padding:'5px 8px' }}
                        onKeyDown={e => { if(e.key==='Enter') generateImage(e.target.value, style); }}
                      />
                      <button onClick={() => { const v=document.getElementById('imgCustom').value; if(v) generateImage(v, style); }}
                        style={{ padding:'5px 10px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>⚡</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posts */}
          {posts && active.filter(p=>posts[p]).map(p => {
            const meta = PLATFORMS[p];
            const rawText = getText(p);
            const finalHtml = getHtml(p);
            const isEdit = editing[p];
            const wasEdited = edited[p] !== undefined;
            const comp = checkCompliance(rawText);
            const charCount = rawText.length;
            const overLimit = charCount > meta.limit;
            const pubR = publishRes[p];

            return (
              <div key={p} style={S.card}>
                <div style={{ ...S.hdr, borderLeftColor:meta.color, borderLeftWidth:3, borderLeftStyle:'solid' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14 }}>{meta.icon}</span>
                    <span style={{ fontWeight:600, color:meta.color }}>{meta.label}</span>
                    {wasEdited && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(124,107,255,.15)', color:'#9B8CFF' }}>Edited</span>}
                    {affOn && effUrl && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(29,158,117,.15)', color:'#5DCAA5' }}>🔗 Linked</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:10, color:overLimit?'#F09595':comp.safe?'#1D9E75':'#F5A623' }}>
                      {overLimit ? `⚠ ${charCount}/${meta.limit}` : comp.safe ? `✓ ${charCount}` : `⚠ ${comp.issues[0]?.label}`}
                    </span>
                    <span style={{ fontSize:11, color:'#4A7A72' }}>{style}</span>
                  </div>
                </div>

                {isEdit ? (
                  <textarea value={rawText} onChange={e => setEdited(prev=>({...prev,[p]:e.target.value}))}
                    style={{ width:'100%', minHeight:120, resize:'vertical', background:'rgba(22,61,106,.5)', border:'1px solid #1D9E75', borderRadius:0, padding:'12px 14px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', lineHeight:1.7, outline:'none', boxSizing:'border-box' }}
                    autoFocus
                  />
                ) : (
                  <div style={{ padding:'12px 14px', fontSize:13, color:'#E8F4F0', lineHeight:1.7, whiteSpace:'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: finalHtml }}
                  />
                )}

                {/* Publish result */}
                {pubR && (
                  <div style={{ padding:'8px 14px', background:pubR.ok?'rgba(29,158,117,.08)':'rgba(226,75,74,.08)', borderTop:'1px solid rgba(29,158,117,.1)' }}>
                    {pubR.ok
                      ? <div style={{ fontSize:12, color:'#5DCAA5' }}>✅ Posted! {pubR.url && <a href={pubR.url} target="_blank" rel="noreferrer" style={{ color:'#5DCAA5' }}>View post ↗</a>}</div>
                      : <div style={{ fontSize:12, color:'#F09595' }}>❌ {pubR.err}</div>
                    }
                  </div>
                )}

                <div style={{ padding:'8px 12px', borderTop:'1px solid rgba(29,158,117,.08)', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                  {isEdit ? (
                    <>
                      <button onClick={() => setEditing(prev=>({...prev,[p]:false}))} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontFamily:'inherit' }}>✓ Save</button>
                      <button onClick={() => { setEdited(prev=>{const n={...prev};delete n[p];return n;}); setEditing(prev=>({...prev,[p]:false})); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing(prev=>({...prev,[p]:true}))} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit' }}>✎ Edit</button>
                      {wasEdited && <button onClick={() => setEdited(prev=>{const n={...prev};delete n[p];return n;})} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'transparent', color:'#4A7A72', cursor:'pointer', fontFamily:'inherit' }}>Reset</button>}
                      {affOn && effUrl && (
                        <button onClick={() => copyPost(p, true)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(29,158,117,.3)', background:'rgba(29,158,117,.08)', color:'#5DCAA5', cursor:'pointer', fontFamily:'inherit' }}>
                          {copied===p+'_html'?'✓ Copied!':'🔗 Copy with link'}
                        </button>
                      )}
                      <button onClick={() => copyPost(p)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit' }}>
                        {copied===p?'✓ Copied':'Copy text'}
                      </button>
                      <button onClick={() => publishPost(p, rawText)} disabled={publishing[p]}
                        style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:meta.color, color:'white', cursor:'pointer', fontFamily:'inherit', opacity:publishing[p]?0.6:1, marginLeft:'auto' }}>
                        {publishing[p]?'Posting...`':`${meta.icon} Post now`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {posts && (
            <button onClick={generate} style={{ width:'100%', padding:'9px', borderRadius:8, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              ↻ Regenerate all posts
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } } select option { background:#102D4F; }`}</style>
    </div>
  );
}
