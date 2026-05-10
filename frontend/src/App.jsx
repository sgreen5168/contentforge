import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Composer from './pages/Composer.jsx';
import VideoEngine from './pages/VideoEngine.jsx';
import Scheduler from './pages/Scheduler.jsx';
import BulkGenerator from './pages/BulkGenerator.jsx';
import EmailSettings from './pages/EmailSettings.jsx';
import Analytics from './pages/Analytics.jsx';
import { Brand, Compliance } from './pages/OtherPages.jsx';
import RedditSettings from './pages/RedditSettings.jsx';
import styles from './App.module.css';

// ── Inline Tutorial — no separate file needed ─────────────────────────────────
const TUTORIAL_DATA = [
  { id:'start', icon:'🚀', label:'Getting started', topics:[
    { title:'Logging in', desc:'ContentForge is password protected.',
      steps:['Go to contentstudiohub.com','Type: ContentForge2026','Press Enter or tap Sign in','You stay logged in until you sign out'],
      tip:'On mobile tap ☰ top-left to open the navigation menu.' },
    { title:'Navigation', desc:'9 sections in the sidebar. On mobile it slides in.',
      steps:['Desktop: sidebar always visible on the left','Mobile: tap ☰ to open','Tap any section to navigate','Tap outside to close the menu'],
      tip:'Add to home screen: Share → Add to Home Screen on iPhone.' },
  ]},
  { id:'composer', icon:'✦', label:'AI Composer', topics:[
    { title:'Writing social posts', desc:'Claude writes a unique post for each platform.',
      steps:['Click AI Composer','Type your topic','Select platforms','Choose tone','Click Generate Posts ⚡','Click Copy to use the post'],
      tip:'Instagram gets hashtags. Reddit gets conversational tone. Facebook gets longer format.' },
  ]},
  { id:'video', icon:'▶', label:'AI Video Engine', topics:[
    { title:'3 input modes', desc:'Topic, URL, or affiliate link.',
      steps:['TOPIC — type any subject: "morning productivity"','URL — paste a product page, Claude reads it','AFFILIATE — paste tracking link, Claude adds it to CTA'],
      tip:'Affiliate mode auto-adds your link to every call-to-action.' },
    { title:'Smart Mode', desc:'Claude picks the best format automatically.',
      steps:['Smart Mode ON (default) — Claude picks the format','Smart Mode OFF — choose from 7 types manually','Toggle at the top of the left panel'],
      tip:'Keep Smart Mode ON when starting out.' },
    { title:'7 video types', desc:'Each has a different script structure.',
      steps:['UGC Persona — authentic first-person review','AI VSL — Hook → Problem → Solution → CTA','Hybrid VSL — avatar + B-roll footage','Reel Ads — short punchy vertical ads','Product Ads — direct-response e-commerce','Commercial — cinematic brand story','Competitor Replicator — original content in competitor structure'],
      tip:'UGC Persona works best for affiliate. VSL works best for high-ticket products.' },
    { title:'Duration and cost', desc:'Drag slider to set length. Cost updates live.',
      steps:['Drag slider: 10 seconds to 10 minutes','Preset buttons: 15s, 30s, 45s, 60s','Dollar amount = your API cost to generate','Platform limits enforced automatically','Orange warning if duration exceeds a platform limit'],
      tip:'Start with 15s to test cheaply before longer videos.' },
    { title:'Generating results', desc:'Click Generate then watch the pipeline run.',
      steps:['Click Generate Video ⚡','Click the Result tab','Script in ~5 seconds','Voiceover in ~10 seconds','Video clips in 3–5 minutes','Download button when ready'],
      tip:'You always get a full script even without RunwayML connected.' },
  ]},
  { id:'vsl', icon:'💰', label:'VSL Builder', topics:[
    { title:'Building a VSL', desc:'High-converting Video Sales Letter scripts.',
      steps:['AI Video Engine → VSL Builder tab','Enter product name and price','Describe target audience specifically','Describe the pain point — be specific','Describe your solution','Paste affiliate link (optional)','Set duration 30–90s','Click Generate VSL Script ⚡'],
      tip:'Specificity converts — "struggling with dry skin despite $100 creams" beats "has dry skin".' },
  ]},
  { id:'bulk', icon:'⚡', label:'Bulk Generator', topics:[
    { title:'Auto-generate mode', desc:'One topic becomes up to 10 unique variations.',
      steps:['Click Bulk Generator','Select Auto-generate variations','Type a base topic','Choose count: 3, 5, 7, or 10','Click ✦ Generate','Review and edit topics','Set persona, duration, platforms, concurrency','Click Generate X Videos ⚡','Watch progress in the Progress tab'],
      tip:'Concurrency 2 halves total time without overloading APIs.' },
  ]},
  { id:'scheduler', icon:'📅', label:'Video Scheduler', topics:[
    { title:'Scheduling a post', desc:'Railway posts your video automatically at the exact time.',
      steps:['Click Video Scheduler','Select a completed video','Choose platforms','Click an optimal time slot','Pick the date','Click Schedule Post 📅','Fires automatically at scheduled time'],
      tip:'Railway stellar-achievement must be Online for auto-posting.' },
    { title:'Peak times', desc:'Best engagement windows per platform.',
      steps:['TikTok: 7pm — Tuesday 8pm is best','Instagram: 11am — Wednesday 11am','YouTube: 3pm — Saturday 11am','Facebook: 1pm — Wednesday 1pm','Reddit: 8am ET — Monday 8am ET'],
      tip:'Check your own analytics after a few weeks for your audience peak times.' },
  ]},
  { id:'analytics', icon:'◎', label:'Analytics', topics:[
    { title:'4 analytics tabs', desc:'Live data — every video appears here automatically.',
      steps:['Overview — daily chart, status donut, breakdowns','Videos — full list with hook previews and downloads','Platforms — usage charts and timing reference','Costs — API spend and monthly projections','Click Refresh ↻ to pull latest data'],
      tip:'Data persists in Supabase even if Railway restarts.' },
  ]},
  { id:'email', icon:'📧', label:'Email Notifications', topics:[
    { title:'Setting up alerts', desc:'Emails when videos finish, batches complete, posts publish.',
      steps:['Sign up free at resend.com','Create API Key → copy the re_ key','Railway → stellar-achievement → Variables → add RESEND_API_KEY and NOTIFY_EMAIL','Email Notifications → Send test email'],
      tip:'3 types: video complete, bulk done, scheduled post published.' },
  ]},
  { id:'mobile', icon:'📱', label:'Using on mobile', topics:[
    { title:'Mobile navigation', desc:'Fully optimised for phones.',
      steps:['Open contentstudiohub.com','Log in','Tap ☰ to open menu','Tap section — menu closes automatically','All buttons sized for finger taps'],
      tip:'Add to home screen for app-like access.' },
    { title:'Generating on mobile', desc:'Full pipeline works on mobile.',
      steps:['Tap AI Video Engine','Type topic','Set duration and platforms','Tap Generate Video ⚡','Watch Result tab — 3–5 minutes','Check Job History for completed videos'],
      tip:'Keep screen on — some browsers pause when locked.' },
  ]},
  { id:'brandvoice', icon:'◈', label:'Brand Voice Memory', topics:[
    { title:'What is Brand Voice Memory', desc:'Brand Voice Memory teaches Claude your unique writing style so every post and script sounds like you — not like a generic AI.',
      steps:[
        'Without Brand Voice: Claude writes in its default style — clear and professional but generic',
        'With Brand Voice: Claude learns your tone, vocabulary, sentence length, personality, and content style',
        'The more examples you give it the more accurately it replicates your voice',
        'Brand Voice applies automatically to every post generated in the AI Composer',
        'It also influences script writing in the Video Engine when persona matches your style',
      ],
      tip:'Think of Brand Voice Memory as training Claude to be your personal ghostwriter who understands exactly how you communicate.' },
    { title:'Setting up your Brand Voice', desc:'Train Claude on your style by providing examples of your best-performing content.',
      steps:[
        'Click Brand Voice in the sidebar',
        'Paste 3 to 5 examples of your own posts or captions in the input field — these are your style samples',
        'Include a mix: a story post, a tips post, a promotional post, and a casual update',
        'Write a short description of your tone — e.g. "casual and direct, uses short sentences, occasionally funny, never corporate"',
        'Describe your audience — e.g. "entrepreneurs aged 25-40 interested in passive income"',
        'Click Save Brand Voice — Claude now uses these samples as reference for every generation',
      ],
      tip:'Use your top-performing posts as examples — if they resonated with your audience they represent your best voice.' },
    { title:'What Brand Voice controls', desc:'Brand Voice Memory influences multiple aspects of how Claude writes for you.',
      steps:[
        'TONE: formal vs casual, serious vs playful, authoritative vs conversational',
        'VOCABULARY: the specific words and phrases you naturally use vs avoid',
        'SENTENCE LENGTH: short punchy sentences vs longer detailed explanations',
        'CONTENT STRUCTURE: whether you lead with questions, stories, stats, or statements',
        'EMOJI USAGE: whether you use them, how many, and which ones fit your brand',
        'HASHTAG STYLE: broad popular tags vs niche specific tags vs no hashtags at all',
        'CALL TO ACTION: your specific CTA phrasing vs generic "click the link" language',
      ],
      tip:'Even small details matter. If you never use exclamation marks tell Claude that. If you always start posts with a question include examples that show this pattern.' },
    { title:'Brand Voice for video scripts', desc:'Your brand voice also shapes the scripts Claude writes for your videos.',
      steps:[
        'In the AI Video Engine your Brand Voice influences the hook style and opening line',
        'The persona you select (UGC, Educator, Influencer etc.) blends with your brand voice',
        'A UGC persona with a casual brand voice produces authentic-feeling ad scripts',
        'An Educator persona with an authoritative brand voice produces expert tip videos',
        'You can override brand voice for any individual video using the script editor before approving',
        'After generating — edit the script directly in the Review & Edit panel before clicking Approve',
      ],
      tip:'The script review step lets you apply your brand voice manually if the AI version is not quite right. Edit any line before approving and sending to video generation.' },
    { title:'Improving your Brand Voice over time', desc:'Brand Voice Memory gets better as you refine it with more examples and feedback.',
      steps:[
        'After generating posts — note which ones sound most like you and which do not',
        'Go back to Brand Voice and add examples of the posts that sounded best',
        'Remove examples that led to off-brand results',
        'Update your tone description to be more specific over time',
        'Add examples of content you would NEVER post to teach Claude what to avoid',
        'Re-generate the same topic after updating Brand Voice and compare the two versions',
      ],
      tip:'Brand Voice is not set-and-forget. Update it monthly with your newest best-performing content to keep it current with how your style evolves.' },
  ]},
  { id:'publishing', icon:'📤', label:'Publishing workflow', topics:[
    { title:'How content gets posted', desc:'ContentForge uses a 5-stage workflow to take your content from idea to published post on every platform.',
      steps:[
        'STAGE 1 — Input: you provide a topic, URL, or affiliate link in the AI Composer or Video Engine',
        'STAGE 2 — Generation: Claude AI writes the script or post, ElevenLabs records the voiceover, fal.ai generates the video clips',
        'STAGE 3 — Assembly: the backend stitches audio and video together and uploads the finished file to Cloudflare R2 for permanent storage',
        'STAGE 4 — Scheduling: you choose to post immediately or schedule for a peak engagement time using the Video Scheduler',
        'STAGE 5 — Publishing: Railway automatically calls each platform API at the scheduled time and posts your content',
      ],
      tip:'Every completed video gets a permanent Cloudflare R2 URL. Even if Railway restarts your videos are never lost.' },
    { title:'Posting social media text posts', desc:'The AI Composer sends finished posts directly to your connected social accounts.',
      steps:[
        'Click AI Composer in the sidebar',
        'Type your topic and select your platforms — Facebook, Instagram, Reddit',
        'Click Generate Posts ⚡ — Claude writes a unique version for each platform',
        'Review the posts — each shows character count and compliance status',
        'Click Copy under any post to copy it to your clipboard',
        'Open the platform app on your phone and paste — or use Auto-upload if credentials are connected',
        'For scheduled posting: go to Video Scheduler, select the post, pick a time, click Schedule Post',
      ],
      tip:'Instagram posts include hashtags automatically. Reddit posts are written in a community-authentic tone. Facebook posts are longer and more conversational.' },
    { title:'Posting videos to social media', desc:'The Video Engine generates and publishes videos through a fully automated pipeline.',
      steps:[
        'STEP 1 — Generate: AI Video Engine creates script, voiceover, and video clips (3–5 minutes total)',
        'STEP 2 — Storage: finished video uploads automatically to Cloudflare R2 and you get a permanent download URL',
        'STEP 3 — Manual post: click Download Video and upload directly to TikTok, Instagram, YouTube, Facebook, or Reddit',
        'STEP 4 — Auto-post: toggle Auto-upload ON before generating — Railway posts directly to connected platforms using their APIs',
        'STEP 5 — Scheduled post: go to Video Scheduler, select the completed video, choose platforms, pick an optimal time, click Schedule Post 📅',
      ],
      tip:'Auto-upload requires platform API tokens added to Railway Variables. Without them you get the video file to post manually — which works perfectly.' },
    { title:'Scheduling for peak times', desc:'The Video Scheduler posts your content automatically at the exact time you choose.',
      steps:[
        'Go to Video Scheduler in the sidebar',
        'Select a completed video from the dropdown — only completed jobs appear here',
        'Choose which platforms to post to — you can select multiple',
        'Click any Optimal time suggestion to auto-fill the best posting time for that platform',
        'Or set a custom date and time using the date and time pickers',
        'Review the preview showing exactly when and where it will post',
        'Click Schedule Post 📅 — the post appears in the Upcoming tab',
        'At the exact scheduled time Railway fires the API call and publishes automatically',
        'You receive an email confirmation when the post goes live (if email notifications are set up)',
      ],
      tip:'Railway stellar-achievement must stay Online for scheduled posts to fire. If it restarts it picks up pending schedules automatically within 1 minute.' },
    { title:'Platform-by-platform publishing guide', desc:'Each platform has different requirements and optimal strategies.',
      steps:[
        'TIKTOK: max 10 minutes, 9:16 vertical format, post at 7pm for best reach — add TIKTOK_ACCESS_TOKEN to Railway for auto-posting',
        'INSTAGRAM REELS: max 90 seconds, 9:16 vertical, post at 11am Wednesday for highest reach — add INSTAGRAM_ACCESS_TOKEN to Railway',
        'YOUTUBE SHORTS: max 60 seconds, 9:16 vertical, post at 3pm Saturday — add YOUTUBE_ACCESS_TOKEN to Railway',
        'FACEBOOK REELS: max 90 seconds, 9:16 vertical, post at 1pm Wednesday — add FACEBOOK_ACCESS_TOKEN to Railway',
        'FACEBOOK FEED: max 4 hours, any ratio, post at 9am Thursday — uses same FACEBOOK_ACCESS_TOKEN',
        'REDDIT: max 15 minutes, any ratio, post at 8am ET Monday — add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to Railway',
      ],
      tip:'You do not need all platform tokens to use ContentForge. Without a token the system generates the video and you post it manually. Add tokens one platform at a time.' },
    { title:'Connecting platform accounts', desc:'Add API tokens to Railway to enable automatic posting to each platform.',
      steps:[
        'Go to railway.app → stellar-achievement → Variables → Raw Editor',
        'Add your platform tokens one per line in the format: VARIABLE_NAME=your_token_value',
        'TIKTOK_ACCESS_TOKEN — get from developers.tiktok.com → your app → Access Token',
        'INSTAGRAM_ACCESS_TOKEN — get from developers.facebook.com → your Instagram Basic Display app',
        'FACEBOOK_ACCESS_TOKEN — get from developers.facebook.com → your app → User Access Token',
        'YOUTUBE_ACCESS_TOKEN — get from console.cloud.google.com → OAuth 2.0 credentials',
        'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET — get from reddit.com/prefs/apps → create script app',
        'Click Save — Railway restarts and the new tokens are live within 30 seconds',
      ],
      tip:'Facebook and Instagram use the same developer app. Create one app at developers.facebook.com and you get tokens for both platforms at once.' },
  ]},
];

