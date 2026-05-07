import React, { useState } from 'react';

const DATA = [
  { id:'start', icon:'🚀', label:'Getting started', topics:[
    { title:'Logging in', desc:'ContentForge is password protected.',
      steps:['Go to contentstudiohub.com','Type: ContentForge2026','Press Enter or tap Sign in','You stay logged in until you sign out'],
      tip:'On mobile tap ☰ top-left to open the navigation menu.' },
    { title:'Navigation', desc:'9 sections in the sidebar.',
      steps:['Desktop: sidebar always visible','Mobile: tap ☰ to open','Tap any section to navigate','Tap outside to close the menu'],
      tip:'Add to home screen: Share then Add to Home Screen on iPhone.' },
  ]},
  { id:'composer', icon:'✦', label:'AI Composer', topics:[
    { title:'Writing social posts', desc:'Claude writes unique posts for each platform.',
      steps:['Click AI Composer','Type your topic','Select platforms','Choose tone','Click Generate Posts ⚡','Click Copy to use the post'],
      tip:'Instagram gets hashtags. Reddit gets conversational tone. Facebook gets longer format.' },
  ]},
  { id:'video', icon:'▶', label:'AI Video Engine', topics:[
    { title:'3 input modes', desc:'Topic, URL, or affiliate link.',
      steps:['TOPIC — type any subject e.g. morning productivity','URL — paste a product page Claude reads it','AFFILIATE — paste tracking link Claude adds it to CTA'],
      tip:'Affiliate mode auto-adds your tracking link to every call-to-action.' },
    { title:'Smart Mode', desc:'Claude picks the best format automatically.',
      steps:['Smart Mode ON default — Claude picks the format','Smart Mode OFF — you choose from 7 types','Toggle is at the top of the left panel'],
      tip:'Keep Smart Mode ON when starting out.' },
    { title:'7 video types', desc:'Each has a different script structure.',
      steps:['UGC Persona — authentic first-person review','AI VSL — Hook Problem Solution CTA','Hybrid VSL — avatar plus B-roll','Reel Ads — short punchy vertical ads','Product Ads — direct-response e-commerce','Commercial — cinematic brand story','Competitor Replicator — original content in competitor structure'],
      tip:'UGC Persona works best for affiliate. VSL works best for high-ticket products.' },
    { title:'Duration and cost', desc:'Drag slider to set length. Cost updates live.',
      steps:['Drag slider 10 seconds to 10 minutes','Preset buttons 15s 30s 45s 60s','Dollar amount equals your API cost not what you charge','Platform limits enforced automatically','Orange warning if duration exceeds platform limit'],
      tip:'Start with 15s to test cheaply before committing to longer videos.' },
    { title:'Generating results', desc:'Click Generate then watch the pipeline run.',
      steps:['Click Generate Video ⚡','Click the Result tab on the right','Script appears in about 5 seconds','Voiceover generates in about 10 seconds','Video clips take 3 to 5 minutes','Download button appears when ready'],
      tip:'You always get a full script even without RunwayML connected.' },
  ]},
  { id:'vsl', icon:'💰', label:'VSL Builder', topics:[
    { title:'Building a VSL', desc:'High-converting Video Sales Letter scripts.',
      steps:['AI Video Engine then VSL Builder tab','Enter product name and price','Describe target audience specifically','Describe the main pain point be very specific','Describe your solution','Paste affiliate link optional','Set duration 30 to 90 seconds','Click Generate VSL Script ⚡'],
      tip:'Specificity converts — struggling with dry skin despite 100 dollar creams beats just has dry skin.' },
  ]},
  { id:'bulk', icon:'⚡', label:'Bulk Generator', topics:[
    { title:'Auto-generate 10 videos', desc:'One topic becomes 10 unique variations.',
      steps:['Click Bulk Generator','Select Auto-generate variations','Type a base topic','Choose count 3 5 7 or 10','Click Generate','Review and edit topics','Set persona duration platforms concurrency','Click Generate X Videos ⚡','Watch all progress in the Progress tab'],
      tip:'Concurrency 2 halves total time without overloading APIs.' },
  ]},
  { id:'scheduler', icon:'📅', label:'Video Scheduler', topics:[
    { title:'Scheduling a post', desc:'Railway posts automatically at the exact time.',
      steps:['Click Video Scheduler','Select a completed video from dropdown','Choose platforms','Click an optimal time slot to auto-fill','Pick the date','Click Schedule Post 📅','Post fires automatically at scheduled time'],
      tip:'Railway stellar-achievement must stay Online for auto-posting to work.' },
    { title:'Peak posting times', desc:'Best engagement windows per platform.',
      steps:['TikTok 7pm daily — Tuesday 8pm is best single slot','Instagram 11am daily — Wednesday 11am for highest reach','YouTube Shorts 3pm — Saturday 11am','Facebook 1pm daily — Wednesday 1pm','Reddit 8am ET — Monday 8am ET for highest weekly traffic'],
      tip:'Check your own platform analytics after a few weeks for your specific audience peak times.' },
  ]},
  { id:'analytics', icon:'◎', label:'Analytics', topics:[
    { title:'4 analytics tabs', desc:'Live data from Supabase — every video appears automatically.',
      steps:['Overview — daily chart status donut breakdowns','Videos — full list with hook previews and download links','Platforms — usage charts and optimal time reference','Costs — API spend breakdown and monthly projections','Click Refresh to pull latest data'],
      tip:'All data persists in Supabase even if Railway restarts.' },
  ]},
  { id:'email', icon:'📧', label:'Email Notifications', topics:[
    { title:'Setting up email alerts', desc:'Automated emails when videos finish generating.',
      steps:['Sign up free at resend.com 3000 emails per month','Create API Key copy the re_ key','Railway Variables add RESEND_API_KEY and NOTIFY_EMAIL','Email Notifications page then Send test email'],
      tip:'3 types: video complete, bulk done, scheduled post published.' },
  ]},
  { id:'mobile', icon:'📱', label:'Using on mobile', topics:[
    { title:'Mobile navigation', desc:'Full phone optimisation with touch-friendly controls.',
      steps:['Open contentstudiohub.com in your browser','Log in with password','Tap hamburger top-left to open menu','Tap any section to navigate — menu closes automatically','All buttons sized for finger taps'],
      tip:'Add to home screen for app-like access without the browser bar.' },
    { title:'Generating on mobile', desc:'Full pipeline works on mobile. Keep screen on.',
      steps:['Tap AI Video Engine','Type your topic','Set duration and platforms','Tap Generate Video ⚡','Tap Result tab to watch progress — 3 to 5 minutes','Check Job History for completed videos'],
      tip:'Keep screen on while generating — some browsers pause JavaScript when locked.' },
  ]},
];

