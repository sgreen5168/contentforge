import React, { useState } from 'react';

const SECTIONS = [
  { id:'start', icon:'🚀', title:'Getting started',
    topics:[
      { title:'Logging in',
        desc:'ContentForge is password protected — only you can access it.',
        steps:['Go to contentstudiohub.com','Type password: ContentForge2026','Press Enter or tap Sign in','You stay logged in until you sign out'],
        tip:'On mobile tap ☰ top-left to open the navigation menu.' },
      { title:'Navigation',
        desc:'9 sections in the sidebar. On mobile it slides in from the left.',
        steps:['Desktop: sidebar always visible','Mobile: tap ☰ to open','Tap any section to navigate','Tap outside to close'],
        tip:'Add to home screen for app-like access.' },
    ]},
  { id:'composer', icon:'✦', title:'AI Composer',
    topics:[
      { title:'Writing social posts',
        desc:'Claude writes unique posts for each platform.',
        steps:['Click AI Composer','Type your topic','Select platforms','Choose tone','Click Generate Posts ⚡','Click Copy to copy text'],
        tip:'Instagram gets hashtags. Reddit gets conversational tone. Facebook gets longer format.' },
    ]},
  { id:'video', icon:'▶', title:'AI Video Engine',
    topics:[
      { title:'3 input modes',
        desc:'Create videos from a topic, URL, or affiliate link.',
        steps:['TOPIC — type any subject','URL — paste a product page','AFFILIATE — paste your tracking link'],
        tip:'Affiliate mode auto-adds your link to every call-to-action.' },
      { title:'Smart Mode',
        desc:'Claude picks the best video format automatically.',
        steps:['Smart Mode ON (default) — Claude picks','Smart Mode OFF — you choose from 7 types','Toggle is at the top of the panel'],
        tip:'Keep Smart Mode ON when starting out.' },
      { title:'7 video types',
        desc:'Each type has a different script structure.',
        steps:['UGC Persona — authentic first-person review','AI VSL — Hook to Problem to Solution to CTA','Hybrid VSL — avatar plus B-roll footage','Reel Ads — short punchy vertical ads','Product Ads — direct-response e-commerce','Commercial — cinematic brand story','Competitor Replicator — original content in competitor structure'],
        tip:'UGC Persona works best for affiliate. VSL works best for high-ticket products.' },
      { title:'Duration and cost',
        desc:'Drag the slider to set length. Cost estimate updates live.',
        steps:['Drag slider 10 seconds to 10 minutes','Preset buttons 15s 30s 45s 60s','Dollar amount equals your API cost','Platform limits enforced automatically','Orange warning if you exceed a platform limit'],
        tip:'Start with 15s to test cheaply before longer videos.' },
      { title:'Generating results',
        desc:'Click Generate then watch the pipeline run.',
        steps:['Click Generate Video','Click the Result tab','Script appears in 5 seconds','Voiceover in 10 seconds','Video clips in 3 to 5 minutes','Download button appears when ready'],
        tip:'You always get a full script even without RunwayML connected.' },
    ]},
  { id:'vsl', icon:'💰', title:'VSL Builder',
    topics:[
      { title:'Building a VSL',
        desc:'High-converting Video Sales Letter scripts.',
        steps:['AI Video Engine then VSL Builder tab','Enter product name and price','Describe target audience specifically','Describe the main pain point','Describe your solution','Paste affiliate link optional','Set duration 30 to 90 seconds','Click Generate VSL Script'],
        tip:'Be very specific with the pain point. Specificity converts better.' },
    ]},
  { id:'bulk', icon:'⚡', title:'Bulk Generator',
    topics:[
      { title:'Auto-generate mode',
        desc:'One base topic becomes 10 unique video variations.',
        steps:['Click Bulk Generator','Select Auto-generate variations','Type a base topic','Choose count 3 5 7 or 10','Click Generate','Review and edit topics','Set persona duration platforms','Click Generate X Videos','Watch progress in the Progress tab'],
        tip:'Concurrency 2 halves total time without overloading APIs.' },
    ]},
  { id:'scheduler', icon:'📅', title:'Video Scheduler',
    topics:[
      { title:'Scheduling a post',
        desc:'Railway posts your video automatically at the exact time.',
        steps:['Click Video Scheduler','Select a completed video','Choose platforms','Click an optimal time slot','Pick the date','Click Schedule Post','Post fires automatically at scheduled time'],
        tip:'Railway stellar-achievement must be Online for auto-posting.' },
    ]},
  { id:'analytics', icon:'◎', title:'Analytics',
    topics:[
      { title:'4 analytics tabs',
        desc:'Live data from Supabase — every video appears automatically.',
        steps:['Overview — daily chart and status breakdown','Videos — full list with hook previews','Platforms — usage charts and timing reference','Costs — API spend and monthly projections','Click Refresh to pull latest data'],
        tip:'Data persists in Supabase even if Railway restarts.' },
    ]},
  { id:'email', icon:'📧', title:'Email Notifications',
    topics:[
      { title:'Setting up email alerts',
        desc:'Automated emails when videos finish generating.',
        steps:['Sign up free at resend.com','Create API Key and copy the re_ key','Railway Variables add RESEND_API_KEY and NOTIFY_EMAIL','Email Notifications page then Send test email'],
        tip:'3 types: video complete, bulk done, scheduled post published.' },
    ]},
  { id:'mobile', icon:'📱', title:'Using on mobile',
    topics:[
      { title:'Mobile navigation',
        desc:'Full phone optimisation with touch-friendly controls.',
        steps:['Open contentstudiohub.com','Log in with password','Tap hamburger top-left to open menu','Tap any section to navigate','All buttons sized for finger taps'],
        tip:'Add to home screen for app-like access without browser bar.' },
      { title:'Generating on mobile',
        desc:'Full pipeline works on mobile. Keep screen on.',
        steps:['Tap AI Video Engine','Type topic','Set duration and platforms','Tap Generate Video','Watch progress in Result tab','Check Job History for completed videos'],
        tip:'Keep screen on — some browsers pause JavaScript when locked.' },
    ]},
];

