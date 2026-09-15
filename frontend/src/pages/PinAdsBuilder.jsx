import { useState, useEffect } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const RED  = '#E60023';
const API  = 'https://contentforge-production-6e13.up.railway.app';

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:16, ...extra };
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  }
  return (
    <button onClick={doCopy}
      style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${BORD}`, background:'transparent', color:copied?GRN:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

function Field({ label, value, hint, rows }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <div style={{ fontSize:11, fontWeight:600, color:TXT2 }}>{label} {hint && <span style={{ fontWeight:400, color:TXT3 }}>{hint}</span>}</div>
        <CopyBtn text={value} />
      </div>
      <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.6, whiteSpace:'pre-wrap', maxHeight:rows?120:40, overflowY:'auto' }}>
        {value || <span style={{ color:TXT3 }}>—</span>}
      </div>
    </div>
  );
}

export default function PinAdsBuilder() {
  const [session, setSession] = useState(null);
  const [topic, setTopic] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [goal, setGoal] = useState('consideration');
  const [budget, setBudget] = useState('3');
  const [niche, setNiche] = useState('health');

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

      const r = await fetch(API + '/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a Pinterest Ads expert specializing in affiliate marketing. Generate a complete Pinterest promoted pin campaign.

Topic: "${topicLabel}"
Niche: ${niche}
Affiliate product: ${affName}
Landing page: ${landingUrl}
Campaign goal: ${goal}
Daily budget: $${budget}

Return ONLY a JSON object with these exact fields:
{
  "campaignName": "campaign name",
  "adGoal": "${goal}",
  "pinTitle": "pin title max 100 chars — compelling, keyword-rich",
  "pinDescription": "pin description max 500 chars — include keywords naturally, end with soft CTA",
  "destinationUrl": "${landingUrl}",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8"],
  "audienceInterests": ["interest category 1", "interest category 2", "interest category 3", "interest category 4"],
  "demographics": {
    "age": "age range best for this topic",
    "gender": "all/women/men recommendation with reason",
    "location": "United States"
  },
  "boards": ["suggested board name 1", "suggested board name 2", "suggested board name 3"],
  "imageSpecs": "exact image specs for this campaign type",
  "videoSpecs": "exact video specs if video pin is better",
  "bidStrategy": "autobid or manual bid recommendation",
  "estimatedCPM": "$x.xx - $x.xx",
  "estimatedMonthlyImpressions": "xx,xxx - xx,xxx at $${budget}/day",
  "bestPostingTime": "day and time recommendation",
  "campaignTips": "3 specific Pinterest affiliate marketing tips for this niche"
}`,
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
        }),
      });
      const d = await r.json();
      const text = d.text || d.content?.[0]?.text || '';
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
      'PINTEREST ADS CAMPAIGN',
      '======================',
      `Campaign Name: ${campaign.campaignName}`,
      `Goal: ${campaign.adGoal}`,
      '',
      `Pin Title: ${campaign.pinTitle}`,
      '',
      `Pin Description:\n${campaign.pinDescription}`,
      '',
      `Destination URL: ${campaign.destinationUrl}`,
      '',
      'Keywords:',
      ...(campaign.keywords||[]).map(k => `• ${k}`),
      '',
      'Audience Interests:',
      ...(campaign.audienceInterests||[]).map(a => `• ${a}`),
      '',
      `Demographics: Age ${campaign.demographics?.age} · ${campaign.demographics?.gender} · ${campaign.demographics?.location}`,
      '',
      'Boards to promote from:',
      ...(campaign.boards||[]).map(b => `• ${b}`),
      '',
      `Image specs: ${campaign.imageSpecs}`,
      `Video specs: ${campaign.videoSpecs}`,
      '',
      `Bid Strategy: ${campaign.bidStrategy}`,
      `Est. CPM: ${campaign.estimatedCPM}`,
      `Est. Monthly Impressions: ${campaign.estimatedMonthlyImpressions}`,
      `Best posting time: ${campaign.bestPostingTime}`,
      '',
      `Tips: ${campaign.campaignTips}`,
    ].join('\n');
    navigator.clipboard.writeText(text).catch(()=>{});
  }

  return (
    <div style={{ color:TXT, fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ ...card({ background:'rgba(230,0,35,.06)', border:'1px solid rgba(230,0,35,.2)' }) }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#FF6B81', marginBottom:4 }}>📌 Pinterest Ads Campaign Builder</div>
            <div style={{ fontSize:12, color:TXT3, lineHeight:1.6 }}>
              Generates promoted pin copy, keywords, and targeting — paste directly into ads.pinterest.com<br/>
              Best for: lifestyle, health, food, finance, home income — visual buying intent
            </div>
          </div>
          <a href="https://ads.pinterest.com" target="_blank" rel="noreferrer"
            style={{ padding:'7px 14px', borderRadius:7, background:RED, color:'white', fontSize:11, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
            Open Pinterest Ads →
          </a>
        </div>
      </div>

      {/* Session */}
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Campaign goal</div>
            <select value={goal} onChange={e=>setGoal(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, color:TXT, fontFamily:'inherit' }}>
              <option value="consideration" style={{ background:BG }}>Consideration (clicks)</option>
              <option value="awareness" style={{ background:BG }}>Awareness (impressions)</option>
              <option value="conversion" style={{ background:BG }}>Conversion (sales)</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Niche</div>
            <select value={niche} onChange={e=>setNiche(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, color:TXT, fontFamily:'inherit' }}>
              {['health','meal-prep','finance','side-hustle','cooking','coffee','mindset','remote-work','woodworking','outdoor-cooking'].map(n=>(
                <option key={n} value={n} style={{ background:BG }}>{n.replace(/-/g,' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Daily budget</div>
            <select value={budget} onChange={e=>setBudget(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, color:TXT, fontFamily:'inherit' }}>
              {['2','3','5','10','15','20'].map(b=>(
                <option key={b} value={b} style={{ background:BG }}>${b}/day</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={generateCampaign} disabled={generating}
          style={{ width:'100%', marginTop:12, padding:'11px', borderRadius:8, border:'none', background:generating?'rgba(230,0,35,.3)':RED, color:'white', fontSize:13, fontWeight:700, cursor:generating?'default':'pointer', fontFamily:'inherit' }}>
          {generating ? '⏳ Generating campaign...' : '📌 Generate Pinterest Ads Campaign'}
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
            <Field label="Pin Title" value={campaign.pinTitle} hint={`${(campaign.pinTitle||'').length}/100 chars`} />
          </div>

          <div style={{ ...card() }}>
            <Field label="Pin Description" value={campaign.pinDescription} hint={`${(campaign.pinDescription||'').length}/500 chars`} rows={4} />
            <Field label="Destination URL" value={campaign.destinationUrl} />
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Keywords — add these in Pinterest Ads keyword targeting</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {(campaign.keywords||[]).map((k,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.05)', borderRadius:20, padding:'4px 10px' }}>
                  <span style={{ fontSize:12, color:TXT }}>{k}</span>
                  <CopyBtn text={k} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Audience Interests</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {(campaign.audienceInterests||[]).map((a,i) => (
                <span key={i} style={{ fontSize:12, color:'#FF6B81', background:'rgba(230,0,35,.08)', border:'1px solid rgba(230,0,35,.2)', borderRadius:20, padding:'4px 12px' }}>{a}</span>
              ))}
            </div>
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Demographics</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {Object.entries(campaign.demographics||{}).map(([k,v]) => (
                <div key={k} style={{ padding:'8px', background:'rgba(255,255,255,.03)', borderRadius:7 }}>
                  <div style={{ fontSize:10, color:TXT3, textTransform:'capitalize', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:12, color:TXT }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Boards to promote from</div>
            {(campaign.boards||[]).map((b,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${BORD}` }}>
                <span style={{ fontSize:12, color:TXT }}>📌 {b}</span>
                <CopyBtn text={b} />
              </div>
            ))}
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>Creative specs</div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, color:TXT3, marginBottom:3 }}>📷 Image Pin</div>
              <div style={{ fontSize:12, color:TXT }}>{campaign.imageSpecs}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:TXT3, marginBottom:3 }}>🎬 Video Pin</div>
              <div style={{ fontSize:12, color:TXT }}>{campaign.videoSpecs}</div>
            </div>
          </div>

          <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)' }) }}>
            <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:8 }}>📊 Estimates</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div style={{ padding:'8px', background:'rgba(255,255,255,.03)', borderRadius:6 }}>
                <div style={{ fontSize:10, color:TXT3 }}>Est. CPM</div>
                <div style={{ fontSize:14, fontWeight:700, color:TXT }}>{campaign.estimatedCPM}</div>
              </div>
              <div style={{ padding:'8px', background:'rgba(255,255,255,.03)', borderRadius:6 }}>
                <div style={{ fontSize:10, color:TXT3 }}>Monthly Impressions</div>
                <div style={{ fontSize:13, fontWeight:700, color:TXT }}>{campaign.estimatedMonthlyImpressions}</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:6 }}>Best time to post: <span style={{ color:TXT }}>{campaign.bestPostingTime}</span></div>
            <div style={{ fontSize:12, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{campaign.campaignTips}</div>
          </div>

          <div style={{ padding:'12px 14px', background:'rgba(230,0,35,.06)', border:'1px solid rgba(230,0,35,.15)', borderRadius:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#FF6B81', marginBottom:6 }}>Next steps</div>
            <ol style={{ paddingLeft:16, fontSize:12, color:TXT3, lineHeight:1.8 }}>
              <li>Go to <a href="https://ads.pinterest.com" target="_blank" rel="noreferrer" style={{ color:'#FF6B81' }}>ads.pinterest.com</a> → Create campaign → Consideration</li>
              <li>Set daily budget to <strong style={{ color:TXT }}>${budget}</strong></li>
              <li>Upload your thumbnail (from Command Center) or HeyGen video as the pin creative</li>
              <li>Copy pin title and description from above</li>
              <li>Add keywords and audience interests from above</li>
              <li>Set destination URL to your NichRoute styled page</li>
              <li>Select the board to promote from (use existing or create one of the boards listed above)</li>
              <li>Run for 14 days — Pinterest needs 7-10 days to exit the learning phase</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