const REFDATA = {
  'Quick actions': [
    ['Generate a video','AI Video Engine → topic → Generate ⚡'],
    ['Generate 10 videos','Bulk Generator → base topic → Generate X Videos'],
    ['Schedule a post','Video Scheduler → video → time → Schedule Post'],
    ['Write social posts','AI Composer → topic → platforms → Generate Posts'],
    ['Build a VSL','AI Video Engine → VSL Builder → Generate VSL'],
    ['View analytics','Analytics → Overview / Videos / Platforms / Costs'],
    ['Set up emails','Email Notifications → Resend key → test email'],
    ['Sign out','Sidebar bottom → Sign out button'],
  ],
  'Platform limits': [
    ['TikTok','10 min max · 4GB · 9:16 vertical'],
    ['Instagram Reels','90 sec max · 1GB · 9:16 vertical'],
    ['YouTube Shorts','60 sec max · 256GB · 9:16 vertical'],
    ['Facebook Reels','90 sec max · 4GB · 9:16 vertical'],
    ['Facebook Feed','4 hours max · 10GB · any ratio'],
    ['Reddit','15 min max · 1GB · any ratio'],
  ],
  'API costs': [
    ['Claude AI script','$0.01 per video'],
    ['ElevenLabs voice','$0.05 per 30 sec'],
    ['RunwayML clips','$0.05 per second'],
    ['Cloudflare R2','10GB free per month'],
    ['30-sec video total','~$1.56'],
    ['10-video bulk batch','~$3.10'],
  ],
  'Troubleshooting': [
    ['Failed to fetch','Railway is down — check stellar-achievement is Online at railway.app'],
    ['Connection error','ANTHROPIC_API_KEY missing — check Railway Variables'],
    ['ElevenLabs 401','Remove any prefix text from the ElevenLabs API key'],
    ['No video clips','RUNWAY_API_KEY missing or credits empty at runwayml.com'],
    ['Password not working','F12 → Application → Local Storage → delete cf_auth_v2 → refresh'],
    ['Netlify not updating','Deploys → Trigger deploy → Deploy site after GitHub commits'],
    ['Scheduled posts not firing','Railway must stay Online — click Restart if it crashed'],
    ['Emails not arriving','Check RESEND_API_KEY and NOTIFY_EMAIL in Railway Variables'],
  ],
};

