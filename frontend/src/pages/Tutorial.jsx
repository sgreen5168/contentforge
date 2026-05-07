import React, { useState, useRef, useEffect } from 'react';

const TEAL   = '#1D9E75';
const TEAL2  = '#5DCAA5';
const NAVY   = '#0D2137';
const SURF   = '#102D4F';
const RAISED = '#163D6A';
const BORDER = 'rgba(29,158,117,.18)';
const TEXT   = '#E8F4F0';
const MUTED  = '#7BAAA0';
const DIM    = '#4A7A72';

const SECTIONS = [
  {
    id: 'start', icon: '🚀', title: 'Getting started', sub: 'Login · navigation · dashboard',
    topics: [
      {
        title: 'Logging in',
        desc: 'ContentForge is password protected so only you can access it.',
        steps: [
          'Go to contentstudiohub.com on any device — desktop, tablet, or phone',
          'Type your password: ContentForge2026',
          'Press Enter or tap Sign in →',
          'You stay logged in automatically until you click Sign out',
        ],
        tip: 'On mobile — tap the ☰ hamburger button top-left to open the navigation menu. The sidebar slides in smoothly from the left.',
      },
      {
        title: 'Navigation',
        desc: 'The sidebar has 9 sections. On desktop it is always visible. On mobile it slides in.',
        steps: [
          'Desktop: sidebar always visible on the left side of the screen',
          'Mobile: tap ☰ to open the slide-in navigation menu',
          'Tap any section name to navigate — the page switches instantly',
          'Tap outside the menu (or select a page) to close it on mobile',
          'The footer shows your connected platforms with On/Off status',
        ],
        tip: 'Add ContentForge to your phone home screen: tap Share → Add to Home Screen (iPhone) or Chrome menu → Add to Home Screen (Android) for app-like access.',
      },
    ],
  },
  {
    id: 'composer', icon: '✦', title: 'AI Composer', sub: 'Social posts for all platforms',
    topics: [
      {
        title: 'Writing social posts',
        desc: 'Claude AI writes platform-optimised posts — each platform gets a unique version tailored to its style.',
        steps: [
          'Click AI Composer in the sidebar',
          'Type your topic, product, or idea in the text area',
          'Select which platforms to write for — Facebook, Instagram, Reddit',
          'Choose a tone: Professional, Casual, Humorous, or Inspirational',
          'Click Generate Posts ⚡',
          'Claude writes a unique version for each platform in seconds',
          'Click Copy under any post to copy it to your clipboard',
          'Paste directly into the platform app on your phone',
        ],
        tip: 'Instagram automatically gets hashtags. Reddit gets a conversational tone. Facebook gets longer format. All handled by Claude automatically.',
      },
      {
        title: 'Getting better results',
        desc: 'The more context you give Claude, the better the posts.',
        steps: [
          'Be specific: "5 morning habits that changed my life" beats "productivity"',
          'Mention your product name if promoting something',
          'Include the benefit — not just what it is but what it does',
          'Click Generate Posts again for a completely different set of variations',
          'Mix tones — generate Professional and Casual versions and pick the best',
        ],
        tip: 'Generate 2–3 times and cherry-pick the best lines from each version. Claude writes something new every time.',
      },
    ],
  },
  {
    id: 'video', icon: '▶', title: 'AI Video Engine', sub: 'Full video generation pipeline',
    topics: [
      {
        title: '3 ways to create a video',
        desc: 'You can generate videos from a topic, a URL, or an affiliate link.',
        steps: [
          'TOPIC — type any subject: "morning productivity habits that changed my life"',
          'URL — paste a product page or blog post, Claude reads the page content automatically',
          'AFFILIATE — paste your tracking link, Claude extracts the product and adds your link to the CTA',
        ],
        tip: 'Affiliate mode is the most powerful for monetisation. It automatically adds your tracking link to every call-to-action so every viewer clicks your link.',
      },
      {
        title: 'Smart Mode vs manual',
        desc: 'Smart Mode automatically selects the best video format for your content.',
        steps: [
          'Smart Mode ON (default) — Claude analyses your input and picks the best format',
          'Smart Mode OFF — you manually choose from 7 video types',
          'Toggle is at the top of the left panel labelled Smart mode',
          'The Pipeline tab updates to show the selected format structure',
        ],
        tip: 'Keep Smart Mode ON when starting out. Turn it off once you know exactly which format you need for a specific campaign.',
      },
      {
        title: '7 video types',
        desc: 'Each type produces a different script structure and visual direction.',
        steps: [
          'UGC Persona — authentic first-person review, casual and relatable',
          'AI VSL — Hook → Problem → Solution → Offer → CTA structure',
          'Hybrid VSL — AI avatar sections combined with B-roll footage',
          'Reel Ads — short punchy ads for TikTok, Reels, and Shorts',
          'Product Ads — direct-response e-commerce with price and urgency',
          'Commercial — cinematic brand story with emotional arc',
          'Competitor Replicator — analyses competitor structure, writes original content',
        ],
        tip: 'UGC Persona and Reel Ads work best for affiliate marketing. VSL works best for high-ticket products like courses, SaaS, and coaching.',
      },
      {
        title: 'Duration slider and cost',
        desc: 'Drag the slider to set any duration. The cost estimate updates live.',
        steps: [
          'Drag the slider: 10 seconds to 10 minutes',
          'Use preset buttons — 15s, 30s, 45s, 60s — for quick selection',
          'The dollar amount shown is your API cost, not what you charge users',
          'Platform limits are enforced automatically — YouTube Shorts caps at 60s',
          'An orange warning appears if your duration exceeds a selected platform limit',
          'Selecting multiple platforms sets the limit to the most restrictive one',
        ],
        tip: '30 seconds is the sweet spot for most content. Start with 15s to test the pipeline cheaply before committing to longer videos.',
      },
      {
        title: 'Generating and viewing results',
        desc: 'After clicking Generate Video the full pipeline runs automatically in the background.',
        steps: [
          'Click Generate Video ⚡',
          'Click the Result tab on the right panel',
          'Script appears first — takes about 5 seconds',
          'Voiceover generates next — takes about 10 seconds',
          'Video clips generate last — takes 3 to 5 minutes',
          'A Download button appears when the full video is assembled',
          'Check Job History tab to see all previous generations',
        ],
        tip: 'Even without RunwayML or ElevenLabs connected, you get a full script immediately. You can use it to record manually or with any other tool.',
      },
    ],
  },
  {
    id: 'vsl', icon: '💰', title: 'VSL Builder', sub: 'High-converting sales scripts',
    topics: [
      {
        title: 'Building a Video Sales Letter',
        desc: 'The VSL Builder creates high-converting sales scripts using a proven direct-response framework.',
        steps: [
          'Click AI Video Engine in the sidebar',
          'Click the VSL Builder tab at the top',
          'Enter your product name — e.g. "ProSkin Hydration Serum"',
          'Enter the price — e.g. "$49.99"',
          'Describe your target audience very specifically',
          'Describe the main pain point — be as specific as possible',
          'Describe your solution and what makes it different',
          'Paste your affiliate link if promoting someone else\'s product',
          'Set duration — 30 to 90 seconds recommended for VSLs',
          'Click Generate VSL Script ⚡',
        ],
        tip: '"Struggling with dry skin despite spending $100 on creams that just sit on the surface and wash off" converts far better than "has dry skin". Specificity is everything in direct response.',
      },
    ],
  },
  {
    id: 'bulk', icon: '⚡', title: 'Bulk Generator', sub: 'Up to 10 videos simultaneously',
    topics: [
      {
        title: 'Auto-generate mode',
        desc: 'Type one base topic and Claude creates 10 unique angle variations automatically.',
        steps: [
          'Click Bulk Generator in the sidebar',
          'Select Auto-generate variations mode',
          'Type a base topic — e.g. "morning productivity"',
          'Choose how many: 3, 5, 7, or 10 videos',
          'Click ✦ Generate — Claude creates unique angle variations',
          'Review the topics and edit any you want to change',
          'Set persona, duration, video type, and platforms',
          'Choose concurrency: 1 (cheapest), 2 (balanced), 3 (fastest)',
          'Click Generate X Videos ⚡',
          'Switch to Progress tab to watch all videos generate in real time',
        ],
        tip: 'Concurrency 2 is the sweet spot — runs 2 videos simultaneously, cutting total time roughly in half without overloading the APIs.',
      },
      {
        title: 'Manual mode',
        desc: 'Enter your own 10 topics one by one for full control.',
        steps: [
          'Select Enter topics manually mode',
          'Type a different topic in each numbered field',
          'Leave fields blank to skip that slot',
          'Active topic count shows at the bottom of the list',
          'Click Clear all to start over',
          'Set your settings and click Generate',
        ],
        tip: 'Manual mode is great for batch-producing content for a specific campaign — 10 variations of the same product from different angles.',
      },
    ],
  },
  {
    id: 'scheduler', icon: '📅', title: 'Video Scheduler', sub: 'Auto-post at peak times',
    topics: [
      {
        title: 'Scheduling a post',
        desc: 'Once scheduled, Railway posts your video automatically at the exact time — no manual action needed.',
        steps: [
          'Click Video Scheduler in the sidebar',
          'Select a completed video from the dropdown',
          'Choose which platforms to post to',
          'Click any Optimal time slot to auto-fill the time field',
          'Set the date with the date picker',
          'Review the preview showing exactly when and where it will post',
          'Click Schedule Post 📅',
          'The post appears in the Upcoming tab',
          'At the scheduled time Railway publishes it automatically',
        ],
        tip: 'Railway must be running (stellar-achievement service Online) for auto-posting to work. Check railway.app if posts are not firing at the scheduled time.',
      },
      {
        title: 'Peak posting times',
        desc: 'Each platform has different windows of highest engagement.',
        steps: [
          'TikTok: 7pm daily — Tuesday 8pm is the single best slot',
          'Instagram Reels: 11am daily — Wednesday 11am for highest reach',
          'YouTube Shorts: 3pm daily — Saturday 11am for weekend viewers',
          'Facebook Reels: 1pm daily — Wednesday 1pm',
          'Facebook Feed: 9am daily — Thursday 1pm',
          'Reddit: 8am ET daily — Monday 8am ET for highest weekly traffic',
        ],
        tip: 'These are general research-based guidelines. After a few weeks, check your own platform analytics — your specific audience may have different peak times.',
      },
    ],
  },
  {
    id: 'analytics', icon: '◎', title: 'Analytics', sub: 'Performance, costs, and platform data',
    topics: [
      {
        title: 'Reading the dashboard',
        desc: 'The Analytics dashboard pulls live data from Supabase. Every video you generate appears here automatically.',
        steps: [
          'Click Analytics in the sidebar',
          'Top row shows 6 key metrics with sparkline trend lines',
          'Click Refresh ↻ anytime to pull the latest data',
          'Overview tab — daily volume chart, status donut, duration and persona breakdowns',
          'Videos tab — every video with hook preview, status badge, and download link',
          'Platforms tab — which platforms you use most with distribution charts',
          'Costs tab — full API spend breakdown and monthly projections',
        ],
        tip: 'All data persists in Supabase even if Railway restarts. Your complete history is always safe and always current.',
      },
    ],
  },
  {
    id: 'email', icon: '📧', title: 'Email Notifications', sub: 'Alerts when videos finish',
    topics: [
      {
        title: 'Setting up email alerts',
        desc: 'ContentForge emails you automatically when important events happen — no need to keep the app open.',
        steps: [
          'Go to resend.com and sign up free — 3,000 emails per month included',
          'Click API Keys → Create API Key → copy the key (starts with re_)',
          'Go to railway.app → stellar-achievement → Variables → Raw Editor',
          'Add: RESEND_API_KEY=re_your_key_here',
          'Add: NOTIFY_EMAIL=your@email.com',
          'Click Update Variables — Railway restarts automatically',
          'In ContentForge go to Email Notifications → click Send test email',
          'Check your inbox — should arrive within 30 seconds',
        ],
        tip: 'You get 3 email types: 🎬 video complete (with hook preview and download link), ⚡ bulk batch done (with success rate), 📅 scheduled post published (confirming which platforms).',
      },
    ],
  },
  {
    id: 'mobile', icon: '📱', title: 'Using on mobile', sub: 'Full phone optimisation guide',
    topics: [
      {
        title: 'Mobile navigation',
        desc: 'ContentForge is fully optimised for phones with touch-friendly controls and a slide-in menu.',
        steps: [
          'Open contentstudiohub.com in Safari (iPhone) or Chrome (Android)',
          'Log in with your password',
          'Tap ☰ top-left to open the navigation menu',
          'Tap any section — the menu closes automatically',
          'Tap outside the menu to close without navigating',
          'All buttons are large enough for finger taps',
          'Forms scroll naturally — no horizontal scrolling needed',
        ],
        tip: 'Add to home screen for app-like access: iPhone — tap Share → Add to Home Screen. Android — tap ⋮ menu → Add to Home Screen.',
      },
      {
        title: 'Generating videos on mobile',
        desc: 'The full video generation pipeline works on mobile. Keep your screen on during generation.',
        steps: [
          'Tap AI Video Engine in the navigation menu',
          'Type your topic in the input field',
          'Scroll down to set duration and persona',
          'Select your platform chips',
          'Tap Generate Video ⚡',
          'Tap the Result tab to watch progress',
          'Generation takes 3–5 minutes — you can browse away and come back',
          'Check Job History to see all completed videos',
        ],
        tip: 'Keep your phone screen on while generating — some mobile browsers pause JavaScript when the screen locks, which can interrupt the progress polling.',
      },
    ],
  },
];

