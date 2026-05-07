import React, { useState } from 'react';

const SECTIONS = [
  {
    id:'start', icon:'🚀', title:'Getting started', sub:'Login · navigation · dashboard',
    topics:[
      { title:'Logging in', desc:'ContentForge is password protected so only you can access it.',
        steps:['Go to contentstudiohub.com on any device','Type your password: ContentForge2026','Press Enter or tap Sign in →','You stay logged in until you click Sign out'],
        tip:'On mobile — tap ☰ top-left to open the navigation menu.' },
      { title:'Navigation', desc:'The sidebar has 9 sections. On mobile it slides in from the left.',
        steps:['Desktop: sidebar always visible on the left','Mobile: tap ☰ to open the menu','Tap any section to navigate instantly','Tap outside the menu to close it'],
        tip:'Add ContentForge to your home screen: Share → Add to Home Screen (iPhone) or Chrome ⋮ → Add to Home Screen (Android).' },
    ],
  },
  {
    id:'composer', icon:'✦', title:'AI Composer', sub:'Social posts for all platforms',
    topics:[
      { title:'Writing social posts', desc:'Claude writes platform-optimised posts — each network gets a unique version.',
        steps:['Click AI Composer in the sidebar','Type your topic or idea','Select target platforms','Choose a tone — Professional, Casual, Humorous, Inspirational','Click Generate Posts ⚡','Click Copy under any post to copy to clipboard'],
        tip:'Instagram gets hashtags automatically. Reddit gets conversational tone. Facebook gets longer format.' },
      { title:'Getting better results', desc:'The more specific your input the better the output.',
        steps:['Be specific: "5 morning habits that changed my life" beats "productivity"','Include the product name if promoting something','Mention the main benefit — not just what it is','Click Generate again for a completely different set of variations'],
        tip:'Generate 2–3 times and pick the best lines from each version.' },
    ],
  },
  {
    id:'video', icon:'▶', title:'AI Video Engine', sub:'Full video generation pipeline',
    topics:[
      { title:'3 input modes', desc:'Generate videos from a topic, a URL, or an affiliate link.',
        steps:['TOPIC — type any subject: "morning productivity habits"','URL — paste a product page, Claude reads the content automatically','AFFILIATE — paste your tracking link, Claude extracts the product and adds your link to the CTA'],
        tip:'Affiliate mode is most powerful — it auto-adds your tracking link to every call-to-action.' },
      { title:'Smart Mode', desc:'Smart Mode picks the best video format for your content automatically.',
        steps:['Smart Mode ON (default) — Claude picks the best format','Smart Mode OFF — you choose from 7 video types manually','Toggle is at the top of the left panel'],
        tip:'Keep Smart Mode ON when starting out.' },
      { title:'7 video types', desc:'Each type produces a different script structure.',
        steps:['UGC Persona — authentic first-person review','AI VSL — Hook → Problem → Solution → CTA','Hybrid VSL — avatar sections + B-roll footage','Reel Ads — short punchy vertical ads','Product Ads — direct-response e-commerce','Commercial — cinematic brand storytelling','Competitor Replicator — original content using competitor structure'],
        tip:'UGC Persona and Reel Ads work best for affiliate marketing. VSL works best for high-ticket products.' },
      { title:'Duration and cost', desc:'The slider sets length and shows your estimated API cost live.',
        steps:['Drag the slider: 10 seconds to 10 minutes','Use preset buttons — 15s, 30s, 45s, 60s','Dollar amount shown = your API cost, not what you charge','Platform limits enforced automatically','Orange warning shows if duration exceeds a platform limit'],
        tip:'30 seconds is the sweet spot. Start with 15s for cheap testing.' },
      { title:'Generating results', desc:'After clicking Generate the pipeline runs automatically.',
        steps:['Click Generate Video ⚡','Click the Result tab on the right','Script appears in ~5 seconds','Voiceover generates in ~10 seconds','Video clips take 3–5 minutes','Download button appears when the video is ready'],
        tip:'Without RunwayML connected you still get a full script ready to record manually.' },
    ],
  },
  {
    id:'vsl', icon:'💰', title:'VSL Builder', sub:'High-converting sales scripts',
    topics:[
      { title:'Building a VSL', desc:'Creates direct-response Video Sales Letter scripts using a proven framework.',
        steps:['AI Video Engine → VSL Builder tab','Enter product name, price, target audience','Describe the main pain point — be very specific','Describe your solution and what makes it different','Paste affiliate link (optional)','Set duration 30–90s recommended','Click Generate VSL Script ⚡'],
        tip:'"Struggling with dry skin despite spending $100 on creams" converts far better than "has dry skin". Specificity wins.' },
    ],
  },
  {
    id:'bulk', icon:'⚡', title:'Bulk Generator', sub:'Up to 10 videos simultaneously',
    topics:[
      { title:'Auto-generate mode', desc:'Type one base topic and Claude creates 10 unique angle variations.',
        steps:['Click Bulk Generator in the sidebar','Select Auto-generate variations','Type a base topic — e.g. "morning productivity"','Choose count: 3, 5, 7, or 10','Click ✦ Generate — Claude creates variations','Review and edit topics','Set persona, duration, platforms','Choose concurrency: 1, 2, or 3','Click Generate X Videos ⚡','Watch all videos generate in the Progress tab'],
        tip:'Concurrency 2 is the sweet spot — halves total time without overloading APIs.' },
      { title:'Bulk cost estimate', desc:'Cost per video is lower in bulk — only 1 scene clip per video.',
        steps:['Script (Claude): $0.01 per video','Voiceover (ElevenLabs): $0.05 per video','Video clip (RunwayML): $0.25 per video','Total: ~$0.31 per video','10 videos ≈ $3.10 total'],
        tip:'Bulk generates 1 scene clip to keep costs low. Regenerate individual videos with more scenes later.' },
    ],
  },
  {
    id:'scheduler', icon:'📅', title:'Video Scheduler', sub:'Auto-post at peak engagement times',
    topics:[
      { title:'Scheduling a post', desc:'Railway posts your video automatically at the exact scheduled time.',
        steps:['Click Video Scheduler in the sidebar','Select a completed video from the dropdown','Choose platforms to post to','Click an optimal time slot to auto-fill','Pick the date','Click Schedule Post 📅','Post appears in the Upcoming tab and fires automatically'],
        tip:'Railway stellar-achievement must be Online for auto-posting to work.' },
      { title:'Peak posting times', desc:'Best engagement windows for each platform.',
        steps:['TikTok: 7pm daily — Tuesday 8pm is the single best slot','Instagram Reels: 11am daily — Wednesday 11am for highest reach','YouTube Shorts: 3pm daily — Saturday 11am','Facebook: 1pm daily — Wednesday 1pm','Reddit: 8am ET daily — Monday 8am ET for highest traffic'],
        tip:'These are general guidelines. Check your own analytics after a few weeks.' },
    ],
  },
  {
    id:'analytics', icon:'◎', title:'Analytics', sub:'Track performance and costs',
    topics:[
      { title:'4 analytics tabs', desc:'Pulls live data from Supabase — every video appears here automatically.',
        steps:['Overview — daily chart, status donut, duration and persona breakdowns','Videos — full list with hook previews and download links','Platforms — usage distribution and optimal time reference','Costs — API spend breakdown and monthly projections','Click Refresh ↻ to pull latest data'],
        tip:'All data persists in Supabase even if Railway restarts.' },
    ],
  },
  {
    id:'email', icon:'📧', title:'Email Notifications', sub:'Alerts when videos finish',
    topics:[
      { title:'Setting up email alerts', desc:'ContentForge emails you automatically — no need to keep the app open.',
        steps:['Sign up free at resend.com — 3,000 emails/month included','API Keys → Create API Key → copy (starts with re_)','Railway → stellar-achievement → Variables → add RESEND_API_KEY and NOTIFY_EMAIL','Email Notifications page → Send test email → check inbox'],
        tip:'You get 3 email types: 🎬 video complete, ⚡ bulk batch done, 📅 scheduled post published.' },
    ],
  },
  {
    id:'mobile', icon:'📱', title:'Using on mobile', sub:'Full phone optimisation guide',
    topics:[
      { title:'Mobile navigation', desc:'ContentForge is fully optimised for phones with touch-friendly controls.',
        steps:['Open contentstudiohub.com in your browser','Log in with your password','Tap ☰ top-left to open the menu','Tap any section — menu closes automatically','Tap outside the menu to close without navigating'],
        tip:'Add to home screen: iPhone — Share → Add to Home Screen. Android — ⋮ → Add to Home Screen.' },
      { title:'Generating on mobile', desc:'The full pipeline works on mobile. Keep your screen on during generation.',
        steps:['Tap AI Video Engine','Type your topic','Scroll down to set duration and platforms','Tap Generate Video ⚡','Tap Result tab to watch progress','Generation takes 3–5 minutes — you can browse away and return','Check Job History for completed videos'],
        tip:'Keep your screen on while generating — some mobile browsers pause when the screen locks.' },
    ],
  },
];