const QUICK_REF = {
  '⚡ Quick actions': [
    ['Generate a video','AI Video Engine → topic → Generate ⚡'],
    ['Generate 10 videos','Bulk Generator → base topic → Generate X Videos'],
    ['Schedule a post','Video Scheduler → video → time → Schedule Post 📅'],
    ['Write social posts','AI Composer → topic → platforms → Generate Posts ⚡'],
    ['Build a VSL','AI Video Engine → VSL Builder → Generate VSL ⚡'],
    ['Post immediately','Generate → Download → upload to platform app manually'],
    ['Auto-post video','Enable Auto-upload toggle → Generate → Railway posts automatically'],
    ['Check analytics','Analytics → Overview / Videos / Platforms / Costs'],
    ['Set up emails','Email Notifications → Resend key → test'],
    ['Connect a platform','Railway → stellar-achievement → Variables → add platform token'],
    ['Sign out','Sidebar bottom → Sign out'],
  ],
  '📤 Publishing tokens': [
    ['TikTok','TIKTOK_ACCESS_TOKEN — developers.tiktok.com'],
    ['Instagram','INSTAGRAM_ACCESS_TOKEN — developers.facebook.com'],
    ['Facebook','FACEBOOK_ACCESS_TOKEN — developers.facebook.com'],
    ['YouTube','YOUTUBE_ACCESS_TOKEN — console.cloud.google.com'],
    ['Reddit','REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET — reddit.com/prefs/apps'],
  ],
  '📱 Platform limits': [
    ['TikTok','10 min · 4GB · 9:16'],
    ['Instagram Reels','90 sec · 1GB · 9:16'],
    ['YouTube Shorts','60 sec · 256GB · 9:16'],
    ['Facebook Reels','90 sec · 4GB · 9:16'],
    ['Facebook Feed','4 hours · 10GB · any'],
    ['Reddit','15 min · 1GB · any'],
  ],
  '💵 API costs': [
    ['Claude script','$0.01/video'],
    ['ElevenLabs voice','$0.05/30sec'],
    ['RunwayML clips','$0.05/second'],
    ['30-sec video','~$1.56 total'],
    ['10-video bulk','~$3.10 total'],
  ],
  '🔧 Troubleshooting': [
    ['"Failed to fetch"','Check stellar-achievement is Online at railway.app'],
    ['"Connection error"','ANTHROPIC_API_KEY missing in Railway Variables'],
    ['"ElevenLabs 401"','Remove prefix text from ElevenLabs key in Railway'],
    ['No video clips','RUNWAY_API_KEY missing or credits empty'],
    ['Password not working','F12 → Application → Local Storage → delete cf_auth_v2'],
    ['Netlify not updating','Deploys → Clear cache and deploy site'],
  ],
};

