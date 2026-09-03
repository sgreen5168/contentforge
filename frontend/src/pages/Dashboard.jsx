import { useState, useEffect, useRef } from 'react';

const API = (typeof window !== 'undefined' && window.__CF_API__) || 'https://contentforge-production-6e13.up.railway.app';
const VB_API = 'https://contentforge-production-c8d9.up.railway.app';

const BG2  = '#112240';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';
const ACCH = '#5DCAA5';

const TOPICS = [
  { id:'mindset',        cat:'mindset',      label:'Success Mindset',              icon:'💡',
    hook:"The habit that separates people who reach their goals from those who give up.",
    videoType:'motivational', cbSearch:'manifestation self help', amzSearch:'mindset books journal planner',
    trendingTitles:['Habits that changed my life in 30 days','The mindset shift nobody talks about','Why most people never reach their goals'] },

  { id:'wfh-income',     cat:'home-income',  label:'Earning from Home',            icon:'🏠',
    hook:"People are quietly building real income from their home offices — here is how.",
    videoType:'educational', cbSearch:'work from home home business', amzSearch:'home office desk setup ergonomic chair',
    trendingTitles:['How I make money from home (realistic)','Work from home jobs that actually pay well','Side income ideas that work in 2026'] },

  { id:'side-hustle',    cat:'side-hustle',  label:'Side Hustle Ideas',            icon:'💰',
    hook:"The gap between your current income and what you want is smaller than you think.",
    videoType:'educational', cbSearch:'affiliate marketing passive income', amzSearch:'side hustle books budget planner',
    trendingTitles:['Side hustles that made me quit my job','$500 a week from home — realistic breakdown','Side hustle ideas for beginners 2026'] },

  { id:'health-wellness',cat:'health',       label:'Health & Wellness',            icon:'💪',
    hook:"Small daily habits that actually move the needle — no gym membership required.",
    videoType:'educational', cbSearch:'weight loss keto diet intermittent fasting', amzSearch:'fitness tracker resistance bands water bottle',
    trendingTitles:['Lazy girl workout that actually works','Habits that changed my health in 30 days','Morning routine for energy without caffeine'] },

  { id:'meal-prep',      cat:'meal-prep',    label:'Meal Prep Under $50',          icon:'🥗',
    hook:"Two hours on Sunday saves five hours of stress — and your grocery bill.",
    videoType:'educational', cbSearch:'meal planning nutrition guide smoothie', amzSearch:'meal prep containers food scale instant pot',
    trendingTitles:['Full week meal prep under $50','High protein meal prep for beginners','5 ingredient meal prep that lasts all week'] },

  { id:'home-bakery',    cat:'baking',       label:'Home Bakery Business',         icon:'🧁',
    hook:"Your baking skills are probably worth more than you realize.",
    videoType:'educational', cbSearch:'home business blueprint food business', amzSearch:'stand mixer baking pans bakery packaging',
    trendingTitles:['How to start selling baked goods from home','Home bakery income — realistic numbers','What you need to legally sell baked goods'] },

  { id:'financial-tips', cat:'finance',      label:'Financial Freedom Tips',       icon:'💵',
    hook:"The money habits nobody teaches you in school — but everyone wishes they knew.",
    videoType:'educational', cbSearch:'stock market investing wealth building', amzSearch:'personal finance books budget planner',
    trendingTitles:['Money habits that changed my finances','How to save $1000 fast starting now','Budgeting tips that actually work 2026'] },

  { id:'remote-work',    cat:'remote-work',  label:'Remote Work Setup',            icon:'💻',
    hook:"The home office setup that doubled productivity — under $200.",
    videoType:'educational', cbSearch:'freelance writing virtual assistant remote', amzSearch:'standing desk ring light blue light glasses',
    trendingTitles:['Home office setup that changed everything','Work from home setup under $200','Remote work tips nobody tells you'] },

  { id:'live-commerce',  cat:'live-commerce',label:'Live Selling on Facebook',     icon:'📱',
    hook:"Live selling is the fastest growing income stream most people overlook.",
    videoType:'educational', cbSearch:'ecommerce selling online dropshipping', amzSearch:'ring light for streaming phone tripod microphone',
    trendingTitles:['How to start live selling on Facebook','Live selling tips for beginners','Make money live streaming in 2026'] },

  { id:'entrepreneur',   cat:'entrepreneur', label:'Entrepreneur Tips',            icon:'🚀',
    hook:"The truth about starting a business that nobody tells you upfront.",
    videoType:'motivational', cbSearch:'online business startup digital marketing', amzSearch:'business books bestsellers whiteboard planner',
    trendingTitles:['What I wish I knew before starting a business','Entrepreneur habits that actually work','How to start a business with no money'] },

  { id:'lazy-workout',   cat:'health',       label:'Lazy Girl Workout',            icon:'🏋️',
    hook:"You do not need a gym, equipment, or motivation — just 10 minutes.",
    videoType:'educational', cbSearch:'weight loss workout program', amzSearch:'resistance bands yoga mat fitness tracker',
    trendingTitles:['Lazy girl workout routine that works','10 minute workout you can do anywhere','No motivation workout — do this instead'] },

  { id:'morning-routine',cat:'mindset',      label:'Morning Routine for Energy',   icon:'☀️',
    hook:"The 15-minute morning routine that changes how the whole day feels.",
    videoType:'educational', cbSearch:'morning routine productivity', amzSearch:'journal planner water bottle blue light glasses',
    trendingTitles:['Morning routine that changed my energy','15 minute morning routine for busy people','Stop scrolling in the morning — do this instead'] },

  { id:'amazon-finds',   cat:'amazon',       label:'Amazon Product Finds',         icon:'📦',
    hook:"These Amazon finds solve everyday problems in ways you would not expect.",
    videoType:'product-demo', cbSearch:'', amzSearch:'top amazon products kitchen home office',
    trendingTitles:['Amazon finds that changed my daily routine','Products I wish I bought sooner','Amazon hidden gems under $30'] },

  { id:'cooking-biz',    cat:'cooking-biz',  label:'Cooking as a Business',        icon:'🍳',
    hook:"Skills you take for granted are worth real money to other people.",
    videoType:'educational', cbSearch:'food business secrets recipe ebook catering', amzSearch:'chef knife set food containers vacuum sealer',
    trendingTitles:['How to turn cooking into income','Start a food business from your kitchen','Sell food from home — what you need to know'] },

  { id:'niche',          cat:'niche',        label:'Finding Your Niche',           icon:'🎯',
    hook:"Most people try to reach everyone — and end up reaching no one.",
    videoType:'educational', cbSearch:'niche profit blogging content marketing', amzSearch:'camera microphone lighting kit content creator',
    trendingTitles:['How to find your niche in 2026','Content creator tips for beginners','Grow on social media — what actually works'] },

  { id:'air-fryer',      cat:'cooking',      label:'Air Fryer Meals Under 30 Min',  icon:'🍳',
    hook:"Most people think cooking healthy takes hours. An air fryer changes that completely.",
    videoType:'product-demo', cbSearch:'', amzSearch:'air fryer under 100 dual basket',
    trendingTitles:['Air fryer meals that changed how I cook','5 air fryer recipes ready in 15 minutes','Why everyone is buying an air fryer in 2026'] },

  { id:'portable-blender', cat:'health',     label:'Portable Blender Protein Shakes', icon:'🥤',
    hook:"You do not need a big blender or a gym membership to get your protein in every day.",
    videoType:'product-demo', cbSearch:'', amzSearch:'portable blender mini smoothie protein shake',
    trendingTitles:['This $25 blender changed my morning routine','Portable blender protein shake recipes','The mini blender that fits in your bag'] },

  { id:'walking-pad',    cat:'health',       label:'Under Desk Treadmill Tips',      icon:'🚶',
    hook:"Most remote workers sit for 8 hours straight. A walking pad fixes that without leaving your desk.",
    videoType:'educational', cbSearch:'', amzSearch:'under desk treadmill walking pad foldable',
    trendingTitles:['How I walk 10000 steps working from home','Under desk treadmill worth it honest review','Walking pad for home office 2026'] },

  { id:'chipotle-bowl',  cat:'meal-prep',    label:'Chipotle Bowl Meal Prep',      icon:'🥩',
    hook:"Five Chipotle-style steak bowls. Under fifty dollars. Made in your own kitchen.",
    videoType:'product-demo', cbSearch:'meal planning nutrition', amzSearch:'glass meal prep containers food scale',
    trendingTitles:['Homemade Chipotle bowl meal prep under $50','Chipotle steak bowl at home — full recipe','Meal prep that saves $80 a week'] },

  { id:'high-protein',   cat:'meal-prep',    label:'High Protein Meal Prep',       icon:'💪',
    hook:"Most people struggle to hit their protein goals. This fixes it in one Sunday session.",
    videoType:'educational', cbSearch:'nutrition meal planning protein', amzSearch:'meal prep containers food scale instant pot',
    trendingTitles:['High protein meal prep for the week','100g protein a day meal prep','Cheap high protein meal prep 2026'] },

  { id:'budget-meals',   cat:'meal-prep',    label:'Budget Dinners Under $5',      icon:'💵',
    hook:"A full week of dinners for less than you spend on one takeout order.",
    videoType:'educational', cbSearch:'meal planning budget cooking', amzSearch:'instant pot budget meals cookbook',
    trendingTitles:['Dinners under $5 per serving','Budget meal prep for the week','Cheap meals that actually taste good'] },
];

