import { useState, useEffect } from 'react';

const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const AMB  = '#F59E0B';
const RED  = '#EF4444';
const BLU  = '#3B82F6';
const PNK  = '#EC4899';
const API  = 'https://contentforge-production-6e13.up.railway.app';

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:14, ...extra };
}

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
      style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${BORD}`, background:'transparent', color:copied?GRN:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
      {copied ? '✓ Copied' : `📋 ${label||'Copy'}`}
    </button>
  );
}

const PLATFORMS = [
  { id:'meta',      label:'📘 Meta Ads',       color:'#1877F2', bg:'rgba(24,119,242,.1)' },
  { id:'pinterest', label:'📌 Pinterest',       color:'#E60023', bg:'rgba(230,0,35,.1)' },
  { id:'youtube',   label:'▶ YouTube',          color:'#FF0000', bg:'rgba(255,0,0,.1)' },
  { id:'msads',     label:'🔍 Microsoft Ads',   color:'#00A4EF', bg:'rgba(0,164,239,.1)' },
  { id:'pinads',    label:'📌 Pinterest Ads',   color:'#E60023', bg:'rgba(230,0,35,.08)' },
  { id:'heygen',    label:'🎬 HeyGen Script',   color:'#8B5CF6', bg:'rgba(139,92,246,.1)' },
];

export default function AdBriefGenerator() {
  const [session, setSession]     = useState(null);
  const [topic, setTopic]         = useState(null);
  const [generating, setGenerating] = useState(false);
  const [brief, setBrief]         = useState(null);
  const [activeTab, setActiveTab] = useState('meta');
  const [error, setError]         = useState('');

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const t = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      setSession(s); setTopic(t);
    } catch(e) {}
  }, []);

  const landingUrl = session?.landingUrl || session?.landing || '';
  const topicLabel = topic?.label || session?.youtubeTitle || '';
  const affName    = session?.link?.name || '';
  const affUrl     = session?.link?.url || session?.landingUrl || '';
  const niche      = topic?.cat || 'general';
  const heroImage  = session?.heroImage || session?.hero_image || '';

  async function generateBrief() {
    if (!topicLabel) return;
    setGenerating(true);
    setError('');
    try {
      const r = await fetch(API + '/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an expert performance marketer creating a complete ad brief for affiliate content.

Topic: "${topicLabel}"
Niche: ${niche}
Affiliate product: ${affName}
Landing page: ${landingUrl}
Hero image: ${heroImage}

Generate a complete ad brief as JSON with these exact fields:

{
  "headlines": ["headline 1 under 35 chars", "headline 2 under 35 chars", "headline 3 under 35 chars"],
  "body_short": "1 sentence ad copy under 80 chars with CTA",
  "body_medium": "2-3 sentence ad copy under 150 chars with emotional hook and CTA",
  "body_long": "3-4 sentence ad copy under 220 chars with problem/solution/CTA",
  "heygen_script": "60-second talking head UGC video script in first person casual tone, mentions the product naturally, ends with 'link in bio' or 'link below', around 120-150 words",
  "pinterest_title": "Pin title under 50 chars optimized for Pinterest search",
  "pinterest_description": "Pin description 2-3 sentences with keywords and call to action",
  "pinterest_hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "youtube_title": "YouTube title under 60 chars SEO optimized with numbers or power words",
  "youtube_description": "YouTube description 3-4 sentences covering topic benefits, includes landing page URL placeholder [URL], ends with subscribe CTA",
  "youtube_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "ms_headline1": "Microsoft Ads headline 1 under 30 chars",
  "ms_headline2": "Microsoft Ads headline 2 under 30 chars",
  "ms_headline3": "Microsoft Ads headline 3 under 30 chars",
  "ms_description": "Microsoft Ads description under 90 chars with CTA",
  "ms_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6"],
  "target_audience": "Facebook/Meta target audience description 2 sentences covering age range, interests, and behaviors",
  "audience_interests": ["interest 1", "interest 2", "interest 3", "interest 4", "interest 5"],
  "budget_recommendation": "Suggested daily budget and testing strategy in 2 sentences",
  "pin_ad_title": "Pinterest ad title under 50 chars",
  "pin_ad_description": "Pinterest ad description under 100 chars"
}

Return ONLY the JSON object, no other text.`,
          max_tokens: 1500,
        }),
      });
      const d = await r.json();
      const text = d.text || d.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      setBrief(JSON.parse(clean));
    } catch(e) {
      setError('Generation failed — try again');
      console.error(e);
    }
    setGenerating(false);
  }

  const renderMeta = () => !brief ? null : (
    <div>
      <div style={{ ...card({ background:'rgba(24,119,242,.06)', border:'1px solid rgba(24,119,242,.2)' }) }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#60A5FA', marginBottom:12 }}>📘 Meta Ads — Facebook & Instagram</div>
        <div style={{ fontSize:11, color:TXT3, marginBottom:10 }}>3 headlines — use one per ad set</div>
        {brief.headlines.map((h,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, marginBottom:6 }}>
            <span style={{ fontSize:13, color:TXT }}>{h}</span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:10, color:h.length>35?RED:TXT3 }}>{h.length}/35</span>
              <CopyBtn text={h} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...card() }}>
        <div style={{ fontSize:11, fontWeight:700, color:TXT3, marginBottom:10 }}>Ad body copy — 3 lengths</div>
        {[{label:'Short (mobile)', text:brief.body_short},{label:'Medium (feed)', text:brief.body_medium},{label:'Long (detailed)', text:brief.body_long}].map((v,i) => (
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ fontSize:11, color:TXT3 }}>{v.label}</div>
              <CopyBtn text={v.text} />
            </div>
            <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.7 }}>{v.text}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card() }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:TXT3 }}>Target audience</div>
          <CopyBtn text={brief.target_audience} />
        </div>
        <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.7, marginBottom:10 }}>{brief.target_audience}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {brief.audience_interests?.map((interest,i) => (
            <span key={i} style={{ padding:'4px 10px', borderRadius:20, background:'rgba(24,119,242,.1)', border:'1px solid rgba(24,119,242,.2)', fontSize:11, color:'#93C5FD' }}>{interest}</span>
          ))}
        </div>
      </div>
      <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.2)' }) }}>
        <div style={{ fontSize:11, fontWeight:700, color:GRN, marginBottom:6 }}>Landing page</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7 }}>
          <span style={{ fontSize:12, color:GRN }}>{landingUrl}</span>
          <CopyBtn text={landingUrl} label="Copy URL" />
        </div>
        <div style={{ fontSize:11, color:TXT3, marginTop:8 }}>{brief.budget_recommendation}</div>
      </div>
    </div>
  );

  const renderPinterest = () => !brief ? null : (
    <div>
      <div style={{ ...card({ background:'rgba(230,0,35,.06)', border:'1px solid rgba(230,0,35,.2)' }) }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#F87171', marginBottom:12 }}>📌 Pinterest Organic Pin</div>
        {[{label:'Pin title', text:brief.pinterest_title},{label:'Pin description', text:brief.pinterest_description}].map((f,i) => (
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ fontSize:11, color:TXT3 }}>{f.label}</div>
              <CopyBtn text={f.text} />
            </div>
            <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.7 }}>{f.text}</div>
          </div>
        ))}
        <div style={{ fontSize:11, color:TXT3, marginBottom:6 }}>Hashtags</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          {brief.pinterest_hashtags?.map((tag,i) => (
            <span key={i} style={{ padding:'3px 8px', borderRadius:20, background:'rgba(230,0,35,.1)', border:'1px solid rgba(230,0,35,.2)', fontSize:11, color:'#FCA5A5' }}>#{tag}</span>
          ))}
        </div>
        <CopyBtn text={brief.pinterest_hashtags?.map(t=>'#'+t).join(' ')} label="Copy all hashtags" />
      </div>
      <div style={{ ...card({ background:'rgba(230,0,35,.04)' }) }}>
        <div style={{ fontSize:11, fontWeight:700, color:TXT3, marginBottom:8 }}>Landing page to pin</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7 }}>
          <span style={{ fontSize:12, color:GRN }}>{landingUrl}</span>
          <CopyBtn text={landingUrl} label="Copy URL" />
        </div>
        {heroImage && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:11, color:TXT3, marginBottom:6 }}>Pin image (save and upload to Pinterest)</div>
            <a href={heroImage} target="_blank" rel="noreferrer" style={{ display:'inline-block', padding:'6px 14px', background:'rgba(230,0,35,.15)', border:'1px solid rgba(230,0,35,.3)', borderRadius:7, fontSize:11, color:'#FCA5A5', textDecoration:'none' }}>
              Open hero image →
            </a>
          </div>
        )}
      </div>
    </div>
  );

  const renderYouTube = () => !brief ? null : (
    <div>
      <div style={{ ...card({ background:'rgba(255,0,0,.06)', border:'1px solid rgba(255,0,0,.2)' }) }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#F87171', marginBottom:12 }}>▶ YouTube — Video Optimization</div>
        {[{label:'Video title', text:brief.youtube_title},{label:'Description', text:brief.youtube_description?.replace('[URL]', landingUrl)}].map((f,i) => (
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ fontSize:11, color:TXT3 }}>{f.label}</div>
              <CopyBtn text={f.text} />
            </div>
            <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.7 }}>{f.text}</div>
          </div>
        ))}
        <div style={{ fontSize:11, color:TXT3, marginBottom:6 }}>Tags</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {brief.youtube_tags?.map((tag,i) => (
            <span key={i} style={{ padding:'3px 8px', borderRadius:20, background:'rgba(255,0,0,.1)', border:'1px solid rgba(255,0,0,.2)', fontSize:11, color:'#FCA5A5' }}>{tag}</span>
          ))}
        </div>
      </div>
      <div style={{ ...card() }}>
        <div style={{ fontSize:11, color:TXT3, marginBottom:6 }}>Pin this in first comment after uploading</div>
        <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:GRN }}>{landingUrl}</div>
      </div>
    </div>
  );

  const renderMsAds = () => !brief ? null : (
    <div>
      <div style={{ ...card({ background:'rgba(0,164,239,.06)', border:'1px solid rgba(0,164,239,.2)' }) }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#60A5FA', marginBottom:12 }}>🔍 Microsoft Ads — Bing Search</div>
        <div style={{ fontSize:11, color:TXT3, marginBottom:8 }}>3 headlines (required by Microsoft Ads)</div>
        {[brief.ms_headline1, brief.ms_headline2, brief.ms_headline3].map((h,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, marginBottom:6 }}>
            <span style={{ fontSize:13, color:TXT }}>{h}</span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:10, color:(h?.length||0)>30?RED:TXT3 }}>{h?.length}/30</span>
              <CopyBtn text={h} />
            </div>
          </div>
        ))}
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:11, color:TXT3 }}>Description</div>
            <CopyBtn text={brief.ms_description} />
          </div>
          <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.7 }}>{brief.ms_description}</div>
        </div>
      </div>
      <div style={{ ...card() }}>
        <div style={{ fontSize:11, color:TXT3, marginBottom:8 }}>Search keywords — paste into Microsoft Ads keyword planner</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          {brief.ms_keywords?.map((kw,i) => (
            <span key={i} style={{ padding:'4px 10px', borderRadius:20, background:'rgba(0,164,239,.1)', border:'1px solid rgba(0,164,239,.2)', fontSize:11, color:'#93C5FD' }}>{kw}</span>
          ))}
        </div>
        <CopyBtn text={brief.ms_keywords?.join(', ')} label="Copy all keywords" />
      </div>
      <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.2)' }) }}>
        <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Final URL (destination)</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7 }}>
          <span style={{ fontSize:12, color:GRN }}>{landingUrl}</span>
          <CopyBtn text={landingUrl} label="Copy URL" />
        </div>
      </div>
    </div>
  );

  const renderPinAds = () => !brief ? null : (
    <div>
      <div style={{ ...card({ background:'rgba(230,0,35,.06)', border:'1px solid rgba(230,0,35,.2)' }) }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#F87171', marginBottom:12 }}>📌 Pinterest Ads — Promoted Pins</div>
        {[{label:'Ad title', text:brief.pin_ad_title},{label:'Ad description', text:brief.pin_ad_description}].map((f,i) => (
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ fontSize:11, color:TXT3 }}>{f.label}</div>
              <CopyBtn text={f.text} />
            </div>
            <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:12, color:TXT, lineHeight:1.7 }}>{f.text}</div>
          </div>
        ))}
        <div style={{ fontSize:11, color:TXT3, marginBottom:6 }}>Audience interests — paste into Pinterest Ads targeting</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          {brief.audience_interests?.map((interest,i) => (
            <span key={i} style={{ padding:'3px 8px', borderRadius:20, background:'rgba(230,0,35,.1)', border:'1px solid rgba(230,0,35,.2)', fontSize:11, color:'#FCA5A5' }}>{interest}</span>
          ))}
        </div>
      </div>
      <div style={{ ...card() }}>
        <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Destination URL</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7 }}>
          <span style={{ fontSize:12, color:GRN }}>{landingUrl}</span>
          <CopyBtn text={landingUrl} label="Copy URL" />
        </div>
        <div style={{ fontSize:11, color:TXT3, marginTop:8 }}>Budget: Start at $5/day, target interests above, objective: Traffic</div>
      </div>
    </div>
  );

  const renderHeyGen = () => !brief ? null : (
    <div>
      <div style={{ ...card({ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.2)' }) }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#A78BFA', marginBottom:12 }}>🎬 HeyGen Video Script</div>
        <div style={{ fontSize:11, color:TXT3, marginBottom:10 }}>60-second talking head UGC style · Paste directly into HeyGen</div>
        <div style={{ padding:'12px 14px', background:'rgba(255,255,255,.04)', borderRadius:8, fontSize:13, color:TXT, lineHeight:1.9, whiteSpace:'pre-wrap', marginBottom:12 }}>
          {brief.heygen_script}
        </div>
        <CopyBtn text={brief.heygen_script} label="Copy full script" />
      </div>
      <div style={{ ...card() }}>
        <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>📋 HeyGen setup checklist</div>
        {[
          'Open HeyGen → Create Video → Talking Avatar',
          'Select your avatar (or use AI avatar)',
          'Paste the script above into the text field',
          'Set voice to English US — natural tone',
          'Preview and adjust pacing if needed',
          'Export as MP4 (1080×1920 for Stories/Reels, 1080×1080 for Feed)',
          'Upload to NichRoute via 📁 Media Manager in Command Center',
          'Post on Facebook, Instagram Reels, YouTube Shorts',
        ].map((step,i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom:`1px solid ${BORD}` }}>
            <span style={{ color:GRN, flexShrink:0, fontSize:11 }}>{i+1}.</span>
            <span style={{ fontSize:12, color:TXT2 }}>{step}</span>
          </div>
        ))}
      </div>
      <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.2)' }) }}>
        <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Include this link in video description and bio</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7 }}>
          <span style={{ fontSize:12, color:GRN }}>{landingUrl}</span>
          <CopyBtn text={landingUrl} label="Copy URL" />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ color:TXT, fontFamily:'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ ...card({ background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', marginBottom:16 }) }}>
        <div style={{ fontSize:14, fontWeight:700, color:GRN, marginBottom:4 }}>📢 Ad Brief Generator</div>
        <div style={{ fontSize:12, color:TXT3, lineHeight:1.6 }}>
          One click generates a complete ad package — Meta, Pinterest, YouTube, Microsoft Ads, Pinterest Ads, and HeyGen script. All formatted and ready to paste.
        </div>
      </div>

      {/* Session */}
      {session ? (
        <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', padding:'10px 14px' }) }}>
          <div style={{ fontSize:12, color:GRN, fontWeight:600 }}>✓ {topicLabel}</div>
          <div style={{ fontSize:11, color:TXT3 }}>{niche} · {affName} · {landingUrl.replace('https://','').slice(0,40)}</div>
        </div>
      ) : (
        <div style={{ ...card({ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', padding:'10px 14px' }) }}>
          <div style={{ fontSize:12, color:'#FC8F8F', fontWeight:600 }}>Generate a topic in Command Center first</div>
        </div>
      )}

      {/* Generate button */}
      <button onClick={generateBrief} disabled={generating || !session}
        style={{ width:'100%', padding:'14px', borderRadius:9, border:'none', background:generating?'rgba(29,158,117,.3)':GRN, color:'#fff', fontSize:14, fontWeight:700, cursor:generating||!session?'default':'pointer', fontFamily:'inherit', marginBottom:14 }}>
        {generating ? '⏳ Generating ad brief for all platforms...' : '📢 Generate Full Ad Brief'}
      </button>

      {error && <div style={{ ...card({ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', padding:'10px 14px', marginBottom:14 }) }}><div style={{ fontSize:12, color:'#FC8F8F' }}>❌ {error}</div></div>}

      {/* Platform tabs */}
      {brief && (
        <div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setActiveTab(p.id)}
                style={{ padding:'7px 12px', borderRadius:20, border:`1px solid ${activeTab===p.id?p.color:BORD}`, background:activeTab===p.id?p.bg:'transparent', color:activeTab===p.id?p.color:TXT3, fontSize:11, fontWeight:activeTab===p.id?700:400, cursor:'pointer', fontFamily:'inherit' }}>
                {p.label}
              </button>
            ))}
          </div>

          {activeTab === 'meta'      && renderMeta()}
          {activeTab === 'pinterest' && renderPinterest()}
          {activeTab === 'youtube'   && renderYouTube()}
          {activeTab === 'msads'     && renderMsAds()}
          {activeTab === 'pinads'    && renderPinAds()}
          {activeTab === 'heygen'    && renderHeyGen()}
        </div>
      )}
    </div>
  );
}
