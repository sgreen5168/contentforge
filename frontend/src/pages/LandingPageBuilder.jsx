import React, { useState } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const TEMPLATES = [
  { id:'review',    icon:'⭐', label:'Product Review',    desc:'First-person review with pros/cons and CTA' },
  { id:'listicle',  icon:'📋', label:'Top Benefits',      desc:'5 key benefits with bullet points and CTA' },
  { id:'story',     icon:'💬', label:'Personal Story',    desc:'Before/after story that leads to the product' },
  { id:'urgency',   icon:'⚡', label:'Problem/Solution',  desc:'Pain point + solution + clear CTA' },
  { id:'compare',   icon:'🔄', label:'Comparison',        desc:'Old way vs new way with product as solution' },
];

const NICHES = ['Make Money Online','Health & Wellness','Fitness','Beauty & Skincare','Personal Finance','Relationships','Self Improvement','Home & Garden','Technology','Travel'];

const COMPLIANCE_RULES = [
  { pattern: /\$\d+\s*(per|a|\/)\s*(day|week|month|hour)/gi,          label:'Income claim',      fix:'Replace with "build additional income" or "earn extra money"' },
  { pattern: /guaranteed|100%\s*free|no\s*risk|risk.?free/gi,          label:'False guarantee',   fix:'Use "try risk-free" or "satisfaction guarantee" instead' },
  { pattern: /secret\s*(method|formula|trick|hack)/gi,                  label:'Misleading claim',  fix:'Use "simple approach" or "proven method" instead' },
  { pattern: /get\s*rich\s*quick|easy\s*money|passive\s*income\s*fast/gi,label:'Get rich claim',   fix:'Use "build long-term income streams" instead' },
  { pattern: /click\s*here\s*now|act\s*now|limited\s*time/gi,           label:'Urgency language',  fix:'Use "learn more" or "see how it works" instead' },
  { pattern: /cure[sd]?|treat[sed]?|heal[sed]?|diagnos/gi,              label:'Medical claim',     fix:'Add "consult a professional" disclaimer' },
  { pattern: /lose\s*\d+\s*(lbs?|pounds?|kg)/gi,                        label:'Weight loss claim', fix:'Add "results not typical, individual results vary"' },
  { pattern: /make\s*money\s*while\s*you\s*sleep/gi,                    label:'Passive income',    fix:'Use "earn while building your business" instead' },
];

function checkCompliance(text) {
  if (!text) return { score: 100, issues: [], safe: true };
  const issues = [];
  COMPLIANCE_RULES.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches) issues.push({ ...rule, matches });
  });
  const score = Math.max(0, 100 - (issues.length * 20));
  return { score, issues, safe: issues.length === 0 };
}

function ScoreBar({ score }) {
  const color = score >= 80 ? '#1D9E75' : score >= 60 ? '#F5A623' : '#E24B4A';
  const label = score >= 80 ? 'Compliant ✓' : score >= 60 ? 'Review needed' : 'Issues found';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, fontWeight:500, color }}>{label}</span>
        <span style={{ fontSize:12, color }}>{score}/100</span>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,.08)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:score+'%', background:color, borderRadius:3, transition:'width .5s' }} />
      </div>
    </div>
  );
}