export default function Tutorial() {
  const [sec, setSec]   = useState(0);
  const [top, setTop]   = useState(0);
  const [done, setDone] = useState(new Set());
  const [view, setView] = useState('guide');
  const [q, setQ]       = useState('');

  const S = SECTIONS[sec];
  const T = S.topics[top];
  const isFirst = sec === 0 && top === 0;
  const isLast  = sec === SECTIONS.length - 1 && top === S.topics.length - 1;
  const pct     = Math.round(done.size / SECTIONS.length * 100);

  function next() {
    if (top < S.topics.length - 1) { setTop(top + 1); }
    else if (sec < SECTIONS.length - 1) { setSec(sec + 1); setTop(0); }
  }
  function prev() {
    if (top > 0) { setTop(top - 1); }
    else if (sec > 0) { setSec(sec - 1); setTop(SECTIONS[sec - 1].topics.length - 1); }
  }
  function mark() {
    const n = new Set(done);
    n.has(sec) ? n.delete(sec) : n.add(sec);
    setDone(n);
  }

  const hits = q.trim()
    ? SECTIONS.flatMap((s, si) =>
        s.topics.flatMap((t, ti) =>
          [t.title, t.desc, ...t.steps, t.tip].join(' ').toLowerCase().includes(q.toLowerCase())
            ? [{ si, ti, icon: s.icon, sec: s.title, top: t.title }] : []))
    : [];

  return (
    <div style={{ padding: 24, maxWidth: 1100, fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:500, color:'var(--color-text-primary)' }}>
            📖 Tutorial
            <span style={{ marginLeft:8, fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.15)', color:'#5DCAA5' }}>Interactive</span>
          </div>
          <div style={{ fontSize:13, color:'var(--color-text-secondary)', marginTop:4 }}>Complete guide to every ContentForge feature</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            style={{ padding:'7px 11px', border:'1px solid rgba(29,158,117,.3)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'transparent', color:'var(--color-text-primary)', outline:'none', width:150 }} />
          {['guide','ref'].map(v => (
            <button key={v} onClick={() => { setView(v); setQ(''); }}
              style={{ padding:'6px 12px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                background: view===v && !q ? 'rgba(29,158,117,.15)' : 'transparent',
                color: view===v && !q ? '#5DCAA5' : 'var(--color-text-secondary)' }}>
              {v === 'guide' ? 'Step-by-step' : 'Quick ref'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ flex:1, height:4, background:'rgba(29,158,117,.1)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width: pct + '%', background:'#1D9E75', borderRadius:2, transition:'width .4s' }} />
        </div>
        <span style={{ fontSize:11, color:'var(--color-text-secondary)', flexShrink:0 }}>{done.size}/{SECTIONS.length} done</span>
      </div>

      {/* Search */}
      {q && (
        <div style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14, background:'var(--color-background-secondary)' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>
            {hits.length} result{hits.length !== 1 ? 's' : ''} for "{q}"
          </div>
          {hits.length === 0
            ? <div style={{ padding:20, textAlign:'center', fontSize:13, color:'var(--color-text-secondary)' }}>No results found</div>
            : hits.map((h, i) => (
              <div key={i} onClick={() => { setSec(h.si); setTop(h.ti); setQ(''); setView('guide'); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom: i < hits.length-1 ? '1px solid rgba(29,158,117,.1)' : 'none' }}>
                <span>{h.icon}</span>
                <div style={{ flex:1, fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{h.sec} → {h.top}</div>
                <span style={{ fontSize:12, color:'#5DCAA5' }}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Guide view */}
      {!q && view === 'guide' && (
        <div style={{ display:'grid', gridTemplateColumns:'175px 1fr', gap:14 }}>

          {/* Nav */}
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => { setSec(i); setTop(0); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', minHeight:42,
                  border: i===sec ? '1px solid rgba(29,158,117,.3)' : '1px solid transparent',
                  background: i===sec ? 'rgba(29,158,117,.08)' : 'transparent' }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'var(--color-text-primary)', flex:1 }}>{s.title}</span>
                {done.has(i) && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'1px solid rgba(29,158,117,.2)', borderRadius:10, background:'var(--color-background-secondary)' }}>
              <span style={{ fontSize:22 }}>{S.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:500, color:'var(--color-text-primary)' }}>{S.title}</div>
              </div>
              <button onClick={mark}
                style={{ padding:'5px 10px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
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
                      border: `1px solid ${i===top ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: i===top ? 'rgba(29,158,117,.12)' : 'transparent',
                      color: i===top ? '#5DCAA5' : 'var(--color-text-secondary)',
                      fontWeight: i===top ? 500 : 400 }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Topic card */}
            <div style={{ padding:'16px 18px', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, background:'var(--color-background-secondary)' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'var(--color-text-primary)', marginBottom:6 }}>{T.title}</div>
              <div style={{ fontSize:13, color:'var(--color-text-secondary)', marginBottom:14, lineHeight:1.6 }}>{T.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {T.steps.map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:'rgba(29,158,117,.15)', color:'#5DCAA5' }}>{i+1}</div>
                    <div style={{ fontSize:13, color:'var(--color-text-primary)', lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>
              {T.tip && (
                <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', borderRadius:8, padding:'10px 12px' }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>💡</span>
                  <div style={{ fontSize:13, color:'#5DCAA5', lineHeight:1.6 }}>{T.tip}</div>
                </div>
              )}
            </div>

            {/* Prev / Next */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={prev} disabled={isFirst}
                style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor: isFirst?'not-allowed':'pointer', fontFamily:'inherit', border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'var(--color-text-secondary)', opacity: isFirst ? 0.35 : 1 }}>
                ← Previous
              </button>
              <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{sec+1}/{SECTIONS.length} · topic {top+1}/{S.topics.length}</span>
              <button onClick={next} disabled={isLast}
                style={{ padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor: isLast?'not-allowed':'pointer', fontFamily:'inherit', border:'none', background:'#1D9E75', color:'white', opacity: isLast ? 0.35 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick ref */}
      {!q && view === 'ref' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { h:'⚡ Quick actions', rows:[
              ['Generate a video','AI Video Engine → topic → Generate ⚡'],
              ['Generate 10 videos','Bulk Generator → base topic → Generate X Videos'],
              ['Schedule a post','Video Scheduler → video → time → Schedule Post'],
              ['Write social posts','AI Composer → topic → platforms → Generate Posts'],
              ['Build a VSL','AI Video Engine → VSL Builder → Generate VSL'],
              ['Check analytics','Analytics → Overview / Videos / Platforms / Costs'],
              ['Set up email alerts','Email Notifications → Resend key → test email'],
              ['Sign out','Sidebar bottom → Sign out button'],
            ]},
            { h:'📱 Platform limits', rows:[
              ['TikTok','10 min · 4GB · 9:16 vertical'],
              ['Instagram Reels','90 sec · 1GB · 9:16 vertical'],
              ['YouTube Shorts','60 sec · 256GB · 9:16 vertical'],
              ['Facebook Reels','90 sec · 4GB · 9:16 vertical'],
              ['Facebook Feed','4 hours · 10GB · any ratio'],
              ['Reddit','15 min · 1GB · 9:16 or 16:9'],
            ]},
            { h:'💵 API cost reference', rows:[
              ['Claude AI script','$0.01 per video'],
              ['ElevenLabs voice','$0.05 per 30 sec'],
              ['RunwayML clips','$0.05 per second of video'],
              ['Cloudflare R2','10GB free per month'],
              ['30-second video total','~$1.56 per video'],
              ['10-video bulk batch','~$3.10 total'],
            ]},
            { h:'🔧 Troubleshooting', rows:[
              ['"Failed to fetch"','Railway is down — check stellar-achievement is Online at railway.app'],
              ['"Connection error"','ANTHROPIC_API_KEY missing — check Railway Variables'],
              ['"ElevenLabs 401"','Remove prefix text from the API key in Railway Variables'],
              ['No video clips','RUNWAY_API_KEY missing or credits empty'],
              ['Password not working','F12 → Application → Local Storage → delete cf_auth_v2'],
              ['Netlify not updating','Deploys → Trigger deploy → Deploy site'],
              ['Scheduled posts not firing','Railway must stay Online — Restart if crashed'],
              ['Emails not arriving','Check RESEND_API_KEY and NOTIFY_EMAIL in Railway Variables'],
            ]},
          ].map(({ h, rows }) => (
            <div key={h} style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', background:'var(--color-background-secondary)' }}>
              <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{h}</div>
              <div style={{ padding:'4px 15px' }}>
                {rows.map(([k, v], i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom: i < rows.length-1 ? '1px solid rgba(29,158,117,.08)' : 'none' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)', flex:1 }}>{k}</span>
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