const QUICK_ACTIONS = [
  ['Generate a video',       'AI Video Engine → type topic → Generate ⚡'],
  ['Generate 10 videos',     'Bulk Generator → base topic → ✦ Generate → Generate X Videos'],
  ['Schedule a post',        'Video Scheduler → select video → pick time → Schedule Post 📅'],
  ['Write social posts',     'AI Composer → type topic → select platforms → Generate Posts ⚡'],
  ['Build a VSL',            'AI Video Engine → VSL Builder tab → fill form → Generate VSL ⚡'],
  ['Check performance',      'Analytics → Overview / Videos / Platforms / Costs'],
  ['Set up email alerts',    'Email Notifications → add Resend key to Railway → Send test email'],
  ['Open on phone',          'contentstudiohub.com → tap ☰ → navigate'],
];

const TROUBLESHOOT = [
  ['"Failed to fetch"',         'Railway stellar-achievement is down — check it shows Online at railway.app'],
  ['"Connection error" at 0%',  'ANTHROPIC_API_KEY missing or wrong — check Railway Variables'],
  ['"ElevenLabs 401"',          'Key has prefix text — remove "sk_your_key_" from the start of the key'],
  ['0 scene clips generated',   'RUNWAY_API_KEY missing or credits empty — log in to runwayml.com to check'],
  ['Password not working',      'Clear browser local storage — F12 → Application → Local Storage → delete cf_auth_v2'],
  ['Mobile menu not opening',   'Hard refresh: hold Shift + tap reload, or Ctrl+Shift+R on desktop'],
  ['Netlify not updating',      'Deploys → Trigger deploy → Deploy site after every GitHub commit'],
  ['Videos disappearing',       'Normal on Railway restart — Cloudflare R2 keeps permanent copies with R2 URLs'],
  ['Scheduled posts not firing','Railway must be Online continuously — click Restart if stellar-achievement crashed'],
  ['Emails not arriving',       'Check RESEND_API_KEY and NOTIFY_EMAIL in Railway Variables → test from Email page'],
];