function TutorialPage() {
  const [sec, setSec] = useState(0);
  const [top, setTop] = useState(0);
  const [done, setDone] = useState(new Set());
  const [view, setView] = useState('guide');
  const [q, setQ] = useState('');

  const S = TUTORIAL_DATA[sec];
  const T = S.topics[top];
  const pct = Math.round(done.size / TUTORIAL_DATA.length * 100);
  const isFirst = sec === 0 && top === 0;
  const isLast = sec === TUTORIAL_DATA.length - 1 && top === S.topics.length - 1;

  function goNext() { if (top < S.topics.length-1) setTop(top+1); else if (sec < TUTORIAL_DATA.length-1) { setSec(sec+1); setTop(0); } }
  function goPrev() { if (top > 0) setTop(top-1); else if (sec > 0) { setSec(sec-1); setTop(TUTORIAL_DATA[sec-1].topics.length-1); } }
  function mark() { const n = new Set(done); n.has(sec) ? n.delete(sec) : n.add(sec); setDone(n); }

  const hits = q.trim() ? TUTORIAL_DATA.flatMap((s,si) => s.topics.flatMap((t,ti) =>
    [t.title,t.desc,...t.steps,t.tip].join(' ').toLowerCase().includes(q.toLowerCase())
      ? [{si,ti,icon:s.icon,sec:s.label,top:t.title}] : [])) : [];

  return (
    <div style={{ padding:24, maxWidth:1100, fontFamily:'inherit' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:8 }}>
            📖 Tutorial
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>Interactive</span>
          </div>
          <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Complete guide to every ContentForge feature</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            style={{ padding:'7px 11px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'rgba(255,255,255,.05)', color:'#E8F4F0', outline:'none', width:150 }} />
          {['guide','ref'].map(v => (
            <button key={v} onClick={() => { setView(v); setQ(''); }}
              style={{ padding:'6px 12px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                background: view===v&&!q ? 'rgba(29,158,117,.2)' : 'transparent',
                color: view===v&&!q ? '#5DCAA5' : '#7BAAA0' }}>
              {v === 'guide' ? 'Step-by-step' : 'Quick ref'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ flex:1, height:4, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:'#1D9E75', borderRadius:2, transition:'width .4s' }} />
        </div>
        <span style={{ fontSize:11, color:'#7BAAA0', flexShrink:0 }}>{done.size}/{TUTORIAL_DATA.length} done</span>
      </div>

      {q.trim() !== '' && (
        <div style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14, background:'rgba(255,255,255,.04)' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>
            {hits.length} result{hits.length!==1?'s':''} for "{q}"
          </div>
          {hits.length === 0
            ? <div style={{ padding:20, textAlign:'center', color:'#7BAAA0', fontSize:13 }}>No results found</div>
            : hits.map((h,i) => (
              <div key={i} onClick={() => { setSec(h.si); setTop(h.ti); setQ(''); setView('guide'); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom: i<hits.length-1 ? '1px solid rgba(29,158,117,.1)' : 'none' }}>
                <span>{h.icon}</span>
                <div style={{ flex:1, fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{h.sec} → {h.top}</div>
                <span style={{ fontSize:12, color:'#5DCAA5' }}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {!q.trim() && view === 'guide' && (
        <div style={{ display:'grid', gridTemplateColumns:'175px 1fr', gap:14 }}>
          <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {TUTORIAL_DATA.map((s,i) => (
              <button key={s.id} onClick={() => { setSec(i); setTop(0); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', minHeight:42,
                  border: i===sec ? '1px solid rgba(29,158,117,.4)' : '1px solid transparent',
                  background: i===sec ? 'rgba(29,158,117,.1)' : 'transparent' }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'#E8F4F0', flex:1 }}>{s.label}</span>
                {done.has(i) && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
              </button>
            ))}
          </nav>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'1px solid rgba(29,158,117,.2)', borderRadius:10, background:'rgba(255,255,255,.04)' }}>
              <span style={{ fontSize:22 }}>{S.icon}</span>
              <span style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', flex:1 }}>{S.label}</span>
              <button onClick={mark}
                style={{ padding:'5px 11px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                  border:'1px solid rgba(29,158,117,.3)',
                  background: done.has(sec) ? 'rgba(29,158,117,.2)' : 'transparent',
                  color: done.has(sec) ? '#5DCAA5' : '#7BAAA0' }}>
                {done.has(sec) ? '✓ Done' : 'Mark done'}
              </button>
            </div>

            {S.topics.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {S.topics.map((t,i) => (
                  <button key={i} onClick={() => setTop(i)}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                      border: `1px solid ${i===top ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: i===top ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: i===top ? '#5DCAA5' : '#7BAAA0', fontWeight: i===top ? 500 : 400 }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding:'16px 18px', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, background:'rgba(255,255,255,.04)' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>{T.title}</div>
              <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:14, lineHeight:1.6 }}>{T.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {T.steps.map((step,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:'rgba(29,158,117,.18)', color:'#5DCAA5' }}>{i+1}</div>
                    <div style={{ fontSize:13, color:'#E8F4F0', lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>
              {T.tip && (
                <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'10px 12px' }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>💡</span>
                  <div style={{ fontSize:13, color:'#5DCAA5', lineHeight:1.6 }}>{T.tip}</div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={goPrev} disabled={isFirst}
                style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor:isFirst?'not-allowed':'pointer', fontFamily:'inherit', border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', opacity:isFirst?.35:1 }}>
                ← Previous
              </button>
              <span style={{ fontSize:11, color:'#7BAAA0' }}>{sec+1}/{TUTORIAL_DATA.length} · {top+1}/{S.topics.length}</span>
              <button onClick={goNext} disabled={isLast}
                style={{ padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor:isLast?'not-allowed':'pointer', fontFamily:'inherit', border:'none', background:'#1D9E75', color:'white', opacity:isLast?.35:1 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {!q.trim() && view === 'ref' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.entries(QUICK_REF).map(([h, rows]) => (
            <div key={h} style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,.04)' }}>
              <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{h}</div>
              <div style={{ padding:'4px 15px' }}>
                {rows.map(([k,v],i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:i<rows.length-1?'1px solid rgba(29,158,117,.08)':'none' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', flex:1 }}>{k}</span>
                    <span style={{ fontSize:12, color:'#7BAAA0', textAlign:'right', flex:1 }}>{v}</span>
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

// ── Auth ───────────────────────────────────────────────────────────────────────
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'ContentForge2026';
function checkAuth() {
  try { return localStorage.getItem('cf_auth_v2') === 'true'; }
  catch { return false; }
}

const PAGE_LABELS = {
  composer:'AI Composer', video:'AI Video Engine', scheduler:'Video Scheduler',
  bulk:'Bulk Generator', email:'Email Notifications', analytics:'Analytics',
  tutorial:'Tutorial',
  reddit:'Reddit Integration', brand:'Brand Voice', compliance:'Compliance',
};

export default function App() {
  const [authed, setAuthed]       = useState(checkAuth);
  const [page, setPage]           = useState('composer');
  const [platforms, setPlatforms] = useState({ facebook:true, instagram:true, reddit:true });
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    const onFocus = () => setAuthed(checkAuth());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function navigateTo(p) { setPage(p); setSidebar(false); }
  function handleLogout() {
    localStorage.removeItem('cf_auth_v2');
    localStorage.removeItem('cf_auth');
    setAuthed(false);
  }

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <div className={styles.app}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebar(false)} />}
      <Sidebar page={page} setPage={navigateTo} platforms={platforms} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebar(false)} />
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebar(true)} aria-label="Open menu">☰</button>
          <div className={styles.topbarTitle}>{PAGE_LABELS[page]}</div>
          <div className={styles.topbarRight}>
            <div className={styles.statusPill}><span className={styles.dot} /> Claude Live</div>
            {['video','scheduler','bulk'].includes(page) && <div className={styles.videoBadge}>▶ Video Engine</div>}
            <button onClick={handleLogout} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'transparent', color:'#888', cursor:'pointer', fontFamily:'inherit' }}>Sign out</button>
          </div>
        </header>
        <main>
          {page === 'composer'   && <Composer onPlatformsChange={setPlatforms} />}
          {page === 'video'      && <VideoEngine />}
          {page === 'scheduler'  && <Scheduler />}
          {page === 'bulk'       && <BulkGenerator />}
          {page === 'email'      && <EmailSettings />}
          {page === 'analytics'  && <Analytics />}
          {page === 'tutorial'   && <TutorialPage />}
          {page === 'reddit'     && <RedditSettings />}
          {page === 'brand'      && <Brand />}
          {page === 'compliance' && <Compliance />}
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setTimeout(() => {
      if (password.trim() === CORRECT_PASSWORD.trim()) {
        localStorage.setItem('cf_auth_v2', 'true');
        onLogin();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D2137', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#102D4F', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:380, textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⚡</div>
        </div>
        <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>ContentForge</div>
        <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:24 }}>Social AI Engine — Private Access</div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10, textAlign:'left' }}>
          <label style={{ fontSize:11, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Password</label>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password" autoFocus autoComplete="off" data-form-type="other"
            style={{ width:'100%', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:8, padding:'11px 13px', fontSize:15, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', boxSizing:'border-box' }} />
          {error && <div style={{ fontSize:12, color:'#F09595', background:'rgba(226,75,74,.1)', border:'0.5px solid rgba(226,75,74,.3)', borderRadius:6, padding:'8px 10px' }}>{error}</div>}
          <button type="submit" disabled={loading || !password.trim()}
            style={{ background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:12, fontSize:15, fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginTop:4, opacity: loading||!password.trim() ? 0.5 : 1 }}>
            {loading ? '⏳ Checking…' : 'Sign in →'}
          </button>
        </form>
        <div style={{ fontSize:11, color:'#4A7A72', marginTop:20 }}>Private — not publicly accessible</div>
      </div>
    </div>
  );
}
