import React, { useState } from 'react';

const SECTIONS = [
  { id:'start', icon:'🚀', title:'Getting started', color:'#1D9E75',
    topics:[
      { title:'Logging in', desc:'ContentForge is password protected — only you can access it.',
        steps:['Go to contentstudiohub.com','Type password: ContentForge2026','Press Enter or tap Sign in →','You stay logged in until you click Sign out'],
        tip:'On mobile — tap ☰ top-left to open the navigation menu.' },
      { title:'Navigation', desc:'9 sections in the sidebar. On mobile it slides in from the left.',
        steps:['Desktop: sidebar always visible on the left','Mobile: tap ☰ to open','Tap any section to navigate','Tap outside to close the menu'],
        tip:'Add to home screen: Share → Add to Home Screen (iPhone) or Chrome ⋮ → Add to Home Screen (Android).' },
    ]},
  { id:'composer', icon:'✦', title:'AI Composer', color:'#8B7FE8',
    topics:[
      { title:'Writing social posts', desc:'Claude writes unique posts for each platform automatically.',
        steps:['Click AI Composer','Type your topic or idea','Select platforms','Choose tone — Professional, Casual, Humorous, Inspirational','Click Generate Posts ⚡','Click Copy to copy to clipboard'],
        tip:'Instagram gets hashtags. Reddit gets conversational tone. Facebook gets longer format.' },
    ]},
  { id:'video', icon:'▶', title:'AI Video Engine', color:'#1D9E75',
    topics:[
      { title:'3 input modes', desc:'Create videos from a topic, URL, or affiliate link.',
        steps:['TOPIC — type any subject: "morning productivity habits"','URL — paste a product page, Claude reads it automatically','AFFILIATE — paste your tracking link, Claude adds it to the CTA'],
        tip:'Affiliate mode auto-adds your tracking link to every call-to-action.' },
      { title:'Smart Mode', desc:'Claude automatically picks the best video format.',
        steps:['Smart Mode ON (default) — Claude picks the format','Smart Mode OFF — you choose from 7 types','Toggle is at the top of the panel'],
        tip:'Keep Smart Mode ON when starting out.' },
      { title:'7 video types', desc:'Each type has a different script structure.',
        steps:['UGC Persona — authentic first-person review','AI VSL — Hook → Problem → Solution → CTA','Hybrid VSL — avatar + B-roll footage','Reel Ads — short punchy vertical ads','Product Ads — direct-response e-commerce','Commercial — cinematic brand story','Competitor Replicator — original content in competitor structure'],
        tip:'UGC Persona works best for affiliate. VSL works best for high-ticket products.' },
      { title:'Duration and cost', desc:'Drag the slider to set length. Cost estimate updates live.',
        steps:['Drag slider: 10 seconds to 10 minutes','Preset buttons: 15s, 30s, 45s, 60s','Dollar amount = your API cost','Platform limits enforced automatically','Orange warning if duration exceeds a platform limit'],
        tip:'Start with 15s to test the pipeline cheaply before committing to longer videos.' },
      { title:'Viewing results', desc:'Click Generate then watch the pipeline run step by step.',
        steps:['Click Generate Video ⚡','Click the Result tab','Script appears in ~5 seconds','Voiceover in ~10 seconds','Video clips in 3–5 minutes','Download button appears when ready'],
        tip:'You always get a full script even without RunwayML connected.' },
    ]},
  { id:'vsl', icon:'💰', title:'VSL Builder', color:'#F5A623',
    topics:[
      { title:'Building a VSL', desc:'Creates high-converting Video Sales Letter scripts.',
        steps:['AI Video Engine → VSL Builder tab','Enter product name and price','Describe target audience specifically','Describe the main pain point — be very specific','Describe your solution','Paste affiliate link (optional)','Set duration 30–90s','Click Generate VSL Script ⚡'],
        tip:'"Struggling with dry skin despite $100 creams" converts better than "has dry skin". Specificity wins.' },
    ]},
  { id:'bulk', icon:'⚡', title:'Bulk Generator', color:'#8B7FE8',
    topics:[
      { title:'Auto-generate mode', desc:'One base topic becomes 10 unique video variations.',
        steps:['Click Bulk Generator','Select Auto-generate variations','Type a base topic — e.g. "morning productivity"','Choose count: 3, 5, 7, or 10','Click ✦ Generate','Review and edit topics','Set persona, duration, platforms, concurrency','Click Generate X Videos ⚡','Watch progress in the Progress tab'],
        tip:'Concurrency 2 is the sweet spot — halves total time without overloading APIs.' },
      { title:'Bulk cost estimate', desc:'Lower cost per video than single generation.',
        steps:['Script: $0.01 per video','Voiceover: $0.05 per video','Video clip: $0.25 per video','Total: ~$0.31 per video','10 videos ≈ $3.10'],
        tip:'Bulk uses 1 scene clip to keep costs low. Regenerate individual videos with more scenes later.' },
    ]},
  { id:'scheduler', icon:'📅', title:'Video Scheduler', color:'#1D9E75',
    topics:[
      { title:'Scheduling a post', desc:'Railway posts your video automatically at the exact scheduled time.',
        steps:['Click Video Scheduler','Select a completed video','Choose platforms','Click an optimal time slot','Pick the date','Click Schedule Post 📅','Post appears in Upcoming tab and fires automatically'],
        tip:'Railway stellar-achievement must be Online for auto-posting to work.' },
      { title:'Peak posting times', desc:'Best engagement windows for each platform.',
        steps:['TikTok: 7pm daily — Tuesday 8pm is best','Instagram: 11am daily — Wednesday 11am','YouTube Shorts: 3pm — Saturday 11am','Facebook: 1pm daily — Wednesday 1pm','Reddit: 8am ET daily — Monday 8am ET'],
        tip:'Check your own platform analytics after a few weeks for your specific audience.' },
    ]},
  { id:'analytics', icon:'◎', title:'Analytics', color:'#5DCAA5',
    topics:[
      { title:'4 analytics tabs', desc:'Live data from Supabase — every video appears here automatically.',
        steps:['Overview — daily chart, status donut, breakdowns','Videos — full list with hook previews and download links','Platforms — usage charts and optimal time reference','Costs — API spend and monthly projections','Click Refresh ↻ to pull latest data'],
        tip:'All data persists in Supabase even if Railway restarts.' },
    ]},
  { id:'email', icon:'📧', title:'Email Notifications', color:'#F5A623',
    topics:[
      { title:'Setting up email alerts', desc:'Automated emails when videos finish, batches complete, or posts publish.',
        steps:['Sign up free at resend.com','API Keys → Create API Key → copy the re_ key','Railway → stellar-achievement → Variables → add RESEND_API_KEY and NOTIFY_EMAIL','Email Notifications → Send test email → check inbox'],
        tip:'3 email types: 🎬 video complete, ⚡ bulk done, 📅 scheduled post published.' },
    ]},
  { id:'mobile', icon:'📱', title:'Using on mobile', color:'#5DCAA5',
    topics:[
      { title:'Mobile navigation', desc:'Full phone optimisation — touch-friendly controls throughout.',
        steps:['Open contentstudiohub.com in your browser','Log in with your password','Tap ☰ top-left to open the menu','Tap any section — menu closes automatically','All buttons sized for finger taps'],
        tip:'Add to home screen for app-like access without the browser bar.' },
      { title:'Generating on mobile', desc:'Full pipeline works on mobile. Keep your screen on.',
        steps:['Tap AI Video Engine','Type your topic','Scroll to set duration and platforms','Tap Generate Video ⚡','Tap Result tab to watch progress (3–5 min)','Check Job History for completed videos'],
        tip:'Keep screen on while generating — some browsers pause JavaScript when locked.' },
    ]},
];

