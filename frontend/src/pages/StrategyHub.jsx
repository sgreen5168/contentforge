import { useState } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BG3  = '#122545';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';
const ACCH = '#4FA3FF';
const AMB  = '#F59E0B';

function card() {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12 };
}

const STRATEGY = {
  platformLengths: [
    { platform:'YouTube Shorts', icon:'▶', sweet:'30-60 sec', why:'Algorithm pushes Shorts hard — monetizes at 1K subs', priority:'🔥 Priority 1', color:'#EF4444' },
    { platform:'TikTok', icon:'🎵', sweet:'15-45 sec', why:'Under 60s gets pushed to more FYP feeds — fastest organic reach', priority:'🔥 Priority 2', color:'#010101' },
    { platform:'Instagram Reels', icon:'📸', sweet:'15-30 sec', why:'Shorter outperforms longer — same MP4 as TikTok', priority:'⚡ Priority 3', color:'#E1306C' },
    { platform:'Pinterest Video', icon:'📌', sweet:'6-15 sec', why:'Autoplay scroll — hook instantly. Evergreen traffic for years', priority:'📈 Long-term', color:'#E60023' },
    { platform:'YouTube Long-form', icon:'▶', sweet:'8-15 min', why:'Ad revenue needs watch time — more ad slots = more income', priority:'📈 Long-term', color:'#EF4444' },
    { platform:'Facebook', icon:'📘', sweet:'3-5 min', why:'Organic reach 1-3% of followers — pay-to-play now', priority:'⬇ Deprioritize', color:'#1877F2' },
  ],
  monetizationPath: [
    { step:'1', timeframe:'Month 1-2', title:'YouTube Shorts Daily', detail:'Upload 30-sec Command Center videos as Shorts. Target: 1,000 subs + 10M Shorts views in 90 days.', revenue:'$0.03-$0.07 per 1K views + affiliate clicks', color:ACC },
    { step:'2', timeframe:'Immediate', title:'Affiliate Income Now', detail:'Every video description has your Amazon/Awin link. 100 clicks → 3-5 sales → $15-50 commission.', revenue:'$15-50 per 100 clicks', color:AMB },
    { step:'3', timeframe:'Month 2-3', title:'TikTok Creator Fund', detail:'Post same MP4 to TikTok daily. Target: 1K followers + 100K views in 30 days.', revenue:'$0.02-$0.04 per 1K views', color:'#010101' },
    { step:'4', timeframe:'Ongoing', title:'Pinterest Affiliate Traffic', detail:'Pin each NichRoute landing page. One good Pin sends affiliate traffic for years.', revenue:'Evergreen passive clicks', color:'#E60023' },
  ],
  trendingTopics: [
    { niche:'Home Bakery', icon:'🧁', titles:['How to start selling baked goods from home','Home bakery income — realistic numbers','What you need to legally sell baked goods','Pricing homemade baked goods for profit'] },
    { niche:'Side Hustle', icon:'💰', titles:['Side hustles that made me quit my job','$500 a week from home — realistic breakdown','Side hustle ideas for beginners 2026','Passive income ideas that actually work'] },
    { niche:'Health & Wellness', icon:'💪', titles:['Lazy girl workout that actually works','Habits that changed my health in 30 days','Morning routine for energy without caffeine','10 minute workout you can do anywhere'] },
    { niche:'Meal Prep', icon:'🥗', titles:['Full week meal prep under $50','High protein meal prep for beginners','5 ingredient meal prep that lasts all week','Meal prep for weight loss 2026'] },
    { niche:'Mindset', icon:'💡', titles:['Habits that changed my life in 30 days','The mindset shift nobody talks about','Why most people never reach their goals','Morning routine that changed my energy'] },
    { niche:'Remote Work', icon:'💻', titles:['Home office setup that changed everything','Work from home setup under $200','Remote work tips nobody tells you','Best work from home jobs 2026'] },
    { niche:'Amazon Finds', icon:'📦', titles:['Amazon finds that changed my daily routine','Products I wish I bought sooner','Amazon hidden gems under $30','Amazon must haves for home 2026'] },
    { niche:'Financial Tips', icon:'💵', titles:['Money habits that changed my finances','How to save $1000 fast starting now','Budgeting tips that actually work 2026','Financial freedom habits nobody teaches'] },
  ],
  actionPlan: [
    { week:"Week 1", actions:["Upload existing Command Center MP4s to YouTube Shorts","Post 1 Short per day — use trending titles from this page","Don't overthink it — consistency beats perfection"] },
    { week:"Week 2", actions:["Start TikTok with same videos — same content, different platform","Post daily — TikTok rewards new creators with organic reach","Add NichRoute landing page URL to bio on both platforms"] },
    { week:"Week 3", actions:["Create Pinterest boards: Home Bakery, Meal Prep, Side Hustle, Health","Pin each NichRoute landing page URL to relevant board","Each Pin drives evergreen affiliate traffic for months"] },
    { week:"Week 4", actions:["Check which videos got most views — generate more on those topics","Double down on what's working — ignore what isn't","Apply to Awin programs that match your top-performing topics"] },
  ],
  whyFacebook: [
    "Facebook organic reach dropped to 1-3% of followers in 2026",
    "If 100 people follow your page, only 1-3 see your posts without paying",
    "Facebook is now essentially pay-to-play for business content",
    "Keep posting there but stop optimizing for it — it's your last priority",
    "Use Facebook Studio to post quickly then move on",
  ],
};