const QUICK = [
  ['Generate a video',    'AI Video Engine → topic → Generate ⚡'],
  ['Generate 10 videos',  'Bulk Generator → base topic → ✦ Generate → Generate X Videos'],
  ['Schedule a post',     'Video Scheduler → select video → time → Schedule Post 📅'],
  ['Write social posts',  'AI Composer → topic → platforms → Generate Posts ⚡'],
  ['Build a VSL',         'AI Video Engine → VSL Builder tab → fill form → Generate VSL ⚡'],
  ['Check analytics',     'Analytics → Overview / Videos / Platforms / Costs'],
  ['Set up email alerts', 'Email Notifications → add Resend key to Railway'],
  ['Sign out',            'Sidebar bottom → Sign out button'],
];

const TROUBLE = [
  ['"Failed to fetch"',       'Railway stellar-achievement is down — check it shows Online at railway.app'],
  ['"Connection error" 0%',   'ANTHROPIC_API_KEY missing — check Railway Variables'],
  ['"ElevenLabs 401"',        'Key has extra text — remove any prefix from the API key'],
  ['0 scene clips',           'RUNWAY_API_KEY missing or credits empty — check runwayml.com'],
  ['Password not working',    'Clear browser storage — F12 → Application → Local Storage → delete cf_auth_v2'],
  ['Netlify not updating',    'Deploys → Trigger deploy → Deploy site after GitHub commits'],
  ['Scheduled posts not firing','Railway must be Online continuously — Restart if stellar-achievement crashed'],
  ['Emails not arriving',     'Check RESEND_API_KEY and NOTIFY_EMAIL in Railway Variables'],
];