export default function TutorialPage() {
  const [sec, setSec]   = useState(0);
  const [top, setTop]   = useState(0);
  const [done, setDone] = useState(new Set());
  const [view, setView] = useState('guide');
  const [q, setQ]       = useState('');

  const S   = DATA[sec];
  const T   = S.topics[top];
  const pct = Math.round(done.size / DATA.length * 100);
  const isFirst = sec === 0 && top === 0;
  const isLast  = sec === DATA.length - 1 && top === S.topics.length - 1;

  function goNext() {
    if (top < S.topics.length - 1) setTop(top + 1);
    else if (sec < DATA.length - 1) { setSec(sec + 1); setTop(0); }
  }
  function goPrev() {
    if (top > 0) setTop(top - 1);
    else if (sec > 0) { setSec(sec - 1); setTop(DATA[sec - 1].topics.length - 1); }
  }
  function toggleDone() {
    const n = new Set(done);
    n.has(sec) ? n.delete(sec) : n.add(sec);
    setDone(n);
  }

  const hits = q.trim()
    ? DATA.flatMap((s, si) =>
        s.topics.flatMap((t, ti) =>
          [t.title, t.desc, ...t.steps, t.tip].join(' ').toLowerCase().includes(q.toLowerCase())
            ? [{ si, ti, icon: s.icon, sec: s.label, top: t.title }] : []))
    : [];

  return (
    <div style={{ padding:24, maxWidth:1100, fontFamily:'inherit', color:'var(--color-text-primary)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, display:'flex', alignItems:'center', gap:8 }}>
            📖 Tutorial
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.15)', color:'#5DCAA5', fontWeight:400 }}>Interactive</span>
          </h1>
          <p style={{ fontSize:13, color:'var(--color-text-secondary)', marginTop:4, marginBottom:0 }}>Complete guide to every ContentForge feature</p>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search topics…"
            style={{ padding:'7px 11px', border:'1px solid rgba(29,158,117,.3)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'transparent', color:'var(--color-text-primary)', outline:'none', width:155 }} />
          <button onClick={() => { setView('guide'); setQ(''); }}
            style={{ padding:'6px 12px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', background: view==='guide'&&!q ? 'rgba(29,158,117,.15)' : 'transparent', color: view==='guide'&&!q ? '#5DCAA5' : 'var(--color-text-secondary)' }}>
            Step-by-step
          </button>
          <button onClick={() => { setView('ref'); setQ(''); }}
            style={{ padding:'6px 12px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', background: view==='ref'&&!q ? 'rgba(29,158,117,.15)' : 'transparent', color: view==='ref'&&!q ? '#5DCAA5' : 'var(--color-text-secondary)' }}>
            Quick ref
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ flex:1, height:4, background:'rgba(29,158,117,.12)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:'#1D9E75', borderRadius:2, transition:'width .4s' }} />
        </div>
        <span style={{ fontSize:11, color:'var(--color-text-secondary)', flexShrink:0 }}>{done.size}/{DATA.length} sections done</span>
      </div>

      {/* Search results */}
      {q.trim() !== '' && (
        <div style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14, background:'var(--color-background-secondary)' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500 }}>
            {hits.length} result{hits.length !== 1 ? 's' : ''} for "{q}"
          </div>
          {hits.length === 0
            ? <div style={{ padding:20, textAlign:'center', fontSize:13, color:'var(--color-text-secondary)' }}>No results — try different keywords</div>
            : hits.map((h, i) => (
              <div key={i} onClick={() => { setSec(h.si); setTop(h.ti); setQ(''); setView('guide'); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom: i < hits.length - 1 ? '1px solid rgba(29,158,117,.08)' : 'none' }}>
                <span style={{ fontSize:15 }}>{h.icon}</span>
                <div style={{ flex:1, fontSize:13, fontWeight:500 }}>{h.sec} → {h.top}</div>
                <span style={{ fontSize:12, color:'#5DCAA5' }}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Step-by-step guide */}
      {!q.trim() && view === 'guide' && (
        <div style={{ display:'grid', gridTemplateColumns:'175px 1fr', gap:14 }}>

          {/* Section nav */}
          <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {DATA.map((s, i) => (
              <button key={s.id} onClick={() => { setSec(i); setTop(0); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', minHeight:42,
                  border: i === sec ? '1px solid rgba(29,158,117,.3)' : '1px solid transparent',
                  background: i === sec ? 'rgba(29,158,117,.08)' : 'transparent' }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'var(--color-text-primary)', flex:1 }}>{s.label}</span>
                {done.has(i) && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
              </button>
            ))}
          </nav>

          {/* Main content */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'1px solid rgba(29,158,117,.2)', borderRadius:10, background:'var(--color-background-secondary)' }}>
              <span style={{ fontSize:22 }}>{S.icon}</span>
              <span style={{ fontSize:15, fontWeight:500, flex:1 }}>{S.label}</span>
              <button onClick={toggleDone}
                style={{ padding:'5px 11px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                  border:'1px solid rgba(29,158,117,.3)',
                  background: done.has(sec) ? 'rgba(29,158,117,.15)' : 'transparent',
                  color: done.has(sec) ? '#5DCAA5' : 'var(--color-text-secondary)' }}>
                {done.has(sec) ? '✓ Done' : 'Mark done'}
              </button>
            </div>

            {/* Topic tabs */}
            {S.topics.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {S.topics.map((t, i) => (
                  <button key={i} onClick={() => setTop(i)}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                      border: `1px solid ${i === top ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: i === top ? 'rgba(29,158,117,.12)' : 'transparent',
                      color: i === top ? '#5DCAA5' : 'var(--color-text-secondary)',
                      fontWeight: i === top ? 500 : 400 }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Topic content */}
            <div style={{ padding:'16px 18px', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, background:'var(--color-background-secondary)' }}>
              <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>{T.title}</div>
              <div style={{ fontSize:13, color:'var(--color-text-secondary)', marginBottom:14, lineHeight:1.6 }}>{T.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {T.steps.map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:'rgba(29,158,117,.15)', color:'#5DCAA5' }}>{i + 1}</div>
                    <div style={{ fontSize:13, lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>
              {T.tip && (
                <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.07)', border:'1px solid rgba(29,158,117,.15)', borderRadius:8, padding:'10px 12px' }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>💡</span>
                  <div style={{ fontSize:13, color:'#5DCAA5', lineHeight:1.6 }}>{T.tip}</div>
                </div>
              )}
            </div>

            {/* Prev / Next */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={goPrev} disabled={isFirst}
                style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor: isFirst ? 'not-allowed' : 'pointer', fontFamily:'inherit', border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'var(--color-text-secondary)', opacity: isFirst ? 0.35 : 1 }}>
                ← Previous
              </button>
              <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{sec + 1}/{DATA.length} · topic {top + 1}/{S.topics.length}</span>
              <button onClick={goNext} disabled={isLast}
                style={{ padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor: isLast ? 'not-allowed' : 'pointer', fontFamily:'inherit', border:'none', background:'#1D9E75', color:'white', opacity: isLast ? 0.35 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick reference */}
      {!q.trim() && view === 'ref' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.entries(REFDATA).map(([heading, rows]) => (
            <div key={heading} style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', background:'var(--color-background-secondary)' }}>
              <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500 }}>
                {heading === 'Quick actions' ? '⚡' : heading === 'Platform limits' ? '📱' : heading === 'API costs' ? '💵' : '🔧'} {heading}
              </div>
              <div style={{ padding:'4px 15px' }}>
                {rows.map(([k, v], i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom: i < rows.length - 1 ? '1px solid rgba(29,158,117,.08)' : 'none' }}>
                    <span style={{ fontSize:13, fontWeight:500, flex:1 }}>{k}</span>
                    <span style={{ fontSize:12, color:'var(--color-text-secondary)', textAlign:'right', flex:1 }}>{v}</span>
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
