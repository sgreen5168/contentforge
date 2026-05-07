import React, { useState } from 'react';

const D=[
  {id:'start',icon:'🚀',label:'Getting started',topics:[
    {title:'Logging in',desc:'ContentForge is password protected — only you can access it.',steps:['Go to contentstudiohub.com on any device','Type your password: ContentForge2026','Press Enter or tap Sign in','You stay logged in until you click Sign out'],tip:'On mobile tap ☰ top-left to open the navigation menu. The sidebar slides in from the left.'},
    {title:'Navigation',desc:'9 sections in the sidebar. On mobile it slides in from the left.',steps:['Desktop: sidebar is always visible on the left','Mobile: tap ☰ to open the slide-in menu','Tap any section name to navigate instantly','Tap outside the menu to close it'],tip:'Add to home screen: Share → Add to Home Screen on iPhone, or Chrome ⋮ → Add to Home Screen on Android.'},
  ]},
  {id:'composer',icon:'✦',label:'AI Composer',topics:[
    {title:'Writing social posts',desc:'Claude writes a unique post for each platform you select.',steps:['Click AI Composer in the sidebar','Type your topic, product, or idea','Select which platforms to write for','Choose a tone — Professional, Casual, Humorous, or Inspirational','Click Generate Posts ⚡','Click Copy under any post to copy it'],tip:'Instagram gets hashtags automatically. Reddit gets a conversational tone. Facebook gets longer format.'},
  ]},
  {id:'video',icon:'▶',label:'AI Video Engine',topics:[
    {title:'3 input modes',desc:'Create videos from a topic, a URL, or an affiliate link.',steps:['TOPIC — type any subject: "morning productivity habits"','URL — paste a product page, Claude reads the content automatically','AFFILIATE — paste your tracking link, Claude extracts the product and adds your link to the CTA'],tip:'Affiliate mode auto-adds your tracking link to every call-to-action so every viewer clicks your link.'},
    {title:'Smart Mode',desc:'Automatically picks the best video format for your content.',steps:['Smart Mode ON (default) — Claude picks the best format','Smart Mode OFF — you choose from 7 video types manually','Toggle is at the top of the left panel'],tip:'Keep Smart Mode ON when starting out. Turn it off when you know which format you need.'},
    {title:'7 video types',desc:'Each type produces a different script structure and visual style.',steps:['UGC Persona — authentic first-person review, casual and relatable','AI VSL — Hook → Problem → Solution → CTA structure','Hybrid VSL — AI avatar sections combined with B-roll footage','Reel Ads — short punchy ads for TikTok, Reels, and Shorts','Product Ads — direct-response e-commerce with price and urgency','Commercial — cinematic brand story with emotional arc','Competitor Replicator — original content using a competitor\'s proven structure'],tip:'UGC Persona and Reel Ads work best for affiliate marketing. VSL works best for high-ticket products.'},
    {title:'Duration and cost',desc:'The slider sets length. The dollar amount shows your estimated API cost live.',steps:['Drag the slider: 10 seconds up to 10 minutes','Use preset buttons — 15s, 30s, 45s, 60s — for quick picks','Dollar amount = your API cost to generate, not what you charge anyone','Platform limits are enforced automatically','Orange warning appears if duration exceeds a platform limit'],tip:'Start with 15 seconds to test the pipeline cheaply before committing to longer videos.'},
    {title:'Generating results',desc:'After clicking Generate the full pipeline runs automatically.',steps:['Click Generate Video ⚡','Click the Result tab on the right panel','Script appears in about 5 seconds','Voiceover generates in about 10 seconds','Video clips take 3 to 5 minutes','Download button appears when the full video is ready'],tip:'Even without RunwayML connected you always get a complete script ready to record manually.'},
  ]},
  {id:'vsl',icon:'💰',label:'VSL Builder',topics:[
    {title:'Building a VSL',desc:'Creates high-converting Video Sales Letter scripts using a proven direct-response framework.',steps:['Click AI Video Engine → VSL Builder tab','Enter your product name and price','Describe your target audience very specifically','Describe the main pain point — be as specific as possible','Describe your solution and what makes it different','Paste your affiliate link if promoting someone else\'s product','Set duration — 30 to 90 seconds recommended','Click Generate VSL Script ⚡'],tip:'"Struggling with dry skin despite spending $100 on creams that wash off" converts far better than "has dry skin". Specificity is everything.'},
  ]},
  {id:'bulk',icon:'⚡',label:'Bulk Generator',topics:[
    {title:'Auto-generate mode',desc:'Type one base topic and Claude creates up to 10 unique angle variations automatically.',steps:['Click Bulk Generator in the sidebar','Select Auto-generate variations mode','Type a base topic — e.g. "morning productivity"','Choose count: 3, 5, 7, or 10 videos','Click ✦ Generate — Claude creates unique variations','Review and edit any topics you want to change','Set persona, duration, video type, and platforms','Choose concurrency: 1 (cheapest), 2 (balanced), 3 (fastest)','Click Generate X Videos ⚡','Switch to Progress tab to watch all videos generate in real time'],tip:'Concurrency 2 is the sweet spot — halves total time without overloading the APIs.'},
    {title:'Bulk cost estimate',desc:'Cost per video is lower in bulk — only 1 scene clip per video.',steps:['Script (Claude): $0.01 per video','Voiceover (ElevenLabs): $0.05 per video','Video clip (RunwayML): $0.25 per video — 1 scene only','Total: approximately $0.31 per video','10 videos = approximately $3.10 total'],tip:'Bulk generates 1 scene clip to keep costs low. You can always regenerate individual videos with more scenes later.'},
  ]},
  {id:'scheduler',icon:'📅',label:'Video Scheduler',topics:[
    {title:'Scheduling a post',desc:'Railway posts your video automatically at the exact scheduled time.',steps:['Click Video Scheduler in the sidebar','Select a completed video from the dropdown','Choose which platforms to post to','Click any optimal time slot to auto-fill the time','Pick the date with the date picker','Click Schedule Post 📅','Post appears in Upcoming tab and fires automatically'],tip:'Railway stellar-achievement must be Online for auto-posting to work. Check railway.app if posts are not firing.'},
    {title:'Peak posting times',desc:'Best engagement windows for each platform.',steps:['TikTok: 7pm daily — Tuesday 8pm is the best single slot','Instagram Reels: 11am daily — Wednesday 11am for highest reach','YouTube Shorts: 3pm daily — Saturday 11am','Facebook: 1pm daily — Wednesday 1pm','Reddit: 8am ET daily — Monday 8am ET for highest weekly traffic'],tip:'These are general guidelines. Check your own platform analytics after a few weeks to find your specific audience peak times.'},
  ]},
  {id:'analytics',icon:'◎',label:'Analytics',topics:[
    {title:'4 analytics tabs',desc:'Pulls live data from Supabase — every video you generate appears here automatically.',steps:['Overview — daily generation chart, status donut, duration and persona breakdowns','Videos — complete list with hook previews, status badges, and download links','Platforms — which platforms you use most with distribution charts','Costs — full API spend breakdown and monthly projection tiers','Click Refresh ↻ anytime to pull the latest data'],tip:'All data persists in Supabase even if Railway restarts. Your complete history is always safe.'},
  ]},
  {id:'email',icon:'📧',label:'Email Notifications',topics:[
    {title:'Setting up email alerts',desc:'ContentForge emails you automatically when important events happen.',steps:['Sign up free at resend.com — 3,000 emails per month included','Click API Keys → Create API Key → copy the key starting with re_','Go to railway.app → stellar-achievement → Variables → Raw Editor','Add RESEND_API_KEY and NOTIFY_EMAIL variables','Railway restarts automatically after saving variables','In ContentForge click Email Notifications → Send test email','Check your inbox — should arrive within 30 seconds'],tip:'You get 3 email types: video complete with hook preview, bulk batch done with stats, and scheduled post published.'},
  ]},
  {id:'mobile',icon:'📱',label:'Using on mobile',topics:[
    {title:'Mobile navigation',desc:'ContentForge is fully optimised for phones with touch-friendly controls.',steps:['Open contentstudiohub.com in Safari or Chrome on your phone','Log in with your password','Tap ☰ top-left to open the navigation menu','Tap any section — the menu closes automatically','Tap outside the menu to close without navigating','All buttons are large enough for finger taps'],tip:'Add to home screen for app-like access: iPhone — Share → Add to Home Screen. Android — ⋮ → Add to Home Screen.'},
    {title:'Generating on mobile',desc:'The full video pipeline works on mobile. Keep your screen on during generation.',steps:['Tap AI Video Engine in the menu','Type your topic in the input field','Scroll down to set duration and platforms','Tap Generate Video ⚡','Tap the Result tab to watch progress — takes 3 to 5 minutes','Check Job History tab for all completed videos'],tip:'Keep your screen on while generating — some mobile browsers pause JavaScript when the screen locks.'},
  ]},
];

