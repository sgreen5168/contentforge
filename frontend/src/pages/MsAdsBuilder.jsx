import { useState, useEffect } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const BLUE = '#2563EB';
const API  = 'https://contentforge-production-6e13.up.railway.app';

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:16, ...extra };
}

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  }
  return (
    <button onClick={doCopy}
      style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${BORD}`, background:'transparent', color:copied?GRN:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
      {copied ? '✓ Copied' : `📋 ${label||'Copy'}`}
    </button>
  );
}

function Field({ label, value, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <div style={{ fontSize:11, fontWeight:600, color:TXT2 }}>{label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {hint && <span style={{ fontSize:10, color:TXT3 }}>{hint}</span>}
          <CopyBtn text={value} />
        </div>
      </div>
      <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.6, whiteSpace:'pre-wrap' }}>
        {value || <span style={{ color:TXT3 }}>—</span>}
      </div>
    </div>
  );
}

export default function MsAdsBuilder() {
  const [session, setSession] = useState(null);
  const [topic, setTopic] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [niche, setNiche] = useState('side-hustle');
  const [budget, setBudget] = useState('5');

  useEffect(function() {
    try {
      const s = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const t = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      setSession(s);
      setTopic(t);
      if (t?.cat) setNiche(t.cat);
    } catch(e) {}
  }, []);

  async function generateCampaign() {
    setGenerating(true);
    try {
      const topicLabel = topic?.label || session?.youtubeTitle || 'home income tips';
      const landingUrl = session?.landingUrl || 'https://nichroute.com';
      const affName = session?.link?.name || '';

      const r = await fetch(API + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a Microsoft Advertising expert. Generate a complete search ad campaign for this topic.

Topic: "${topicLabel}"
Niche: ${niche}
Affiliate product: ${affName}
Landing page: ${landingUrl}
Daily budget: $${budget}

Return ONLY a JSON object with these exact fields:
{
  "campaignName": "campaign name under 50 chars",
  "headlines": ["headline 1 max 30 chars", "headline 2 max 30 chars", "headline 3 max 30 chars"],
  "descriptions": ["description 1 max 90 chars", "description 2 max 90 chars"],
  "displayUrl": "nichroute.com/topic-keywords",
  "finalUrl": "${landingUrl}",
  "keywords": [
    {"keyword": "exact match keyword", "match": "exact", "bid": "$0.50"},
    {"keyword": "phrase match keyword", "match": "phrase", "bid": "$0.40"},
    {"keyword": "broad match modifier", "match": "broad", "bid": "$0.30"}
  ],
  "negativeKeywords": ["free", "diy", "youtube", "reddit"],
  "targeting": {
    "location": "United States",
    "language": "English",
    "devices": "All devices",
    "schedule": "Mon-Sun, 7am-10pm",
    "audience": "In-market audience description"
  },
  "bidStrategy": "bid strategy recommendation",
  "estimatedCPC": "$0.xx - $0.xx range",
  "estimatedMonthlyClicks": "xx-xx clicks at $${budget}/day",
  "campaignTips": "2-3 sentence optimization tip"
}

Make headlines compelling with strong CTAs. Keywords must be highly specific to the topic. No placeholders.`,
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
        }),
      });
      const d = await r.json();
      const text = d.content?.[0]?.text || d.text || '';
      const clean = text.replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(clean);
      setCampaign(parsed);
    } catch(e) {
      console.error(e);
      alert('Generation failed — try again');
    }
    setGenerating(false);
  }

  function copyAll() {
    if (!campaign) return;
    const text = [
      'MICROSOFT ADVERTISING CAMPAIGN',
      '================================',
      `Campaign Name: ${campaign.campaignName}`,
      '',
      'HEADLINES:',
      ...(campaign.headlines||[]).map((h,i) => `${i+1}. ${h}`),
      '',
      'DESCRIPTIONS:',
      ...(campaign.descriptions||[]).map((d,i) => `${i+1}. ${d}`),
      '',
      `Display URL: ${campaign.displayUrl}`,
      `Final URL: ${campaign.finalUrl}`,
      '',
      'KEYWORDS:',
      ...(campaign.keywords||[]).map(k => `[${k.match}] ${k.keyword} — Bid: ${k.bid}`),
      '',
      'NEGATIVE KEYWORDS:',
      (campaign.negativeKeywords||[]).join(', '),
      '',
      'TARGETING:',
      `Location: ${campaign.targeting?.location}`,
      `Schedule: ${campaign.targeting?.schedule}`,
      `Audience: ${campaign.targeting?.audience}`,
      '',
      `Bid Strategy: ${campaign.bidStrategy}`,
      `Est. CPC: ${campaign.estimatedCPC}`,
      `Est. Monthly Clicks: ${campaign.estimatedMonthlyClicks}`,
      '',
      `Tips: ${campaign.campaignTips}`,
    ].join('\n');
    navigator.clipboard.writeText(text).catch(()=>{});
  }

  return (
    <div style={{ color:TXT, fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ ...card({ background:'rgba(37,99,235,.08)', border:'1px solid rgba(37,99,235,.2)' }) }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#60A5FA', marginBottom:4 }}>🔍 Microsoft Advertising Campaign Builder</div>
            <div style={{ fontSize:12, color:TXT3, lineHeight:1.6 }}>
              Generates search ad copy, keywords, and targeting — paste directly into ads.microsoft.com<br/>
              Best for: search intent buyers already looking for your topic · 30-40% cheaper than Google Ads
            </div>
          </div>
          <a href="https://ads.microsoft.com" target="_blank" rel="noreferrer"
            style={{ padding:'7px 14px', borderRadius:7, background:'#2563EB', color:'white', fontSize:11, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
            Open Microsoft Ads →
          </a>
        </div>
      </div>

      {/* Session loaded */}
      {session ? (
        <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', padding:'10px 14px' }) }}>
          <div style={{ fontSize:12, color:GRN, fontWeight:600 }}>✓ Session loaded — {topic?.label || 'Last generated topic'}</div>
          <div style={{ fontSize:11, color:TXT3, marginTop:2 }}>Landing page and content auto-filled from Command Center</div>
        </div>
      ) : (
        <div style={{ ...card({ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', padding:'10px 14px' }) }}>
          <div style={{ fontSize:12, color:'#FC8F8F', fontWeight:600 }}>No session loaded — generate content in Command Center first</div>
        </div>
      )}

      {/* Settings */}
      <div style={{ ...card() }}>
        <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:12 }}>Campaign settings</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Content niche</div>
            <select value={niche} onChange={e=>setNiche(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, color:TXT, fontFamily:'inherit' }}>
              {['side-hustle','health','meal-prep','finance','remote-work','mindset','cooking','coffee','woodworking','outdoor-cooking','home-income'].map(n=>(
                <option key={n} value={n} style={{ background:BG }}>{n.replace(/-/g,' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Daily budget</div>
            <select value={budget} onChange={e=>setBudget(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, color:TXT, fontFamily:'inherit' }}>
              {['5','10','15','20','25','50'].map(b=>(
                <option key={b} value={b} style={{ background:BG }}>${b}/day</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={generateCampaign} disabled={generating}
          style={{ width:'100%', marginTop:12, padding:'11px', borderRadius:8, border:'none', background:generating?'rgba(37,99,235,.3)':'#2563EB', color:'white', fontSize:13, fontWeight:700, cursor:generating?'default':'pointer', fontFamily:'inherit' }}>
          {generating ? '⏳ Generating campaign...' : '🔍 Generate Microsoft Ads Campaign'}
        </button>
      </div>

      {/* Generated Campaign */}
      {campaign && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TXT }}>Generated Campaign — ready to paste</div>
            <button onClick={copyAll}
              style={{ padding:'7px 14px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              📋 Copy all
            </button>
          </div>

          <div style={{ ...card() }}>
            <Field label="Campaign Name" value={campaign.campaignName} />
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Headlines <span style={{ fontSize:10, color:TXT3, fontWeight:400 }}>max 30 chars each</span></div>
            {(campaign.headlines||[]).map((h,i) => (
              <Field key={i} label={`Headline ${i+1}`} value={h} hint={`${h.length}/30`} />
            ))}
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Descriptions <span style={{ fontSize:10, color:TXT3, fontWeight:400 }}>max 90 chars each</span></div>
            {(campaign.descriptions||[]).map((d,i) => (
              <Field key={i} label={`Description ${i+1}`} value={d} hint={`${d.length}/90`} />
            ))}
          </div>

          <div style={{ ...card() }}>
            <Field label="Display URL" value={campaign.displayUrl} />
            <Field label="Final URL (Landing Page)" value={campaign.finalUrl} />
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Keywords</div>
            {(campaign.keywords||[]).map((k,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${BORD}` }}>
                <div>
                  <span style={{ fontSize:11, color:TXT }}>{k.keyword}</span>
                  <span style={{ fontSize:10, color:TXT3, marginLeft:8 }}>[{k.match}]</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:GRN }}>{k.bid}</span>
                  <CopyBtn text={k.keyword} />
                </div>
              </div>
            ))}
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Negative keywords</div>
              <div style={{ fontSize:12, color:'#FC8F8F' }}>{(campaign.negativeKeywords||[]).join(', ')}</div>
            </div>
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Targeting</div>
            {Object.entries(campaign.targeting||{}).map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:`1px solid ${BORD}` }}>
                <span style={{ fontSize:11, color:TXT3, minWidth:80, textTransform:'capitalize' }}>{k}</span>
                <span style={{ fontSize:11, color:TXT }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)' }) }}>
            <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:8 }}>📊 Estimates</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div style={{ padding:'8px', background:'rgba(255,255,255,.03)', borderRadius:6 }}>
                <div style={{ fontSize:10, color:TXT3 }}>Est. CPC</div>
                <div style={{ fontSize:14, fontWeight:700, color:TXT }}>{campaign.estimatedCPC}</div>
              </div>
              <div style={{ padding:'8px', background:'rgba(255,255,255,.03)', borderRadius:6 }}>
                <div style={{ fontSize:10, color:TXT3 }}>Monthly Clicks</div>
                <div style={{ fontSize:14, fontWeight:700, color:TXT }}>{campaign.estimatedMonthlyClicks}</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:TXT2, lineHeight:1.7 }}>{campaign.campaignTips}</div>
          </div>

          <div style={{ padding:'12px 14px', background:'rgba(37,99,235,.06)', border:'1px solid rgba(37,99,235,.15)', borderRadius:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#60A5FA', marginBottom:6 }}>Next steps</div>
            <ol style={{ paddingLeft:16, fontSize:12, color:TXT3, lineHeight:1.8 }}>
              <li>Go to <a href="https://ads.microsoft.com" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>ads.microsoft.com</a> → Create campaign → Search</li>
              <li>Set daily budget to <strong style={{ color:TXT }}>${budget}</strong> · Bid strategy: <strong style={{ color:TXT }}>{campaign.bidStrategy}</strong></li>
              <li>Copy headlines and descriptions from above → paste into ad copy fields</li>
              <li>Add keywords with their match types and bids</li>
              <li>Add negative keywords to prevent wasted spend</li>
              <li>Set landing page to the Final URL above</li>
              <li>Run for 14 days before judging performance</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