export default function LandingPageBuilder() {
  const [tab, setTab]               = useState('builder');
  const [template, setTemplate]     = useState('review');
  const [niche, setNiche]           = useState('Make Money Online');
  const [product, setProduct]       = useState('');
  const [affiliateUrl, setAffUrl]   = useState('');
  const [keyword, setKeyword]       = useState('');
  const [tone, setTone]             = useState('Casual');
  const [generating, setGenerating] = useState(false);
  const [page, setPage]             = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState('');
  const [checkText, setCheckText]   = useState('');
  const [liveCheck, setLiveCheck]   = useState(null);

  async function generatePage() {
    if (!product.trim() || !affiliateUrl.trim()) return;
    setGenerating(true); setPage(null); setError(''); setCompliance(null);

    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode: 'topic',
          topic: `Create a mini landing page for: ${product}. 
Template: ${TEMPLATES.find(t=>t.id===template)?.label}.
Niche: ${niche}.
Affiliate URL: ${affiliateUrl}.
Anchor keyword: ${keyword || 'learn more'}.
Tone: ${tone}.
Write compelling copy with: headline, subheadline, 3-5 benefit points, social proof snippet, clear CTA button text, and compliance disclaimer.
Make it concise, engaging, and compliant with Facebook/Instagram advertising policies.
Avoid income guarantees, false claims, or misleading urgency.`,
          style: tone,
          platforms: ['facebook'],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const text = data.posts?.facebook?.text || '';

      // Parse the generated content into sections
      const lines = text.split('\n').filter(l => l.trim());
      const pageContent = {
        headline:    lines[0] || `Discover ${product}`,
        subheadline: lines[1] || `The simple approach that's changing everything`,
        benefits:    lines.slice(2, 7).filter(l => l.trim()),
        cta:         keyword || 'Learn More',
        affiliateUrl,
        disclaimer:  'Results may vary. This post contains affiliate links.',
        raw:         text,
      };

      const complianceResult = checkCompliance(text);
      setPage(pageContent);
      setCompliance(complianceResult);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function copyHTML() {
    if (!page) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.headline}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#0D2137; color:#E8F4F0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .card { background:#102D4F; border:1px solid rgba(29,158,117,.25); border-radius:16px; padding:40px 32px; max-width:520px; width:100%; text-align:center; }
  h1 { font-size:28px; font-weight:700; margin-bottom:12px; line-height:1.3; }
  .sub { font-size:16px; color:#7BAAA0; margin-bottom:28px; line-height:1.6; }
  .benefits { list-style:none; text-align:left; margin-bottom:28px; }
  .benefits li { padding:8px 0; border-bottom:1px solid rgba(29,158,117,.1); font-size:15px; display:flex; gap:10px; align-items:flex-start; }
  .benefits li::before { content:'✓'; color:#1D9E75; font-weight:700; flex-shrink:0; }
  .cta { display:block; background:#1D9E75; color:white; text-decoration:none; padding:16px 32px; border-radius:10px; font-size:17px; font-weight:600; margin-bottom:16px; transition:opacity .2s; }
  .cta:hover { opacity:.9; }
  .disclaimer { font-size:11px; color:#4A7A72; line-height:1.5; }
</style>
</head>
<body>
<div class="card">
  <h1>${page.headline}</h1>
  <p class="sub">${page.subheadline}</p>
  <ul class="benefits">
    ${page.benefits.map(b => `<li>${b.replace(/^[-•*]\s*/, '')}</li>`).join('\n    ')}
  </ul>
  <a href="${page.affiliateUrl}" class="cta" target="_blank" rel="noopener noreferrer">${page.cta} →</a>
  <p class="disclaimer">${page.disclaimer} #ad #affiliate</p>
</div>
</body>
</html>`;

    navigator.clipboard.writeText(html).catch(() => {});
    setCopied('html');
    setTimeout(() => setCopied(''), 2000);
  }

  function copyText() {
    if (!page) return;
    const text = `${page.headline}\n\n${page.subheadline}\n\n${page.benefits.join('\n')}\n\n👉 ${page.affiliateUrl}\n\n${page.disclaimer}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied('text');
    setTimeout(() => setCopied(''), 2000);
  }

  function runLiveCheck() {
    if (!checkText.trim()) return;
    setLiveCheck(checkCompliance(checkText));
  }

  const S = {
    card:    { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14 },
    hdr:     { padding:'12px 16px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
    body:    { padding:'14px 16px' },
    label:   { fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:5, display:'block' },
    inp:     { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:12, boxSizing:'border-box' },
  };

  return (
    <div style={{ padding:24, maxWidth:1100, fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 }}>
          🚀 Landing Page Builder
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>+ Compliance Checker</span>
        </div>
        <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Generate AI landing pages with built-in policy compliance for every social platform</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[['builder','🚀 Landing Page Builder'],['checker','🛡️ Compliance Checker']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500,
              border: `1px solid ${tab===id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
              background: tab===id ? 'rgba(29,158,117,.15)' : 'transparent',
              color: tab===id ? '#5DCAA5' : '#7BAAA0' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Landing Page Builder Tab ── */}
      {tab === 'builder' && (
        <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:16 }}>

          {/* Left — inputs */}
          <div>
            <div style={S.card}>
              <div style={S.hdr}>Page settings</div>
              <div style={S.body}>
                <span style={S.label}>Product or offer name</span>
                <input style={S.inp} placeholder='e.g. "Morning Smoothie Program"' value={product} onChange={e => setProduct(e.target.value)} />

                <span style={S.label}>Your affiliate URL</span>
                <input style={S.inp} placeholder="https://yourlink.com/product" value={affiliateUrl} onChange={e => setAffUrl(e.target.value)} />

                <span style={S.label}>CTA button text</span>
                <input style={S.inp} placeholder='e.g. "Learn More" or "Get Started"' value={keyword} onChange={e => setKeyword(e.target.value)} />

                <span style={S.label}>Niche</span>
                <select style={{ ...S.inp, cursor:'pointer' }} value={niche} onChange={e => setNiche(e.target.value)}>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                <span style={S.label}>Tone</span>
                <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                  {['Casual','Professional','Inspirational','Humorous'].map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                        border: `1px solid ${tone===t ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                        background: tone===t ? 'rgba(29,158,117,.15)' : 'transparent',
                        color: tone===t ? '#5DCAA5' : '#7BAAA0' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template selector */}
            <div style={S.card}>
              <div style={S.hdr}>Page template</div>
              <div style={{ padding:'8px 10px' }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', marginBottom:4,
                      border: `1px solid ${template===t.id ? '#1D9E75' : 'transparent'}`,
                      background: template===t.id ? 'rgba(29,158,117,.1)' : 'transparent' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500, color:'#E8F4F0' }}>{t.label}</div>
                      <div style={{ fontSize:11, color:'#7BAAA0' }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generatePage} disabled={generating || !product.trim() || !affiliateUrl.trim()}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: generating||!product.trim()||!affiliateUrl.trim() ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {generating ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 1s linear infinite', display:'inline-block' }} /> Generating...</> : '⚡ Generate Landing Page'}
            </button>
          </div>

          {/* Right — preview */}
          <div>
            {error && (
              <div style={{ padding:'12px 14px', background:'rgba(226,75,74,.1)', border:'1px solid rgba(226,75,74,.2)', borderRadius:10, color:'#F09595', fontSize:13, marginBottom:14 }}>
                ⚠ {error}
              </div>
            )}

            {!page && !generating && !error && (
              <div style={{ ...S.card, textAlign:'center' }}>
                <div style={{ padding:'60px 20px' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🚀</div>
                  <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>Your landing page will appear here</div>
                  <div style={{ fontSize:13, color:'#7BAAA0' }}>Fill in the form and click Generate</div>
                </div>
              </div>
            )}

            {generating && (
              <div style={{ ...S.card, textAlign:'center' }}>
                <div style={{ padding:'60px 20px' }}>
                  <div style={{ width:40, height:40, border:'3px solid rgba(29,158,117,.2)', borderTopColor:'#1D9E75', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
                  <div style={{ fontSize:14, color:'#5DCAA5' }}>Claude is writing your landing page...</div>
                </div>
              </div>
            )}

            {page && compliance && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

                {/* Compliance score */}
                <div style={S.card}>
                  <div style={S.hdr}>🛡️ Compliance report</div>
                  <div style={S.body}>
                    <ScoreBar score={compliance.score} />
                    {compliance.issues.length === 0 ? (
                      <div style={{ display:'flex', gap:8, background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'10px 12px' }}>
                        <span>✅</span>
                        <span style={{ fontSize:13, color:'#5DCAA5' }}>All clear — content is compliant with Facebook, Instagram, YouTube and Pinterest policies</span>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {compliance.issues.map((issue, i) => (
                          <div key={i} style={{ background:'rgba(245,166,35,.06)', border:'1px solid rgba(245,166,35,.2)', borderRadius:8, padding:'10px 12px' }}>
                            <div style={{ fontSize:12, fontWeight:500, color:'#FAC775', marginBottom:3 }}>⚠ {issue.label}</div>
                            <div style={{ fontSize:12, color:'#7BAAA0' }}>→ {issue.fix}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Page preview */}
                <div style={S.card}>
                  <div style={{ ...S.hdr, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>📄 Landing page preview</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={copyText}
                        style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', cursor:'pointer', fontFamily:'inherit' }}>
                        {copied==='text' ? '✓ Copied' : 'Copy text'}
                      </button>
                      <button onClick={copyHTML}
                        style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontFamily:'inherit' }}>
                        {copied==='html' ? '✓ Copied!' : '⬇ Copy HTML'}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding:'20px 16px' }}>

                    {/* Simulated landing page */}
                    <div style={{ background:'#0D2137', border:'1px solid rgba(29,158,117,.15)', borderRadius:12, padding:'28px 24px', textAlign:'center', maxWidth:480, margin:'0 auto' }}>
                      <div style={{ fontSize:22, fontWeight:700, color:'#E8F4F0', marginBottom:10, lineHeight:1.3 }}>{page.headline}</div>
                      <div style={{ fontSize:14, color:'#7BAAA0', marginBottom:20, lineHeight:1.6 }}>{page.subheadline}</div>
                      <div style={{ textAlign:'left', marginBottom:20 }}>
                        {page.benefits.map((b, i) => (
                          <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(29,158,117,.08)', fontSize:13, color:'#E8F4F0' }}>
                            <span style={{ color:'#1D9E75', fontWeight:700, flexShrink:0 }}>✓</span>
                            <span>{b.replace(/^[-•*✓]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                      <a href={page.affiliateUrl} target="_blank" rel="noreferrer"
                        style={{ display:'block', background:'#1D9E75', color:'white', textDecoration:'none', padding:'14px 24px', borderRadius:10, fontSize:15, fontWeight:600, marginBottom:10 }}>
                        {page.cta || 'Learn More'} →
                      </a>
                      <div style={{ fontSize:10, color:'#4A7A72', lineHeight:1.5 }}>
                        {page.disclaimer} #ad #affiliate
                      </div>
                    </div>
                  </div>
                </div>

                {/* How to use */}
                <div style={S.card}>
                  <div style={S.hdr}>📋 How to use this landing page</div>
                  <div style={S.body}>
                    {[
                      ['Copy HTML','Click "Copy HTML" → paste into any free page builder like Carrd.co, Linktree, or Notion → publish as a public page'],
                      ['Get your URL','Once published copy the URL — e.g. yourname.carrd.co'],
                      ['Use in social posts','In AI Composer paste this landing page URL as your link — social posts drive traffic here first'],
                      ['Instagram bio','Add your landing page URL to your Instagram bio via link-in-bio tools'],
                      ['Facebook posts','Paste the landing page URL directly in your Facebook posts as a link'],
                    ].map(([title, desc], i) => (
                      <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i<4 ? '1px solid rgba(29,158,117,.08)' : 'none' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(29,158,117,.15)', color:'#5DCAA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>{i+1}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:500, color:'#E8F4F0', marginBottom:2 }}>{title}</div>
                          <div style={{ fontSize:11, color:'#7BAAA0', lineHeight:1.5 }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Compliance Checker Tab ── */}
      {tab === 'checker' && (
        <div style={{ maxWidth:700 }}>
          <div style={S.card}>
            <div style={S.hdr}>🛡️ Compliance Checker — paste any post or script</div>
            <div style={S.body}>
              <span style={S.label}>Paste your content to check</span>
              <textarea
                value={checkText}
                onChange={e => { setCheckText(e.target.value); setLiveCheck(null); }}
                placeholder="Paste any social media post, video script, or ad copy here to check for policy compliance issues..."
                style={{ ...S.inp, minHeight:140, resize:'vertical', lineHeight:1.6 }}
              />
              <button onClick={runLiveCheck} disabled={!checkText.trim()}
                style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:!checkText.trim()?0.5:1, marginBottom:16 }}>
                🛡️ Check Compliance
              </button>

              {liveCheck && (
                <div>
                  <ScoreBar score={liveCheck.score} />
                  {liveCheck.issues.length === 0 ? (
                    <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:10, padding:'14px' }}>
                      <span style={{ fontSize:20 }}>✅</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:'#5DCAA5', marginBottom:3 }}>Content is compliant</div>
                        <div style={{ fontSize:12, color:'#7BAAA0' }}>No policy violations detected. Safe to post on Facebook, Instagram, YouTube and Pinterest.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:4 }}>{liveCheck.issues.length} issue{liveCheck.issues.length>1?'s':''} found:</div>
                      {liveCheck.issues.map((issue, i) => (
                        <div key={i} style={{ background:'rgba(245,166,35,.06)', border:'1px solid rgba(245,166,35,.2)', borderRadius:10, padding:'12px 14px' }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'#FAC775', marginBottom:4 }}>⚠ {issue.label}</div>
                          <div style={{ fontSize:12, color:'#7BAAA0', marginBottom:4 }}>Matched: <span style={{ color:'#F09595' }}>{issue.matches?.join(', ')}</span></div>
                          <div style={{ fontSize:12, color:'#5DCAA5' }}>✓ Fix: {issue.fix}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Platform rules reference */}
          <div style={S.card}>
            <div style={S.hdr}>📋 Platform compliance rules reference</div>
            <div style={S.body}>
              {[
                { platform:'Facebook & Instagram', color:'#1877F2', rules:['No exaggerated income or financial claims','Affiliate content must include #ad or #sponsored','No misleading health or weight loss claims','No "get rich quick" language','AI-generated content should be disclosed with #AIContent','No artificial engagement bait'] },
                { platform:'YouTube', color:'#FF0000', rules:['Must disclose AI-generated content in upload settings','No misleading thumbnails or titles','Affiliate links must be disclosed in description','No fake urgency or scarcity tactics','No spam or deceptive metadata'] },
                { platform:'Pinterest', color:'#E60023', rules:['No misleading claims in pin descriptions','Affiliate links allowed but must be disclosed','Max 25 pins per day to avoid spam flags','No adult content or sensationalism','Clear disclosure for sponsored content'] },
                { platform:'TikTok', color:'#000000', rules:['Must disclose AI-generated content','No misleading health claims','Affiliate content needs #ad disclosure','No fake urgency or artificial scarcity','No impersonation or misleading identities'] },
              ].map(({ platform, color, rules }) => (
                <div key={platform} style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid rgba(29,158,117,.08)' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
                    {platform}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {rules.map((rule, i) => (
                      <div key={i} style={{ fontSize:12, color:'#7BAAA0', display:'flex', gap:6 }}>
                        <span style={{ color:'#1D9E75', flexShrink:0 }}>•</span>
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Safe language guide */}
              <div style={{ marginTop:4 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:10 }}>✍️ Safe language guide</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {[
                    ['Make $500 a day','Build an additional income stream'],
                    ['Guaranteed results','Results may vary'],
                    ['Secret method','Simple approach'],
                    ['Get rich quick','Build long-term income'],
                    ['Limited time only','While this is available'],
                    ['This cured my...','This helped me with...'],
                    ['100% free','No cost to start'],
                    ['Click here now','Learn more at the link'],
                  ].map(([bad, good], i) => (
                    <div key={i} style={{ background:'rgba(22,61,106,.4)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:11, color:'#F09595', marginBottom:3 }}>❌ {bad}</div>
                      <div style={{ fontSize:11, color:'#5DCAA5' }}>✅ {good}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #102D4F; color: #E8F4F0; }
      `}</style>
    </div>
  );
}