const REF={
  '⚡ Quick actions':[
    ['Generate a video','AI Video Engine → type topic → Generate ⚡'],
    ['Generate 10 videos','Bulk Generator → base topic → ✦ Generate → Generate X Videos'],
    ['Schedule a post','Video Scheduler → select video → pick time → Schedule Post 📅'],
    ['Write social posts','AI Composer → topic → select platforms → Generate Posts ⚡'],
    ['Build a VSL','AI Video Engine → VSL Builder tab → fill form → Generate VSL ⚡'],
    ['Check analytics','Analytics → Overview / Videos / Platforms / Costs tabs'],
    ['Set up email alerts','Email Notifications → add Resend key to Railway → test'],
    ['Sign out','Sidebar bottom → Sign out button'],
  ],
  '📱 Platform limits':[
    ['TikTok','Max 10 min · 4GB · 9:16 vertical'],
    ['Instagram Reels','Max 90 sec · 1GB · 9:16 vertical'],
    ['YouTube Shorts','Max 60 sec · 256GB · 9:16 vertical'],
    ['Facebook Reels','Max 90 sec · 4GB · 9:16 vertical'],
    ['Facebook Feed','Max 4 hours · 10GB · any ratio'],
    ['Reddit','Max 15 min · 1GB · any ratio'],
  ],
  '💵 API costs':[
    ['Claude AI script','$0.01 per video'],
    ['ElevenLabs voice','$0.05 per 30 sec'],
    ['RunwayML clips','$0.05 per second of video'],
    ['Cloudflare R2','10GB free per month'],
    ['30-second video total','~$1.56 per video'],
    ['10-video bulk batch','~$3.10 total'],
  ],
  '🔧 Troubleshooting':[
    ['"Failed to fetch"','Railway is down — check stellar-achievement is Online at railway.app'],
    ['"Connection error"','ANTHROPIC_API_KEY missing or wrong — check Railway Variables'],
    ['"ElevenLabs 401"','Remove any prefix text from the ElevenLabs API key in Railway'],
    ['No video clips generated','RUNWAY_API_KEY missing or credits empty — check runwayml.com'],
    ['Password not working','F12 → Application → Local Storage → delete cf_auth_v2 → refresh'],
    ['Netlify not updating','Deploys → Trigger deploy → Clear cache and deploy site'],
    ['Scheduled posts not firing','Railway must stay Online continuously — click Restart if crashed'],
    ['Emails not arriving','Check RESEND_API_KEY and NOTIFY_EMAIL are set in Railway Variables'],
  ],
};