export default function Tutorial() {
  const [secIdx, setSec]     = useState(0);
  const [topIdx, setTop]     = useState(0);
  const [done, setDone]      = useState(new Set());
  const [view, setView]      = useState('guide'); // guide | ref
  const [query, setQuery]    = useState('');
  const [results, setResults]= useState([]);
  const searchRef            = useRef(null);

  const section = SECTIONS[secIdx];
  const topic   = section.topics[topIdx];

  function goSection(i) { setSec(i); setTop(0); }

  function goNext() {
    if (topIdx < section.topics.length - 1) setTop(topIdx + 1);
    else if (secIdx < SECTIONS.length - 1) { setSec(secIdx + 1); setTop(0); }
  }

  function goPrev() {
    if (topIdx > 0) setTop(topIdx - 1);
    else if (secIdx > 0) {
      const prev = SECTIONS[secIdx - 1];
      setSec(secIdx - 1);
      setTop(prev.topics.length - 1);
    }
  }

  function toggleDone() {
    const next = new Set(done);
    next.has(secIdx) ? next.delete(secIdx) : next.add(secIdx);
    setDone(next);
  }

  function doSearch(q) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lq = q.toLowerCase();
    const hits = [];
    SECTIONS.forEach((s, si) => {
      s.topics.forEach((t, ti) => {
        const text = [t.title, t.desc, ...t.steps, t.tip || ''].join(' ').toLowerCase();
        if (text.includes(lq)) hits.push({ si, ti, icon: s.icon, section: s.title, topic: t.title, desc: t.desc });
      });
    });
    setResults(hits);
  }

  function goResult(si, ti) {
    setSec(si); setTop(ti);
    setQuery(''); setResults([]);
    setView('guide');
  }

  const isFirst = secIdx === 0 && topIdx === 0;
  const isLast  = secIdx === SECTIONS.length - 1 && topIdx === section.topics.length - 1;
  const progress = Math.round((done.size / SECTIONS.length) * 100);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logoIcon}>⚡</div>
          <div>
            <div style={S.logoText}>ContentForge tutorial <span style={S.badge}>Interactive</span></div>
            <div style={S.logoSub}>Complete guide to every feature — step by step</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <input
            ref={searchRef}
            style={S.search}
            placeholder="Search topics…"
            value={query}
            onChange={e => doSearch(e.target.value)}
          />
          <div style={S.modeTabs}>
            {[['guide','Step-by-step'],['ref','Quick ref']].map(([v,l]) => (
              <button key={v} style={{...S.modeBtn,...(view===v&&!query?S.modeBtnOn:{})}} onClick={()=>{setView(v);setQuery('');setResults([])}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={S.progressRow}>
        <div style={S.progressTrack}><div style={{...S.progressFill,width:progress+'%'}} /></div>
        <span style={S.progressLabel}>{done.size}/{SECTIONS.length} sections done</span>
      </div>

      {/* Search results */}
      {query && (
        <div style={S.searchCard}>
          <div style={S.searchHdr}>{results.length} result{results.length!==1?'s':''} for "{query}"</div>
          {results.length === 0
            ? <div style={S.searchEmpty}>No results — try different keywords</div>
            : results.map((r,i) => (
              <div key={i} style={S.searchRow} onClick={() => goResult(r.si, r.ti)}>
                <span style={{fontSize:16}}>{r.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:TEXT}}>{r.section} → {r.topic}</div>
                  <div style={{fontSize:11,color:MUTED,marginTop:2}}>{r.desc.slice(0,90)}…</div>
                </div>
                <span style={{fontSize:12,color:TEAL2}}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Guide view */}
      {!query && view === 'guide' && (
        <div style={S.guideLayout}>
          {/* Section nav */}
          <div style={S.navCol}>
            {SECTIONS.map((s, i) => (
              <button key={s.id} style={{...S.navBtn,...(i===secIdx?S.navBtnActive:{})}} onClick={() => goSection(i)}>
                <span style={{fontSize:14,flexShrink:0}}>{s.icon}</span>
                <span style={{fontSize:12,color:TEXT,flex:1,textAlign:'left'}}>{s.title}</span>
                {done.has(i) && <span style={{fontSize:11,color:TEAL}}>✓</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={S.content}>
            {/* Section header */}
            <div style={S.contentHdr}>
              <span style={{fontSize:24}}>{section.icon}</span>
              <div>
                <div style={{fontSize:16,fontWeight:500,color:TEXT}}>{section.title}</div>
                <div style={{fontSize:12,color:MUTED,marginTop:2}}>{section.sub}</div>
              </div>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <button
                  style={{...S.doneBtn,...(done.has(secIdx)?S.doneBtnOn:{})}}
                  onClick={toggleDone}
                >
                  {done.has(secIdx) ? '✓ Done' : 'Mark done'}
                </button>
              </div>
            </div>

            {/* Topic tabs */}
            {section.topics.length > 1 && (
              <div style={S.topicTabs}>
                {section.topics.map((t, i) => (
                  <button key={i} style={{...S.topicTab,...(i===topIdx?S.topicTabOn:{})}} onClick={() => setTop(i)}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Topic content */}
            <div style={S.topicCard}>
              <div style={{fontSize:15,fontWeight:500,color:TEXT,marginBottom:6}}>{topic.title}</div>
              <div style={{fontSize:13,color:MUTED,marginBottom:14,lineHeight:1.6}}>{topic.desc}</div>

              <div style={S.stepsList}>
                {topic.steps.map((step, i) => (
                  <div key={i} style={S.stepRow}>
                    <div style={S.stepNum}>{i + 1}</div>
                    <div style={{fontSize:13,color:TEXT,lineHeight:1.6,flex:1}}>{step}</div>
                  </div>
                ))}
              </div>

              {topic.tip && (
                <div style={S.tipBox}>
                  <span style={{fontSize:16,flexShrink:0}}>💡</span>
                  <div style={{fontSize:13,color:TEAL2,lineHeight:1.6,flex:1}}>{topic.tip}</div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={S.navBtns}>
              <button style={{...S.prevBtn,...(isFirst?{opacity:.3}:{})}} onClick={goPrev} disabled={isFirst}>
                ← Previous
              </button>
              <span style={{fontSize:11,color:DIM}}>{secIdx+1} of {SECTIONS.length} · topic {topIdx+1}/{section.topics.length}</span>
              <button style={{...S.nextBtn,...(isLast?{opacity:.3}:{})}} onClick={goNext} disabled={isLast}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick reference view */}
      {!query && view === 'ref' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>

          {/* Quick actions */}
          <div style={S.refCard}>
            <div style={S.refHdr}>⚡ Quick actions</div>
            <div style={S.refBody}>
              {QUICK_ACTIONS.map(([action,how],i) => (
                <div key={i} style={{...S.refRow,...(i===QUICK_ACTIONS.length-1?{border:'none'}:{})}}>
                  <span style={{fontSize:13,fontWeight:500,color:TEXT,flex:1}}>{action}</span>
                  <span style={{fontSize:12,color:MUTED,textAlign:'right',flex:1}}>{how}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video types */}
          <div style={S.refCard}>
            <div style={S.refHdr}>🎬 Video types cheat sheet</div>
            <div style={S.refBody}>
              {[
                ['UGC Persona',          'Authentic first-person review',   'Affiliate products, apps, physical goods'],
                ['AI VSL',               'Hook→Problem→Solution→CTA',       'High-ticket products, courses, SaaS'],
                ['Hybrid VSL',           'Avatar + B-roll mix',             'Mid-ticket products needing demo'],
                ['Reel Ads',             'Short punchy vertical ad',        'Any product — impulse purchases'],
                ['Product Ads',          'Direct-response e-commerce',      'Amazon, Shopify, drop-shipping'],
                ['Commercial',           'Cinematic brand story',           'Brand building, premium launches'],
                ['Competitor Replicator','Copies competitor structure',     'Any niche where competitors are winning'],
              ].map(([type,desc,best],i,arr) => (
                <div key={i} style={{...S.refRow,flexDirection:'column',alignItems:'flex-start',gap:4,...(i===arr.length-1?{border:'none'}:{})}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                    <span style={{fontSize:13,fontWeight:500,color:TEXT}}>{type}</span>
                    <span style={{fontSize:11,color:TEAL2,background:'rgba(29,158,117,.1)',padding:'2px 8px',borderRadius:10}}>{desc}</span>
                  </div>
                  <span style={{fontSize:11,color:DIM}}>Best for: {best}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform limits */}
          <div style={S.refCard}>
            <div style={S.refHdr}>📱 Platform limits</div>
            <div style={S.refBody}>
              {[
                ['TikTok',          'Max 10 min',   '4 GB',   '9:16 vertical'],
                ['Instagram Reels', 'Max 90 sec',   '1 GB',   '9:16 vertical'],
                ['YouTube Shorts',  'Max 60 sec',   '256 GB', '9:16 vertical'],
                ['Facebook Reels',  'Max 90 sec',   '4 GB',   '9:16 vertical'],
                ['Facebook Feed',   'Max 4 hours',  '10 GB',  '16:9 or 1:1'],
                ['Reddit',          'Max 15 min',   '1 GB',   '16:9 or 9:16'],
              ].map(([plat,len,size,fmt],i,arr) => (
                <div key={i} style={{...S.refRow,...(i===arr.length-1?{border:'none'}:{})}}>
                  <span style={{fontSize:13,fontWeight:500,color:TEXT,width:140,flexShrink:0}}>{plat}</span>
                  <span style={{fontSize:12,color:TEAL2,width:90,flexShrink:0}}>{len}</span>
                  <span style={{fontSize:12,color:MUTED,width:60,flexShrink:0}}>{size}</span>
                  <span style={{fontSize:12,color:MUTED}}>{fmt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API costs */}
          <div style={S.refCard}>
            <div style={S.refHdr}>💵 API cost reference</div>
            <div style={S.refBody}>
              {[
                ['Claude AI script',    '$0.01 per video',   'Pay-as-you-go from $5'],
                ['ElevenLabs voice',    '$0.05 per 30 sec',  '$5/mo starter plan'],
                ['RunwayML clips',      '$0.05 per second',  '$10 starter credits'],
                ['Cloudflare R2',       '$0.015 per GB',     '10 GB free per month'],
                ['Supabase database',   'Free',              'Generous free tier'],
                ['Resend email',        'Free',              '3,000 emails per month'],
              ].map(([api,cost,free],i,arr) => (
                <div key={i} style={{...S.refRow,...(i===arr.length-1?{border:'none'}:{})}}>
                  <span style={{fontSize:13,fontWeight:500,color:TEXT,flex:1}}>{api}</span>
                  <span style={{fontSize:12,color:TEAL,width:130,flexShrink:0}}>{cost}</span>
                  <span style={{fontSize:12,color:MUTED,textAlign:'right'}}>{free}</span>
                </div>
              ))}
              <div style={{...S.refRow,border:'none',paddingTop:10,borderTop:`0.5px solid ${BORDER}`,marginTop:6}}>
                <span style={{fontSize:13,fontWeight:500,color:TEXT,flex:1}}>30-second video total</span>
                <span style={{fontSize:16,fontWeight:500,color:TEAL}}>~$1.56</span>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div style={S.refCard}>
            <div style={S.refHdr}>🔧 Troubleshooting</div>
            <div style={S.refBody}>
              {TROUBLESHOOT.map(([problem,fix],i,arr) => (
                <div key={i} style={{...S.refRow,flexDirection:'column',alignItems:'flex-start',gap:4,...(i===arr.length-1?{border:'none'}:{})}}>
                  <span style={{fontSize:12,fontWeight:500,color:'#F09595'}}>⚠ {problem}</span>
                  <span style={{fontSize:12,color:MUTED}}>→ {fix}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const S = {
  page:         { padding:24, minHeight:'100vh', background:NAVY, maxWidth:1200 },
  header:       { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:12 },
  headerLeft:   { display:'flex', alignItems:'center', gap:12 },
  logoIcon:     { width:32, height:32, borderRadius:8, background:TEAL, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:500, flexShrink:0 },
  logoText:     { fontSize:15, fontWeight:500, color:TEXT },
  badge:        { fontSize:10, padding:'2px 7px', borderRadius:10, background:'rgba(29,158,117,.15)', color:TEAL2, marginLeft:7, fontWeight:400 },
  logoSub:      { fontSize:12, color:MUTED, marginTop:2 },
  headerRight:  { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  search:       { padding:'7px 12px', border:`0.5px solid ${BORDER}`, borderRadius:8, fontSize:13, fontFamily:'inherit', color:TEXT, background:RAISED, outline:'none', width:200 },
  modeTabs:     { display:'flex', gap:4 },
  modeBtn:      { padding:'6px 12px', border:`0.5px solid ${BORDER}`, borderRadius:8, fontSize:11, cursor:'pointer', background:'none', color:MUTED, fontFamily:'inherit', transition:'all .15s' },
  modeBtnOn:    { background:'rgba(29,158,117,.12)', borderColor:TEAL, color:TEAL2 },
  progressRow:  { display:'flex', alignItems:'center', gap:10, marginBottom:16 },
  progressTrack:{ flex:1, height:4, background:RAISED, borderRadius:2, overflow:'hidden' },
  progressFill: { height:'100%', background:TEAL, borderRadius:2, transition:'width .4s' },
  progressLabel:{ fontSize:11, color:MUTED, flexShrink:0 },
  searchCard:   { background:SURF, border:`0.5px solid ${BORDER}`, borderRadius:12, overflow:'hidden', marginBottom:14 },
  searchHdr:    { padding:'11px 14px', borderBottom:`0.5px solid ${BORDER}`, fontSize:13, fontWeight:500, color:TEXT },
  searchEmpty:  { padding:'20px', textAlign:'center', fontSize:13, color:MUTED },
  searchRow:    { display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom:`0.5px solid ${BORDER}`, cursor:'pointer', transition:'background .15s' },
  guideLayout:  { display:'grid', gridTemplateColumns:'190px 1fr', gap:14 },
  navCol:       { display:'flex', flexDirection:'column', gap:3 },
  navBtn:       { display:'flex', alignItems:'center', gap:8, padding:'9px 10px', border:`0.5px solid transparent`, borderRadius:9, cursor:'pointer', background:'none', fontFamily:'inherit', transition:'all .15s', width:'100%', minHeight:40 },
  navBtnActive: { background:'rgba(29,158,117,.08)', border:`0.5px solid rgba(29,158,117,.2)` },
  content:      { display:'flex', flexDirection:'column', gap:12 },
  contentHdr:   { display:'flex', alignItems:'center', gap:12, background:SURF, border:`0.5px solid ${BORDER}`, borderRadius:10, padding:'13px 16px' },
  doneBtn:      { fontSize:11, padding:'5px 11px', border:`0.5px solid rgba(29,158,117,.3)`, borderRadius:20, background:'none', color:MUTED, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' },
  doneBtnOn:    { background:'rgba(29,158,117,.15)', color:TEAL2 },
  topicTabs:    { display:'flex', gap:6, flexWrap:'wrap' },
  topicTab:     { padding:'5px 12px', border:`0.5px solid ${BORDER}`, borderRadius:20, fontSize:11, cursor:'pointer', background:'none', color:MUTED, fontFamily:'inherit', transition:'all .15s' },
  topicTabOn:   { borderColor:TEAL, background:'rgba(29,158,117,.1)', color:TEAL2, fontWeight:500 },
  topicCard:    { background:SURF, border:`0.5px solid ${BORDER}`, borderRadius:12, padding:'16px 18px' },
  stepsList:    { display:'flex', flexDirection:'column', gap:8, marginBottom:14 },
  stepRow:      { display:'flex', alignItems:'flex-start', gap:10 },
  stepNum:      { width:22, height:22, borderRadius:'50%', background:'rgba(29,158,117,.15)', color:TEAL2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, flexShrink:0, marginTop:2 },
  tipBox:       { display:'flex', gap:10, background:'rgba(29,158,117,.07)', border:`0.5px solid rgba(29,158,117,.2)`, borderRadius:8, padding:'11px 13px' },
  navBtns:      { display:'flex', alignItems:'center', justifyContent:'space-between' },
  prevBtn:      { padding:'7px 14px', border:`0.5px solid ${BORDER}`, borderRadius:8, fontSize:12, cursor:'pointer', background:'none', color:MUTED, fontFamily:'inherit', transition:'all .15s' },
  nextBtn:      { padding:'7px 18px', border:'none', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', background:TEAL, color:'#fff', fontFamily:'inherit' },
  refCard:      { background:SURF, border:`0.5px solid ${BORDER}`, borderRadius:12, overflow:'hidden' },
  refHdr:       { padding:'12px 16px', borderBottom:`0.5px solid ${BORDER}`, fontSize:13, fontWeight:500, color:TEXT },
  refBody:      { padding:'6px 16px' },
  refRow:       { display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:`0.5px solid ${BORDER}` },
};