const QUICK = [
  ['Generate a video',    'AI Video Engine → topic → Generate ⚡'],
  ['Generate 10 videos',  'Bulk Generator → base topic → ✦ Generate → Generate X Videos'],
  ['Schedule a post',     'Video Scheduler → select video → time → Schedule Post 📅'],
  ['Write social posts',  'AI Composer → topic → platforms → Generate Posts ⚡'],
  ['Build a VSL',         'AI Video Engine → VSL Builder tab → Generate VSL ⚡'],
  ['Check analytics',     'Analytics → Overview / Videos / Platforms / Costs'],
  ['Set up emails',       'Email Notifications → add Resend key → test'],
  ['Sign out',            'Sidebar bottom → Sign out button'],
];

const TROUBLE = [
  ['"Failed to fetch"',       'Railway stellar-achievement is down — check it shows Online'],
  ['"Connection error"',      'ANTHROPIC_API_KEY missing — check Railway Variables'],
  ['"ElevenLabs 401"',        'Remove any prefix text from the ElevenLabs API key'],
  ['No video clips',          'RUNWAY_API_KEY missing or credits empty — check runwayml.com'],
  ['Password not working',    'F12 → Application → Local Storage → delete cf_auth_v2 → refresh'],
  ['Netlify not updating',    'Deploys → Trigger deploy → Deploy site after GitHub commits'],
  ['Scheduled posts not firing','Railway must stay Online — click Restart if crashed'],
  ['Emails not arriving',     'Check RESEND_API_KEY and NOTIFY_EMAIL in Railway Variables'],
];