// High-view video strategies built into each topic type
const VIDEO_STRATEGIES = {
  'educational': 'Use a curiosity hook in the first 3 seconds. Reveal a surprising fact or challenge a common belief. Use numbered tips (Top 3, 5 mistakes etc). End with a clear next step.',
  'motivational': 'Open with an emotional story or struggle. Build to a turning point. End with an inspiring call to action that feels personal.',
  'product-demo': 'Start with the PROBLEM not the product. Show the before state. Demo the product solving it. End with social proof and where to get it.',
};

const PIPELINE_STEPS = [
  { id:'post',    icon:'📝', label:'Facebook post',    color:'#1877F2' },
  { id:'script',  icon:'🎬', label:'Video script',     color:'#EF4444' },
  { id:'video',   icon:'▶',  label:'Video (MP4)',      color:'#EF4444' },
  { id:'link',    icon:'🔗', label:'Affiliate link',   color:'#1D9E75' },
  { id:'landing', icon:'🌐', label:'Landing page',     color:'#8B5CF6' },
];

export default function Dashboard({ onNavigate }) {
  const [selectedTopic, setTopic]   = useState(function() {
    try { return JSON.parse(sessionStorage.getItem('cf_cc_topic') || 'null'); } catch { return null; }
  });
  const [running, setRunning]       = useState(false);
  const [pipeline, setPipeline]     = useState({});   // stepId → { status, data, error }
  // Restore results from session if available
  const [results, setResults] = useState(function() {
    try { return JSON.parse(sessionStorage.getItem('cf_cc_results') || 'null'); } catch { return null; }
  });
  const [copied, setCopied]         = useState('');
  const [stats, setStats]           = useState({ posts:0, videos:0, links:0 });
  const [history, setHistory]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_cmd_history') || '[]'); } catch { return []; }
  });
  const [viewingSession, setViewing] = useState(null);
  const [editingPost, setEditingPost]     = useState(false);
  const [editedPost, setEditedPost]       = useState('');
  const [editingScript, setEditingScript] = useState(false);
  const [editedScript, setEditedScript]   = useState('');
  const [reading, setReading]             = useState(null); // 'post' | 'script' | null
  const [readSpeed, setReadSpeed]         = useState(1.0);
  const speechRef                         = useRef(null);
  const [customTopic, setCustomTopic] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [trendSearch, setTrendSearch] = useState('');
  const [trendResults, setTrendResults] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [publishPlatform, setPublishPlatform] = useState(null);
  const [publishMedia, setPublishMedia] = useState(null);
  const [publishMediaPreview, setPublishMediaPreview] = useState(null);
  const [publishMediaType, setPublishMediaType] = useState('');
  const [publishResized, setPublishResized] = useState(null);
  const [publishResizing, setPublishResizing] = useState(false);
  const publishFileRef = useRef(null);
  const [pinMedia, setPinMedia] = useState(null);
  const [platformMedia, setPlatformMedia] = useState({});
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [pinResized, setPinResized] = useState(null);
  const [pinResizing, setPinResizing] = useState(false);
  const [pinMediaPreview, setPinMediaPreview] = useState(null);
  const [pinMediaType, setPinMediaType] = useState('');
  const [indexResult, setIndexResult] = useState(null);
  const [showTopicGuide, setShowTopicGuide] = useState(null); // topic id or null
  const abortRef                    = useRef(false);

  useEffect(() => {
    fetch(API + '/api/affiliate/status')
      .then(r=>r.json())
      .then(d=>setStats(s=>({...s,links:d.library||0})))
      .catch(()=>{});
    const h = JSON.parse(localStorage.getItem('cf_vb_history')||'[]');
    const p = JSON.parse(localStorage.getItem('cf_fb_scheduled')||'[]');
    setStats(s=>({...s,videos:h.filter(v=>v.status==='completed').length,posts:p.length}));
  },[]);

  function updateStep(id, update) {
    setPipeline(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...update } }));
  }

  async function runPipeline(topic) {
    if (running) return;
    setRunning(true);
    abortRef.current = false;
    setResults(null);
    setPipeline({});
    const out = {};

    // ── Step 1: Match affiliate link FIRST so it flows into everything ────────
    updateStep('link', { status:'running' });
    try {
      const r = await fetch(API + '/api/affiliate/match', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ topic: topic.label, category: topic.cat, count:1 }),
      });
      const d = await r.json();
      out.link = d.links?.[0] || null;
      if (out.link) {
        updateStep('link', { status:'done', data: out.link });
      } else {
        updateStep('link', { status:'warn', error:'No affiliate links saved — add links in Affiliate Library' });
      }
    } catch(e) {
      updateStep('link', { status:'warn', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 2: Generate Facebook post with affiliate link woven in naturally ──
    updateStep('post', { status:'running' });
    try {
      const isProductDemo = topic.videoType === 'product-demo';
      const affiliateInstruction = out.link
        ? (isProductDemo
            ? 'This is a PRODUCT DEMO post. Write it as an honest review/demo of: "' + out.link.name + '". Start with the problem it solves. Describe the experience of using it. Include 3 specific benefits. Be conversational and authentic — not salesy. End with: "Get it here: [LANDING_PAGE_URL]" as a placeholder.'
            : 'Naturally weave this affiliate product into the post as a recommendation. Product: "' + out.link.name + '". Write the post so the product mention feels organic — not like an ad. End with: "Full details: [LANDING_PAGE_URL]" as a placeholder.')
        : 'End the post with: "Full details: [LANDING_PAGE_URL]" as a placeholder for the landing page link.';

      const r = await fetch(API + '/api/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode:'topic',
          topic: topic.label + ' — ' + topic.hook + '. ' + affiliateInstruction,
          style:'Casual', platforms:['facebook'], affiliate:false,
        }),
      });
      const d = await r.json();
      const postText = d.posts?.facebook?.text || d.post?.text || d.text || '';
      if (!postText) throw new Error('No post content returned');
      out.post = postText;
      updateStep('post', { status:'done', data: postText });
    } catch(e) {
      updateStep('post', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 3: Generate video script (different angle from post) ─────────────
    updateStep('script', { status:'running' });
    try {
      const videoStrategy = VIDEO_STRATEGIES[topic.videoType] || VIDEO_STRATEGIES['educational'];
      const r = await fetch(API + '/api/video/script', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          inputMode:'topic',
          topic: topic.label + '. Strategy: ' + videoStrategy + (topic.videoType === 'product-demo' ? ' This is a product demo — focus on the product benefits and how it solves problems.' : ''),
          style:'Casual', persona:'ugc-creator',
          duration:'30s', platforms:['youtube'], videoType: topic.videoType || 'ugc-persona',
          affiliateProduct: out.link?.name || '',
          affiliateUrl: out.link?.url || '',
        }),
      });
      const d = await r.json();
      const scriptObj = d.script || d;
      const script = scriptObj?.fullScript || scriptObj?.script || scriptObj?.hook || d?.text || '';
      if (!script) throw new Error('Script generation failed — check Anthropic credits');
      out.script = script;
      out.hook = scriptObj?.hook || '';
      out.youtubeTitle = scriptObj?.title || topic.label;

      // Auto-build YouTube description with affiliate link for instant publishing
      const ytLink = out.link;
      const ytLandingUrl = out.landingUrl || out.landing || '';
      const ytAffLine = ytLink ? ('\n\n🔗 ' + (ytLink.name||'Product mentioned') + ': ' + (ytLink.url||'')) : '';
      const ytDisclosure = ytLink ? '\n(Affiliate link — I may earn a small commission at no extra cost to you)' : '';
      out.youtubeDescription = [
        out.youtubeTitle || topic.label,
        '',
        (out.script || '').slice(0, 500),
        ytAffLine + ytDisclosure,
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        ytLandingUrl ? ('📌 Full details: ' + ytLandingUrl) : '',
        '━━━━━━━━━━━━━━━━━━━━',
        '#' + (topic.id||'content').replace(/-/g,'') + ' #homebusiness #sidehustle #contentcreator',
        '',
        '✅ Subscribe for weekly tips on home business, meal prep, health and lifestyle.',
      ].filter(Boolean).join('\n');

      // Auto-build YouTube tags
      const topicWords = (topic.label||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').split(' ').filter(function(w){ return w.length>2; });
      out.youtubeTags = [...topicWords, 'home business', 'side hustle', 'how to', topic.cat||'lifestyle'].join(', ');
      updateStep('script', { status:'done', data: script });
    } catch(e) {
      updateStep('script', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 4: Build video ───────────────────────────────────────────────────
    updateStep('video', { status:'running' });
    try {
      const vbR = await fetch(VB_API + '/video/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          topic: topic.label,
          length: 30, format: '9:16', voice: 'nova', music: 'uplifting',
          affiliateUrl: out.link?.url || '',
          affiliateCTA: out.link?.name || '',
        }),
      });
      const vbD = await vbR.json();
      if (!vbD.id) throw new Error('Video Builder did not return a job ID');
      out.videoJobId = vbD.id;
      updateStep('video', { status:'building', data: { jobId: vbD.id } });
      let elapsed = 0;
      while (elapsed < 300) {
        await new Promise(r=>setTimeout(r,8000));
        elapsed += 8;
        if (abortRef.current) break;
        const pollR = await fetch(VB_API + '/video/' + vbD.id);
        const pollD = await pollR.json();
        updateStep('video', { status:'building', data: pollD, progress: pollD.progress });
        if (pollD.status === 'completed') {
          out.video = pollD;
          out.videoUrl = VB_API + '/video/' + vbD.id + '/file';
          updateStep('video', { status:'done', data: pollD, url: out.videoUrl });
          break;
        }
        if (pollD.status === 'failed') throw new Error(pollD.step || 'Video generation failed');
      }
      if (!out.video) updateStep('video', { status:'warn', error:'Still processing — check Video Builder tab' });
    } catch(e) {
      updateStep('video', { status:'error', error: e.message });
    }

    if (abortRef.current) { setRunning(false); return; }

    // ── Step 5: Create NichRoute landing page (different content from post) ───
    updateStep('landing', { status:'running' });
    try {
      console.log('Landing page: calling API...');
      const landingR = await fetch(API + '/api/nichroute/create-page', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          topic: topic.label, topicId: topic.id,
          postContent: out.post || '',
          affiliateUrl: out.link?.url || '',
          affiliateName: out.link?.name || '',
          videoUrl: out.videoUrl || '',
          category: topic.cat,
        }),
      });
      console.log('Landing page: response status', landingR.status);
      const landingD = await landingR.json();
      console.log('Landing page: response data', JSON.stringify(landingD).slice(0,200));
      if (landingD.url) {
        console.log('Landing page: URL received', landingD.url);
        out.landingUrl = landingD.url;
        out.landing = landingD.url;
        updateStep('landing', { status:'done', data: landingD.url });

        // Replace [LANDING_PAGE_URL] placeholder in post with real URL
        if (out.post && landingD.url) {
          const nl = String.fromCharCode(10);
          // Clean any duplicate content first
          const halfLen = Math.floor(out.post.length / 2);
          const firstHalf = out.post.slice(0, halfLen);
          const secondHalf = out.post.slice(halfLen);
          if (secondHalf.trim() === firstHalf.trim()) {
            out.post = firstHalf.trim();
          }
          // Replace placeholder or append URL
          console.log('Post includes placeholder:', out.post.includes('[LANDING_PAGE_URL]'));
          if (out.post.includes('[LANDING_PAGE_URL]')) {
            out.post = out.post.replace('[LANDING_PAGE_URL]', landingD.url);
            console.log('Post after replacement:', out.post.slice(-100));
          } else if (!out.post.includes('nichroute.com')) {
            const nl = String.fromCharCode(10);
            out.post = out.post.trimEnd() + nl + nl + 'Full details: ' + landingD.url;
          }
          // Force React to re-render the post immediately with the landing page URL
          setResults(prev => prev ? { ...prev, post: out.post, landingUrl: landingD.url, landing: landingD.url } : out);
          updateStep('post', { status:'done', data: out.post });
        }
      } else {
        throw new Error(landingD.error || 'No URL returned. Response: ' + JSON.stringify(landingD).slice(0,200));
      }
    } catch(e) {
      console.error('Landing page error:', e.message);
      updateStep('landing', { status:'error', error: 'Landing page failed: ' + e.message });
      // Still try to replace placeholder with a note
      if (out.post && out.post.includes('[LANDING_PAGE_URL]')) {
        out.post = out.post.replace('[LANDING_PAGE_URL]', '[Landing page creation failed — retry]');
        updateStep('post', { status:'done', data: out.post });
      }
    }

    // ── Save to history ───────────────────────────────────────────────────────
    const session = {
      id: Date.now(), topic, date: new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
      post: out.post||null, script: out.script||null, link: out.link||null,
      landing: out.landing||null, landingUrl: out.landingUrl||null, videoUrl: out.videoUrl||null,
    };
    const newHistory = [session, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('cf_cmd_history', JSON.stringify(newHistory));

    // ── Save post to scheduled ────────────────────────────────────────────────
    if (out.post) {
      try {
        const scheduled = JSON.parse(localStorage.getItem('cf_fb_scheduled')||'[]');
        scheduled.unshift({ id: Date.now(), topic: topic.label, cat: topic.cat, content: out.post, scheduledDate: new Date().toLocaleDateString(), time: '9:00 AM' });
        localStorage.setItem('cf_fb_scheduled', JSON.stringify(scheduled.slice(0,50)));
        setStats(s=>({...s, posts:s.posts+1}));
      } catch {}
    }

    setResults(out);
    try {
      sessionStorage.setItem('cf_cc_results', JSON.stringify(out));
      sessionStorage.setItem('cf_cc_topic', JSON.stringify(selectedTopic));
    } catch(e) {}
    setRunning(false);
  }

  // Placeholder to avoid duplicate

  async function submitToSearchEngines(url) {
    // Extract landing URL from post text if not directly available
    const landingUrl = url || (function() {
      const match = (results?.post || '').match(/https:\/\/nichroute\.com\/[^\s]+/);
      return match ? match[0] : '';
    })();
    if (!landingUrl || !landingUrl.includes('nichroute.com')) return;
    setIndexing(true); setIndexResult(null);
    try {
      const r = await fetch(API + '/api/index/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: landingUrl, slug: landingUrl.split('slug=')[1] || '' }),
      });
      const d = await r.json();
      setIndexResult(d);
    } catch(e) {
      setIndexResult({ error: e.message });
    }
    setIndexing(false);
  }

  function readAloud(text, type) {
    if (!text) return;
    if (!window.speechSynthesis) { alert('Read Aloud requires Chrome or Edge browser.'); return; }
    window.speechSynthesis.cancel();
    // Clean text for natural reading
    const cleanText = text
      .split('\n').map(line => line
        .replace(/[#*_`]/g, '')
        .replace(/https\S*/g, '')
      ).join(' ').replace(/  +/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Use a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Natural'))
      || voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
      || voices.find(v => v.lang === 'en-US')
      || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate  = readSpeed;
    utterance.pitch = 1.05;  // slightly warmer
    utterance.volume = 1.0;
    utterance.onend = () => setReading(null);
    utterance.onerror = () => setReading(null);
    setReading(type);
    // Small delay to let voice load
    setTimeout(() => window.speechSynthesis.speak(utterance), 100);
  }

  function stopReading() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setReading(null);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(id);
    setTimeout(()=>setCopied(''),2000);
  }

  function downloadLanding(html) {
    const blob = new Blob([html],{type:'text/html'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = (selectedTopic?.id||'page') + '-landing.html';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const stepStatus = (id) => pipeline[id]?.status || 'waiting';
  const stepIcon   = (s) => ({ waiting:'○', running:'⟳', building:'⟳', done:'✅', warn:'⚠️', error:'❌' }[s]||'○');

  const PLATFORM_SPECS = [
    { id:'facebook',   label:'📘 Facebook',   icon:'📘', color:'#1877F2',
      image:'1200×630px (landscape) or 1080×1080px (square)',
      video:'1280×720px min, MP4, under 4GB, 15 sec–240 min',
      ratio:'16:9 or 1:1', url:'https://www.facebook.com' },
    { id:'youtube',    label:'▶ YouTube',     icon:'▶',  color:'#EF4444',
      image:'1280×720px thumbnail (16:9)',
      video:'1920×1080px ideal, MP4/MOV, any length',
      ratio:'16:9', url:'https://studio.youtube.com' },
    { id:'tiktok',     label:'🎵 TikTok',     icon:'🎵', color:'#010101',
      image:'1080×1920px (9:16 vertical)',
      video:'1080×1920px, MP4, 15 sec–10 min, under 500MB',
      ratio:'9:16 vertical', url:'https://www.tiktok.com/upload' },
    { id:'instagram',  label:'📸 Instagram',  icon:'📸', color:'#E1306C',
      image:'1080×1080px (square) or 1080×1350px (portrait)',
      video:'1080×1920px Reels, MP4, 15 sec–90 sec',
      ratio:'1:1 or 4:5 or 9:16', url:'https://www.instagram.com' },
    { id:'pinterest',  label:'📌 Pinterest',  icon:'📌', color:'#E60023',
      image:'1000×1500px (2:3 vertical) — ideal',
      video:'1:1 or 9:16, MP4, 4 sec–15 min',
      ratio:'2:3 vertical', url:'https://pinterest.com/pin/creation/button' },
    { id:'reddit',     label:'🔴 Reddit',     icon:'🔴', color:'#FF4500',
      image:'1200×628px (landscape) recommended',
      video:'1920×1080px max, MP4, under 15 min, under 1GB',
      ratio:'16:9', url:'https://www.reddit.com/submit' },
    { id:'twitter',    label:'𝕏 X/Twitter',  icon:'𝕏',  color:'#000000',
      image:'1200×675px (16:9) or 1200×1200px (1:1)',
      video:'1280×720px, MP4, 2:20 min max, under 512MB',
      ratio:'16:9 or 1:1', url:'https://twitter.com/compose/tweet' },
  ];

  function resizeForPlatform(file, targetW, targetH, callback) {
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
      const ir = img.width / img.height;
      const tr = targetW / targetH;
      let sw, sh, sx, sy;
      if (ir > tr) { sh=img.height; sw=sh*tr; sx=(img.width-sw)/2; sy=0; }
      else { sw=img.width; sh=sw/tr; sx=0; sy=(img.height-sh)/2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      canvas.toBlob(function(blob){ callback(URL.createObjectURL(blob)); }, 'image/jpeg', 0.92);
    };
    img.src = URL.createObjectURL(file);
  }

  // Buyer trends database — products people are actively searching for and buying
  const BUYER_TRENDS = [
    { id:'air-fryer', label:'Air Fryer', volume:'320K', change:'+42%', status:'hot', cat:'cooking', commission:'4.5%', keys:['best air fryer under 100','air fryer dual basket','air fryer recipes'], hook:'5 air fryer meals ready in 15 minutes — no oil needed' },
    { id:'portable-blender', label:'Portable Blender', volume:'89K', change:'+28%', status:'rising', cat:'health', commission:'4.5%', keys:['portable blender for smoothies','mini blender travel','protein shake blender'], hook:'This $25 blender changed the morning protein routine' },
    { id:'walking-pad', label:'Under Desk Treadmill', volume:'145K', change:'+67%', status:'hot', cat:'health', commission:'3%', keys:['walking pad home office','under desk treadmill','foldable treadmill work from home'], hook:'How to walk 10,000 steps without leaving a desk' },
    { id:'meal-prep-containers', label:'Meal Prep Containers', volume:'210K', change:'+8%', status:'steady', cat:'meal-prep', commission:'4.5%', keys:['best meal prep containers','glass meal prep containers','portion control containers'], hook:'5 lunches meal-prepped for $35 — exact breakdown' },
    { id:'resistance-bands', label:'Resistance Bands', volume:'178K', change:'+12%', status:'steady', cat:'health', commission:'3%', keys:['resistance bands with handles','best resistance bands for women','resistance bands home workout'], hook:'Full body workout in 20 minutes — no gym needed' },
    { id:'monitor-light', label:'Monitor Light Bar', volume:'62K', change:'+35%', status:'rising', cat:'remote-work', commission:'3%', keys:['best monitor light bar','screen bar for eye strain','monitor light bar review'], hook:'One desk upgrade that fixed eye strain and looked great' },
    { id:'ninja-creami', label:'Ninja Creami', volume:'96K', change:'+88%', status:'hot', cat:'cooking', commission:'4.5%', keys:['Ninja Creami protein ice cream','Ninja Creami worth it','Ninja Creami recipes'], hook:'High protein ice cream that actually tastes good — 30g per serving' },
    { id:'sunrise-alarm', label:'Sunrise Alarm Clock', volume:'54K', change:'+22%', status:'rising', cat:'health', commission:'3%', keys:['sunrise alarm clock wake up','best wake up light','light therapy alarm'], hook:'How to stop hitting snooze for good — no willpower needed' },
    { id:'weighted-blanket', label:'Weighted Blanket', volume:'165K', change:'+6%', status:'steady', cat:'health', commission:'3%', keys:['best weighted blanket for anxiety','weighted blanket for adults','weighted blanket 15 lbs'], hook:'The one thing that actually helped with sleep anxiety' },
    { id:'food-scale', label:'Digital Food Scale', volume:'73K', change:'+18%', status:'rising', cat:'meal-prep', commission:'4.5%', keys:['best food scale for meal prep','digital kitchen scale grams','food scale for weight loss'], hook:'The $12 kitchen tool that made meal prep actually accurate' },
    { id:'adjustable-dumbbells', label:'Adjustable Dumbbells', volume:'134K', change:'+9%', status:'steady', cat:'health', commission:'3%', keys:['adjustable dumbbells space saving','best adjustable dumbbells home gym','adjustable dumbbells under 300'], hook:'15 dumbbells in the space of one — the only home gym buy worth it' },
    { id:'standing-desk', label:'Standing Desk Converter', volume:'118K', change:'+5%', status:'steady', cat:'remote-work', commission:'3%', keys:['standing desk converter adjustable','best standing desk for home office','standing desk under 200'], hook:'How to fix back pain without leaving a home office' },
    { id:'ring-light', label:'Ring Light with Tripod', volume:'98K', change:'+15%', status:'rising', cat:'side-hustle', commission:'4%', keys:['ring light for content creators','best ring light tripod','ring light for youtube'], hook:'Studio quality video for under $40 — the exact setup' },
    { id:'label-printer', label:'Thermal Label Printer', volume:'44K', change:'+31%', status:'rising', cat:'side-hustle', commission:'4%', keys:['thermal label printer for small business','best label printer Etsy','label printer shipping'], hook:'How to cut shipping time in half with one $80 tool' },
    { id:'milk-frother', label:'Handheld Milk Frother', volume:'67K', change:'+19%', status:'rising', cat:'cooking', commission:'4.5%', keys:['best handheld milk frother','electric frother latte','milk frother under 25'], hook:'A $12 frother that makes café lattes at home every morning' },
    { id:'vegetable-chopper', label:'Vegetable Chopper', volume:'112K', change:'+24%', status:'rising', cat:'cooking', commission:'4.5%', keys:['best vegetable chopper dicer','onion chopper no tears','vegetable chopper for meal prep'], hook:'This $25 chopper cut meal prep time in half' },
    { id:'foam-roller', label:'Foam Roller', volume:'89K', change:'+7%', status:'steady', cat:'health', commission:'3%', keys:['foam roller for back pain','deep tissue foam roller','foam roller for muscle recovery'], hook:'10 minutes of foam rolling that fixes sore muscles overnight' },
    { id:'blue-light-glasses', label:'Blue Light Glasses', volume:'76K', change:'+11%', status:'steady', cat:'remote-work', commission:'3%', keys:['best blue light glasses for screens','blue light blocking glasses computer','blue light glasses for headaches'], hook:'Screen headaches stopped after one simple switch' },
  ];

  function searchTrends(q) {
    setTrendSearch(q);
    if (!q || q.length < 2) { setTrendResults([]); return; }
    const ql = q.toLowerCase();
    const results = BUYER_TRENDS.filter(function(t) {
      return t.label.toLowerCase().includes(ql) ||
             t.cat.toLowerCase().includes(ql) ||
             t.keys.some(function(k){ return k.toLowerCase().includes(ql); }) ||
             t.hook.toLowerCase().includes(ql);
    });
    setTrendResults(results);
  }

  const PUBLISH_PLATFORMS = [
    { id:'youtube',   label:'YouTube Shorts', icon:'▶',  color:'#EF4444', url:'https://studio.youtube.com',        w:1280, h:720,  ratio:'16:9', videoMax:'60 sec for Shorts', imageSize:'1280×720px' },
    { id:'tiktok',    label:'TikTok',         icon:'🎵', color:'#010101', url:'https://www.tiktok.com/upload',     w:1080, h:1920, ratio:'9:16', videoMax:'10 min',            imageSize:'1080×1920px' },
    { id:'instagram', label:'Instagram Reels',icon:'📸', color:'#E1306C', url:'https://www.instagram.com',         w:1080, h:1920, ratio:'9:16', videoMax:'90 sec',            imageSize:'1080×1920px' },
    { id:'pinterest', label:'Pinterest',      icon:'📌', color:'#E60023', url:'https://pinterest.com/pin-builder/', w:1000, h:1500, ratio:'2:3',  videoMax:'15 min',            imageSize:'1000×1500px' },
    { id:'reddit',    label:'Reddit',         icon:'🔴', color:'#FF4500', url:'https://www.reddit.com/submit',     w:1200, h:628,  ratio:'16:9', videoMax:'15 min',            imageSize:'1200×628px' },
    { id:'facebook',  label:'Facebook',       icon:'📘', color:'#1877F2', url:'https://www.facebook.com',          w:1200, h:630,  ratio:'16:9', videoMax:'240 min',           imageSize:'1200×630px' },
  ];

  function resizeForPinterest(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setPinResizing(true);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const TARGET_W = 1000;
      const TARGET_H = 1500;
      canvas.width = TARGET_W;
      canvas.height = TARGET_H;
      const ctx = canvas.getContext('2d');
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TARGET_W, TARGET_H);
      // Calculate cover crop
      const imgRatio = img.width / img.height;
      const targetRatio = TARGET_W / TARGET_H;
      let sw, sh, sx, sy;
      if (imgRatio > targetRatio) {
        sh = img.height;
        sw = sh * targetRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / targetRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
      canvas.toBlob(function(blob) {
        const resizedUrl = URL.createObjectURL(blob);
        setPinResized(resizedUrl);
        setPinResizing(false);
      }, 'image/jpeg', 0.92);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div style={{ padding:20, maxWidth:1000, fontFamily:'inherit', color:TXT }}>

      {/* Header */}
      <div style={{ marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:TXT }}>🚀 Command Center</div>
          <div style={{ fontSize:12, color:TXT3, marginTop:2 }}>Select a topic → everything generates automatically → you just post</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[{l:'Videos',v:stats.videos,i:'🎬',c:'#EF4444'},{l:'Posts saved',v:stats.posts,i:'📝',c:'#1877F2'},{l:'Links',v:stats.links,i:'🔗',c:ACC}].map(s=>(
            <div key={s.l} style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:16 }}>{s.i}</div>
              <div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:9, color:TXT3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer Trends Search */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:showTrends&&trendResults.length>0?8:0 }}>
          <div style={{ flex:1, position:'relative' }}>
            <input
              value={trendSearch}
              onChange={function(e){ searchTrends(e.target.value); setShowTrends(true); }}
              onFocus={function(){ setShowTrends(true); }}
              placeholder="🔍 Search buyer trends — air fryer, meal prep, side hustle, walking pad..."
              style={{ width:'100%', padding:'9px 14px', background:'rgba(22,61,106,.3)', border:`1px solid ${BORD}`, borderRadius:9, fontSize:12, color:TXT, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <button onClick={function(){ setShowTrends(!showTrends); if(!trendSearch) setTrendResults(BUYER_TRENDS.slice(0,6)); }}
            style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${BORD}`, background:'rgba(255,255,255,.05)', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            📈 {showTrends?'Hide':'Show'} Trends
          </button>
        </div>

        {showTrends && (trendResults.length > 0 || !trendSearch) && (
          <div style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', borderBottom:`1px solid ${BORD}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:TXT2 }}>
                {trendSearch ? (trendResults.length + ' results for "' + trendSearch + '"') : '📈 Trending buyer searches right now'}
              </div>
              <button onClick={function(){ if(!trendSearch) setTrendResults(BUYER_TRENDS.slice(0,6)); }}
                style={{ fontSize:10, color:TXT3, background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                Show all {BUYER_TRENDS.length}
              </button>
            </div>
            <div style={{ maxHeight:320, overflowY:'auto' }}>
              {(trendSearch ? trendResults : (trendResults.length>0 ? trendResults : BUYER_TRENDS.slice(0,6))).map(function(t){
                const statusColor = t.status==='hot'?'#EF4444':t.status==='rising'?'#10B981':'rgba(255,255,255,.4)';
                const statusLabel = t.status==='hot'?'🔥 Hot':t.status==='rising'?'📈 Rising':'→ Steady';
                return (
                  <div key={t.id} style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:TXT }}>{t.label}</div>
                        <span style={{ fontSize:10, color:statusColor, fontWeight:600 }}>{statusLabel}</span>
                        <span style={{ fontSize:10, color:'rgba(16,185,129,.8)', fontWeight:600 }}>{t.change}</span>
                        <span style={{ fontSize:10, color:TXT3 }}>{t.volume}/mo</span>
                      </div>
                      <div style={{ fontSize:10, color:TXT3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        💡 {t.hook}
                      </div>
                      <div style={{ fontSize:9, color:'rgba(79,163,255,.7)', marginTop:3 }}>
                        🔍 {t.keys[0]}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                      <div style={{ fontSize:10, color:'rgba(16,185,129,.8)', textAlign:'right' }}>{t.commission} comm.</div>
                      <button
                        onClick={function(){
                          const match = TOPICS.find(function(tp){ return tp.cat===t.cat || tp.id===t.id; });
                          if (match) { setTopic(match); setShowTrends(false); setTrendSearch(''); setTrendResults([]); }
                          else { setCustomTopic(t.label); setShowTrends(false); }
                        }}
                        style={{ padding:'4px 10px', borderRadius:6, border:'none', background:GRN, color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        ⚡ Use
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:'8px 12px', fontSize:10, color:TXT3, borderTop:`1px solid ${BORD}` }}>
              Data based on Amazon search volume patterns · Updated regularly · Commission rates are Amazon Associates standard rates
            </div>
          </div>
        )}
      </div>

      {/* How it works strip */}
      <div style={{ display:'flex', gap:0, marginBottom:16, background:BG2, border:`1px solid ${BORD}`, borderRadius:10, overflow:'hidden' }}>
        {[['1','Type or pick a topic',''],['→','',''],['2','Post + Video + Landing page',''],['→','',''],['3','Review & publish','']].map((s,i)=>(
          <div key={i} style={{ flex:s[1]?1:0, padding:s[1]?'10px 8px':'10px 4px', textAlign:'center' }}>
            {s[0]==='→' ? <div style={{ color:TXT3, fontSize:16 }}>→</div> : (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:ACCH }}>{s[0]}</div>
                <div style={{ fontSize:11, color:TXT2 }}>{s[1]}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Session History */}
      {!running && history.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:TXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>📋 Previous Sessions — click to retrieve</span>
            <button onClick={()=>{ setHistory([]); localStorage.removeItem('cf_cmd_history'); }}
              style={{ background:'none', border:'none', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
              Clear history
            </button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {history.slice(0,6).map((session, idx) => (
              <button key={session.id} onClick={()=>{
                  setResults({ post:session.post, script:session.script, link:session.link, landing:session.landing, videoUrl:session.videoUrl });
                  setTopic(session.topic);
                  setViewing(idx);
                }}
                style={{ padding:'7px 12px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', border:`1px solid ${BORD}`, background: viewingSession===idx ? 'rgba(29,158,117,.1)' : 'rgba(255,255,255,.03)', transition:'all .15s' }}>
                <div style={{ fontSize:11, fontWeight:700, color: viewingSession===idx ? ACCH : TXT }}>{session.topic?.icon} {session.topic?.label}</div>
                <div style={{ fontSize:9, color:TXT3 }}>{session.date} · {session.time}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic selector */}
      {!running && !results && (
        <div>
          {/* Free text topic input */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:TXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Type your own topic</div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={customTopic} onChange={function(e){setCustomTopic(e.target.value);}}
                onKeyDown={function(e){ if(e.key==='Enter'&&customTopic.trim()) setTopic({id:'custom',cat:'general',label:customTopic.trim(),icon:'✍️',hook:customTopic.trim()}); }}
                placeholder="e.g. how to start a home bakery in 2026, meal prep for busy families..."
                style={{ flex:1, padding:'10px 14px', borderRadius:9, border:`1px solid ${BORD}`, background:'rgba(255,255,255,.04)', color:TXT, fontSize:12, fontFamily:'inherit', outline:'none' }}
              />
              <button onClick={function(){if(customTopic.trim()) setTopic({id:'custom',cat:'general',label:customTopic.trim(),icon:'✍️',hook:customTopic.trim()});}}
                disabled={!customTopic.trim()}
                style={{ padding:'10px 18px', borderRadius:9, border:'none', background:customTopic.trim()?ACC:'rgba(29,158,117,.3)', color:'white', fontSize:12, fontWeight:700, cursor:customTopic.trim()?'pointer':'default', fontFamily:'inherit' }}>
                Use →
              </button>
            </div>
            <div style={{ fontSize:10, color:TXT3, marginTop:4 }}>Press Enter or click Use → then click ⚡ Generate Everything</div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:TXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Or choose a preset topic</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
            {TOPICS.map(t=>(
              <button key={t.id} onClick={()=>setTopic(t.id===selectedTopic?.id ? null : t)}
                style={{ padding:'12px 6px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', textAlign:'center', border: selectedTopic?.id===t.id ? `2px solid ${ACC}` : `1px solid ${BORD}`, background: selectedTopic?.id===t.id ? 'rgba(29,158,117,.15)' : 'rgba(255,255,255,.03)', transition:'all .15s', boxShadow: selectedTopic?.id===t.id ? `0 0 14px rgba(29,158,117,.3)` : 'none' }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{t.icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color: selectedTopic?.id===t.id ? ACCH : TXT2, lineHeight:1.3 }}>{t.label}</div>
              </button>
            ))}
          </div>

          {selectedTopic && (
            <div style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:28 }}>{selectedTopic.icon}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:TXT }}>{selectedTopic.label}</div>
                  <div style={{ fontSize:11, color:TXT3, fontStyle:'italic' }}>"{selectedTopic.hook}"</div>
                </div>
              </div>
              {selectedTopic.trendingTitles && (
                <div style={{ marginBottom:12, padding:'10px 12px', background:'rgba(255,153,0,.06)', border:'1px solid rgba(255,153,0,.2)', borderRadius:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>🔥 Trending video titles for this topic — click to use</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {selectedTopic.trendingTitles.map(function(title, i) {
                      return (
                        <button key={i} onClick={function(){ copy(title, 'trending_'+i); }}
                          style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,153,0,.2)', background:'rgba(255,153,0,.05)', color:TXT2, fontSize:10, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                          {copied==='trending_'+i ? '✓ Copied!' : '📋 ' + title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ fontSize:11, color:TXT2, lineHeight:1.7, marginBottom:14, padding:'10px 12px', background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', borderRadius:8 }}>
                <strong style={{ color:ACCH }}>What ContentForge will do automatically:</strong><br/>
                📝 Write a Facebook post about this topic<br/>
                🎬 Generate a 30-second video script and produce the MP4<br/>
                🔗 Find and embed the best matching affiliate link<br/>
                🌐 Build a landing page with your post and affiliate CTA<br/>
                <strong style={{ color:TXT3 }}>You just review and post.</strong>
              </div>
              <button onClick={()=>runPipeline(selectedTopic)}
                style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', background:ACC, color:'white', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 16px rgba(29,158,117,.4)' }}>
                ⚡ Generate Everything for "{selectedTopic.label}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pipeline progress */}
      {running && (
        <div style={{ background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:TXT, marginBottom:16 }}>
            ⚡ Generating everything for "{selectedTopic?.label}"…
          </div>
          {PIPELINE_STEPS.map(step=>{
            const s = stepStatus(step.id);
            const p = pipeline[step.id];
            return (
              <div key={step.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${BORD}` }}>
                <div style={{ fontSize:18, width:24, textAlign:'center', animation: s==='running'||s==='building' ? 'spin .8s linear infinite' : 'none' }}>
                  {s==='waiting' ? '○' : s==='done' ? '✅' : s==='error' ? '❌' : s==='warn' ? '⚠️' : step.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:TXT }}>{step.label}</div>
                  {s==='running' || s==='building' ? (
                    <div style={{ fontSize:10, color:ACCH }}>
                      {s==='building' && p?.data?.step ? p.data.step : 'Working…'}
                      {s==='building' && p?.progress ? ` (${p.progress}%)` : ''}
                    </div>
                  ) : s==='done' ? (
                    <div style={{ fontSize:10, color:ACCH }}>Complete ✓</div>
                  ) : s==='error' ? (
                    <div style={{ fontSize:10, color:'#F09595' }}>{p?.error}</div>
                  ) : (
                    <div style={{ fontSize:10, color:TXT3 }}>Waiting…</div>
                  )}
                </div>
                {(s==='running'||s==='building') && (
                  <div style={{ width:80, height:4, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:step.color, borderRadius:2, animation:'progress-bar 1.5s ease-in-out infinite' }} />
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={()=>{ abortRef.current=true; setRunning(false); }}
            style={{ marginTop:14, padding:'7px 14px', borderRadius:7, border:'1px solid rgba(226,75,74,.3)', background:'transparent', color:'#F09595', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Results — review and post */}
      {results && !running && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:TXT }}>✅ Everything is ready — review and post</div>
            <button onClick={()=>{ setResults(null); setTopic(null); setPipeline({}); setViewing(null);
        try { sessionStorage.removeItem('cf_cc_results'); sessionStorage.removeItem('cf_cc_topic'); } catch(e) {} }}
              style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              ↺ Start over
            </button>
          </div>

          {/* Facebook post */}
          <div style={{ background:BG2, border:'1px solid rgba(24,119,242,.3)', borderRadius:12, marginBottom:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(24,119,242,.06)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#4FA3FF' }}>📘 Facebook Post — landing page URL included ✓</span>
              <button onClick={()=>copy(results.post||'','post')}
                style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#1877F2', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='post'?'✓ Copied!':'📋 Copy Post'}
              </button>
            </div>
            {editingPost ? (
              <div style={{ padding:'12px 14px' }}>
                <textarea value={editedPost} onChange={e=>setEditedPost(e.target.value)} rows={8}
                  style={{ width:'100%', background:'rgba(22,61,106,.5)', border:'1px solid rgba(24,119,242,.3)', borderRadius:8, padding:10, fontSize:12, color:TXT, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box' }} />
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <button onClick={()=>{ results.post=editedPost; setEditingPost(false); }}
                    style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#1877F2', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Save</button>
                  <button onClick={()=>setEditingPost(false)}
                    style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ padding:'12px 14px', fontSize:12, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:180, overflow:'auto' }}>
                {results.post || 'Post generation failed — try again'}
              </div>
            )}
            <div style={{ padding:'8px 14px', borderTop:`1px solid ${BORD}`, display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
              <button onClick={()=>{ if(reading==='post') stopReading(); else readAloud(results.post||'','post'); }}
                style={{ padding:'5px 12px', borderRadius:6, border:'none', background:reading==='post'?'#EF4444':'rgba(24,119,242,.2)', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {reading==='post' ? '⏹ Stop' : '🔊 Read Post Aloud'}
              </button>
              {reading==='post' && [0.8,0.9,1.0,1.1,1.2,1.3].map(s=>(
                <button key={s} onClick={()=>{ setReadSpeed(s); stopReading(); setTimeout(()=>readAloud(results.post||'','post'),100); }}
                  style={{ padding:'3px 7px', borderRadius:4, border:`1px solid ${readSpeed===s?'#1877F2':BORD}`, background:readSpeed===s?'rgba(24,119,242,.2)':'transparent', color:readSpeed===s?'#4FA3FF':TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                  {s}x
                </button>
              ))}
              <button onClick={()=>{ setEditedPost(results.post||''); setEditingPost(true); }}
                style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
                ✏️ Edit Post
              </button>
            </div>
          </div>

          {/* Video script */}
          {results.script && (
            <div style={{ background:BG2, border:'1px solid rgba(239,68,68,.3)', borderRadius:12, marginBottom:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(239,68,68,.06)' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#FC8F8F' }}>🎬 Video Script (30 seconds)</span>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>copy(results.script,'script')}
                    style={{ padding:'5px 12px', borderRadius:6, border:'1px solid rgba(239,68,68,.3)', background:'transparent', color:'#FC8F8F', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied==='script'?'✓ Copied!':'📋 Copy Script'}
                  </button>
                  <button onClick={()=>onNavigate&&onNavigate('video')}
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'#EF4444', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    📺 YouTube Studio
                  </button>
                </div>
              </div>
              {editingScript ? (
                <div style={{ padding:'12px 14px' }}>
                  <textarea value={editedScript} onChange={e=>setEditedScript(e.target.value)} rows={6}
                    style={{ width:'100%', background:'rgba(22,61,106,.5)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, padding:10, fontSize:11, color:TXT, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.7 }} />
                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                    <button onClick={()=>{ if(results) results.script=editedScript; setEditingScript(false); }}
                      style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#EF4444', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      ✓ Save edits
                    </button>
                    <button onClick={()=>setEditingScript(false)}
                      style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'12px 14px', fontSize:11, color:TXT2, lineHeight:1.7, maxHeight:120, overflow:'auto' }}>
                  {results.script}
                </div>
              )}
              {/* Script reader controls */}
              <div style={{ padding:'8px 14px', borderTop:`1px solid ${BORD}`, display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={()=>{ if(reading==='script') stopReading(); else readAloud(results.script||'','script'); }}
                  style={{ padding:'5px 12px', borderRadius:6, border:'none', background: reading==='script'?'#EF4444':'rgba(239,68,68,.2)', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  {reading==='script' ? '⏹ Stop' : '🔊 Read Script Aloud'}
                </button>
                {reading==='script' && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:10, color:TXT3 }}>Speed:</span>
                    {[0.8,0.9,1.0,1.1,1.2,1.3].map(s=>(
                      <button key={s} onClick={()=>{ setReadSpeed(s); stopReading(); setTimeout(()=>readAloud(results.script||'','script'),100); }}
                        style={{ padding:'3px 7px', borderRadius:4, border:`1px solid ${readSpeed===s?'#EF4444':BORD}`, background: readSpeed===s?'rgba(239,68,68,.2)':'transparent', color: readSpeed===s?'#FC8F8F':TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={()=>{ setEditedScript(results.script||''); setEditingScript(true); }}
                  style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
                  ✏️ Edit Script
                </button>
              </div>
              {results.video ? (
                <div style={{ padding:'10px 14px', borderTop:`1px solid ${BORD}`, display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, color:ACCH, flex:1 }}>✅ Video MP4 ready</span>
                  <a href={results.videoUrl} download target="_blank" rel="noreferrer"
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'#EF4444', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', textDecoration:'none' }}>
                    ⬇ Download MP4
                  </a>
                </div>
              ) : pipeline.video?.status === 'error' ? (
                <div style={{ padding:'10px 14px', borderTop:`1px solid ${BORD}`, fontSize:11, color:'#FAC775' }}>
                  ⚠ Video could not be generated — {pipeline.video?.error}
                  <button onClick={()=>onNavigate&&onNavigate('video')} style={{ marginLeft:8, background:'none', border:'none', color:ACCH, fontSize:11, cursor:'pointer', textDecoration:'underline', fontFamily:'inherit' }}>
                    Open Video Builder →
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Affiliate link */}
          <div style={{ background:BG2, border:`1px solid rgba(29,158,117,.3)`, borderRadius:12, marginBottom:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, background:'rgba(29,158,117,.06)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:ACCH }}>🔗 Affiliate Link</span>
            </div>
            <div style={{ padding:'12px 14px' }}>
              {results.link ? (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:TXT }}>{results.link.name}</div>
                    <div style={{ fontSize:10, color:ACCH }}>Already included in your post automatically</div>
                  </div>
                  <button onClick={()=>copy(results.link.url,'link')}
                    style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied==='link'?'✓':'📋 Copy link'}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize:11, color:'#FAC775', lineHeight:1.6 }}>
                  No affiliate links in library yet — your post was generated without one.
                  <button onClick={()=>onNavigate&&onNavigate('affiliate')}
                    style={{ display:'block', marginTop:6, background:'none', border:'none', color:ACCH, fontSize:11, cursor:'pointer', textDecoration:'underline', fontFamily:'inherit', padding:0 }}>
                    → Add links in Affiliate Library
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Landing page */}
          {results.landing && (
            <div style={{ background:BG2, border:'1px solid rgba(139,92,246,.3)', borderRadius:12, marginBottom:16, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(139,92,246,.06)' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#A78BFA' }}>🌐 Landing Page — ready to deploy</span>
                {results.landingUrl && results.landingUrl !== 'downloaded' ? (
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>copy(results.landingUrl,'landing')}
                      style={{ padding:'5px 12px', borderRadius:6, border:'1px solid rgba(139,92,246,.3)', background:'transparent', color:'#A78BFA', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      {copied==='landing'?'✓ Copied!':'📋 Copy URL'}
                    </button>
                    <a href={results.landingUrl} target="_blank" rel="noreferrer"
                      style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#8B5CF6', color:'white', fontSize:10, fontWeight:700, textDecoration:'none' }}>
                      ↗ View Page
                    </a>
                  </div>
                ) : (
                  <button onClick={()=>downloadLanding(results.landing)}
                    style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#8B5CF6', color:'white', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    ⬇ Download HTML
                  </button>
                )}
              </div>
              <div style={{ padding:'12px 14px' }}>
                {results.landingUrl && results.landingUrl !== 'downloaded' ? (
                  <div>
                    <div style={{ fontSize:12, color:ACCH, wordBreak:'break-all', marginBottom:6, fontWeight:600 }}>{results.landingUrl}</div>
                    <div style={{ fontSize:11, color:TXT3, lineHeight:1.6 }}>Live on NichRoute — use this URL in your Facebook post, bio link, and YouTube description.</div>
                  </div>
                ) : (
                  <div style={{ fontSize:11, color:TXT2, lineHeight:1.6 }}>
                    Landing page HTML ready to download and deploy. Contains your post, affiliate CTA, and FTC disclosure.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step-by-step publish checklist */}
          <div style={{ background:'rgba(29,158,117,.05)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:ACCH, marginBottom:14 }}>📤 How to Publish — follow these steps in order</div>

            {/* Step 1 */}
            <div style={{ marginBottom:12, padding:12, background:'rgba(255,255,255,.04)', borderRadius:9, border:`1px solid ${BORD}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:ACCH, marginBottom:6 }}>Step 1 — Copy the Facebook post</div>
              <div style={{ fontSize:11, color:TXT3, marginBottom:8, lineHeight:1.5 }}>
                The post already contains your landing page URL. Copy it and paste directly into Facebook. No raw affiliate link — just the landing page URL at the end.
              </div>
              <button onClick={()=>copy(results.post||'','post2')}
                style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'#1877F2', color:'white', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='post2'?'✓ Copied!':'📋 Copy Post for Facebook'}
              </button>
            </div>

            {/* Step 2 — Full Platform Publisher */}
            <div style={{ marginBottom:12, padding:12, background:'rgba(255,255,255,.04)', borderRadius:9, border:`1px solid ${BORD}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#FC8F8F', marginBottom:6 }}>Step 2 — Publish to any platform</div>
              <div style={{ fontSize:11, color:TXT3, marginBottom:10, lineHeight:1.5 }}>
                Select a platform — title, description, tags and affiliate link are auto-filled. Upload media, resize to exact size, then open the platform to post.
              </div>

              {/* Platform selector */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5, marginBottom:10 }}>
                {PUBLISH_PLATFORMS.map(function(pp){
                  return (
                    <button key={pp.id} onClick={function(){ setPublishPlatform(pp.id===publishPlatform?null:pp.id); setPublishResized(null); }}
                      style={{ padding:'7px 4px', borderRadius:7, border:`1px solid ${publishPlatform===pp.id?pp.color+'80':BORD}`, background:publishPlatform===pp.id?pp.color+'22':'transparent', color:publishPlatform===pp.id?pp.color:TXT3, fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                      {pp.icon} {pp.label}
                    </button>
                  );
                })}
              </div>

              {/* Platform panel */}
              {publishPlatform && (function(){
                const pp = PUBLISH_PLATFORMS.find(function(p){ return p.id===publishPlatform; });
                if (!pp) return null;
                const ptitle = results?.youtubeTitle || selectedTopic?.label || '';
                const pdesc = (function(){
                  if (pp.id==='youtube') return results?.youtubeDescription || '';
                  if (pp.id==='tiktok') return results?.tikTokCaption || '';
                  if (pp.id==='instagram') return results?.igCaption || '';
                  if (pp.id==='pinterest') return (results?.post||'').slice(0,300)+'\n\nFull details at the link below 🔗 #ad';
                  if (pp.id==='reddit') return (results?.post||'').slice(0,400)+'\n\nHas anyone else tried this? 👇';
                  return results?.post || '';
                })();
                const ptags = results?.youtubeTags || '';
                const affUrl = results?.link?.url || '';
                const landUrl = results?.landingUrl || '';

                return (
                  <div style={{ padding:'12px', background:'rgba(255,255,255,.03)', borderRadius:9, border:`1px solid ${pp.color}33` }}>
                    <div style={{ fontSize:11, fontWeight:700, color:pp.color, marginBottom:8 }}>{pp.icon} {pp.label} Publisher</div>

                    {/* Size guide */}
                    <div style={{ fontSize:10, color:TXT3, marginBottom:8, padding:'6px 10px', background:'rgba(255,255,255,.03)', borderRadius:6 }}>
                      📐 <strong style={{ color:TXT2 }}>Image:</strong> {pp.imageSize} &nbsp;|&nbsp; 🎬 <strong style={{ color:TXT2 }}>Video max:</strong> {pp.videoMax}
                    </div>

                    {/* Media uploader */}
                    {publishMediaPreview ? (
                      <div style={{ marginBottom:8 }}>
                        {publishMediaType.startsWith('video') ? (
                          <video src={publishResized||publishMediaPreview} controls style={{ width:'100%', maxHeight:120, borderRadius:7, background:'#000' }} />
                        ) : (
                          <img src={publishResized||publishMediaPreview} alt="" style={{ width:'100%', maxHeight:120, borderRadius:7, objectFit:'cover' }} />
                        )}
                        <div style={{ display:'flex', gap:5, marginTop:6 }}>
                          {publishMediaType.startsWith('image/') && (
                            <button onClick={function(){
                              setPublishResizing(true);
                              resizeForPlatform(publishMedia, pp.w, pp.h, function(url){ setPublishResized(url); setPublishResizing(false); });
                            }} disabled={publishResizing}
                              style={{ flex:1, padding:'5px', borderRadius:5, border:'none', background:publishResizing?'rgba(29,158,117,.3)':GRN, color:'white', fontSize:9, fontWeight:700, cursor:publishResizing?'default':'pointer', fontFamily:'inherit' }}>
                              {publishResizing?'⏳ Resizing…':'📐 Resize to '+pp.w+'×'+pp.h}
                            </button>
                          )}
                          {publishResized && (
                            <a href={publishResized} download={pp.id+'-optimized.jpg'}
                              style={{ padding:'5px 10px', borderRadius:5, border:`1px solid ${GRN}`, background:'transparent', color:GRN, fontSize:9, fontWeight:700, textDecoration:'none' }}>
                              ⬇ Download
                            </a>
                          )}
                          <button onClick={function(){ setPublishMedia(null); setPublishMediaPreview(null); setPublishResized(null); setPublishMediaType(''); }}
                            style={{ padding:'5px 8px', borderRadius:5, border:'1px solid rgba(226,75,74,.3)', background:'transparent', color:'#F09595', fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px', background:'rgba(255,255,255,.02)', border:`1px dashed ${BORD}`, borderRadius:8, cursor:'pointer', marginBottom:8 }}>
                        <span style={{ fontSize:20 }}>📁</span>
                        <div style={{ fontSize:10, color:TXT2 }}>
                          <div style={{ fontWeight:600 }}>Upload photo or video</div>
                          <div style={{ color:TXT3, fontSize:9 }}>MP4, JPG, PNG — auto-resize available for images</div>
                        </div>
                        <input type="file" accept="image/*,video/*" style={{ display:'none' }}
                          onChange={function(e){
                            const f=e.target.files[0]; if(!f) return;
                            setPublishMedia(f); setPublishMediaType(f.type);
                            setPublishMediaPreview(URL.createObjectURL(f)); setPublishResized(null);
                          }} />
                      </label>
                    )}

                    {/* Auto-filled fields */}
                    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:TXT3, marginBottom:2 }}>✨ Auto-filled — copy each field:</div>
                      {[
                        { label:'Title', value:ptitle, id:'pp_title' },
                        { label:'Description', value:pdesc, id:'pp_desc' },
                        pp.id==='youtube' ? { label:'Tags', value:ptags, id:'pp_tags' } : null,
                        affUrl ? { label:'Affiliate Link', value:affUrl, id:'pp_aff' } : null,
                        landUrl ? { label:'Landing URL', value:landUrl, id:'pp_land' } : null,
                      ].filter(Boolean).map(function(field){
                        return (
                          <div key={field.id} style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <div style={{ fontSize:9, color:TXT3, width:75, flexShrink:0 }}>{field.label}</div>
                            <div style={{ fontSize:9, color:TXT2, flex:1, padding:'4px 8px', background:'rgba(255,255,255,.04)', borderRadius:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{field.value||'—'}</div>
                            <button onClick={function(){ copy(field.value,field.id); }}
                              style={{ padding:'3px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:8, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                              {copied===field.id?'✓':'📋'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <a href={pp.url} target="_blank" rel="noreferrer"
                      style={{ display:'block', padding:'9px', borderRadius:8, border:'none', background:pp.color, color:'white', fontSize:11, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                      {pp.icon} Open {pp.label} — Upload Now
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Step 3 */}
            {results && (results.landingUrl || results.post) && results.landingUrl !== 'downloaded' && (
              <div style={{ marginBottom:12, padding:12, background:'rgba(255,255,255,.04)', borderRadius:9, border:`1px solid ${BORD}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#A78BFA', marginBottom:6 }}>Step 3 — Share the landing page link</div>
                <div style={{ fontSize:11, color:TXT3, marginBottom:8, lineHeight:1.5 }}>
                  This is your live NichRoute page. Share it in Facebook groups, put it in your bio link, or post it in NichRoute communities. It has your affiliate CTA button already embedded.
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <button onClick={()=>copy(results.landingUrl,'landingfinal')}
                    style={{ padding:'8px 14px', borderRadius:7, border:'1px solid rgba(139,92,246,.3)', background:'transparent', color:'#A78BFA', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied==='landingfinal'?'✓ Copied!':'📋 Copy Landing Page URL'}
                  </button>
                  <a href={results.landingUrl} target="_blank" rel="noreferrer"
                    style={{ padding:'8px 14px', borderRadius:7, border:'none', background:'#8B5CF6', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>
                    ↗ View Live Page
                  </a>
                  <button onClick={()=>submitToSearchEngines(results.landingUrl || results?.link?.url || '')}
                    disabled={indexing || (!results?.landingUrl && !results?.link?.url && !(results?.post||'').includes('nichroute.com'))}
                    style={{ padding:'8px 14px', borderRadius:7, border:'none', background:indexing?'rgba(16,185,129,.3)':'#059669', color:'white', fontSize:11, fontWeight:700, cursor:indexing?'default':'pointer', fontFamily:'inherit' }}>
                    {indexing ? '⏳ Submitting…' : '🔍 Submit to Google & Bing'}
                  </button>
                  <button onClick={()=>onNavigate&&onNavigate('nichroute')}
                    style={{ padding:'8px 14px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                    🎯 Share in NichRoute Groups
                  </button>
                </div>
                {indexResult && !indexResult.error && (
                  <div style={{ marginTop:8, padding:'10px 12px', background:'rgba(5,150,105,.08)', border:'1px solid rgba(5,150,105,.2)', borderRadius:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#34D399', marginBottom:4 }}>✅ Submitted to Bing</div>
                    <div style={{ fontSize:10, color:TXT3, marginBottom:8, lineHeight:1.6 }}>
                      For Google — open Search Console below → click <strong style={{ color:TXT2 }}>URL Inspection</strong> in the left sidebar → paste your landing page URL → click <strong style={{ color:TXT2 }}>Request Indexing</strong>.
                    </div>
                    <div style={{ fontSize:10, color:'rgba(79,163,255,.8)', marginBottom:8, padding:'6px 10px', background:'rgba(79,163,255,.06)', borderRadius:6, fontFamily:'monospace', wordBreak:'break-all' }}>
                      {indexResult.url}
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer"
                        style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#4285F4', color:'white', fontSize:10, fontWeight:700, textDecoration:'none' }}>
                        🔍 Open Google Search Console
                      </a>
                      <a href="https://www.bing.com/webmasters" target="_blank" rel="noreferrer"
                        style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#00809D', color:'white', fontSize:10, fontWeight:700, textDecoration:'none' }}>
                        🔵 Open Bing Webmaster
                      </a>
                      <button onClick={()=>copy(indexResult.url,'gsc_url')}
                        style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied==='gsc_url'?'✓ Copied!':'📋 Copy URL to paste'}
                      </button>
                    </div>
                  </div>
                )}
                {indexResult?.error && (
                  <div style={{ marginTop:8, fontSize:10, color:'#F09595' }}>❌ {indexResult.error}</div>
                )}
              </div>
            )}

            {/* Step 4 — Pinterest */}
            <div style={{ padding:12, background:'rgba(255,255,255,.04)', borderRadius:9, border:'1px solid rgba(226,0,35,.2)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#E60023', marginBottom:6 }}>Step 4 — Create a Pinterest Pin</div>
              <div style={{ fontSize:11, color:TXT3, marginBottom:8, lineHeight:1.5 }}>
                Pinterest drives evergreen traffic for months. Pin your landing page so people searching your topic find it and click to your affiliate link.
              </div>
              {(results?.landingUrl || results?.post) && (
                <div style={{ marginBottom:8, padding:'10px 12px', background:'rgba(226,0,35,.06)', borderRadius:8, border:'1px solid rgba(226,0,35,.15)' }}>
                  {/* Media uploader */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#E60023', marginBottom:5 }}>🖼 Attach Photo or Video</div>
                    {pinMediaPreview ? (
                      <div style={{ position:'relative', marginBottom:6 }}>
                        {pinMediaType.startsWith('video') ? (
                          <video src={pinMediaPreview} controls style={{ width:'100%', maxHeight:160, borderRadius:7, background:'#000' }} />
                        ) : (
                          <div>
                            <img src={pinResized || pinMediaPreview} alt="Pin media" style={{ width:'100%', maxHeight:200, borderRadius:7, objectFit:'cover' }} />
                            {!pinMediaType.startsWith('video') && (
                              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                                <button onClick={function(){ resizeForPinterest(pinMedia); }} disabled={pinResizing}
                                  style={{ flex:1, padding:'6px 10px', borderRadius:6, border:'none', background:pinResizing?'rgba(226,0,35,.3)':'#E60023', color:'white', fontSize:10, fontWeight:700, cursor:pinResizing?'default':'pointer', fontFamily:'inherit' }}>
                                  {pinResizing ? '⏳ Resizing…' : '📐 Resize to 1000×1500 (Pinterest ideal)'}
                                </button>
                                {pinResized && (
                                  <a href={pinResized} download="pinterest-pin.jpg"
                                    style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(226,0,35,.3)', background:'transparent', color:'#E60023', fontSize:10, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>
                                    ⬇ Download Resized
                                  </a>
                                )}
                              </div>
                            )}
                            {pinResized && <div style={{ fontSize:10, color:'#34D399', marginTop:4 }}>✅ Resized to 1000×1500px — download and upload to Pinterest</div>}
                          </div>
                        )}
                        <button onClick={function(){ setPinMedia(null); setPinMediaPreview(null); setPinMediaType(''); setPinResized(null); }}
                          style={{ position:'absolute', top:6, right:6, padding:'3px 8px', borderRadius:5, border:'none', background:'rgba(0,0,0,.6)', color:'white', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                          ✕ Remove
                        </button>
                        {!pinResized && !pinMediaType.startsWith('video') && <div style={{ fontSize:10, color:TXT3, marginTop:4 }}>Click Resize to optimize for Pinterest before uploading</div>}
                        {pinMediaType.startsWith('video') && <div style={{ fontSize:10, color:'#E60023', marginTop:4 }}>✅ Video ready — upload directly to Pinterest</div>}
                      </div>
                    ) : (
                      <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'rgba(226,0,35,.04)', border:'1px dashed rgba(226,0,35,.3)', borderRadius:8, cursor:'pointer' }}>
                        <span style={{ fontSize:18 }}>📁</span>
                        <div>
                          <div style={{ fontSize:11, color:TXT2, fontWeight:600 }}>Upload photo or video from your computer</div>
                          <div style={{ fontSize:9, color:TXT3 }}>JPG, PNG, GIF, MP4 — recommended size 1000×1500px for images</div>
                        </div>
                        <input type="file" accept="image/*,video/*" style={{ display:'none' }}
                          onChange={function(e){
                            const file = e.target.files[0];
                            if (!file) return;
                            setPinMedia(file);
                            setPinMediaType(file.type);
                            setPinMediaPreview(URL.createObjectURL(file));
                          }} />
                      </label>
                    )}
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#E60023', marginBottom:6 }}>📌 Copy each field into Pinterest</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {[
                      ['Title', results?.title||selectedTopic?.label||''],
                      ['Description', (results?.post||'').slice(0,300)],
                      ['Link', results?.landingUrl || results?.link?.url || ''],
                      ['Affiliate Link', results?.link?.url || ''],
                      ['Hashtags', '#'+(selectedTopic?.id||'content').replace(/-/g,'')+' #homebusiness #sidehustle #contentcreator #'+( selectedTopic?.cat||'lifestyle').replace(/-/g,'')],
                    ].filter(function(item){ return item[1]; }).map(function(item,i){
                      const id='pin_'+i;
                      return (
                        <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <div style={{ fontSize:9, color:TXT3, width:70, flexShrink:0 }}>{item[0]}</div>
                          <div style={{ fontSize:10, color:TXT2, flex:1, padding:'4px 8px', background:'rgba(255,255,255,.04)', borderRadius:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item[1]}</div>
                          <button onClick={()=>copy(item[1],id)} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid rgba(226,0,35,.3)', background:'transparent', color:'#E60023', fontSize:9, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                            {copied===id?'✓':'📋'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <a href="https://pinterest.com/pin/creation/button" target="_blank" rel="noreferrer"
                style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'#E60023', color:'white', fontSize:11, fontWeight:700, textDecoration:'none', display:'inline-block', marginBottom:6 }}>
                📌 Create Pin on Pinterest
              </a>
              <div style={{ fontSize:10, color:TXT3 }}>Copy each field above → open Pinterest → Create Pin → paste title, description and link → publish</div>
            </div>

            {/* Step 5 — Schedule */}
            <div style={{ padding:12, background:'rgba(255,255,255,.04)', borderRadius:9, border:`1px solid ${BORD}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#4FA3FF', marginBottom:6 }}>Step 5 — Schedule for later (optional)</div>
              <div style={{ fontSize:11, color:TXT3, marginBottom:8, lineHeight:1.5 }}>
                Save the post to your scheduler to post at the best time — 9am or 7pm typically get the most reach on Facebook.
              </div>
              <button onClick={()=>onNavigate&&onNavigate('submitter')}
                style={{ padding:'8px 16px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                📅 Open Post Submitter
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
      `}} />
    </div>
  );
}
