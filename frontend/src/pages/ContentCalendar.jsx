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
  { id:'side-hustle',    icon:'💰', label:'Side Hustles',              color:'#6366F1' },
  { id:'cooking-biz',    icon:'🍽', label:'Cooking as a Business',     color:'#F97316' },
  { id:'meal-prep',      icon:'🥗', label:'Meal Prep & Food Planning',  color:'#22C55E' },
  { id:'wfh-cooking',    icon:'🏡', label:'Work From Home + Cooking',   color:'#A78BFA' },
  { id:'home-catering',  icon:'🎂', label:'Home Catering & Events',     color:'#FB7185' },
  { id:'food-selling',   icon:'🛒', label:'Selling Food From Home',     color:'#FBBF24' },
];

// ── 30-day post plan ─────────────────────────────────────────────────────────
const POST_PLAN = [
  { day:1,  cat:'home-income',   time:'9:00 AM',  topic:'3 things people are doing from home right now that actually pay', hook:'No office. No commute. Just results.' },
  { day:2,  cat:'entrepreneur',  time:'7:00 PM',  topic:'What separates people who succeed from those who give up', hook:'The difference is smaller than you think.' },
  { day:3,  cat:'cooking',       time:'11:00 AM', topic:'This 15-minute dinner is cheaper than takeout and way better', hook:'Stop ordering food you could make in minutes.' },
  { day:4,  cat:'remote-work',   time:'8:00 AM',  topic:'How to stay productive working from home when distractions hit', hook:"Your couch is not the enemy. Here\'s what is." },
  { day:5,  cat:'baking',        time:'2:00 PM',  topic:'Beginner bread recipe that actually works every time', hook:'If you can stir, you can bake this bread.' },
  { day:6,  cat:'live-commerce', time:'6:00 PM',  topic:'How people are making money going live on Facebook and TikTok', hook:'Live selling is the fastest-growing income stream right now.' },
  { day:7,  cat:'side-hustle',   time:'10:00 AM', topic:'5 side hustles that require zero startup money', hook:'Starting costs: $0. Potential: real.' },
  { day:8,  cat:'mindset',       time:'7:00 AM',  topic:'Why most people quit before things get good', hook:'The breakthrough usually comes right after the hardest day.' },
  { day:9,  cat:'home-income',   time:'9:00 AM',  topic:'Selling digital products from home — what\'s working in 2026', hook:'Create once. Sell forever. No inventory needed.' },
  { day:10, cat:'cooking',       time:'5:00 PM',  topic:'Budget meal prep that feeds a family of 4 for under $30', hook:"Meal prep isn\'t just for fitness people." },
  { day:11, cat:'remote-work',   time:'8:00 AM',  topic:'Best remote jobs hiring right now with no experience required', hook:'Companies are still hiring people to work from home.' },
  { day:12, cat:'entrepreneur',  time:'7:00 PM',  topic:'The truth about starting a business nobody tells you', hook:"It\'s messier than the highlight reels show. Here\'s the real picture." },
  { day:13, cat:'baking',        time:'1:00 PM',  topic:'Simple cookie recipes that sell at markets and online', hook:'People are paying real money for homemade cookies.' },
  { day:14, cat:'live-commerce', time:'6:00 PM',  topic:'How to set up your first Facebook Live selling event', hook:"You don\'t need a studio. Just a phone and a product." },
  { day:15, cat:'side-hustle',   time:'10:00 AM', topic:'Reselling thrifted items — where to find and what to flip', hook:"Other people\'s discards are becoming real income for smart resellers." },
  { day:16, cat:'mindset',       time:'7:00 AM',  topic:'Consistency beats motivation every single time', hook:'Motivation fades. Habits stick.' },
  { day:17, cat:'home-income',   time:'9:00 AM',  topic:'Freelancing from home — the skills companies are paying most for', hook:'Businesses are outsourcing these tasks to home workers right now.' },
  { day:18, cat:'cooking',       time:'5:00 PM',  topic:'One-pan recipes that take 20 minutes and taste like effort', hook:"Cooking doesn\'t have to be a production." },
  { day:19, cat:'remote-work',   time:'8:00 AM',  topic:'How to negotiate remote work if your job isn\'t remote yet', hook:'More companies are open to this than they let on.' },
  { day:20, cat:'entrepreneur',  time:'7:00 PM',  topic:'Starting a home-based service business with what you already know', hook:'Skills you take for granted are worth money to other people.' },
  { day:21, cat:'baking',        time:'2:00 PM',  topic:'How some home bakers turned weekend baking into a real business', hook:'What started as a hobby is now paying real bills.' },
  { day:22, cat:'live-commerce', time:'6:00 PM',  topic:'Products that sell best on Facebook Live in 2026', hook:'Not every product is live-sell friendly. These ones are.' },
  { day:23, cat:'side-hustle',   time:'10:00 AM', topic:'Making money with skills you already have — a practical list', hook:"Most people are sitting on income they haven\'t tapped yet." },
  { day:24, cat:'mindset',       time:'7:00 AM',  topic:'How to handle self-doubt when building something from scratch', hook:'Doubt is normal. Letting it stop you is optional.' },
  { day:25, cat:'home-income',   time:'9:00 AM',  topic:'Affiliate marketing explained simply — and how to start today', hook:'Recommending products you already use can become passive income.' },
  { day:26, cat:'cooking',       time:'5:00 PM',  topic:'Comfort food recipes that bring people together around the table', hook:'Some meals are more than food. Here are a few of those recipes.' },
  { day:27, cat:'remote-work',   time:'8:00 AM',  topic:'Setting up a productive home workspace on any budget', hook:"A good setup doesn\'t require expensive gear." },
  { day:28, cat:'entrepreneur',  time:'7:00 PM',  topic:'Building an audience before you have a product to sell', hook:'The audience comes first. The product comes second.' },
  { day:29, cat:'baking',        time:'1:00 PM',  topic:'Sourdough starter guide — the basics that actually work', hook:"Sourdough is having a moment. Here\'s how to join it." },
  { day:30, cat:'live-commerce',  time:'6:00 PM',  topic:'Growing a loyal customer base through live video', hook:"People don't just buy products. They buy from people they trust." },

  // ── Cooking Business + WFH posts ─────────────────────────────────────────
  { day:31, cat:'cooking-biz',   time:'10:00 AM', topic:'How home cooks are turning their kitchen into a real income stream', hook:'The kitchen table is becoming the new boardroom.' },
  { day:32, cat:'wfh-cooking',   time:'12:00 PM', topic:'The work-from-home schedule that leaves time to cook real meals every day', hook:"Working from home means actually eating well — here's how." },
  { day:33, cat:'meal-prep',     time:'11:00 AM', topic:'Weekend meal prep that saves money and stress all week long', hook:'Two hours on Sunday. Zero cooking stress Monday through Friday.' },
  { day:34, cat:'food-selling',  time:'9:00 AM',  topic:'How to legally sell homemade food from your kitchen in most states', hook:"Cottage food laws are changing. Here's what that means for home cooks." },
  { day:35, cat:'cooking-biz',   time:'7:00 PM',  topic:'Starting a home meal prep delivery service — what you actually need', hook:'People will pay for home-cooked food delivered to their door.' },
  { day:36, cat:'wfh-cooking',   time:'12:00 PM', topic:'Lunch breaks that actually nourish — quick cook recipes for remote workers', hook:"Your lunch break is 30 minutes. Here's what to make." },
  { day:37, cat:'home-catering', time:'2:00 PM',  topic:'How home cooks are building catering side businesses for local events', hook:'Birthday parties. Baby showers. Office lunches. All opportunities.' },
  { day:38, cat:'meal-prep',     time:'11:00 AM', topic:'Freezer meal prep — cook once, eat for a month strategy', hook:'The most underrated time and money saving skill for busy households.' },
  { day:39, cat:'cooking-biz',   time:'9:00 AM',  topic:'Selling meal kits from home — a growing opportunity most people overlook', hook:'Meal kit services make billions. Home cooks can get a piece of that.' },
  { day:40, cat:'wfh-cooking',   time:'6:00 PM',  topic:'Why working from home actually makes you a better cook', hook:"The commute time became kitchen time. Here's what that looks like." },
  { day:41, cat:'food-selling',  time:'10:00 AM', topic:'Baked goods, sauces, and spice blends — what sells best at local markets', hook:'Farmers markets. Online shops. Neighbors. More outlets than most people realize.' },
  { day:42, cat:'home-catering', time:'3:00 PM',  topic:'Building a home catering portfolio with no prior professional experience', hook:'Every dinner party is practice. Every family gathering is a portfolio piece.' },
  { day:43, cat:'meal-prep',     time:'11:00 AM', topic:'Budget-friendly meal prep feeding a family of 4 for under $50 a week', hook:"Grocery bills don't have to spiral. Here's how to take back control." },
  { day:44, cat:'cooking-biz',   time:'7:00 PM',  topic:'Teaching cooking skills online — how home cooks are monetizing their knowledge', hook:"There are people who will pay to learn what's second nature to you." },
  { day:45, cat:'wfh-cooking',   time:'12:00 PM', topic:'The flexible work-from-home lifestyle that puts home cooking back at the center', hook:"Remote work didn't just change where people work. It changed how they eat." },
  { day:46, cat:'baking',        time:'9:00 AM',  topic:'How to start a home bakery business from scratch with no commercial kitchen', hook:"Starting a home bakery sounds like a dream. Here's the reality — and it's better than you think." },
  { day:47, cat:'baking',        time:'7:00 PM',  topic:'What licenses and permits are actually needed to sell baked goods from home', hook:'Licensing a home bakery is simpler than most people assume.' },
  { day:48, cat:'food-selling',  time:'10:00 AM', topic:'How to price homemade baked goods so the business actually makes money', hook:'Home bakers are selling out every weekend. Here is how they price their products.' },
  { day:49, cat:'cooking-biz',   time:'9:00 AM',  topic:'Finding your home bakery niche — custom cakes, bread, cookies, or specialty items', hook:'The home bakery niche is wide open for someone who knows their audience.' },
  { day:50, cat:'baking',        time:'11:00 AM', topic:'How to market a home bakery on Facebook and Instagram with zero ad budget', hook:'Social media turned unknown home bakers into full-time business owners.' },
  { day:51, cat:'food-selling',  time:'2:00 PM',  topic:'Setting up local pickup and delivery for a home bakery without a website', hook:'Local pickup orders changed everything for home bakers.' },
  { day:52, cat:'home-catering', time:'10:00 AM', topic:'How home bakers are landing event and wedding cake orders from their kitchen', hook:'Wedding cakes. Corporate events. Holiday orders. Home bakers are landing all of it.' },
  { day:53, cat:'baking',        time:'7:00 PM',  topic:'Real income milestones home bakery owners hit in their first year', hook:"The first $1,000 from a home bakery feels impossible until it happens." },
  { day:54, cat:'wfh-cooking',   time:'12:00 PM', topic:'Running a home bakery business alongside a full-time remote job', hook:'Baking around a remote work schedule is more doable than it looks.' },
  { day:55, cat:'cooking-biz',   time:'9:00 AM',  topic:'Building a loyal customer base for a home bakery through community and consistency', hook:'Repeat customers are the foundation of every successful home bakery.' },
];
const BEST_TIMES = {
  'home-income':  ['7:00 AM', '9:00 AM', '8:00 PM'],
  'remote-work':  ['7:00 AM', '8:00 AM', '6:00 PM'],
  'entrepreneur': ['6:00 AM', '7:00 PM', '9:00 PM'],
  'live-commerce':['5:00 PM', '6:00 PM', '7:00 PM'],
  'cooking':      ['11:00 AM','5:00 PM', '6:00 PM'],
  'baking':       ['10:00 AM','1:00 PM', '2:00 PM'],
  'mindset':      ['6:00 AM', '7:00 AM', '8:00 PM'],
  'side-hustle':  ['8:00 AM', '10:00 AM', '7:00 PM'],
  'cooking-biz':  ['9:00 AM', '7:00 PM',  '8:00 PM'],
  'meal-prep':    ['10:00 AM','11:00 AM', '6:00 PM'],
  'wfh-cooking':  ['11:00 AM','12:00 PM', '6:00 PM'],
  'home-catering':['10:00 AM','2:00 PM',  '7:00 PM'],
  'food-selling': ['9:00 AM', '10:00 AM', '3:00 PM'],
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
  const [scriptView, setScriptView] = useState(null);   // null | 'write' | 'result'
  const [scriptPlan, setScriptPlan] = useState(null);
  const [generatingScript, setGenScript] = useState(false);
  const [generatedScript, setGenScriptResult] = useState(null);
  const [scriptError, setScriptErr] = useState('');
  const [scriptReading, setScriptReading] = useState(false);
  const [imgPrompts, setImgPrompts]     = useState({});   // day → prompt string
  const [imgUrls, setImgUrls]           = useState({});   // day → image url
  const [imgLoading, setImgLoading]     = useState({});   // day → bool
  const [scriptPaused, setScriptPaused] = useState(false);
  const [scriptRate, setScriptRate] = useState(1.1);
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

  // ── Video script generator ────────────────────────────────────────────────
  // Generate a Pollinations image + prompt for a post topic
  async function generateImagePrompt(plan) {
    const cat = getCat(plan.cat);
    const day = plan.day;
    setImgLoading(prev => ({ ...prev, [day]: true }));

    // Build a visual image prompt from the topic
    const VISUAL_MAP = {
      'home-income':   'cozy home office setup, warm morning light, laptop and coffee, productive atmosphere, no people, cinematic',
      'remote-work':   'modern home workspace, clean desk, dual monitors, natural window light, plants, professional, no people',
      'entrepreneur':  'entrepreneurship concept, notebook with ideas, coffee cup, vision board, inspiring workspace, warm tones, no people',
      'live-commerce': 'smartphone on tripod for live streaming, ring light, products displayed, home studio setup, no people',
      'cooking':       'beautiful food photography, fresh ingredients on wooden cutting board, warm kitchen light, overhead shot',
      'baking':        'rustic baking scene, flour dusted surface, fresh baked goods, warm oven light, cozy kitchen atmosphere',
      'mindset':       'motivational workspace, open notebook with handwriting, sunrise light through window, calm and focused, no people',
      'side-hustle':   'entrepreneur planning concept, sticky notes, laptop, calendar, coffee, flat lay, overhead view, no people',
      'cooking-biz':   'professional home kitchen setup, beautiful plated food, recipe notebook, cooking as business concept, warm light, no people',
      'meal-prep':     'colorful meal prep containers, fresh vegetables, organized refrigerator, healthy food planning, overhead shot, no people',
      'wfh-cooking':   'cozy home office next to kitchen, laptop beside fresh cooking ingredients, work from home lifestyle, warm tones, no people',
      'home-catering': 'elegant home catering spread, beautifully arranged food platters, party setup, decorative serving dishes, no people',
      'food-selling':  'homemade food products arranged for sale, jars of sauces, baked goods packaged professionally, farmers market style, no people',
    };
    const baseVisual = VISUAL_MAP[plan.cat] || 'professional lifestyle photography, warm tones, no people';
    const prompt = `${baseVisual}, ${plan.topic.toLowerCase().replace(/[^a-z0-9 ]/g,'').slice(0,60)}, high quality, Facebook post image, 4K, no text, no watermarks`;

    setImgPrompts(prev => ({ ...prev, [day]: prompt }));

    // Fetch image from our backend
    try {
      const res = await fetch(`${API}/api/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: 1080, height: 1080, n: 1, style: 'lifestyle' }),
      });
      const data = await res.json();
      const url = data.images?.[0]?.url;
      if (url) setImgUrls(prev => ({ ...prev, [day]: url }));
    } catch(e) {
      console.warn('Image generation failed:', e.message);
    }
    setImgLoading(prev => ({ ...prev, [day]: false }));
  }

  async function generateVideoScript(plan) {
    setGenScript(true); setScriptErr(''); setGenScriptResult(null);
    const cat = getCat(plan.cat);
    try {
      const res = await fetch(`${API}/api/video/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode: 'topic',
          topic: plan.topic,
          style: 'Casual',
          persona: 'ugc-persona',
          duration: '30s',
          platforms: ['facebook'],
          videoType: 'ugc-persona',
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) throw new Error('Server connection issue — try again');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Script generation failed');
      const script = data.script;
      if (!script || !script.fullScript) throw new Error('No script content returned');
      setGenScriptResult(script);
      setScriptView('result');
    } catch(e) { setScriptErr(e.message); }
    finally { setGenScript(false); }
  }

  async function readScript(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (scriptReading) { setScriptReading(false); return; }
    const cleaned = text.replace(/#\w+/g,'').replace(/[*_~`]/g,'').replace(/\s+/g,' ').trim();
    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.rate = scriptRate;
    utt.pitch = 1.0;
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      await new Promise(function(r) { window.speechSynthesis.onvoiceschanged = function() { voices = window.speechSynthesis.getVoices(); r(); }; setTimeout(r, 1000); });
      voices = window.speechSynthesis.getVoices();
    }
    const preferred = voices.find(function(v) { return /Samantha|Karen|Daniel|Google US English|Microsoft Aria|Ava/i.test(v.name); })
      || voices.find(function(v) { return v.lang === 'en-US'; }) || voices[0];
    if (preferred) utt.voice = preferred;
    utt.onend = function() { setScriptReading(false); setScriptPaused(false); };
    utt.onerror = function() { setScriptReading(false); setScriptPaused(false); };
    setScriptReading(true); setScriptPaused(false);
    window.speechSynthesis.speak(utt);
  }

  function pauseScript()  { window.speechSynthesis.pause();  setScriptPaused(true);  }
  function resumeScript() { window.speechSynthesis.resume(); setScriptPaused(false); }
  function stopScript()   { window.speechSynthesis.cancel(); setScriptReading(false); setScriptPaused(false); }

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
          {[['calendar','📅 30-Day Plan'],['scheduled','✅ Scheduled'],['videoscript','🎬 Video Scripts'],].map(function(v) {
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
              { label: 'Posts planned', value: '55', icon: '📅' },
              { label: 'Topics covered', value: '13', icon: '🎯' },
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
                          <div style={{ padding: '8px 10px', background: 'rgba(24,119,242,.08)', border: '1px solid rgba(24,119,242,.2)', borderRadius: 8, fontSize: 10, color: 'rgba(24,119,242,.8)', lineHeight: 1.5, marginBottom: 10 }}>
                            📘 <strong>Facebook tip:</strong> Posts with questions get 3x more comments. End this post with a question related to {cat.label.toLowerCase()}.
                          </div>

                          {/* Photo image prompt */}
                          <div style={{ padding: '10px', background: 'rgba(255,255,255,.03)', border: `1px solid ${BORD}`, borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>📸 Photo Prompt</div>
                            {imgUrls[plan.day] ? (
                              <div>
                                <img src={imgUrls[plan.day]} alt="Post visual"
                                  style={{ width: '100%', borderRadius: 7, marginBottom: 6, display: 'block', aspectRatio: '1', objectFit: 'cover' }} />
                                <div style={{ fontSize: 9, color: TXT3, lineHeight: 1.5, marginBottom: 6, fontStyle: 'italic' }}>
                                  Prompt: {imgPrompts[plan.day]}
                                </div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  <button onClick={function() {
                                    const url = imgUrls[plan.day];
                                    if (!url) return;
                                    if (url.startsWith('data:')) {
                                      const a = document.createElement('a'); a.href = url;
                                      a.download = 'post-image-day-' + plan.day + '.jpg';
                                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                    } else {
                                      fetch(url).then(function(r){return r.blob();}).then(function(b){
                                        const bu = URL.createObjectURL(b);
                                        const a = document.createElement('a'); a.href = bu;
                                        a.download = 'post-image-day-' + plan.day + '.jpg';
                                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                        URL.revokeObjectURL(bu);
                                      }).catch(function(){ window.open(url,'_blank'); });
                                    }
                                  }}
                                    style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: ACC, color: 'white', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ⬇ Download
                                  </button>
                                  <button onClick={function() { generateImagePrompt(plan); }}
                                    style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ↻ New
                                  </button>
                                </div>
                              </div>
                            ) : imgLoading[plan.day] ? (
                              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <div style={{ width: 24, height: 24, border: '2px solid rgba(29,158,117,.2)', borderTopColor: ACC, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 6px' }} />
                                <div style={{ fontSize: 10, color: TXT3 }}>Generating image…</div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: 10, color: TXT3, lineHeight: 1.5, marginBottom: 8 }}>
                                  Generate a photo that visually captures this post topic — ready to use on Facebook.
                                </div>
                                <button onClick={function() { generateImagePrompt(plan); }}
                                  style={{ width: '100%', padding: '7px', borderRadius: 7, border: 'none', background: `${cat.color}cc`, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  📸 Generate Post Image
                                </button>
                              </div>
                            )}
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

      {/* ── VIDEO SCRIPT GENERATOR VIEW ─────────────────────────────────── */}
      {view === 'videoscript' && (
        <div>
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(29,158,117,.06)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 4 }}>🎬 30-Second Video Script Generator</div>
            <div style={{ fontSize: 11, color: TXT3, lineHeight: 1.6 }}>Pick any topic from your 30-day plan and generate a ready-to-record 30-second video script. Includes hook, body, and CTA. Read it aloud to preview before recording.</div>
          </div>

          {/* Topic picker */}
          {scriptView !== 'result' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Choose a topic to script</div>
              {(filterCat === 'all' ? POST_PLAN : POST_PLAN.filter(function(p) { return p.cat === filterCat; })).map(function(plan) {
                const cat = getCat(plan.cat);
                const isSelected = scriptPlan && scriptPlan.day === plan.day;
                return (
                  <div key={plan.day} onClick={function() { setScriptPlan(plan); setGenScriptResult(null); setScriptView('write'); setScriptErr(''); }}
                    style={{ padding: '10px 14px', borderRadius: 9, cursor: 'pointer', border: isSelected ? `2px solid ${cat.color}` : `1px solid ${BORD}`, background: isSelected ? `${cat.color}11` : BG2, display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? cat.color : TXT }}>{plan.topic}</div>
                      <div style={{ fontSize: 10, color: TXT3 }}>Day {plan.day} · {cat.label} · {plan.time}</div>
                    </div>
                    {isSelected && <span style={{ fontSize: 16, color: cat.color }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate button */}
          {scriptPlan && scriptView !== 'result' && (
            <div style={{ ...card({ padding: '14px 16px' }), marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TXT, marginBottom: 4 }}>Selected: {getCat(scriptPlan.cat).icon} {scriptPlan.topic}</div>
              <div style={{ fontSize: 11, color: TXT3, marginBottom: 12 }}>Hook: "{scriptPlan.hook}"</div>
              {scriptError && <div style={{ marginBottom: 10, padding: '7px 10px', background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 6, fontSize: 11, color: '#F09595' }}>{scriptError}</div>}
              <button onClick={function() { generateVideoScript(scriptPlan); }} disabled={generatingScript}
                style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: generatingScript ? 'rgba(29,158,117,.3)' : ACC, color: 'white', fontSize: 13, fontWeight: 700, cursor: generatingScript ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {generatingScript
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} /> Writing 30-second script…</>
                  : '🎬 Generate 30-Second Video Script'}
              </button>
            </div>
          )}

          {/* Script result */}
          {scriptView === 'result' && generatedScript && (
            <div style={card({ padding: '16px', border: `2px solid ${ACC}` })}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: ACCH }}>✅ 30-Second Script Ready</div>
                <button onClick={function() { stopScript(); setScriptView('write'); setGenScriptResult(null); }}
                  style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Back
                </button>
              </div>

              {/* Hook */}
              {generatedScript.hook && (
                <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(29,158,117,.08)', border: `1px solid ${ACC}40`, borderRadius: 8, borderLeft: `3px solid ${ACC}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: ACCH, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Hook (first 3 seconds)</div>
                  <div style={{ fontSize: 13, color: TXT, fontWeight: 600, lineHeight: 1.6 }}>{generatedScript.hook}</div>
                </div>
              )}

              {/* Full script */}
              <div style={{ marginBottom: 12, padding: '12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, border: `1px solid ${BORD}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Full 30-Second Script</div>
                <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{generatedScript.fullScript}</div>
              </div>

              {/* Hashtags */}
              {generatedScript.hashtags && generatedScript.hashtags.length > 0 && (
                <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {generatedScript.hashtags.map(function(tag) {
                    return <span key={tag} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(29,158,117,.1)', color: ACCH, fontSize: 10, fontWeight: 600 }}>{tag.startsWith('#') ? tag : '#'+tag}</span>;
                  })}
                </div>
              )}

              {/* Read Aloud */}
              <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, border: `1px solid ${BORD}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: TXT }}>🔊 Read Script Aloud</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[['0.9','Slow'],['1.1','Natural'],['1.3','Fast']].map(function(r) {
                      var active = scriptRate === parseFloat(r[0]);
                      return (
                        <button key={r[0]} onClick={function() { setScriptRate(parseFloat(r[0])); }}
                          style={{ padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, border: active ? `1px solid ${ACC}` : `1px solid ${BORD}`, background: active ? `${ACC}22` : 'transparent', color: active ? ACCH : TXT3 }}>
                          {r[1]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!scriptReading ? (
                    <button onClick={function() { readScript(generatedScript.fullScript); }}
                      style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', background: ACC, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ▶ Read Script Aloud
                    </button>
                  ) : (
                    <>
                      {!scriptPaused ? (
                        <button onClick={pauseScript}
                          style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', background: '#F5A623', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ⏸ Pause
                        </button>
                      ) : (
                        <button onClick={resumeScript}
                          style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', background: ACC, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ▶ Resume
                        </button>
                      )}
                      <button onClick={stopScript}
                        style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                        ■ Stop
                      </button>
                    </>
                  )}
                </div>
                {scriptReading && (
                  <div style={{ marginTop: 6, fontSize: 10, color: ACCH, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCH, display: 'inline-block', animation: 'pulse 1s ease infinite' }} />
                    {scriptPaused ? 'Paused' : 'Reading script — takes ~30 seconds at Natural speed'}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={function() { navigator.clipboard.writeText(generatedScript.fullScript).catch(function(){}); setCopied('script'); setTimeout(function() { setCopied(''); }, 2000); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: ACC, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {copied === 'script' ? '✓ Copied!' : '📋 Copy Full Script'}
                </button>
                <button onClick={function() { generateVideoScript(scriptPlan); }}
                  style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ↻ Rewrite
                </button>
              </div>

              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(29,158,117,.05)', borderRadius: 7, fontSize: 10, color: TXT3, lineHeight: 1.6 }}>
                💡 <strong style={{ color: TXT2 }}>Next step:</strong> Copy this script → go to <strong style={{ color: TXT2 }}>🎬 Video Builder</strong> → paste the topic → click Create Video to generate a full video with voiceover and scenes.
              </div>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }' }} />
    </div>
  );
}