export default function TutorialPage() {
  const [sec,setSec]=useState(0);
  const [top,setTop]=useState(0);
  const [done,setDone]=useState(new Set());
  const [view,setView]=useState('guide');
  const [q,setQ]=useState('');

  const S=D[sec], T=S.topics[top];
  const pct=Math.round(done.size/D.length*100);
  const isFirst=sec===0&&top===0;
  const isLast=sec===D.length-1&&top===S.topics.length-1;

  function goNext(){if(top<S.topics.length-1)setTop(top+1);else if(sec<D.length-1){setSec(sec+1);setTop(0);}}
  function goPrev(){if(top>0)setTop(top-1);else if(sec>0){setSec(sec-1);setTop(D[sec-1].topics.length-1);}}
  function mark(){const n=new Set(done);n.has(sec)?n.delete(sec):n.add(sec);setDone(n);}

  const hits=q.trim()?D.flatMap((s,si)=>s.topics.flatMap((t,ti)=>
    [t.title,t.desc,...t.steps,t.tip].join(' ').toLowerCase().includes(q.toLowerCase())
      ?[{si,ti,icon:s.icon,sec:s.label,top:t.title}]:[])):[];

  const bdr='1px solid rgba(100,200,160,.2)';
  const bg2='rgba(255,255,255,.04)';
  const tc='#e8f4f0';
  const tc2='#9ab8b0';
  const acc='#1D9E75';
  const acc2='#5DCAA5';

  return(
    <div style={{padding:24,maxWidth:1100,fontFamily:'inherit',minHeight:400}}>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:500,color:tc,display:'flex',alignItems:'center',gap:8}}>
            📖 Tutorial
            <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'rgba(29,158,117,.2)',color:acc2}}>Interactive</span>
          </div>
          <div style={{fontSize:13,color:tc2,marginTop:4}}>Complete guide to every ContentForge feature</div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search topics…"
            style={{padding:'7px 11px',border:bdr,borderRadius:8,fontSize:13,fontFamily:'inherit',background:'rgba(255,255,255,.05)',color:tc,outline:'none',width:155}}/>
          {['guide','ref'].map(v=>(
            <button key={v} onClick={()=>{setView(v);setQ('');}}
              style={{padding:'6px 12px',border:bdr,borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'inherit',
                background:view===v&&!q?'rgba(29,158,117,.2)':'transparent',
                color:view===v&&!q?acc2:tc2}}>
              {v==='guide'?'Step-by-step':'Quick ref'}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <div style={{flex:1,height:4,background:'rgba(255,255,255,.08)',borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',width:pct+'%',background:acc,borderRadius:2,transition:'width .4s'}}/>
        </div>
        <span style={{fontSize:11,color:tc2,flexShrink:0}}>{done.size}/{D.length} done</span>
      </div>

      {q.trim()!==''&&(
        <div style={{border:bdr,borderRadius:12,overflow:'hidden',marginBottom:14,background:bg2}}>
          <div style={{padding:'10px 14px',borderBottom:bdr,fontSize:13,fontWeight:500,color:tc}}>
            {hits.length} result{hits.length!==1?'s':''} for "{q}"
          </div>
          {hits.length===0
            ?<div style={{padding:20,textAlign:'center',fontSize:13,color:tc2}}>No results — try different keywords</div>
            :hits.map((h,i)=>(
              <div key={i} onClick={()=>{setSec(h.si);setTop(h.ti);setQ('');setView('guide');}}
                style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:i<hits.length-1?bdr:'none'}}>
                <span style={{fontSize:15}}>{h.icon}</span>
                <div style={{flex:1,fontSize:13,fontWeight:500,color:tc}}>{h.sec} → {h.top}</div>
                <span style={{fontSize:12,color:acc2}}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {!q.trim()&&view==='guide'&&(
        <div style={{display:'grid',gridTemplateColumns:'175px 1fr',gap:14}}>
          <nav style={{display:'flex',flexDirection:'column',gap:2}}>
            {D.map((s,i)=>(
              <button key={s.id} onClick={()=>{setSec(i);setTop(0);}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%',minHeight:42,
                  border:i===sec?'1px solid rgba(29,158,117,.4)':'1px solid transparent',
                  background:i===sec?'rgba(29,158,117,.1)':'transparent'}}>
                <span style={{fontSize:14}}>{s.icon}</span>
                <span style={{fontSize:12,color:tc,flex:1}}>{s.label}</span>
                {done.has(i)&&<span style={{fontSize:11,color:acc}}>✓</span>}
              </button>
            ))}
          </nav>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:bdr,borderRadius:10,background:bg2}}>
              <span style={{fontSize:22}}>{S.icon}</span>
              <span style={{fontSize:15,fontWeight:500,color:tc,flex:1}}>{S.label}</span>
              <button onClick={mark}
                style={{padding:'5px 11px',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit',
                  border:'1px solid rgba(29,158,117,.3)',
                  background:done.has(sec)?'rgba(29,158,117,.2)':'transparent',
                  color:done.has(sec)?acc2:tc2}}>
                {done.has(sec)?'✓ Done':'Mark done'}
              </button>
            </div>

            {S.topics.length>1&&(
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {S.topics.map((t,i)=>(
                  <button key={i} onClick={()=>setTop(i)}
                    style={{padding:'5px 12px',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit',
                      border:`1px solid ${i===top?acc:'rgba(29,158,117,.2)'}`,
                      background:i===top?'rgba(29,158,117,.15)':'transparent',
                      color:i===top?acc2:tc2,fontWeight:i===top?500:400}}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <div style={{padding:'16px 18px',border:bdr,borderRadius:12,background:bg2}}>
              <div style={{fontSize:15,fontWeight:500,color:tc,marginBottom:6}}>{T.title}</div>
              <div style={{fontSize:13,color:tc2,marginBottom:14,lineHeight:1.6}}>{T.desc}</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {T.steps.map((step,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,background:'rgba(29,158,117,.18)',color:acc2}}>{i+1}</div>
                    <div style={{fontSize:13,color:tc,lineHeight:1.6}}>{step}</div>
                  </div>
                ))}
              </div>
              {T.tip&&(
                <div style={{display:'flex',gap:10,background:'rgba(29,158,117,.08)',border:'1px solid rgba(29,158,117,.2)',borderRadius:8,padding:'10px 12px'}}>
                  <span style={{fontSize:15,flexShrink:0}}>💡</span>
                  <div style={{fontSize:13,color:acc2,lineHeight:1.6}}>{T.tip}</div>
                </div>
              )}
            </div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <button onClick={goPrev} disabled={isFirst}
                style={{padding:'7px 14px',borderRadius:8,fontSize:12,cursor:isFirst?'not-allowed':'pointer',fontFamily:'inherit',border:bdr,background:'transparent',color:tc2,opacity:isFirst?.35:1}}>
                ← Previous
              </button>
              <span style={{fontSize:11,color:tc2}}>{sec+1}/{D.length} · topic {top+1}/{S.topics.length}</span>
              <button onClick={goNext} disabled={isLast}
                style={{padding:'7px 18px',borderRadius:8,fontSize:12,fontWeight:500,cursor:isLast?'not-allowed':'pointer',fontFamily:'inherit',border:'none',background:acc,color:'white',opacity:isLast?.35:1}}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {!q.trim()&&view==='ref'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {Object.entries(REF).map(([h,rows])=>(
            <div key={h} style={{border:bdr,borderRadius:12,overflow:'hidden',background:bg2}}>
              <div style={{padding:'11px 15px',borderBottom:bdr,fontSize:13,fontWeight:500,color:tc}}>{h}</div>
              <div style={{padding:'4px 15px'}}>
                {rows.map(([k,v],i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:i<rows.length-1?'1px solid rgba(100,200,160,.1)':'none'}}>
                    <span style={{fontSize:13,fontWeight:500,color:tc,flex:1}}>{k}</span>
                    <span style={{fontSize:12,color:tc2,textAlign:'right',flex:1}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
