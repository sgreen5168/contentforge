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
];

const QUICK_REF = {
  '⚡ Quick actions': [
    ['Generate a video','AI Video Engine → topic → Generate ⚡'],
    ['Generate 10 videos','Bulk Generator → base topic → Generate X Videos'],
    ['Schedule a post','Video Scheduler → video → time → Schedule Post 📅'],
    ['Write social posts','AI Composer → topic → platforms → Generate Posts ⚡'],
    ['Build a VSL','AI Video Engine → VSL Builder → Generate VSL ⚡'],
    ['Check analytics','Analytics → Overview / Videos / Platforms / Costs'],
    ['Set up emails','Email Notifications → Resend key → test'],
    ['Sign out','Sidebar bottom → Sign out'],
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
  tutorial:'Tutorial', brand:'Brand Voice', compliance:'Compliance',
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
            placeholder="Enter your password" autoFocus autoComplete="current-password"
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