export default function StrategyHub({ onNavigate }) {
  const [tab, setTab] = useState('platform');
  const [copied, setCopied] = useState('');

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  const tabs = [
    { id:'platform', label:'📱 Platform Guide' },
    { id:'monetize', label:'💰 Monetization Path' },
    { id:'trending', label:'🔥 Trending Topics' },
    { id:'plan', label:'📅 30-Day Plan' },
    { id:'facebook', label:'📘 Facebook Reality' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:BG, color:TXT, fontFamily:'system-ui,sans-serif', padding:'24px 20px' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>📊 Research & Strategy Hub</div>
          <div style={{ fontSize:12, color:TXT3 }}>Platform insights, monetization paths, trending topics and your 30-day action plan — all in one place</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
          {tabs.map(function(t) {
            return (
              <button key={t.id} onClick={function(){ setTab(t.id); }}
                style={{ padding:'7px 14px', borderRadius:8,
                  border:`1px solid ${tab===t.id?'rgba(29,158,117,.5)':BORD}`,
                  background:tab===t.id?'rgba(29,158,117,.12)':'transparent',
                  color:tab===t.id?ACC:TXT3, fontSize:11, fontWeight:600,
                  cursor:'pointer', fontFamily:'inherit' }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Platform Guide */}
        {tab === 'platform' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:TXT2, marginBottom:4, lineHeight:1.6 }}>
              Your Command Center generates <strong style={{ color:ACC }}>30-second videos</strong> — the perfect length for YouTube Shorts, TikTok, and Instagram Reels. Upload the same MP4 to all three platforms in 15 minutes.
            </div>
            {STRATEGY.platformLengths.map(function(p, i) {
              return (
                <div key={i} style={{ ...card(), padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:p.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{p.platform}</div>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,.06)', color:TXT3 }}>{p.priority}</span>
                    </div>
                    <div style={{ fontSize:12, color:ACC, fontWeight:700, marginBottom:3 }}>Sweet spot: {p.sweet}</div>
                    <div style={{ fontSize:11, color:TXT3, lineHeight:1.5 }}>{p.why}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Monetization Path */}
        {tab === 'monetize' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:TXT2, marginBottom:4, lineHeight:1.6 }}>
              Four income streams — start all of them simultaneously. Affiliate income starts <strong style={{ color:AMB }}>immediately</strong>. Platform monetization builds over 60-90 days.
            </div>
            {STRATEGY.monetizationPath.map(function(m, i) {
              return (
                <div key={i} style={{ ...card(), padding:'14px 16px', borderLeft:`3px solid ${m.color}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:m.color+'33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:m.color, flexShrink:0 }}>{m.step}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{m.title}</div>
                      <div style={{ fontSize:10, color:TXT3 }}>{m.timeframe}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:TXT2, lineHeight:1.6, marginBottom:8 }}>{m.detail}</div>
                  <div style={{ padding:'6px 10px', background:'rgba(29,158,117,.08)', borderRadius:6, fontSize:11, color:ACC, fontWeight:600 }}>
                    💰 {m.revenue}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trending Topics */}
        {tab === 'trending' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:TXT2, marginBottom:4, lineHeight:1.6 }}>
              These are real high-volume search titles people type into YouTube, TikTok and Google right now. Click any title to copy it — use it as your video title for maximum search visibility.
            </div>
            {STRATEGY.trendingTopics.map(function(n, i) {
              return (
                <div key={i} style={{ ...card(), padding:'14px 16px' }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>{n.icon} {n.niche}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {n.titles.map(function(title, j) {
                      const id = 'trend_' + i + '_' + j;
                      return (
                        <button key={j} onClick={function(){ copy(title, id); }}
                          style={{ padding:'8px 12px', borderRadius:7, border:`1px solid ${BORD}`, background:'rgba(255,255,255,.03)', color:TXT2, fontSize:11, cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span>{title}</span>
                          <span style={{ fontSize:10, color:copied===id?ACC:TXT3, flexShrink:0, marginLeft:8 }}>{copied===id?'✓ Copied!':'📋 Copy'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 30-Day Plan */}
        {tab === 'plan' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:TXT2, marginBottom:4, lineHeight:1.6 }}>
              Follow this plan for 30 days. Consistency beats perfection — one video per day is more powerful than five videos once a week.
            </div>
            {STRATEGY.actionPlan.map(function(w, i) {
              return (
                <div key={i} style={{ ...card(), padding:'14px 16px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:ACC, marginBottom:10 }}>{w.week}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {w.actions.map(function(action, j) {
                      return (
                        <div key={j} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(29,158,117,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:ACC, flexShrink:0, marginTop:1 }}>{j+1}</div>
                          <div style={{ fontSize:12, color:TXT2, lineHeight:1.5 }}>{action}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ ...card(), padding:'14px 16px', border:'1px solid rgba(29,158,117,.25)', background:'rgba(29,158,117,.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:ACC, marginBottom:8 }}>🎯 The single most important thing</div>
              <div style={{ fontSize:12, color:TXT2, lineHeight:1.6 }}>
                Upload to <strong style={{ color:TXT }}>YouTube Shorts first</strong> every day. It is the only platform that builds toward long-term monetization while also driving immediate affiliate traffic. TikTok and Instagram get you faster reach — YouTube gets you lasting income.
              </div>
            </div>
          </div>
        )}

        {/* Facebook Reality */}
        {tab === 'facebook' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ ...card(), padding:'14px 16px', border:'1px solid rgba(239,68,68,.2)', background:'rgba(239,68,68,.04)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#FC8F8F', marginBottom:10 }}>Why Facebook organic reach is not working</div>
              {STRATEGY.whyFacebook.map(function(point, i) {
                return (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                    <span style={{ color:'#FC8F8F', flexShrink:0 }}>→</span>
                    <div style={{ fontSize:12, color:TXT2, lineHeight:1.5 }}>{point}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ ...card(), padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>What to do with Facebook instead</div>
              {[
                ["Post quickly via Facebook Studio", "Generate content → copy description → post in under 5 minutes. Don't spend more time than that."],
                ['Use Facebook Groups for reach', 'Join Home Bakery, Side Hustle, and Meal Prep groups. Share your NichRoute landing page as helpful content — not as an ad.'],
                ["Boost selectively", "If a post gets good organic engagement, boost it with $5-10. Only pay to amplify what's already working."],
                ["Facebook is your archive", "Your Facebook page is a content library. New followers can browse your history. Not your primary traffic source."],
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ marginBottom:12, padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${BORD}` }}>
                    <div style={{ fontSize:12, fontWeight:700, marginBottom:4 }}>{item[0]}</div>
                    <div style={{ fontSize:11, color:TXT3, lineHeight:1.5 }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ ...card(), padding:'14px 16px', border:'1px solid rgba(29,158,117,.25)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:ACC, marginBottom:6 }}>Where to focus your energy instead</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['▶ YouTube Shorts','Builds to monetization — post daily'],['🎵 TikTok','Fastest organic reach for new creators'],['📸 Instagram Reels','Same video — zero extra work'],['📌 Pinterest','Evergreen traffic for months']].map(function(p,i){
                  return (
                    <div key={i} style={{ padding:'10px', borderRadius:8, background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)' }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{p[0]}</div>
                      <div style={{ fontSize:10, color:TXT3 }}>{p[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
