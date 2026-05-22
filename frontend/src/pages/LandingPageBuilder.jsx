import React, { useState } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const TEMPLATES = [
  { id:'review',   icon:'⭐', label:'Product Review',   desc:'First-person review with pros/cons and CTA' },
  { id:'benefits', icon:'📋', label:'Top Benefits',     desc:'5 key benefits with bullet points and CTA' },
  { id:'story',    icon:'💬', label:'Personal Story',   desc:'Before/after story leading to the product' },
  { id:'problem',  icon:'⚡', label:'Problem/Solution', desc:'Pain point + solution + clear CTA' },
  { id:'compare',  icon:'🔄', label:'Comparison',       desc:'Old way vs new way with product as solution' },
];

const NICHES = ['Make Money Online','Health & Wellness','Fitness','Beauty & Skincare','Personal Finance','Relationships','Self Improvement','Home & Garden','Technology','Travel'];
const TONES  = ['Casual','Professional','Inspirational','Urgent'];

const COMPLIANCE_RULES = [
  { re:/\$\d+\s*(per|a|\/)\s*(day|week|month)/gi, label:'Income claim',    fix:'Use "build additional income" instead' },
  { re:/guaranteed|100%\s*free|no\s*risk/gi,       label:'False guarantee', fix:'Use "try risk-free" instead' },
  { re:/secret\s*(method|formula|trick)/gi,         label:'Misleading',     fix:'Use "simple approach" instead' },
  { re:/get\s*rich\s*quick/gi,                      label:'Get rich claim', fix:'Use "build long-term income" instead' },
  { re:/click\s*here\s*now|act\s*now/gi,            label:'Urgency',        fix:'Use "learn more" instead' },
];

function checkCompliance(text) {
  const issues = COMPLIANCE_RULES.filter(r => text.match(r.re));
  return { score: Math.max(0, 100-issues.length*20), issues, safe: issues.length===0 };
}

