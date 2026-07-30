import { useState, useEffect } from 'react';

// ── Facebook Post Planner ─────────────────────────────────────────────────────
// Daily scheduled posts across home business, remote work, entrepreneurship,
// cooking, baking, live commerce topics — Facebook-compliant, casual-professional tone

const API = (typeof window !== 'undefined' && window.__CF_API__) || 'https://stellar-achievement-production-ea9d.up.railway.app';

// ── Color tokens ──────────────────────────────────────────────────────────────
const BG   = '#0B1829';
const BG2  = '#112240';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';
const ACCH = '#5DCAA5';
const FB   = '#1877F2';

// ── Topic categories ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:'home-income',    icon:'🏠', label:'Earning from Home',        color:'#1D9E75' },
  { id:'remote-work',    icon:'💻', label:'Remote Work',              color:'#3B82F6' },
  { id:'entrepreneur',   icon:'🚀', label:'Entrepreneurship',         color:'#8B5CF6' },
  { id:'live-commerce',  icon:'📱', label:'Live Business & Commerce', color:'#EF4444' },
  { id:'cooking',        icon:'🍳', label:'Cooking',                  color:'#F59E0B' },
  { id:'baking',         icon:'🧁', label:'Baking',                   color:'#EC4899' },
  { id:'mindset',        icon:'💡', label:'Success Mindset',          color:'#10B981' },
  { id:'side-hustle',    icon:'💰', label:'Side Hustles',             color:'#6366F1' },
];

// ── 30-day post plan ─────────────────────────────────────────────────────────
const POST_PLAN = [
  { day:1,  cat:'home-income',   time:'9:00 AM',  topic:'3 things people are doing from home right now that actually pay', hook:'No office. No commute. Just results.' },
  { day:2,  cat:'entrepreneur',  time:'7:00 PM',  topic:'What separates people who succeed from those who give up', hook:'The difference is smaller than you think.' },
  { day:3,  cat:'cooking',       time:'11:00 AM', topic:'This 15-minute dinner is cheaper than takeout and way better', hook:'Stop ordering food you could make in minutes.' },
  { day:4,  cat:'remote-work',   time:'8:00 AM',  topic:'How to stay productive working from home when distractions hit', hook:'Your couch is not the enemy. Here\'s what is.' },
  { day:5,  cat:'baking',        time:'2:00 PM',  topic:'Beginner bread recipe that actually works every time', hook:'If you can stir, you can bake this bread.' },
  { day:6,  cat:'live-commerce', time:'6:00 PM',  topic:'How people are making money going live on Facebook and TikTok', hook:'Live selling is the fastest-growing income stream right now.' },
  { day:7,  cat:'side-hustle',   time:'10:00 AM', topic:'5 side hustles that require zero startup money', hook:'Starting costs: $0. Potential: real.' },
  { day:8,  cat:'mindset',       time:'7:00 AM',  topic:'Why most people quit before things get good', hook:'The breakthrough usually comes right after the hardest day.' },
  { day:9,  cat:'home-income',   time:'9:00 AM',  topic:'Selling digital products from home — what\'s working in 2026', hook:'Create once. Sell forever. No inventory needed.' },
  { day:10, cat:'cooking',       time:'5:00 PM',  topic:'Budget meal prep that feeds a family of 4 for under $30', hook:'Meal prep isn\'t just for fitness people.' },
  { day:11, cat:'remote-work',   time:'8:00 AM',  topic:'Best remote jobs hiring right now with no experience required', hook:'Companies are still hiring people to work from home.' },
  { day:12, cat:'entrepreneur',  time:'7:00 PM',  topic:'The truth about starting a business nobody tells you', hook:'It\'s messier than the highlight reels show. Here\'s the real picture.' },
  { day:13, cat:'baking',        time:'1:00 PM',  topic:'Simple cookie recipes that sell at markets and online', hook:'People are paying real money for homemade cookies.' },
  { day:14, cat:'live-commerce', time:'6:00 PM',  topic:'How to set up your first Facebook Live selling event', hook:'You don\'t need a studio. Just a phone and a product.' },
  { day:15, cat:'side-hustle',   time:'10:00 AM', topic:'Reselling thrifted items — where to find and what to flip', hook:'Other people\'s discards are becoming real income for smart resellers.' },
  { day:16, cat:'mindset',       time:'7:00 AM',  topic:'Consistency beats motivation every single time', hook:'Motivation fades. Habits stick.' },
  { day:17, cat:'home-income',   time:'9:00 AM',  topic:'Freelancing from home — the skills companies are paying most for', hook:'Businesses are outsourcing these tasks to home workers right now.' },
  { day:18, cat:'cooking',       time:'5:00 PM',  topic:'One-pan recipes that take 20 minutes and taste like effort', hook:'Cooking doesn\'t have to be a production.' },
  { day:19, cat:'remote-work',   time:'8:00 AM',  topic:'How to negotiate remote work if your job isn\'t remote yet', hook:'More companies are open to this than they let on.' },
  { day:20, cat:'entrepreneur',  time:'7:00 PM',  topic:'Starting a home-based service business with what you already know', hook:'Skills you take for granted are worth money to other people.' },
  { day:21, cat:'baking',        time:'2:00 PM',  topic:'How some home bakers turned weekend baking into a real business', hook:'What started as a hobby is now paying real bills.' },
  { day:22, cat:'live-commerce', time:'6:00 PM',  topic:'Products that sell best on Facebook Live in 2026', hook:'Not every product is live-sell friendly. These ones are.' },
  { day:23, cat:'side-hustle',   time:'10:00 AM', topic:'Making money with skills you already have — a practical list', hook:'Most people are sitting on income they haven\'t tapped yet.' },
  { day:24, cat:'mindset',       time:'7:00 AM',  topic:'How to handle self-doubt when building something from scratch', hook:'Doubt is normal. Letting it stop you is optional.' },
  { day:25, cat:'home-income',   time:'9:00 AM',  topic:'Affiliate marketing explained simply — and how to start today', hook:'Recommending products you already use can become passive income.' },
  { day:26, cat:'cooking',       time:'5:00 PM',  topic:'Comfort food recipes that bring people together around the table', hook:'Some meals are more than food. Here are a few of those recipes.' },
  { day:27, cat:'remote-work',   time:'8:00 AM',  topic:'Setting up a productive home workspace on any budget', hook:'A good setup doesn\'t require expensive gear.' },
  { day:28, cat:'entrepreneur',  time:'7:00 PM',  topic:'Building an audience before you have a product to sell', hook:'The audience comes first. The product comes second.' },
  { day:29, cat:'baking',        time:'1:00 PM',  topic:'Sourdough starter guide — the basics that actually work', hook:'Sourdough is having a moment. Here\'s how to join it.' },
  { day:30, cat:'live-commerce', time:'6:00 PM',  topic:'Growing a loyal customer base through live video', hook:'People don\'t just buy products. They buy from people they trust.' },
];