export default function Tutorial() {
  const [sec, setSec] = useState(0);
  const [top, setTop] = useState(0);
  const [done, setDone] = useState(new Set());
  const [view, setView] = useState('guide');
  const [q, setQ] = useState('');

  const section = SECTIONS[sec];
  const topic = section.topics[top];

  const hits = q.trim()
    ? SECTIONS.flatMap((s, si) => s.topics.flatMap((t, ti) =>
        [t.title, t.desc, ...t.steps, t.tip || ''].join(' ').toLowerCase().includes(q.toLowerCase())
          ? [{ si, ti, icon: s.icon, section: s.title, topic: t.title }] : []))
    : [];

  const isFirst = sec === 0 && top === 0;
  const isLast  = sec === SECTIONS.length - 1 && top === section.topics.length - 1;

  function goNext() {
    if (top < section.topics.length - 1) setTop(t => t + 1);
    else if (sec < SECTIONS.length - 1) { setSec(s => s + 1); setTop(0); }
  }
  function goPrev() {
    if (top > 0) setTop(t => t - 1);
    else if (sec > 0) { const p = sec - 1; setSec(p); setTop(SECTIONS[p].topics.length - 1); }
  }

  const card = { background:'rgba(22,61,106,.5)', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden' };
  const hdr  = { padding:'11px 15px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500 };

  return (
    <div style={{ padding:'20px 24px', maxWidth:1100, fontFamily:'inherit' }}>

      {/* Title row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:500, display:'flex', alignItems:'center', gap:8 }}>
            📖 ContentForge Tutorial
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>Interactive</span>
          </div>
          <div style={{ fontSize:13, color:'#7BAAA0', marginTop:3 }}>Complete guide to every feature — step by step</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search…"
            style={{ padding:'7px 12px', border:'0.5px solid rgba(29,158,117,.3)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'rgba(22,61,106,.6)', color:'#E8F4F0', outline:'none', width:160 }}
          />
          {['guide','ref'].map(v => (
            <button key={v} onClick={() => { setView(v); setQ(''); }}
              style={{ padding:'6px 12px', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                background: view===v&&!q ? 'rgba(29,158,117,.2)' : 'transparent',
                color: view===v&&!q ? '#5DCAA5' : '#7BAAA0' }}>
              {v === 'guide' ? 'Step-by-step' : 'Quick ref'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ flex:1, height:4, background:'rgba(22,61,106,.8)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.round(done.size/SECTIONS.length*100)}%`, background:'#1D9E75', borderRadius:2, transition:'width .4s' }} />
        </div>
        <span style={{ fontSize:11, color:'#7BAAA0', flexShrink:0 }}>{done.size} of {SECTIONS.length} sections done</span>
      </div>

      {/* Search results */}
      {q && (
        <div style={card}>
          <div style={{ ...hdr, color:'#E8F4F0' }}>{hits.length} result{hits.length!==1?'s':''} for "{q}"</div>
          {hits.length === 0
            ? <div style={{ padding:20, textAlign:'center', fontSize:13, color:'#7BAAA0' }}>No results — try different keywords</div>
            : hits.map((h, i) => (
              <div key={i} onClick={() => { setSec(h.si); setTop(h.ti); setQ(''); setView('guide'); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 15px', borderBottom:'0.5px solid rgba(29,158,117,.1)', cursor:'pointer' }}>
                <span>{h.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{h.section} → {h.topic}</div>
                </div>
                <span style={{ fontSize:12, color:'#5DCAA5' }}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Guide */}
      {!q && view === 'guide' && (
        <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:14 }}>

          {/* Section nav */}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => { setSec(i); setTop(0); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', width:'100%', minHeight:40, textAlign:'left',
                  background: i===sec ? 'rgba(29,158,117,.1)' : 'transparent',
                  border: `0.5px solid ${i===sec ? 'rgba(29,158,117,.3)' : 'transparent'}` }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'#E8F4F0', flex:1 }}>{s.title}</span>
                {done.has(i) && <span style={{ color:'#1D9E75', fontSize:11 }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, ...card, padding:'12px 16px' }}>
              <span style={{ fontSize:22 }}>{section.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0' }}>{section.title}</div>
                <div style={{ fontSize:12, color:'#7BAAA0', marginTop:2 }}>{section.sub || ''}</div>
              </div>
              <button onClick={() => setDone(prev => { const n=new Set(prev); n.has(sec)?n.delete(sec):n.add(sec); return n; })}
                style={{ fontSize:11, padding:'5px 10px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                  border:'0.5px solid rgba(29,158,117,.3)',
                  background: done.has(sec) ? 'rgba(29,158,117,.2)' : 'transparent',
                  color: done.has(sec) ? '#5DCAA5' : '#7BAAA0' }}>
                {done.has(sec) ? '✓ Done' : 'Mark done'}
              </button>
            </div>

            {/* Topic tabs */}
            {section.topics.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {section.topics.map((t, i) => (
                  <button key={i} onClick={() => setTop(i)}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                      border: `0.5px solid ${i===top ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: i===top ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: i===top ? '#5DCAA5' : '#7BAAA0', fontWeight: i===top ? 500 : 400 }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Topic content */}
            <div style={{ ...card, padding:'16px 18px' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>{topic.title}</div>
              <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:14, lineHeight:1.6 }}>{topic.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {topic.steps.map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:'rgba(29,158,117,.15)', color:'#5DCAA5' }}>{i+1}</div>
                    <div style={{ fontSize:13, color:'#E8F4F0', lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>
              {topic.tip && (
                <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.08)', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'10px 13px' }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                  <div style={{ fontSize:13, color:'#5DCAA5', lineHeight:1.6 }}>{topic.tip}</div>
                </div>
              )}
            </div>

            {/* Prev / Next */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={goPrev} disabled={isFirst}
                style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor: isFirst?'not-allowed':'pointer', fontFamily:'inherit', border:'0.5px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', opacity: isFirst?0.35:1 }}>
                ← Previous
              </button>
              <span style={{ fontSize:11, color:'#4A7A72' }}>{sec+1}/{SECTIONS.length} · {top+1}/{section.topics.length}</span>
              <button onClick={goNext} disabled={isLast}
                style={{ padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor: isLast?'not-allowed':'pointer', fontFamily:'inherit', border:'none', background:'#1D9E75', color:'white', opacity: isLast?0.35:1 }}>
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
            { hdr:'⚡ Quick actions', rows: QUICK },
            { hdr:'📱 Platform limits', rows: [['TikTok','10 min · 4GB · 9:16'],['Instagram Reels','90 sec · 1GB · 9:16'],['YouTube Shorts','60 sec · 256GB · 9:16'],['Facebook Reels','90 sec · 4GB · 9:16'],['Facebook Feed','4 hours · 10GB · any'],['Reddit','15 min · 1GB · any']] },
            { hdr:'💵 API costs', rows: [['Claude AI script','$0.01 per video'],['ElevenLabs voice','$0.05 per 30 sec'],['RunwayML clips','$0.05 per second'],['Cloudflare R2','10GB free/month'],['30-sec video total','~$1.56']] },
          ].map(({ hdr: h, rows }) => (
            <div key={h} style={card}>
              <div style={{ ...hdr, color:'#E8F4F0' }}>{h}</div>
              <div style={{ padding:'4px 15px' }}>
                {rows.map(([k, v], i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom: i<rows.length-1?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', flex:1 }}>{k}</span>
                    <span style={{ fontSize:12, color:'#7BAAA0', textAlign:'right', flex:1 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Video types */}
          <div style={card}>
            <div style={{ ...hdr, color:'#E8F4F0' }}>🎬 Video types</div>
            <div style={{ padding:'4px 15px' }}>
              {[['UGC Persona','First-person review — affiliate products, apps'],['AI VSL','Hook→Problem→Solution→CTA — high-ticket, courses'],['Hybrid VSL','Avatar + B-roll — mid-ticket products'],['Reel Ads','Short punchy ad — any product'],['Product Ads','Direct-response — Amazon, Shopify'],['Commercial','Cinematic story — brand building'],['Competitor Replicator','Copies structure — proven niches']].map(([t,d],i,arr) => (
                <div key={i} style={{ padding:'8px 0', borderBottom: i<arr.length-1?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{t}</span>
                  <span style={{ fontSize:12, color:'#7BAAA0', marginLeft:10 }}>— {d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div style={card}>
            <div style={{ ...hdr, color:'#E8F4F0' }}>🔧 Troubleshooting</div>
            <div style={{ padding:'4px 15px' }}>
              {TROUBLE.map(([p,f],i,arr) => (
                <div key={i} style={{ padding:'8px 0', borderBottom: i<arr.length-1?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#F09595', marginBottom:3 }}>⚠ {p}</div>
                  <div style={{ fontSize:12, color:'#7BAAA0' }}>→ {f}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