export default function LandingPageBuilder() {
  const [tab, setTab]             = useState('builder');
  const [template, setTemplate]   = useState('review');
  const [niche, setNiche]         = useState('Make Money Online');
  const [product, setProduct]     = useState('');
  const [affUrl, setAffUrl]       = useState('');
  const [cta, setCta]             = useState('Learn More');
  const [tone, setTone]           = useState('Casual');
  const [generating, setGen]      = useState(false);
  const [publishing, setPub]      = useState(false);
  const [page, setPage]           = useState(null);
  const [compliance, setComp]     = useState(null);
  const [publishedUrl, setPubUrl] = useState('');
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState('');
  const [checkText, setCheckText] = useState('');
  const [liveCheck, setLive]      = useState(null);

  async function generate() {
    if (!product.trim() || !affUrl.trim()) return;
    setGen(true); setPage(null); setError(''); setComp(null); setPubUrl('');
    try {
      const res = await fetch(`${API}/api/generate`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode:'topic',
          topic:`Mini landing page for: ${product}. Template: ${TEMPLATES.find(t=>t.id===template)?.label}. Niche: ${niche}. Tone: ${tone}. Write: headline, subheadline, 4 benefit bullets, social proof line, CTA text "${cta}". Compliance: no income guarantees, no false claims. Add disclaimer: Results may vary. Affiliate link: ${affUrl}`,
          style: tone,
          platforms:['facebook'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const text = data.posts?.facebook?.text || '';
      const lines = text.split('\n').filter(l=>l.trim());
      const pg = {
        headline:    lines[0] || `Discover ${product}`,
        subheadline: lines[1] || 'The simple approach changing everything',
        benefits:    lines.slice(2,7),
        cta,
        affiliateUrl: affUrl,
        disclaimer:  'Results may vary. This page contains affiliate links.',
        raw: text,
      };
      setPage(pg);
      setComp(checkCompliance(text));
    } catch(e) { setError(e.message); }
    finally { setGen(false); }
  }

  async function publish() {
    if (!page) return;
    setPub(true);
    try {
      const slug = product.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30) + '-' + Math.random().toString(36).slice(2,5);
      const res = await fetch(`${API}/api/landing/create`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...page, slug, product }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPubUrl(data.url);
    } catch(e) { setError(e.message); }
    finally { setPub(false); }
  }

  function copyHtml() {
    if (!page) return;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${page.headline}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#0D2137;color:#E8F4F0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#102D4F;border:1px solid rgba(29,158,117,.25);border-radius:16px;padding:40px 32px;max-width:520px;width:100%;text-align:center}h1{font-size:26px;font-weight:700;margin-bottom:12px;line-height:1.3}.sub{font-size:16px;color:#7BAAA0;margin-bottom:28px;line-height:1.6}.benefits{list-style:none;text-align:left;margin-bottom:28px}.benefits li{padding:9px 0;border-bottom:1px solid rgba(29,158,117,.1);font-size:15px;display:flex;gap:10px}.benefits li::before{content:"✓";color:#1D9E75;font-weight:700;flex-shrink:0}.cta{display:block;background:#1D9E75;color:white;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:17px;font-weight:600;margin-bottom:12px}.disclaimer{font-size:11px;color:#4A7A72;line-height:1.5;border-top:1px solid rgba(29,158,117,.1);padding-top:16px}</style></head><body><div class="card"><h1>${page.headline}</h1><p class="sub">${page.subheadline}</p><ul class="benefits">${page.benefits.map(b=>`<li>${b.replace(/^[-•*✓]\s*/,'')}</li>`).join('')}</ul><a href="${page.affiliateUrl}" class="cta">${page.cta} →</a><p class="disclaimer">${page.disclaimer} #ad #affiliate</p></div></body></html>`;
    navigator.clipboard.writeText(html).catch(()=>{});
    setCopied('html'); setTimeout(()=>setCopied(''),2000);
  }

  const S = {
    card: { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:12 },
    hdr:  { padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
    body: { padding:'12px 14px' },
    inp:  { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:10, boxSizing:'border-box' },
    lbl:  { fontSize:10, color:'#4A7A72', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:5 },
  };

  return (
    <div style={{ padding:20, maxWidth:1100, fontFamily:'inherit' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:600, color:'#E8F4F0' }}>🚀 Landing Page <span style={{color:'#5DCAA5'}}>Builder</span></div>
        <div style={{ fontSize:12, color:'#7BAAA0', marginTop:3 }}>Generate hosted landing pages + compliance checker</div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[['builder','🚀 Builder'],['checker','🛡️ Compliance']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'7px 16px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:500,
              border:`1px solid ${tab===id?'#1D9E75':'rgba(29,158,117,.2)'}`,
              background:tab===id?'rgba(29,158,117,.15)':'transparent',
              color:tab===id?'#5DCAA5':'#7BAAA0' }}>
            {label}
          </button>
        ))}
      </div>

      {tab==='builder' && (
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14 }}>
          {/* Left */}
          <div>
            <div style={S.card}>
              <div style={S.hdr}>Page settings</div>
              <div style={S.body}>
                <span style={S.lbl}>Product or offer name</span>
                <input style={S.inp} placeholder='"Morning Smoothie Program"' value={product} onChange={e=>setProduct(e.target.value)} />
                <span style={S.lbl}>Your affiliate URL</span>
                <input style={S.inp} placeholder="https://yourlink.com/product" value={affUrl} onChange={e=>setAffUrl(e.target.value)} />
                <span style={S.lbl}>CTA button text</span>
                <input style={S.inp} placeholder="Learn More" value={cta} onChange={e=>setCta(e.target.value)} />
                <span style={S.lbl}>Niche</span>
                <select style={{ ...S.inp, cursor:'pointer' }} value={niche} onChange={e=>setNiche(e.target.value)}>
                  {NICHES.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
                <span style={S.lbl}>Tone</span>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                  {TONES.map(t=>(
                    <button key={t} onClick={()=>setTone(t)}
                      style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                        border:`1px solid ${tone===t?'#1D9E75':'rgba(29,158,117,.2)'}`,
                        background:tone===t?'rgba(29,158,117,.15)':'transparent',
                        color:tone===t?'#5DCAA5':'#7BAAA0' }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Template</div>
              <div style={{ padding:'6px 8px' }}>
                {TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>setTemplate(t.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', marginBottom:3,
                      border:`1px solid ${template===t.id?'#1D9E75':'transparent'}`,
                      background:template===t.id?'rgba(29,158,117,.1)':'transparent' }}>
                    <span style={{ fontSize:16 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500, color:'#E8F4F0' }}>{t.label}</div>
                      <div style={{ fontSize:10, color:'#7BAAA0' }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={generating||!product.trim()||!affUrl.trim()}
              style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:generating||!product.trim()||!affUrl.trim()?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {generating?<><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'}}/>Generating...</>:'⚡ Generate Page'}
            </button>
            {error && <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(226,75,74,.1)', borderRadius:8, fontSize:12, color:'#F09595' }}>⚠ {error}</div>}
          </div>

          {/* Right */}
          <div>
            {generating && (
              <div style={{ ...S.card, textAlign:'center', padding:'50px' }}>
                <div style={{ width:40,height:40,border:'3px solid rgba(29,158,117,.2)',borderTopColor:'#1D9E75',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px' }}/>
                <div style={{ fontSize:14, color:'#5DCAA5' }}>Claude is writing your landing page...</div>
              </div>
            )}

            {!page && !generating && (
              <div style={{ ...S.card, textAlign:'center', padding:'50px' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🚀</div>
                <div style={{ fontSize:14, color:'#E8F4F0', marginBottom:6 }}>Your landing page will appear here</div>
                <div style={{ fontSize:12, color:'#7BAAA0' }}>Fill in the form and click Generate</div>
              </div>
            )}

            {page && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* Compliance */}
                {compliance && (
                  <div style={S.card}>
                    <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>🛡️ Compliance</span>
                      <span style={{ fontSize:11, fontWeight:600, color:compliance.safe?'#1D9E75':'#F5A623' }}>
                        {compliance.score}/100 — {compliance.safe?'✓ All clear':'Review needed'}
                      </span>
                    </div>
                    {!compliance.safe && (
                      <div style={{ padding:'0 14px 10px' }}>
                        {compliance.issues.map((iss,i) => (
                          <div key={i} style={{ fontSize:12, color:'#FAC775', marginBottom:4 }}>⚠ {iss.label} → {iss.fix}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Published URL */}
                {publishedUrl && (
                  <div style={{ padding:'12px 14px', background:'rgba(29,158,117,.1)', border:'1px solid rgba(29,158,117,.3)', borderRadius:10 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'#5DCAA5', marginBottom:6 }}>✅ Page published!</div>
                    <div style={{ fontSize:12, color:'#E8F4F0', wordBreak:'break-all', marginBottom:8 }}>{publishedUrl}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => { navigator.clipboard.writeText(publishedUrl); setCopied('url'); setTimeout(()=>setCopied(''),2000); }}
                        style={{ flex:1, padding:'6px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied==='url'?'✓ Copied!':'🔗 Copy URL'}
                      </button>
                      <button onClick={() => window.open(publishedUrl,'_blank')}
                        style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                        Preview ↗
                      </button>
                    </div>
                    <div style={{ fontSize:10, color:'#4A7A72', marginTop:8 }}>Use this URL in AI Composer as your affiliate link</div>
                  </div>
                )}

                {/* Preview */}
                <div style={S.card}>
                  <div style={{ ...S.hdr, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>📄 Preview</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={copyHtml} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', cursor:'pointer', fontFamily:'inherit' }}>
                        {copied==='html'?'✓ Copied!':'⬇ Copy HTML'}
                      </button>
                      <button onClick={publish} disabled={publishing}
                        style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontFamily:'inherit', opacity:publishing?0.5:1 }}>
                        {publishing?'Publishing...':'🚀 Publish'}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding:'16px', background:'#0D2137' }}>
                    <div style={{ background:'#102D4F', border:'1px solid rgba(29,158,117,.15)', borderRadius:12, padding:'28px 24px', maxWidth:440, margin:'0 auto', textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:700, color:'#E8F4F0', marginBottom:10, lineHeight:1.3 }}>{page.headline}</div>
                      <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:18, lineHeight:1.6 }}>{page.subheadline}</div>
                      <div style={{ textAlign:'left', marginBottom:18 }}>
                        {page.benefits.map((b,i) => (
                          <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(29,158,117,.08)', fontSize:12, color:'#E8F4F0' }}>
                            <span style={{ color:'#1D9E75', fontWeight:700, flexShrink:0 }}>✓</span>
                            <span>{b.replace(/^[-•*✓]\s*/,'')}</span>
                          </div>
                        ))}
                      </div>
                      <a href={page.affiliateUrl} target="_blank" rel="noreferrer"
                        style={{ display:'block', background:'#1D9E75', color:'white', textDecoration:'none', padding:'13px', borderRadius:8, fontSize:14, fontWeight:600, marginBottom:8 }}>
                        {page.cta} →
                      </a>
                      <div style={{ fontSize:10, color:'#4A7A72', lineHeight:1.5 }}>{page.disclaimer} #ad #affiliate</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Checker tab */}
      {tab==='checker' && (
        <div style={{ maxWidth:680 }}>
          <div style={S.card}>
            <div style={S.hdr}>🛡️ Paste any post or script to check</div>
            <div style={S.body}>
              <textarea value={checkText} onChange={e=>{setCheckText(e.target.value);setLive(null);}}
                placeholder="Paste any social media post, ad copy, or script here..."
                style={{ ...S.inp, minHeight:140, resize:'vertical', lineHeight:1.6 }}
              />
              <button onClick={() => setLive(checkCompliance(checkText))} disabled={!checkText.trim()}
                style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:!checkText.trim()?0.5:1, marginBottom:14 }}>
                🛡️ Check Compliance
              </button>

              {liveCheck && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1, height:6, background:'rgba(255,255,255,.08)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:liveCheck.score+'%', background:liveCheck.safe?'#1D9E75':'#F5A623', borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:liveCheck.safe?'#5DCAA5':'#FAC775', whiteSpace:'nowrap' }}>
                      {liveCheck.score}/100 — {liveCheck.safe?'✓ Compliant':'Issues found'}
                    </span>
                  </div>
                  {liveCheck.safe ? (
                    <div style={{ padding:'12px', background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:10, fontSize:13, color:'#5DCAA5' }}>
                      ✅ Content is compliant — safe to post on all platforms
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {liveCheck.issues.map((iss,i) => (
                        <div key={i} style={{ padding:'10px 12px', background:'rgba(245,166,35,.06)', border:'1px solid rgba(245,166,35,.2)', borderRadius:10 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:'#FAC775', marginBottom:4 }}>⚠ {iss.label}</div>
                          <div style={{ fontSize:12, color:'#5DCAA5' }}>✓ Fix: {iss.fix}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Platform rules */}
          <div style={S.card}>
            <div style={S.hdr}>📋 Platform rules quick reference</div>
            <div style={S.body}>
              {[
                { p:'Facebook & Instagram', rules:['No exaggerated income claims','No misleading health claims','#ad required for affiliate content','No "get rich quick" language','Disclose AI-generated content'] },
                { p:'YouTube',              rules:['Disclose AI content in upload settings','No misleading titles or thumbnails','Affiliate links must be disclosed','No fake urgency or scarcity'] },
                { p:'Pinterest',            rules:['No misleading claims','Max 25 pins per day','Affiliate links must be disclosed','#sponsored for paid content'] },
                { p:'TikTok',              rules:['Disclose AI-generated content','No misleading health claims','#ad for affiliate content','No fake urgency'] },
              ].map(({p,rules}) => (
                <div key={p} style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid rgba(29,158,117,.08)' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>{p}</div>
                  {rules.map((r,i) => <div key={i} style={{ fontSize:12, color:'#7BAAA0', display:'flex', gap:6, marginBottom:3 }}><span style={{color:'#1D9E75'}}>•</span>{r}</div>)}
                </div>
              ))}
              {/* Safe language guide */}
              <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:8 }}>✍️ Safe language</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                {[['Make $500/day','Build additional income'],['Guaranteed','Results may vary'],['Secret method','Simple approach'],['Get rich quick','Long-term income'],['100% free','No cost to start'],['Click here now','Learn more'],['Limited time','While available'],['Cures/heals','Helped me with']].map(([bad,good],i) => (
                  <div key={i} style={{ background:'rgba(22,61,106,.4)', borderRadius:7, padding:'7px 9px' }}>
                    <div style={{ fontSize:11, color:'#F09595' }}>❌ {bad}</div>
                    <div style={{ fontSize:11, color:'#5DCAA5' }}>✅ {good}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform:rotate(360deg); } } select option { background:#102D4F; }`}</style>
    </div>
  );
}