export default function Tutorial() {
  const [secIdx, setSec] = useState(0);
  const [topIdx, setTop] = useState(0);
  const [done, setDone]  = useState(new Set());
  const [view, setView]  = useState('guide');
  const [query, setQuery]= useState('');

  const section = SECTIONS[secIdx];
  const topic   = section.topics[topIdx];

  const results = query.trim()
    ? SECTIONS.flatMap((s, si) =>
        s.topics.flatMap((t, ti) =>
          [t.title, t.desc, ...t.steps, t.tip || ''].join(' ').toLowerCase().includes(query.toLowerCase())
            ? [{ si, ti, icon: s.icon, section: s.title, topic: t.title, desc: t.desc }]
            : []
        )
      )
    : [];

  function goNext() {
    if (topIdx < section.topics.length - 1) setTop(t => t + 1);
    else if (secIdx < SECTIONS.length - 1) { setSec(s => s + 1); setTop(0); }
  }

  function goPrev() {
    if (topIdx > 0) setTop(t => t - 1);
    else if (secIdx > 0) { setSec(s => s - 1); setTop(SECTIONS[secIdx - 1].topics.length - 1); }
  }

  function toggleDone() {
    setDone(prev => {
      const next = new Set(prev);
      next.has(secIdx) ? next.delete(secIdx) : next.add(secIdx);
      return next;
    });
  }

  const isFirst = secIdx === 0 && topIdx === 0;
  const isLast  = secIdx === SECTIONS.length - 1 && topIdx === section.topics.length - 1;

  return (
    <div style={{ padding: 24, minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:'var(--color-text-primary, #E8F4F0)', display:'flex', alignItems:'center', gap:10 }}>
            ContentForge Tutorial
            <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(29,158,117,.2)', color:'#5DCAA5', fontWeight:400 }}>Interactive</span>
          </div>
          <div style={{ fontSize:13, color:'var(--color-text-secondary, #7BAAA0)', marginTop:4 }}>
            Complete walkthrough of every feature — step by step
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input
            style={{ padding:'7px 12px', border:'0.5px solid rgba(29,158,117,.3)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'rgba(22,61,106,.8)', color:'#E8F4F0', outline:'none', width:190 }}
            placeholder="Search topics…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {['guide','ref'].map(v => (
            <button key={v} onClick={() => { setView(v); setQuery(''); }}
              style={{ padding:'6px 13px', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', background: view===v&&!query ? 'rgba(29,158,117,.15)' : 'transparent', color: view===v&&!query ? '#5DCAA5' : '#7BAAA0' }}>
              {v === 'guide' ? '📖 Step-by-step' : '⚡ Quick ref'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ flex:1, height:4, background:'rgba(22,61,106,.8)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.round(done.size/SECTIONS.length*100)}%`, background:'#1D9E75', borderRadius:2, transition:'width .4s' }} />
        </div>
        <span style={{ fontSize:11, color:'#7BAAA0', flexShrink:0 }}>{done.size}/{SECTIONS.length} done</span>
      </div>

      {/* Search results */}
      {query && (
        <div style={{ background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
          <div style={{ padding:'11px 14px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          {results.length === 0
            ? <div style={{ padding:20, textAlign:'center', fontSize:13, color:'#7BAAA0' }}>No results — try different keywords</div>
            : results.map((r, i) => (
              <div key={i} onClick={() => { setSec(r.si); setTop(r.ti); setQuery(''); setView('guide'); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom:'0.5px solid rgba(29,158,117,.1)', cursor:'pointer' }}>
                <span style={{ fontSize:16 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{r.section} → {r.topic}</div>
                  <div style={{ fontSize:11, color:'#7BAAA0', marginTop:2 }}>{r.desc.slice(0, 80)}…</div>
                </div>
                <span style={{ fontSize:12, color:'#5DCAA5' }}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Guide view */}
      {!query && view === 'guide' && (
        <div style={{ display:'grid', gridTemplateColumns:'185px 1fr', gap:14 }}>

          {/* Nav */}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => { setSec(i); setTop(0); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', border:`0.5px solid ${i===secIdx?'rgba(29,158,117,.3)':'transparent'}`, borderRadius:9, cursor:'pointer', background: i===secIdx?'rgba(29,158,117,.08)':'transparent', fontFamily:'inherit', width:'100%', minHeight:40 }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'#E8F4F0', flex:1, textAlign:'left' }}>{s.title}</span>
                {done.has(i) && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:10, padding:'13px 16px' }}>
              <span style={{ fontSize:24 }}>{section.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:500, color:'#E8F4F0' }}>{section.title}</div>
                <div style={{ fontSize:12, color:'#7BAAA0', marginTop:2 }}>{section.sub}</div>
              </div>
              <button onClick={toggleDone}
                style={{ fontSize:11, padding:'5px 11px', border:'0.5px solid rgba(29,158,117,.3)', borderRadius:20, background: done.has(secIdx)?'rgba(29,158,117,.15)':'transparent', color: done.has(secIdx)?'#5DCAA5':'#7BAAA0', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                {done.has(secIdx) ? '✓ Done' : 'Mark done'}
              </button>
            </div>

            {/* Topic tabs */}
            {section.topics.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {section.topics.map((t, i) => (
                  <button key={i} onClick={() => setTop(i)}
                    style={{ padding:'5px 12px', border:`0.5px solid ${i===topIdx?'#1D9E75':'rgba(29,158,117,.18)'}`, borderRadius:20, fontSize:11, cursor:'pointer', background: i===topIdx?'rgba(29,158,117,.1)':'transparent', color: i===topIdx?'#5DCAA5':'#7BAAA0', fontFamily:'inherit', fontWeight: i===topIdx?500:400 }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Topic card */}
            <div style={{ background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>{topic.title}</div>
              <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:14, lineHeight:1.6 }}>{topic.desc}</div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {topic.steps.map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(29,158,117,.15)', color:'#5DCAA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, flexShrink:0, marginTop:2 }}>{i+1}</div>
                    <div style={{ fontSize:13, color:'#E8F4F0', lineHeight:1.6, flex:1 }}>{step}</div>
                  </div>
                ))}
              </div>

              {topic.tip && (
                <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.07)', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'11px 13px' }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                  <div style={{ fontSize:13, color:'#5DCAA5', lineHeight:1.6, flex:1 }}>{topic.tip}</div>
                </div>
              )}
            </div>

            {/* Prev / Next */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={goPrev} disabled={isFirst}
                style={{ padding:'7px 14px', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, fontSize:12, cursor: isFirst?'not-allowed':'pointer', background:'transparent', color:'#7BAAA0', fontFamily:'inherit', opacity: isFirst?0.35:1 }}>
                ← Previous
              </button>
              <span style={{ fontSize:11, color:'#4A7A72' }}>{secIdx+1} of {SECTIONS.length} · topic {topIdx+1}/{section.topics.length}</span>
              <button onClick={goNext} disabled={isLast}
                style={{ padding:'7px 18px', border:'none', borderRadius:8, fontSize:12, fontWeight:500, cursor: isLast?'not-allowed':'pointer', background:'#1D9E75', color:'#fff', fontFamily:'inherit', opacity: isLast?0.35:1 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick reference view */}
      {!query && view === 'ref' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {[
            { hdr:'⚡ Quick actions', rows: QUICK.map(([a,h]) => [a,h]) },
          ].map(({ hdr, rows }) => (
            <div key={hdr} style={{ background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{hdr}</div>
              <div style={{ padding:'6px 16px' }}>
                {rows.map(([k, v], i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom: i<rows.length-1?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', flex:1 }}>{k}</span>
                    <span style={{ fontSize:12, color:'#7BAAA0', textAlign:'right', flex:1 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Video types */}
          <div style={{ background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>🎬 Video types</div>
            <div style={{ padding:'6px 16px' }}>
              {[['UGC Persona','First-person review','Affiliate products, apps'],['AI VSL','Hook→Problem→Solution→CTA','High-ticket, courses, SaaS'],['Hybrid VSL','Avatar + B-roll','Mid-ticket products'],['Reel Ads','Short punchy ad','Any product'],['Product Ads','Direct-response','Amazon, Shopify'],['Commercial','Cinematic story','Brand building'],['Competitor Replicator','Copies structure','Proven niches']].map(([t,d,b],i,arr) => (
                <div key={i} style={{ padding:'8px 0', borderBottom: i<arr.length-1?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{t}</span>
                    <span style={{ fontSize:11, color:'#5DCAA5', background:'rgba(29,158,117,.1)', padding:'2px 8px', borderRadius:10 }}>{d}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#4A7A72' }}>Best for: {b}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform limits */}
          <div style={{ background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>📱 Platform limits</div>
            <div style={{ padding:'6px 16px' }}>
              {[['TikTok','10 min','4 GB'],['Instagram Reels','90 sec','1 GB'],['YouTube Shorts','60 sec','256 GB'],['Facebook Reels','90 sec','4 GB'],['Facebook Feed','4 hours','10 GB'],['Reddit','15 min','1 GB']].map(([p,l,s],i,arr) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom: i<arr.length-1?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', width:140, flexShrink:0 }}>{p}</span>
                  <span style={{ fontSize:12, color:'#5DCAA5', width:70 }}>Max {l}</span>
                  <span style={{ fontSize:12, color:'#7BAAA0' }}>{s} max</span>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div style={{ background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>🔧 Troubleshooting</div>
            <div style={{ padding:'6px 16px' }}>
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