const BEST_TIMES = {
  'home-income':  ['7:00 AM', '9:00 AM', '8:00 PM'],
  'remote-work':  ['7:00 AM', '8:00 AM', '6:00 PM'],
  'entrepreneur': ['6:00 AM', '7:00 PM', '9:00 PM'],
  'live-commerce':['5:00 PM', '6:00 PM', '7:00 PM'],
  'cooking':      ['11:00 AM','5:00 PM', '6:00 PM'],
  'baking':       ['10:00 AM','1:00 PM', '2:00 PM'],
  'mindset':      ['6:00 AM', '7:00 AM', '8:00 PM'],
  'side-hustle':  ['8:00 AM', '10:00 AM','7:00 PM'],
};

export default function ContentCalendar() {
  const [view, setView]           = useState('calendar');  // 'calendar' | 'generate' | 'scheduled'
  const [selectedDay, setDay]     = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [generating, setGen]      = useState(false);
  const [generatedPost, setPost]  = useState(null);
  const [postError, setPostErr]   = useState('');
  const [scheduled, setScheduled] = useState([]);
  const [copied, setCopied]       = useState('');
  const [readingId, setReadingId] = useState(null);
  const [readerPaused, setRdrPaused] = useState(false);
  const [readerRate, setRdrRate]  = useState(1.1);
  const [currentMonth]            = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('cf_fb_scheduled');
    if (saved) try { setScheduled(JSON.parse(saved)); } catch {}
  }, []);

  function saveScheduled(list) {
    setScheduled(list);
    localStorage.setItem('cf_fb_scheduled', JSON.stringify(list));
  }

  function getCat(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }

  const filtered = filterCat === 'all' ? POST_PLAN : POST_PLAN.filter(p => p.cat === filterCat);

  async function generatePost(plan) {
    setGen(true); setPostErr(''); setPost(null);
    const cat = getCat(plan.cat);
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode: 'topic',
          topic: `Facebook post about: ${plan.topic}. Hook: ${plan.hook}. Category: ${cat.label}. Write 150-250 words. Second/third person only — no I/me/my. Casual-professional tone. End with a question. Include 3-5 hashtags. Facebook-compliant — no income guarantees.`,
          style: 'Casual',
          platforms: ['facebook'],
          affiliate: false,
        }),
      });

      // Check for HTML error page (wrong URL or server down)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Server returned an error page — check API connection');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed HTTP ' + res.status);

      // Extract post text from response
      const postText = data.posts?.facebook?.text
        || data.post?.text
        || data.text
        || data.content
        || '';

      if (!postText) throw new Error('No post content in response — try again');
      setPost({ ...plan, content: postText, generatedAt: new Date().toISOString() });
    } catch(e) {
      const msg = e.message || 'Unknown error';
      setPostErr(msg.includes('JSON') ? 'Server connection issue — make sure you are logged in and try again' : msg);
    }
    finally { setGen(false); }
  }

  function schedulePost(post, date) {
    const newPost = { ...post, scheduledDate: date, id: Date.now() };
    const updated = [newPost, ...scheduled];
    saveScheduled(updated);
  }

  function removeScheduled(id) {
    saveScheduled(scheduled.filter(p => p.id !== id));
  }

  function copyPost(text, id) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }

  // ── Post reader functions ────────────────────────────────────────────────────
  async function readPost(id, text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (readingId === id) { setReadingId(null); return; }

    // Clean text for natural reading — remove hashtags and symbols
    const cleaned = text
      .replace(/#\w+/g, '')
      .replace(/[*_~`]/g, '')
      .replace(/📘|🏠|💻|🚀|📱|🍳|🧁|💡|💰|✅|📅|📋|↻|✍️/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.rate  = readerRate;
    utt.pitch = 1.0;

    // Wait for voices to load
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      await new Promise(function(resolve) {
        window.speechSynthesis.onvoiceschanged = function() {
          voices = window.speechSynthesis.getVoices();
          resolve();
        };
        setTimeout(resolve, 1000);
      });
      voices = window.speechSynthesis.getVoices();
    }
    // Pick best natural English voice
    const preferred = voices.find(function(v) {
      return /Samantha|Karen|Daniel|Google US English|Microsoft Aria|Microsoft Jenny|Ava/i.test(v.name);
    }) || voices.find(function(v) { return v.lang === 'en-US'; }) || voices[0];
    if (preferred) utt.voice = preferred;

    utt.onend   = function() { setReadingId(null); setRdrPaused(false); };
    utt.onerror = function() { setReadingId(null); setRdrPaused(false); };
    setReadingId(id);
    setRdrPaused(false);
    window.speechSynthesis.speak(utt);
  }

  function pauseReader()  { window.speechSynthesis.pause();  setRdrPaused(true);  }
  function resumeReader() { window.speechSynthesis.resume(); setRdrPaused(false); }
  function stopReader()   { window.speechSynthesis.cancel(); setReadingId(null); setRdrPaused(false); }

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = (extra = {}) => ({ background: BG2, border: `1px solid ${BORD}`, borderRadius: 12, ...extra });
  const btn  = (active, color = ACC) => ({
    padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 11, fontWeight: active ? 700 : 400,
    border: active ? `2px solid ${color}` : `1px solid ${BORD}`,
    background: active ? `${color}22` : 'transparent',
    color: active ? color : TXT3,
  });

  return (
    <div style={{ padding: 20, maxWidth: 1100, fontFamily: 'inherit', color: TXT }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TXT, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>📘</span> Facebook Post Planner
          </div>
          <div style={{ fontSize: 12, color: TXT3, marginTop: 4 }}>30-day content plan · AI-generated posts · Facebook-compliant</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['calendar','📅 30-Day Plan'],['scheduled','✅ Scheduled'],].map(function(v) {
            return (
              <button key={v[0]} onClick={() => setView(v[0])} style={btn(view === v[0], FB)}>
                {v[1]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
        <button onClick={() => setFilterCat('all')} style={btn(filterCat === 'all')}>👥 All topics</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} style={btn(filterCat === c.id, c.color)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* ── 30-DAY CALENDAR VIEW ─────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Posts planned', value: '30', icon: '📅' },
              { label: 'Topics covered', value: '8', icon: '🎯' },
              { label: 'Avg per week', value: '7', icon: '📊' },
              { label: 'Best time range', value: '7AM–7PM', icon: '⏰' },
            ].map(s => (
              <div key={s.label} style={{ ...card(), padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: ACCH }}>{s.value}</div>
                <div style={{ fontSize: 10, color: TXT3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Post list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(plan => {
              const cat = getCat(plan.cat);
              const isSelected = selectedDay === plan.day;
              const isScheduled = scheduled.some(s => s.day === plan.day);
              return (
                <div key={plan.day} style={{ ...card(), border: isSelected ? `2px solid ${cat.color}` : `1px solid ${BORD}`, overflow: 'hidden', transition: 'all .2s' }}>
                  <div onClick={() => setDay(isSelected ? null : plan.day)}
                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Day badge */}
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${cat.color}22`, border: `1px solid ${cat.color}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: cat.color, fontWeight: 600, textTransform: 'uppercase' }}>Day</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: cat.color }}>{plan.day}</div>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 14 }}>{cat.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: .5 }}>{cat.label}</span>
                        <span style={{ fontSize: 10, color: TXT3 }}>· {plan.time}</span>
                        {isScheduled && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(29,158,117,.15)', color: ACCH }}>✅ Scheduled</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{plan.topic}</div>
                      <div style={{ fontSize: 11, color: TXT3, fontStyle: 'italic', marginTop: 2 }}>"{plan.hook}"</div>
                    </div>
                    {/* Arrow */}
                    <div style={{ fontSize: 16, color: TXT3, transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</div>
                  </div>

                  {/* Expanded panel */}
                  {isSelected && (
                    <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${BORD}` }}>
                      <div style={{ paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Left — details */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Post details</div>
                          <div style={{ fontSize: 12, color: TXT2, marginBottom: 6, lineHeight: 1.6 }}>
                            <strong style={{ color: TXT }}>Topic:</strong> {plan.topic}
                          </div>
                          <div style={{ fontSize: 12, color: TXT2, marginBottom: 6 }}>
                            <strong style={{ color: TXT }}>Suggested time:</strong> {plan.time}
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: TXT3, marginBottom: 4 }}>Best posting times for {cat.label}:</div>
                            <div style={{ display: 'flex', gap: 5 }}>
                              {(BEST_TIMES[plan.cat] || []).map(t => (
                                <span key={t} style={{ padding: '2px 8px', borderRadius: 10, background: `${cat.color}15`, color: cat.color, fontSize: 10, fontWeight: 600 }}>{t}</span>
                              ))}
                            </div>
                          </div>
                          <div style={{ padding: '8px 10px', background: 'rgba(24,119,242,.08)', border: '1px solid rgba(24,119,242,.2)', borderRadius: 8, fontSize: 10, color: 'rgba(24,119,242,.8)', lineHeight: 1.5 }}>
                            📘 <strong>Facebook tip:</strong> Posts with questions get 3x more comments. End this post with a question related to {cat.label.toLowerCase()}.
                          </div>
                        </div>
                        {/* Right — actions */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Actions</div>
                          {!generatedPost || generatedPost.day !== plan.day ? (
                            <button onClick={() => generatePost(plan)} disabled={generating}
                              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: generating ? 'rgba(24,119,242,.3)' : FB, color: 'white', fontSize: 12, fontWeight: 700, cursor: generating ? 'default' : 'pointer', fontFamily: 'inherit', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {generating ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Writing post…</> : '✍️ Generate This Post'}
                            </button>
                          ) : (
                            <div>
                              <div style={{ padding: '10px', background: 'rgba(24,119,242,.06)', border: '1px solid rgba(24,119,242,.2)', borderRadius: 8, marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{generatedPost.content}</div>
                              </div>
                              {/* Reader controls */}
                              <div style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 7, border: `1px solid ${BORD}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: TXT3 }}>🔊 Read Aloud</span>
                                  <div style={{ display: 'flex', gap: 3 }}>
                                    {[['0.9','Slow'],['1.1','Natural'],['1.3','Fast']].map(function(r) {
                                      var active = readerRate === parseFloat(r[0]);
                                      return (
                                        <button key={r[0]} onClick={function() { setRdrRate(parseFloat(r[0])); }}
                                          style={{ padding: '2px 7px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, border: active ? `1px solid ${ACC}` : `1px solid ${BORD}`, background: active ? `${ACC}22` : 'transparent', color: active ? ACCH : TXT3 }}>
                                          {r[1]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  {readingId !== plan.day ? (
                                    <button onClick={function() { readPost(plan.day, generatedPost.content); }}
                                      style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', background: ACC, color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                      ▶ Read Post Aloud
                                    </button>
                                  ) : (
                                    <>
                                      {!readerPaused ? (
                                        <button onClick={pauseReader}
                                          style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', background: '#F5A623', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                          ⏸ Pause
                                        </button>
                                      ) : (
                                        <button onClick={resumeReader}
                                          style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', background: ACC, color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                          ▶ Resume
                                        </button>
                                      )}
                                      <button onClick={stopReader}
                                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        ■ Stop
                                      </button>
                                    </>
                                  )}
                                </div>
                                {readingId === plan.day && (
                                  <div style={{ marginTop: 5, fontSize: 9, color: ACCH, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCH, display: 'inline-block', animation: 'pulse 1s ease infinite' }} />
                                    {readerPaused ? 'Paused' : 'Reading post aloud…'}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => copyPost(generatedPost.content, plan.day)}
                                  style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', background: ACC, color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  {copied === plan.day ? '✓ Copied!' : '📋 Copy Post'}
                                </button>
                                <button onClick={() => schedulePost(generatedPost, new Date().toLocaleDateString())}
                                  style={{ flex: 1, padding: '8px', borderRadius: 7, border: `1px solid ${FB}`, background: 'transparent', color: '#4FA3FF', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  📅 Save to Schedule
                                </button>
                              </div>
                              <button onClick={() => generatePost(plan)}
                                style={{ width: '100%', marginTop: 6, padding: '7px', borderRadius: 7, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ↻ Rewrite
                              </button>
                            </div>
                          )}
                          {postError && <div style={{ marginTop: 8, fontSize: 10, color: '#F09595', padding: '6px 8px', background: 'rgba(226,75,74,.1)', borderRadius: 6 }}>{postError}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Facebook compliance note */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(24,119,242,.05)', border: '1px solid rgba(24,119,242,.15)', borderRadius: 10, fontSize: 11, color: TXT3, lineHeight: 1.7 }}>
            <strong style={{ color: '#4FA3FF' }}>📘 Facebook Content Guidelines</strong> — All generated posts avoid income guarantees, misleading claims, and restricted content. Posts use educational and informational framing. Always review generated content before posting. Avoid posting more than 3-5 times per day to prevent reduced reach.
          </div>
        </div>
      )}

      {/* ── SCHEDULED POSTS VIEW ─────────────────────────────────────────── */}
      {view === 'scheduled' && (
        <div>
          {scheduled.length === 0 ? (
            <div style={{ ...card(), padding: 50, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TXT, marginBottom: 6 }}>No posts scheduled yet</div>
              <div style={{ fontSize: 12, color: TXT3, lineHeight: 1.6 }}>
                Go to the 30-Day Plan, expand any day, generate the post, then click Save to Schedule.
              </div>
              <button onClick={() => setView('calendar')}
                style={{ marginTop: 14, padding: '9px 20px', borderRadius: 8, border: 'none', background: FB, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                View 30-Day Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scheduled.map(post => {
                const cat = getCat(post.cat);
                return (
                  <div key={post.id} style={card({ padding: '14px 16px' })}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {cat.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: cat.color }}>{cat.label}</span>
                          <span style={{ fontSize: 10, color: TXT3 }}>· Day {post.day} · {post.time}</span>
                          <span style={{ fontSize: 10, color: TXT3 }}>· Saved {post.scheduledDate}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 8 }}>{post.topic}</div>
                        <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.7, padding: '8px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 6, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                          {post.content}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => copyPost(post.content, post.id)}
                            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: ACC, color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {copied === post.id ? '✓ Copied!' : '📋 Copy'}
                          </button>
                          {readingId !== post.id ? (
                            <button onClick={function() { readPost(post.id, post.content); }}
                              style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${ACC}`, background: 'transparent', color: ACCH, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              🔊 Read Aloud
                            </button>
                          ) : (
                            <>
                              <button onClick={readerPaused ? resumeReader : pauseReader}
                                style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#F5A623', color: 'white', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {readerPaused ? '▶' : '⏸'}
                              </button>
                              <button onClick={stopReader}
                                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ■ Stop
                              </button>
                            </>
                          )}
                          <button onClick={() => removeScheduled(post.id)}
                            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            🗑 Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }' }} />
    </div>
  );
}
