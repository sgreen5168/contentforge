import React, { useState, useEffect, useRef } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const VIDEO_TYPES = [
  { id:'ugc-persona', icon:'UGC', label:'UGC Persona',  desc:'Authentic first-person review' },
  { id:'ai-vsl',      icon:'VSL', label:'AI VSL',        desc:'Video sales letter' },
  { id:'reel-ads',    icon:'AD',  label:'Reel Ads',      desc:'Short punchy vertical ad' },
  { id:'product-ads', icon:'PRD', label:'Product Ad',    desc:'Direct-response product' },
  { id:'commercial',  icon:'CIN', label:'Commercial',    desc:'Cinematic brand video' },
  { id:'educator',    icon:'EDU', label:'Educational',   desc:'Expert tips format' },
];

const PERSONAS = [
  { id:'ugc',         label:'UGC Creator' },
  { id:'testimonial', label:'Testimonial' },
  { id:'demo',        label:'Product Demo' },
  { id:'influencer',  label:'Influencer' },
  { id:'educator',    label:'Educator' },
];

const DURATIONS_SHORT = ['15s','30s','45s','60s'];
const DURATIONS_LONG  = ['2m','5m','10m','15m'];

const PLATFORMS = [
  { id:'tiktok',    label:'TikTok',          icon:'T' },
  { id:'instagram', label:'Instagram Reels', icon:'I' },
  { id:'youtube',   label:'YouTube Shorts',  icon:'Y' },
];

const MUSIC_OPTIONS = [
  { id:'none',        label:'No music' },
  { id:'upbeat',      label:'Upbeat' },
  { id:'calm',        label:'Calm' },
  { id:'motivational',label:'Motivational' },
  { id:'corporate',   label:'Corporate' },
];

const CROP_STYLES = [
  { id:'center',  label:'Center',    desc:'Crop center' },
  { id:'top',     label:'Top',       desc:'Crop from top' },
  { id:'bottom',  label:'Bottom',    desc:'Crop from bottom' },
  { id:'pad',     label:'Letterbox', desc:'Add black bars' },
];

const SCENE_SITUATIONS = [
  'Airport','Balcony','Office','Art Studio','Bathroom','Beauty','Bedroom',
  'Bookshelf','Business','Car','Cityscape','Closet','Cooking','Daytime',
  'Fashion','Fitness','Gaming','Gym','Home','Kitchen','Lifestyle',
  'Living Room','Nature','Skincare','Streaming','Vlogging',
];


const NICHES = [
  {
    id: 'make-money-home',
    label: 'Make Money from Home',
    icon: '🏠',
    desc: 'Side hustles, home income, entrepreneurship',
    subNiches: [
      { id: 'baking-business',    label: 'Baking from Home',        desc: 'Selling baked goods, recipes, food business' },
      { id: 'home-services',      label: 'Home Services',           desc: 'Lawn care, repairs, cleaning, handyman' },
      { id: 'online-work',        label: 'Online Work',             desc: 'Freelancing, remote jobs, digital services' },
      { id: 'affiliate-content',  label: 'Affiliate Content',       desc: 'Content creation, product reviews, commissions' },
      { id: 'crafts-handmade',    label: 'Crafts & Handmade',       desc: 'Etsy, handmade goods, creative selling' },
      { id: 'general-hustle',     label: 'General Side Hustle',     desc: 'Mixed home income ideas and opportunities' },
    ],
    situations: ['Home','Kitchen','Office','Living Room','Bedroom','Cooking','Baking','Business','Lifestyle','Daytime','Nature','Fitness'],
    hooks: [
      'Here are real ways people are earning from home right now',
      'Did you know this home business idea is growing fast?',
      `If you've been thinking about starting something from home, this is worth knowing`,
      'More people than ever are building income without leaving the house',
      'This is what starting a home-based business actually looks like',
      `You don't need a big investment to start earning from home`,
      `Here's an honest look at what's working for home entrepreneurs`,
      'These are the home income ideas most people overlook',
    ],
    compliance: 'Do NOT make personal income claims. Do NOT say "I made $X." Present opportunities in an educational, informational way. Use third-person examples or general statements about what is possible. Keep tone relaxed, uplifting, honest, and professional-casual. Content must comply with Facebook, TikTok, and FTC guidelines on income representation.',
  },
  {
    id: 'healthy-eating',
    label: 'Healthy Eating',
    icon: '🥗',
    desc: 'Nutrition, wellness, clean eating',
    subNiches: [
      { id: 'meal-prep',          label: 'Meal Prep',               desc: 'Weekly prep, batch cooking, planning' },
      { id: 'smoothies-juices',   label: 'Smoothies & Juices',      desc: 'Green juices, protein shakes, blends' },
      { id: 'weight-wellness',    label: 'Weight & Wellness',       desc: 'Healthy habits, balanced lifestyle' },
      { id: 'clean-eating',       label: 'Clean Eating',            desc: 'Whole foods, ingredient swaps, recipes' },
    ],
    situations: ['Kitchen','Cooking','Fitness','Nature','Lifestyle','Gym','Home','Skincare','Beauty'],
    hooks: [
      'This simple food swap is something more people are trying',
      `Here's what a week of healthy eating actually looks like`,
      'These are the meals nutrition-focused people are making right now',
      'Small changes in what you eat can make a real difference',
      'Here are some healthy eating ideas that are easy to start with',
    ],
    compliance: 'Do NOT make unverified health claims. Do NOT promise weight loss results. Present food ideas as options and inspiration, not medical advice. Encourage viewers to consult professionals for health decisions.',
  },
  {
    id: 'fitness-wellness',
    label: 'Fitness & Wellness',
    icon: '💪',
    desc: 'Exercise, mindset, healthy living',
    subNiches: [
      { id: 'home-workouts',      label: 'Home Workouts',           desc: 'No-gym exercise, bodyweight, routines' },
      { id: 'mindset-motivation', label: 'Mindset & Motivation',    desc: 'Habits, mindset, daily routines' },
      { id: 'outdoor-fitness',    label: 'Outdoor Fitness',         desc: 'Walking, running, outdoor movement' },
    ],
    situations: ['Gym','Fitness','Nature','Home','Daytime','Lifestyle','Living Room'],
    hooks: [
      'These are simple fitness habits more people are building at home',
      `Here's what a realistic home workout routine can look like`,
      `Movement doesn't have to be complicated — here's proof`,
      'Small daily habits add up — here are some worth trying',
    ],
    compliance: 'Do NOT promise specific fitness results. Do NOT make before/after claims without clear disclaimers. Present exercise ideas as general wellness content, not medical or personal training advice.',
  },
  {
    id: 'cooking',
    label: 'Cooking',
    icon: '👨‍🍳',
    desc: 'Recipes, techniques, food content',
    subNiches: [
      { id: 'quick-meals',        label: 'Quick & Easy Meals',      desc: 'Fast recipes, simple cooking, busy families' },
      { id: 'budget-cooking',     label: 'Budget Cooking',          desc: 'Affordable meals, stretching groceries' },
      { id: 'baking-recipes',     label: 'Baking & Desserts',       desc: 'Bread, cakes, pastries, sweet treats' },
      { id: 'special-diets',      label: 'Special Diets',           desc: 'Vegan, gluten-free, keto, dairy-free' },
    ],
    situations: ['Kitchen','Cooking','Baking','Home','Lifestyle','Food'],
    hooks: [
      'This recipe takes less than 20 minutes and tastes amazing',
      `Here's a budget-friendly meal that actually fills you up`,
      `If you're short on time, this is worth trying`,
      'This is one of those recipes people keep coming back to',
    ],
    compliance: 'Present recipes as creative ideas, not guaranteed outcomes. Be accurate about ingredients and allergens where mentioned.',
  },
];

export default function VideoEngineCore({ jumpToTab, loadJob, quickStart } = {}) {
  const [tab, setTab]           = useState('generate');
  const [topic, setTopic]       = useState('');
  const [videoType, setVType]   = useState('ugc-persona');
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDur]      = useState('30s');
  const [platforms, setPlats]   = useState(['tiktok','youtube']);
  const [music, setMusic]       = useState('none');
  const [loading, setLoad]      = useState(false);
  const [jobId, setJobId]       = useState(null);
  const [job, setJob]           = useState(null);
  const [error, setError]       = useState('');
  const [jobs, setJobs]         = useState([]);
  const [assembling, setAssembling] = useState(false);
  const [ctaUrl, setCtaUrl]         = useState('');
  const [ctaText, setCtaText]       = useState('');
  const [voice, setVoice]       = useState('nova');
  const [playingVoice, setPlayingVoice] = useState('');
  const audioPreviewRef = React.useRef(null);
  const creatorPanelRef = React.useRef(null);
  const [durMode, setDurMode]   = useState('short');
  const [cropStyle, setCropStyle]     = useState('center');
  const [autoAssemble, setAutoAssemble] = useState(false);
  const [autoResult, setAutoResult]   = useState(null);
  const [niche, setNiche]         = useState('');
  const [subNiche, setSubNiche]   = useState('');
  const [showNichePanel, setShowNichePanel] = useState(false);
  const [aspectRatio, setAspect]   = useState('9:16');
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(30);
  const [vignette, setVignette] = useState(true);
  const [selectedPhrases, setSelectedPhrases] = useState([]);
  const [sceneKeywords, setSceneKeywords] = useState({});
  const [sceneMatches, setSceneMatches]   = useState({});
  const [sceneMatching, setSceneMatching] = useState({});
  const [sceneMatchError, setSceneMatchError] = useState({});
  const [scenesConfirmed, setScenesConfirmed] = useState(false);
  const [phraseClips, setPhraseClips]     = useState([]);
  const [combineError, setCombineError]   = useState('');
  const [ytTitle, setYtTitle]             = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytPrivacy, setYtPrivacy]         = useState('unlisted');
  const [publishing, setPublishing]       = useState(false);
  const [publishError, setPublishError]   = useState('');
  const [publishResult, setPublishResult] = useState(null);
  const [heygenAvatars, setHeygenAvatars] = useState([]);
  const [heygenVoices, setHeygenVoices]   = useState([]);
  const [heygenAvatar, setHeygenAvatar]   = useState('');
  const [heygenVoice, setHeygenVoice]     = useState('');
  const [heygenGenerating, setHeygenGen]  = useState(false);
  const [heygenVideoId, setHeygenVideoId] = useState('');
  const [heygenVideoUrl, setHeygenUrl]    = useState('');
  const [heygenError, setHeygenError]     = useState('');
  const [heygenConfigured, setHeygenConf] = useState(false);
  const [heygenLoaded, setHeygenLoaded]   = useState(false);
  const [avatarFilter, setAvatarFilter]   = useState('all');
  const [avatarSearch, setAvatarSearch]   = useState('');
  const [avatarPage, setAvatarPage]       = useState(0);
  const [avatarNiche, setAvatarNiche]     = useState('all');
  const [showCreateAvatar, setShowCreate] = useState(false);
  const [createAppearance, setCreateApp]  = useState('');
  const [createGender, setCreateGender]   = useState('Woman');
  const [createAge, setCreateAge]         = useState('Unspecified');
  const [createEthnicity, setCreateEth]   = useState('Unspecified');
  const [createStyle, setCreateStyle]     = useState('Realistic');
  const [creating, setCreating]           = useState(false);
  const [createGenId, setCreateGenId]     = useState('');
  const [createError, setCreateError]     = useState('');
  const [createDone, setCreateDone]       = useState(false);
  const [nicheSuggestions, setNicheSugg]  = useState([]);
  const [heygenBgType, setHeygenBgType]   = useState('color');
  const [heygenBgValue, setHeygenBgValue] = useState('#18202e');
  const [heygenGreenScreen, setHeygenGS]  = useState(false);
  const [createBgType, setCreateBgType]   = useState('color');
  const [createBgUrl, setCreateBgUrl]     = useState('');
  const [imgToClipUrl, setImgToClipUrl]   = useState('');
  const [imgToClipLoading, setImgClipLoad]= useState(false);
  const [imgToClipError, setImgClipErr]   = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    if (jumpToTab && jumpToTab.tab) setTab(jumpToTab.tab);
  }, [jumpToTab]);

  useEffect(() => {
    if (loadJob && loadJob.job) {
      const j = loadJob.job;
      setJob(j);
      setJobId(j.id || j.jobId || j.job_id || null);
      setTab('result');
    }
  }, [loadJob]);

  useEffect(() => {
    if (quickStart && quickStart.id) {
      const MAP = { ugc:'ugc-persona', vsl:'ai-vsl', reel:'reel-ads', demo:'product-ads', educator:'educator', commercial:'commercial' };
      const mapped = MAP[quickStart.id];
      if (mapped) setVType(mapped);
      setTab('generate');
    }
  }, [quickStart]);

  useEffect(() => {
    if (tab === 'history') loadJobs();
  }, [tab]);

  useEffect(() => {
    if (job && job.result && job.result.script) {
      const script = job.result.script;
      if (script.hook && !ytTitle) setYtTitle(script.hook.slice(0, 100));
      if (!ytDescription) {
        const tags = (script.hashtags || []).join(' ');
        const desc = (script.fullScript || '').slice(0, 200);
        setYtDescription(desc + (tags ? '\n\n' + tags : ''));
      }
    }
  }, [job]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function loadJobs() {
    try {
      const r = await fetch(API + '/api/video/jobs');
      const d = await r.json();
      setJobs(Array.isArray(d) ? d : []);
    } catch(e) { console.warn('loadJobs:', e.message); }
  }

  async function previewVoice(voiceId) {
    if (playingVoice === voiceId) {
      if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current = null; }
      setPlayingVoice('');
      return;
    }
    setPlayingVoice(voiceId);
    try {
      const audio = new Audio(API + '/api/voice/preview/' + voiceId);
      audioPreviewRef.current = audio;
      audio.onended = function() { setPlayingVoice(''); audioPreviewRef.current = null; };
      audio.onerror = function() { setPlayingVoice(''); audioPreviewRef.current = null; };
      await audio.play();
    } catch(e) {
      setPlayingVoice('');
      console.warn('Voice preview failed:', e.message);
    }
  }

  async function generate() {
    if (!topic.trim()) return;
    setLoad(true); setJob(null); setError(''); setJobId(null);
    setSelectedPhrases([]); setSceneKeywords({}); setSceneMatches({});
    setSceneMatching({}); setSceneMatchError({}); setScenesConfirmed(false);
    setPhraseClips([]); setPublishResult(null);
    try {
      const res = await fetch(API + '/api/video/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputMode:'topic', topic, videoType, persona, duration, platforms, voice, niche, subNiche, autoAssemble, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setJobId(data.jobId); setTab('result');
      pollRef.current = setInterval(() => pollJob(data.jobId), 3000);
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  }

  async function pollJob(id) {
    try {
      const r = await fetch(API + '/api/video/job/' + id);
      if (!r.ok) return;
      const d = await r.json();
      if (d && typeof d === 'object') {
        setJob(d);
        if (d.status === 'completed' || d.status === 'failed') {
          clearInterval(pollRef.current); loadJobs();
        }
      }
    } catch(e) { console.warn('pollJob:', e.message); }
  }

  function getNicheSituations() {
    const activeNiche = NICHES.find(function(n) { return n.id === niche; });
    if (!activeNiche) return SCENE_SITUATIONS;
    const nicheSits = activeNiche.situations;
    const rest = SCENE_SITUATIONS.filter(function(s) { return !nicheSits.includes(s); });
    return [...nicheSits, ...rest];
  }

  function togglePhrase(phrase) {
    const isSelected = selectedPhrases.includes(phrase);
    setSelectedPhrases(prev => isSelected ? prev.filter(p => p !== phrase) : [...prev, phrase]);
    setScenesConfirmed(false);
    if (isSelected) {
      setSceneKeywords(prev => { const n={...prev}; delete n[phrase]; return n; });
      setSceneMatches(prev => { const n={...prev}; delete n[phrase]; return n; });
      setSceneMatchError(prev => { const n={...prev}; delete n[phrase]; return n; });
    } else {
      matchScene(phrase, null);
    }
  }

  async function matchScene(phrase, overrideKeyword) {
    setSceneMatching(prev => ({ ...prev, [phrase]: true }));
    setSceneMatchError(prev => { const n={...prev}; delete n[phrase]; return n; });
    try {
      const res = await fetch(API + '/api/video/scene-keyword-match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: phrase, keyword: overrideKeyword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scene match failed');
      setSceneKeywords(prev => ({ ...prev, [phrase]: data.keyword }));
      setSceneMatches(prev => ({ ...prev, [phrase]: { videoUrl: data.videoUrl, thumb: data.thumb, matched: data.matched } }));
    } catch(e) {
      setSceneMatchError(prev => ({ ...prev, [phrase]: e.message }));
    } finally {
      setSceneMatching(prev => ({ ...prev, [phrase]: false }));
    }
  }

  function rematchScene(phrase) {
    const kw = sceneKeywords[phrase];
    if (!kw || !kw.trim()) return;
    matchScene(phrase, kw.trim());
  }

  async function assembleAndDownload() {
    const clips = (phraseClips || []).filter(c => c && c.status === 'success' && c.videoUrl);
    if (clips.length === 0) { setCombineError('No matched clips — select scenes above first.'); return; }
    if (!job || !job.result) return;
    setAssembling(true); setCombineError('');
    try {
      const audioUrl = job.result.audioBase64 || (job.result.hasAudio ? API + '/api/video/audio/' + jobId : null);
      const res = await fetch(API + '/api/video/assemble', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipUrls: clips.map(c => c.videoUrl),
          clips: clips.map(c => ({ pexelsId: c.pexelsId, pexelsQuery: c.pexelsQuery })),
          audioUrl, jobId,
          aspectRatio, cropStyle,
          music, voiceVolume: voiceVolume / 100, musicVolume: musicVolume / 100,
          captions: false, captionText: '',
          vignette,
          ctaUrl: ctaUrl.trim(),
          ctaText: ctaText.trim(),
          heygenVideoUrl: heygenVideoUrl ? heygenVideoUrl.trim() : '',
          heygenBackgroundType: heygenGreenScreen ? 'greenscreen' : heygenBgType,
          heygenGreenScreen: heygenGreenScreen,
        }),
      });
      if (!res.ok) {
        let detail = '';
        try { const err = await res.json(); detail = err.error || ''; } catch {}
        throw new Error('HTTP ' + res.status + (detail ? ' — ' + detail : ''));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'contentforge-' + Date.now() + '.mp4'; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { setCombineError(e.message); }
    finally { setAssembling(false); }
  }

  async function loadHeyGenConfig() {
    setHeygenLoaded(true);
    setHeygenAvatars([]);
    setHeygenVoices([]);
    try {
      const statusRes = await fetch(API + '/api/heygen/status');
      const statusData = await statusRes.json();
      if (!statusData.configured) { setHeygenConf(false); return; }
      setHeygenConf(true);
      const [avatarRes, voiceRes] = await Promise.all([
        fetch(API + '/api/heygen/avatars'),
        fetch(API + '/api/heygen/voices'),
      ]);
      const avatarData = await avatarRes.json();
      const voiceData  = await voiceRes.json();
      setHeygenAvatars(avatarData.avatars || []);
      setHeygenVoices(voiceData.voices || []);
      // Do NOT auto-select — user must explicitly choose an avatar
      if (voiceData.voices?.[0]) setHeygenVoice(voiceData.voices[0].voice_id);
    } catch(e) {
      console.warn('HeyGen config load failed:', e.message);
      setHeygenConf(false);
    }
  }

  async function convertImageToClip() {
    if (!imgToClipUrl.trim()) { setImgClipErr('Paste an image URL first.'); return; }
    setImgClipLoad(true);
    setImgClipErr('');
    try {
      const res = await fetch(API + '/api/video/image-to-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imgToClipUrl.trim(), aspectRatio, duration: 6 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(function() { return {}; });
        throw new Error(err.error || 'Image conversion failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'image-clip-' + aspectRatio.replace(':','-') + '.mp4';
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      setImgClipErr(e.message);
    } finally {
      setImgClipLoad(false);
    }
  }

  async function createPhotoAvatar() {
    if (!createAppearance.trim()) { setCreateError('Describe the avatar appearance first.'); return; }
    setCreating(true); setCreateError(''); setCreateDone(false); setCreateGenId('');
    try {
      const res = await fetch(API + '/api/heygen/create-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ContentForge ' + createGender + ' Avatar',
          age: createAge || 'Unspecified',
          gender: createGender,
          ethnicity: createEthnicity || 'Unspecified',
          style: createStyle,
          orientation: 'vertical',
          pose: 'half_body',
          appearance: createAppearance.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Avatar creation failed');
      setCreateGenId(data.generationId);
      // Poll for completion — photo avatars take 1-3 minutes
      let attempts = 0;
      while (attempts < 20) {
        await new Promise(r => setTimeout(r, 10000));
        attempts++;
        const pollRes = await fetch(API + '/api/heygen/avatar-status/' + data.generationId);
        const pollData = await pollRes.json();
        if (pollData.status === 'completed' || pollData.avatarId) {
          setCreateDone(true);
          setCreating(false);
          // Reload avatar list to include the new one
          await loadHeyGenConfig();
          return;
        }
        if (pollData.status === 'failed') throw new Error('Avatar creation failed on HeyGen');
      }
      // Timed out — tell user to refresh
      setCreateDone(true);
      setCreating(false);
    } catch(e) {
      setCreateError(e.message);
      setCreating(false);
    }
  }

  async function loadNicheSuggestions(niche) {
    if (niche === 'all') { setNicheSugg([]); return; }
    try {
      const res = await fetch(API + '/api/heygen/niche-suggestions/' + niche);
      const data = await res.json();
      setNicheSugg(data.suggestions || []);
    } catch(e) { setNicheSugg([]); }
  }

  async function generateHeyGenVideo() {
    if (!job?.result?.script?.fullScript) { setHeygenError('Generate a script first before creating an avatar video.'); return; }
    if (!heygenAvatar) { setHeygenError('Select an avatar first.'); return; }
    if (!heygenVoice)  { setHeygenError('Select a voice first.'); return; }
    setHeygenGen(true);
    setHeygenError('');
    setHeygenUrl('');
    setHeygenVideoId('');
    try {
      // Phase 1: Start generation — returns immediately with a videoId
      const res = await fetch(API + '/api/heygen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId:        heygenAvatar,
          voiceId:         heygenVoice,
          script:          job.result.script.fullScript,
          aspectRatio:     aspectRatio,
          backgroundType:  heygenGreenScreen ? 'color' : (createBgType && createBgUrl ? 'image' : heygenBgType),
          backgroundValue: heygenGreenScreen ? '#00b140' : (createBgType === 'image' && createBgUrl ? createBgUrl : heygenBgValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HeyGen generation failed to start');
      const videoId = data.videoId;
      setHeygenVideoId(videoId);

      // HeyGen's architecture is async — videos take 5-30+ minutes
      // Rather than hold an open connection that will timeout, we show the user
      // a direct link to their HeyGen projects page where the video will appear
      // We still poll briefly (5 times × 30s = 2.5 min) in case it's fast
      let attempts = 0;
      while (attempts < 5) {
        await new Promise(r => setTimeout(r, 30000));
        attempts++;
        try {
          const pollRes = await fetch(API + '/api/heygen/video/' + videoId);
          const pollData = await pollRes.json();
          if (pollData.status === 'completed' && pollData.videoUrl) {
            setHeygenUrl(pollData.videoUrl);
            setHeygenGen(false);
            return;
          }
          if (pollData.status === 'failed') {
            throw new Error('HeyGen video generation failed: ' + (pollData.error || 'Unknown error'));
          }
        } catch(pollErr) {
          if (pollErr.message && pollErr.message.includes('failed')) throw pollErr;
        }
      }
      // After 2.5 min, stop polling and send user to HeyGen directly
      // The video will be ready there when HeyGen finishes (usually 5-30 min)
      setHeygenGen(false);
      setHeygenError('READY_CHECK:' + videoId);
    } catch(e) {
      setHeygenError(e.message);
      setHeygenGen(false);
    }
  }

  async function publishToYouTube() {
    if (!ytTitle.trim()) { setPublishError('A title is required before publishing.'); return; }
    const clips = (phraseClips || []).filter(c => c && c.status === 'success' && c.videoUrl);
    if (clips.length === 0) { setPublishError('No matched clips — select scenes first.'); return; }
    if (!job || !job.result) return;
    setPublishing(true); setPublishError(''); setPublishResult(null);
    try {
      const audioUrl = job.result.audioBase64 || (job.result.hasAudio ? API + '/api/video/audio/' + jobId : null);
      const res = await fetch(API + '/api/video/publish-youtube', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipUrls: clips.map(c => c.videoUrl),
          clips: clips.map(c => ({ pexelsId: c.pexelsId, pexelsQuery: c.pexelsQuery })),
          audioUrl, jobId,
          aspectRatio, cropStyle,
          music, voiceVolume: voiceVolume / 100, musicVolume: musicVolume / 100,
          captions: false, captionText: '',
          title: ytTitle, description: ytDescription, privacy: ytPrivacy,
          vignette,
          ctaUrl: ctaUrl.trim(),
          ctaText: ctaText.trim(),
          heygenVideoUrl: heygenVideoUrl ? heygenVideoUrl.trim() : '',
          heygenGreenScreen: heygenGreenScreen,
          heygenBackgroundType: heygenGreenScreen ? 'greenscreen' : heygenBgType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('HTTP ' + res.status + (data.error ? ' — ' + data.error : ''));
      setPublishResult(data);
    } catch(e) { setPublishError(e.message); }
    finally { setPublishing(false); }
  }

  function splitIntoPhrases(text) {
    if (!text) return [];
    return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  function togglePlatform(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.concat(id));
  }

  function download(url) {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = 'contentforge-clip-' + Date.now() + '.mp4';
    a.target = '_blank'; a.click();
  }

  const CARD  = 'rgba(16,45,79,.9)';
  const BORD  = 'rgba(29,158,117,.2)';
  const ACC   = '#1D9E75';
  const ACCH  = '#5DCAA5';
  const TXT   = '#E8F4F0';
  const TXT2  = '#7BAAA0';
  const TXT3  = '#4A7A72';

  function chip(active) {
    return {
      padding: '5px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
      fontFamily: 'inherit', fontWeight: 500,
      border: '1px solid ' + (active ? ACC : BORD),
      background: active ? 'rgba(29,158,117,.15)' : 'transparent',
      color: active ? ACCH : TXT2, margin: '0 4px 4px 0', display: 'inline-block',
    };
  }

  function card(extra) {
    return Object.assign({ background: CARD, border: '1px solid ' + BORD, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }, extra || {});
  }

  function hdr(extra) {
    return Object.assign({ padding: '10px 14px', borderBottom: '1px solid rgba(29,158,117,.12)', fontSize: 13, fontWeight: 500, color: TXT, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, extra || {});
  }

  function body(extra) { return Object.assign({ padding: '12px 14px' }, extra || {}); }

  const inp = {
    width: '100%', border: '1px solid ' + BORD, borderRadius: 8, padding: '8px 11px',
    fontSize: 13, fontFamily: 'inherit', color: TXT, background: 'rgba(22,61,106,.6)',
    outline: 'none', marginBottom: 10, boxSizing: 'border-box',
  };

  const lbl = { fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 };

  const progress = (job && job.progress) || 0;

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: TXT }}>
          AI Video Engine
          <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(29,158,117,.2)', color: ACCH }}>4.0</span>
        </div>
        <div style={{ fontSize: 12, color: TXT2, marginTop: 3 }}>Script + Voiceover + FREE Pexels clips + YouTube publish</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['generate','Generate'],['result','Result'],['history','History']].map(function(t) {
          var id = t[0]; var label = t[1];
          return (
            <button key={id} onClick={function() { setTab(id); }}
              style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, border: '1px solid ' + (tab === id ? ACC : BORD), background: tab === id ? 'rgba(29,158,117,.15)' : 'transparent', color: tab === id ? ACCH : TXT2 }}>
              {label}
              {id === 'result' && job && (
                <span style={{ marginLeft: 6, width: 7, height: 7, borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', background: job.status === 'completed' ? ACC : job.status === 'failed' ? '#E24B4A' : '#F5A623' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* GENERATE TAB */}
      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
          <div>

            {/* Niche selector */}
            <div style={card()}>
              <div style={hdr()}>
                <span>Content niche <span style={{ fontSize: 10, color: TXT3, fontWeight: 400 }}>(optional — shapes your script and scene suggestions)</span></span>
                {niche && <button onClick={function() { setNiche(''); setSubNiche(''); }} style={{ fontSize: 10, color: TXT3, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>}
              </div>
              <div style={body()}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, marginBottom: niche ? 12 : 0 }}>
                  {NICHES.map(function(n) {
                    const active = niche === n.id;
                    return (
                      <button key={n.id} onClick={function() { setNiche(active ? '' : n.id); setSubNiche(''); }}
                        style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: '1px solid ' + (active ? ACC : BORD), background: active ? 'rgba(29,158,117,.12)' : 'transparent' }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: active ? ACCH : TXT }}>{n.icon} {n.label}</div>
                        <div style={{ fontSize: 10, color: TXT3, marginTop: 2 }}>{n.desc}</div>
                      </button>
                    );
                  })}
                </div>
                {niche && (function() {
                  const activeNiche = NICHES.find(function(n) { return n.id === niche; });
                  if (!activeNiche) return null;
                  return (
                    <div>
                      <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Sub-category</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {activeNiche.subNiches.map(function(s) {
                          const active = subNiche === s.id;
                          return (
                            <button key={s.id} onClick={function() { setSubNiche(active ? '' : s.id); }}
                              style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (active ? ACC : BORD), background: active ? 'rgba(29,158,117,.12)' : 'transparent', color: active ? ACCH : TXT2 }}>
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Starter hooks — click to use</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {activeNiche.hooks.map(function(hook, i) {
                          return (
                            <button key={i} onClick={function() { setTopic(hook); }}
                              style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: '1px solid ' + BORD, background: 'rgba(22,61,106,.3)', color: TXT2, lineHeight: 1.4 }}>
                              {hook}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 10, padding: '6px 8px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 6, fontSize: 10, color: '#FAC775', lineHeight: 1.5 }}>
                        ⚠ Compliance note: {activeNiche.compliance.slice(0, 120)}...
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>Topic</div>
              <div style={body()}>
                <input style={inp} placeholder="e.g. morning productivity tips" value={topic} onChange={function(e) { setTopic(e.target.value); }} />
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>Video type</div>
              <div style={{ padding: '6px 8px' }}>
                {VIDEO_TYPES.map(function(t) {
                  return (
                    <button key={t.id} onClick={function() { setVType(t.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 3, border: '1px solid ' + (videoType === t.id ? ACC : 'transparent'), background: videoType === t.id ? 'rgba(29,158,117,.1)' : 'transparent' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: ACCH, width: 28, flexShrink: 0, background: 'rgba(29,158,117,.15)', padding: '2px 4px', borderRadius: 4, textAlign: 'center' }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: TXT }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: TXT2 }}>{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>Persona</div>
              <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PERSONAS.map(function(p) {
                  return <button key={p.id} onClick={function() { setPersona(p.id); }} style={chip(persona === p.id)}>{p.label}</button>;
                })}
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>
                <span>Duration</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  <button onClick={function() { setDurMode('short'); setDur('30s'); }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (durMode === 'short' ? ACC : BORD), background: durMode === 'short' ? 'rgba(29,158,117,.15)' : 'transparent', color: durMode === 'short' ? ACCH : TXT2 }}>Short</button>
                  <button onClick={function() { setDurMode('long'); setDur('5m'); }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (durMode === 'long' ? '#FF0000' : BORD), background: durMode === 'long' ? 'rgba(255,0,0,.1)' : 'transparent', color: durMode === 'long' ? '#FF6B6B' : TXT2 }}>Long (YouTube)</button>
                </div>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                {(durMode === 'long' ? DURATIONS_LONG : DURATIONS_SHORT).map(function(d) {
                  return (
                    <button key={d} onClick={function() { setDur(d); }}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, textAlign: 'center', border: '1px solid ' + (duration === d ? ACC : BORD), background: duration === d ? 'rgba(29,158,117,.15)' : 'transparent', color: duration === d ? ACCH : TXT2 }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>Platforms</div>
              <div style={{ padding: '8px 10px' }}>
                {PLATFORMS.map(function(p) {
                  var on = platforms.includes(p.id);
                  return (
                    <div key={p.id} onClick={function() { togglePlatform(p.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: on ? 'rgba(29,158,117,.08)' : 'transparent', border: '1px solid ' + (on ? 'rgba(29,158,117,.3)' : 'transparent') }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: ACCH, flexShrink: 0 }}>{p.icon}</span>
                      <div style={{ flex: 1, fontSize: 12, color: TXT }}>{p.label}</div>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (on ? ACC : BORD), background: on ? ACC : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <span style={{ fontSize: 9, color: 'white' }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div style={card()}>
              <div style={hdr()}>Video settings</div>
              <div style={body()}>
                <span style={lbl}>Aspect ratio</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
                  {[
                    { id:'9:16',  label:'9:16',  desc:'TikTok' },
                    { id:'16:9',  label:'16:9',  desc:'YouTube' },
                    { id:'1:1',   label:'1:1',   desc:'Feed' },
                    { id:'4:5',   label:'4:5',   desc:'Portrait' },
                    { id:'4:3',   label:'4:3',   desc:'Standard' },
                  ].map(function(r) {
                    return (
                      <button key={r.id} onClick={function() { setAspect(r.id); }}
                        style={{ padding: '7px 2px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', border: '1px solid ' + (aspectRatio === r.id ? ACC : BORD), background: aspectRatio === r.id ? 'rgba(29,158,117,.15)' : 'transparent' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: aspectRatio === r.id ? ACCH : TXT }}>{r.label}</div>
                        <div style={{ fontSize: 9, color: TXT3, marginTop: 2 }}>{r.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <span style={lbl}>Crop style</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
                  {CROP_STYLES.map(function(c) {
                    return (
                      <button key={c.id} onClick={function() { setCropStyle(c.id); }}
                        style={{ padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', border: '1px solid ' + (cropStyle === c.id ? ACC : BORD), background: cropStyle === c.id ? 'rgba(29,158,117,.15)' : 'transparent' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: cropStyle === c.id ? ACCH : TXT }}>{c.label}</div>
                        <div style={{ fontSize: 9, color: TXT3, marginTop: 2 }}>{c.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <span style={lbl}>Background music</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: music !== 'none' ? 10 : 0 }}>
                  {MUSIC_OPTIONS.map(function(m) {
                    return <button key={m.id} onClick={function() { setMusic(m.id); }} style={chip(music === m.id)}>{m.label}</button>;
                  })}
                </div>

                {music !== 'none' && (
                  <div style={{ marginTop: 4 }}>
                    <span style={lbl}>Volume levels</span>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: TXT2 }}>🎙 Voiceover</span>
                        <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{voiceVolume}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={voiceVolume} onChange={function(e) { setVoiceVolume(parseInt(e.target.value)); }} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: TXT2 }}>🎵 Background music</span>
                        <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{musicVolume}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={musicVolume} onChange={function(e) { setMusicVolume(parseInt(e.target.value)); }} style={{ width: '100%' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>Voiceover</div>
              <div style={body()}>
                <span style={lbl}>Female voices — click name to select, ▶ to preview</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {[['nova','Nova','Warm & friendly'],['shimmer','Shimmer','Professional'],['alloy','Alloy','Versatile']].map(function(v) {
                    const isSelected = voice === v[0];
                    const isPlaying = playingVoice === v[0];
                    return (
                      <div key={v[0]} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={function() { setVoice(v[0]); }}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: '1px solid ' + (isSelected ? ACC : BORD), background: isSelected ? 'rgba(29,158,117,.12)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: isSelected ? ACCH : TXT }}>{v[1]}</span>
                            <span style={{ fontSize: 10, color: TXT3, marginLeft: 8 }}>{v[2]}</span>
                          </div>
                          {isSelected && <span style={{ fontSize: 9, color: ACCH }}>✓ Selected</span>}
                        </button>
                        <button onClick={function(e) { e.stopPropagation(); previewVoice(v[0]); }}
                          title={'Preview ' + v[1] + ' voice'}
                          style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid ' + (isPlaying ? ACC : BORD), background: isPlaying ? 'rgba(29,158,117,.2)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: isPlaying ? ACCH : TXT2 }}>
                          {isPlaying ? '■' : '▶'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <span style={lbl}>Male voices — click name to select, ▶ to preview</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['onyx','Onyx','Deep & authoritative'],['echo','Echo','Confident & clear'],['fable','Fable','Warm & expressive']].map(function(v) {
                    const isSelected = voice === v[0];
                    const isPlaying = playingVoice === v[0];
                    return (
                      <div key={v[0]} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={function() { setVoice(v[0]); }}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: '1px solid ' + (isSelected ? ACC : BORD), background: isSelected ? 'rgba(29,158,117,.12)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: isSelected ? ACCH : TXT }}>{v[1]}</span>
                            <span style={{ fontSize: 10, color: TXT3, marginLeft: 8 }}>{v[2]}</span>
                          </div>
                          {isSelected && <span style={{ fontSize: 9, color: ACCH }}>✓ Selected</span>}
                        </button>
                        <button onClick={function(e) { e.stopPropagation(); previewVoice(v[0]); }}
                          title={'Preview ' + v[1] + ' voice'}
                          style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid ' + (isPlaying ? ACC : BORD), background: isPlaying ? 'rgba(29,158,117,.2)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: isPlaying ? ACCH : TXT2 }}>
                          {isPlaying ? '■' : '▶'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: TXT3 }}>Selected: <span style={{ color: ACCH }}>{voice}</span> — OpenAI TTS-1 HD</div>
              </div>
            </div>

            <div style={card()}>
              <div style={hdr()}>Cost per video</div>
              <div style={body()}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['Claude script','~$0.01'],['OpenAI voice','~$0.02'],['Pexels clips','FREE'],['FFmpeg assembly','FREE'],['YouTube publish','FREE'],['Music','FREE']].map(function(item) {
                    return (
                      <div key={item[0]} style={{ padding: '8px 10px', background: 'rgba(22,61,106,.4)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: TXT2, marginBottom: 3 }}>{item[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: item[1] === 'FREE' ? ACC : ACCH }}>{item[1]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Auto-assembly mode toggle */}
            <div style={card()}>
              <div style={hdr()}>
                <span>⚡ Auto-assemble mode</span>
                <span style={{ fontSize: 10, color: TXT3 }}>No manual scene picking needed</span>
              </div>
              <div style={body()}>
                <button onClick={function() { setAutoAssemble(function(v) { return !v; }); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (autoAssemble ? '#1D9E75' : 'rgba(29,158,117,.2)'), background: autoAssemble ? 'rgba(29,158,117,.1)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: autoAssemble ? '#1D9E75' : 'transparent', border: '2px solid ' + (autoAssemble ? '#1D9E75' : 'rgba(29,158,117,.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {autoAssemble && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: autoAssemble ? '#5DCAA5' : TXT }}>
                      {autoAssemble ? '⚡ Auto-assemble ON — one click creates the full video' : 'Enable auto-assemble'}
                    </div>
                    <div style={{ fontSize: 10, color: TXT3, marginTop: 2, lineHeight: 1.4 }}>
                      {autoAssemble
                        ? 'ContentForge will write the script, generate voiceover, extract scene keywords, fetch Pexels clips, and assemble the final ' + aspectRatio + ' video automatically.'
                        : 'Turn on to skip manual scene picking — script, voiceover, clips and final video all generated in one step.'}
                    </div>
                  </div>
                </button>

                {autoAssemble && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon:'✍️', label:'Script', desc:'Claude writes your script from the topic' },
                      { icon:'🎙', label:'Voiceover', desc:'OpenAI TTS reads the script aloud' },
                      { icon:'🔍', label:'Keywords', desc:'Claude extracts a Pexels search term per sentence' },
                      { icon:'🎬', label:'Clips', desc:'Pexels stock clips fetched for each keyword' },
                      { icon:'🎞', label:'Assembly', desc:'FFmpeg syncs clips to voiceover duration + trims to ' + aspectRatio },
                      { icon:'⬇', label:'Download', desc:'Final MP4 ready to post — no editing needed' },
                    ].map(function(step, i) {
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 8px', borderRadius: 6, background: 'rgba(29,158,117,.04)' }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{step.icon}</span>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: TXT, marginRight: 6 }}>{step.label}</span>
                            <span style={{ fontSize: 10, color: TXT3 }}>{step.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 4, padding: '6px 8px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 6, fontSize: 10, color: '#FAC775', lineHeight: 1.4 }}>
                      ⏱ Takes 2–4 minutes end to end. The video downloads automatically when ready.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 10, color: '#F09595', fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <button onClick={generate} disabled={loading || !topic.trim()}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: autoAssemble ? '#1D9E75' : ACC, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading || !topic.trim() ? 0.5 : 1 }}>
              {loading ? 'Working...' : autoAssemble ? '⚡ Generate + Assemble Full Video' : 'Generate Video'}
            </button>
          </div>
        </div>
      )}

      {/* RESULT TAB */}
      {tab === 'result' && (
        <div style={{ maxWidth: 700 }}>
          {!job && (
            <div style={{ ...card(), textAlign: 'center', padding: 50 }}>
              <div style={{ fontSize: 14, color: TXT }}>Generate a video to see results here</div>
            </div>
          )}

          {job && (
            <div>
              <div style={card()}>
                <div style={hdr()}>
                  <span>Progress</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: job.status === 'completed' ? ACC : job.status === 'failed' ? '#F09595' : '#F5A623' }}>
                    {job.status === 'completed' ? 'Complete' : job.status === 'failed' ? 'Failed' : 'Processing'}
                  </span>
                </div>
                <div style={body()}>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: progress + '%', background: job.status === 'failed' ? '#E24B4A' : ACC, borderRadius: 3, transition: 'width .5s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: TXT2 }}>{job.step || 'Waiting...'}</div>
                </div>
              </div>

              {/* Auto-assembled video result */}
              {job.result && job.result.autoAssembled && (
                <div style={{ ...card(), border: '1px solid rgba(29,158,117,.4)', background: 'rgba(29,158,117,.06)' }}>
                  <div style={hdr()}>
                    <span>⚡ Auto-assembled video ready</span>
                    <span style={{ fontSize: 10, color: '#5DCAA5' }}>{job.result.aspectRatio} · {job.result.clipsCount} scenes</span>
                  </div>
                  <div style={body()}>
                    <div style={{ marginBottom: 12, fontSize: 11, color: TXT2, lineHeight: 1.5 }}>
                      Your complete video was assembled automatically — script, voiceover, {job.result.clipsCount} Pexels scenes, and audio sync. Ready to download and post.
                    </div>
                    {job.result.finalVideoUrl ? (
                      <div>
                        <button onClick={function() {
                            const raw = job.result.finalVideoUrl;
                            const url = raw.startsWith('/') ? (API + raw) : raw;
                            const filename = 'contentforge-' + (job.result.aspectRatio || '9-16').replace(':','-') + '.mp4';
                            fetch(url)
                              .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
                              .then(function(blob) {
                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl; a.download = filename;
                                document.body.appendChild(a); a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                              })
                              .catch(function() { window.open(url, '_blank'); });
                          }}
                          style={{ width: '100%', display: 'block', textAlign: 'center', padding: '14px', borderRadius: 10, background: '#1D9E75', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, boxShadow: '0 2px 12px rgba(29,158,117,.4)' }}>
                          ⬇ Download Auto-Assembled Video
                        </button>
                        <div style={{ textAlign: 'center', marginBottom: 8 }}>
                          <a href={job.result.finalVideoUrl.startsWith('/') ? API + job.result.finalVideoUrl : job.result.finalVideoUrl}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 10, color: TXT3, textDecoration: 'underline' }}>
                            Or open in new tab if download doesn't start
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#FAC775', marginBottom: 8 }}>
                          ⏳ Video assembled — preparing download link...
                        </div>
                        <button onClick={function() {
                            const url = API + '/api/video/download/' + job.id;
                            const filename = 'contentforge-' + (job.result.aspectRatio || '9-16').replace(':','-') + '.mp4';
                            fetch(url)
                              .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
                              .then(function(blob) {
                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl; a.download = filename;
                                document.body.appendChild(a); a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                              })
                              .catch(function(e) { alert('Download failed: ' + e.message + '. Try refreshing the page.'); });
                          }}
                          style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#1D9E75', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(29,158,117,.4)' }}>
                          ⬇ Download Video Now
                        </button>
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: TXT3, lineHeight: 1.5 }}>
                      You can also scroll down to add a HeyGen avatar overlay, or use the manual scene picker below to customise individual clips.
                    </div>
                  </div>
                </div>
              )}

              {job.result && job.result.autoAssembleFailed && (
                <div style={{ ...card(), border: '1px solid rgba(245,166,35,.3)', background: 'rgba(245,166,35,.05)' }}>
                  <div style={hdr()}>⚠ Auto-assembly couldn't complete</div>
                  <div style={body()}>
                    <div style={{ fontSize: 11, color: '#FAC775', lineHeight: 1.5, marginBottom: 8 }}>
                      {job.step || 'Auto-assembly encountered an issue.'} Your script and voiceover are ready — use the manual scene picker below to select clips and combine manually.
                    </div>
                  </div>
                </div>
              )}

              {job.result && job.result.script && (
                <div style={card()}>
                  <div style={hdr()}>Script</div>
                  <div style={body()}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: ACCH, marginBottom: 4 }}>Hook</div>
                    <div style={{ fontSize: 13, color: TXT, marginBottom: 10, padding: '8px 10px', background: 'rgba(29,158,117,.06)', borderRadius: 6 }}>
                      {job.result.script.hook}
                    </div>
                    <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.7, maxHeight: 100, overflow: 'auto', padding: '8px 10px', background: 'rgba(22,61,106,.4)', borderRadius: 6 }}>
                      {job.result.script.fullScript}
                    </div>
                    {job.result.script.hashtags && job.result.script.hashtags.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: ACCH }}>{job.result.script.hashtags.join(' ')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Image / Photo → video clip converter */}
              {job.result && job.result.script && (
                <div style={card()}>
                  <div style={hdr()}>
                    <span>Photo → video clip</span>
                    <span style={{ fontSize: 10, color: TXT3 }}>Ken Burns pan/zoom · fits your chosen ratio</span>
                  </div>
                  <div style={body()}>
                    <div style={{ fontSize: 11, color: TXT2, marginBottom: 10, lineHeight: 1.5 }}>
                      Paste any image URL below to convert it into a {aspectRatio} video clip with a smooth pan/zoom effect. Downloads as an MP4 you can mix into your project.
                    </div>
                    <span style={lbl}>Image URL</span>
                    <input style={inp}
                      placeholder="https://example.com/your-photo.jpg"
                      value={imgToClipUrl}
                      onChange={function(e) {
                        // Sanitise pasted URLs — strip invisible chars, smart quotes
                        const raw = e.target.value;
                        const cleaned = raw
                          .replace(/[​-‍﻿ ]/g, '') // zero-width + nbsp
                          .replace(/[‘’“”]/g, '')   // smart quotes
                          .trim();
                        setImgToClipUrl(cleaned);
                        setImgClipErr('');
                      }} />
                    {imgToClipError && (
                      <div style={{ marginBottom: 8, padding: '6px 10px', background: 'rgba(226,75,74,.12)', borderRadius: 6, fontSize: 11, color: '#F09595' }}>
                        {imgToClipError}
                      </div>
                    )}
                    <button onClick={convertImageToClip} disabled={imgToClipLoading || !imgToClipUrl.trim()}
                      style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                        background: (imgToClipLoading || !imgToClipUrl.trim()) ? 'rgba(29,158,117,.25)' : '#1D9E75',
                        boxShadow: (!imgToClipLoading && imgToClipUrl.trim()) ? '0 2px 12px rgba(29,158,117,.45)' : 'none',
                        color: (imgToClipLoading || !imgToClipUrl.trim()) ? 'rgba(255,255,255,.5)' : 'white',
                        fontSize: 13, fontWeight: 700, cursor: (imgToClipLoading || !imgToClipUrl.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.2s ease' }}>
                      {imgToClipLoading ? (
                        <>
                          <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />
                          Converting to {aspectRatio} video…
                        </>
                      ) : <>⬇ Convert to {aspectRatio} video clip</>}
                    </button>
                  </div>
                </div>
              )}

              {job.result && job.result.script && job.result.script.fullScript && (
                <div style={card()}>
                  <div style={hdr()}>
                    <span>Pick scenes from your script</span>
                    <span style={{ fontSize: 11, color: TXT3 }}>{selectedPhrases.length} selected</span>
                  </div>
                  <div style={body()}>
                    <div style={{ fontSize: 11, color: TXT2, marginBottom: 10, lineHeight: 1.5 }}>
                      Click any sentence to select it. Claude suggests a keyword for the scene — edit it and click Re-match to find a better clip.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {splitIntoPhrases(job.result.script.fullScript).map(function(phrase, i) {
                        const isSelected = selectedPhrases.includes(phrase);
                        const keyword = sceneKeywords[phrase] || '';
                        const match = sceneMatches[phrase];
                        const matching = !!sceneMatching[phrase];
                        const matchError = sceneMatchError[phrase];
                        return (
                          <div key={i}>
                            <div onClick={function() { togglePhrase(phrase); }}
                              style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, lineHeight: 1.5, border: '1px solid ' + (isSelected ? ACC : BORD), background: isSelected ? 'rgba(29,158,117,.12)' : 'rgba(22,61,106,.3)', color: isSelected ? TXT : TXT2, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 4, marginTop: 1, border: '2px solid ' + (isSelected ? ACC : BORD), background: isSelected ? ACC : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isSelected && <span style={{ fontSize: 9, color: 'white' }}>✓</span>}
                              </span>
                              <span>{phrase}</span>
                            </div>
                            {isSelected && (
                              <div style={{ padding: '8px 10px 4px 34px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <span style={lbl}>Scene keyword</span>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input style={{ ...inp, marginBottom: 0, flex: 1 }} value={keyword}
                                      placeholder={matching ? 'Suggesting...' : 'e.g. elderly woman baking pie'}
                                      onClick={function(e) { e.stopPropagation(); }}
                                      onChange={function(e) { setSceneKeywords(prev => ({ ...prev, [phrase]: e.target.value })); }} />
                                    <button onClick={function(e) { e.stopPropagation(); rematchScene(phrase); }}
                                      disabled={matching || !keyword.trim()}
                                      style={{ padding: '0 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', border: '1px solid ' + BORD, background: 'transparent', color: ACCH, cursor: (matching || !keyword.trim()) ? 'default' : 'pointer', opacity: (matching || !keyword.trim()) ? 0.5 : 1 }}>
                                      Re-match
                                    </button>
                                  </div>
                                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    {getNicheSituations().slice(0, niche ? 12 : 8).map(function(sit) {
                                      const nicheActive = NICHES.find(function(n) { return n.id === niche; });
                                      const isNicheRelevant = nicheActive && nicheActive.situations.includes(sit);
                                      return (
                                        <span key={sit}
                                          onClick={function(e) { e.stopPropagation(); setSceneKeywords(function(prev) { return { ...prev, [phrase]: ((prev[phrase] || '').trim() + ' ' + sit.toLowerCase()).trim() }; }); }}
                                          style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, cursor: 'pointer', border: '1px solid ' + (isNicheRelevant ? ACC : BORD), background: isNicheRelevant ? 'rgba(29,158,117,.1)' : 'transparent', color: isNicheRelevant ? ACCH : TXT3, fontWeight: isNicheRelevant ? 500 : 400 }}>
                                          {sit}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  {matchError && <div style={{ marginTop: 6, fontSize: 11, color: '#F09595' }}>{matchError}</div>}
                                </div>
                                <div style={{ width: 90, flexShrink: 0 }}>
                                  <span style={lbl}>Match</span>
                                  <div style={{ width: 90, aspectRatio: '9/16', borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORD, background: 'rgba(22,61,106,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {matching ? (
                                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: ACCH, borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />
                                    ) : match && match.matched && match.videoUrl ? (
                                      <video src={match.videoUrl} muted loop autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : match && !match.matched ? (
                                      <span style={{ fontSize: 9, color: '#F09595', textAlign: 'center', padding: 6 }}>No match</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedPhrases.length > 0 && (
                      <button onClick={function() {
                        const clips = selectedPhrases.map(function(phrase, i) {
                          const match = sceneMatches[phrase];
                          return { scene: i+1, phrase, status: (match && match.matched && match.videoUrl) ? 'success' : 'failed', videoUrl: (match && match.matched) ? match.videoUrl : null };
                        });
                        setPhraseClips(clips);
                        setScenesConfirmed(true);
                      }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: scenesConfirmed ? 'rgba(29,158,117,.3)' : ACC, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {scenesConfirmed ? '✓ Scenes confirmed — edit selections above to change' : 'Done picking scenes'}
                      </button>
                    )}

                    <style>{'@keyframes cf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
                  </div>
                </div>
              )}

              {scenesConfirmed && phraseClips.some(function(c) { return c.status === 'success'; }) && (
                <div style={{ ...card(), padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 4 }}>Combine clips into final video</div>
                  {heygenVideoUrl ? (
                    <div style={{ marginBottom: 8, padding: '6px 10px', background: 'rgba(29,158,117,.1)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 6, fontSize: 10, color: ACCH, lineHeight: 1.5 }}>
                      🎭 HeyGen avatar ready — will appear as PIP overlay in bottom-right corner of the combined video.
                      {heygenGreenScreen && ' Green screen mode on — avatar will float transparently over scenes.'}
                      <button onClick={function() { setHeygenUrl(''); }}
                        style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(29,158,117,.4)', background: 'transparent', color: TXT3, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 8, padding: '5px 10px', background: 'rgba(22,61,106,.3)', borderRadius: 6, fontSize: 10, color: TXT3, lineHeight: 1.4 }}>
                      No HeyGen avatar attached — combine will use Pexels scenes only. Generate an avatar video in the HeyGen panel below to include it.
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: TXT2, marginBottom: 10, lineHeight: 1.5 }}>
                    Merges your {phraseClips.filter(function(c){return c.status==='success';}).length} matched scenes with the voiceover and music into one downloadable MP4.
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 10px', background: 'rgba(29,158,117,.05)', borderRadius: 8, border: '1px solid rgba(29,158,117,.15)' }}>
                    <div onClick={function() { setVignette(function(v){return !v;}); }}
                      style={{ width: 36, height: 20, borderRadius: 10, background: vignette ? ACC : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: vignette ? 18 : 2, transition: 'left .2s' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: TXT, fontWeight: 500 }}>Dark vignette edges</div>
                      <div style={{ fontSize: 10, color: TXT3 }}>Cinematic dark fade around the edges — free FFmpeg filter</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(22,61,106,.4)', borderRadius: 8, border: '1px solid ' + BORD }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: TXT, marginBottom: 6 }}>CTA overlay — appears on final 5 seconds of video</div>
                    <div style={{ fontSize: 11, color: TXT2, marginBottom: 8, lineHeight: 1.4 }}>
                      Your link or short URL displays as visible text burned into the video. Leave blank to skip.
                    </div>
                    <span style={lbl}>Your URL (the actual link)</span>
                    <input style={inp} placeholder="https://your-affiliate-link.com/product"
                      value={ctaUrl} onChange={function(e) { setCtaUrl(e.target.value); }} />
                    <span style={lbl}>Display text (optional — shown instead of the full URL)</span>
                    <input style={inp} placeholder="e.g.  Link in bio  or  contentstudiohub.com"
                      value={ctaText} onChange={function(e) { setCtaText(e.target.value); }} />
                    <div style={{ fontSize: 10, color: TXT3, lineHeight: 1.4 }}>
                      Tip: use a short display text so viewers can remember it. The actual clickable link goes in your Facebook/YouTube description.
                    </div>
                  </div>

                  {music !== 'none' && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: TXT2 }}>🎙 Voiceover</span>
                          <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{voiceVolume}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={voiceVolume} onChange={function(e) { setVoiceVolume(parseInt(e.target.value)); }} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: TXT2 }}>🎵 Background music</span>
                          <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{musicVolume}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={musicVolume} onChange={function(e) { setMusicVolume(parseInt(e.target.value)); }} style={{ width: '100%' }} />
                      </div>
                    </div>
                  )}

                  {combineError && (
                    <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(226,75,74,.12)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 8, fontSize: 12, color: '#F09595', wordBreak: 'break-word' }}>
                      <strong>Combine failed:</strong> {combineError}
                    </div>
                  )}

                  <button onClick={assembleAndDownload} disabled={assembling}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: assembling ? 'rgba(29,158,117,.4)' : ACC, color: 'white', fontSize: 13, fontWeight: 600, cursor: assembling ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {assembling ? (
                      <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />Combining clips and audio…</>
                    ) : <>⬇ Combine &amp; Download Final Video</>}
                  </button>

                  <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,0,0,.05)', border: '1px solid rgba(255,0,0,.2)', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 4 }}>Publish to YouTube</div>
                    <div style={{ fontSize: 11, color: TXT2, marginBottom: 10 }}>Publishes as a YouTube Short (9:16 vertical). Title and description are pre-filled from your script.</div>

                    <span style={lbl}>Title (required)</span>
                    <input style={inp} placeholder="Video title" value={ytTitle} onChange={function(e) { setYtTitle(e.target.value); }} maxLength={100} />

                    <span style={lbl}>Description</span>
                    <textarea value={ytDescription} onChange={function(e) { setYtDescription(e.target.value); }} placeholder="Add a description..." style={{ ...inp, minHeight: 60, resize: 'vertical' }} />

                    <span style={lbl}>Privacy</span>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {[['unlisted','Unlisted'],['public','Public'],['private','Private']].map(function(p) {
                        return (
                          <button key={p[0]} onClick={function() { setYtPrivacy(p[0]); }}
                            style={{ flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, textAlign: 'center', border: '1px solid ' + (ytPrivacy === p[0] ? '#FF0000' : BORD), background: ytPrivacy === p[0] ? 'rgba(255,0,0,.12)' : 'transparent', color: ytPrivacy === p[0] ? '#FF6B6B' : TXT2 }}>
                            {p[1]}
                          </button>
                        );
                      })}
                    </div>

                    {publishError && (
                      <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(226,75,74,.12)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 8, fontSize: 12, color: '#F09595', wordBreak: 'break-word' }}>
                        <strong>Publish failed:</strong> {publishError}
                      </div>
                    )}

                    {publishResult && publishResult.success && (
                      <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.3)', borderRadius: 8, fontSize: 12, color: ACCH }}>
                        ✅ Published{publishResult.isShort ? ' as a Short' : ''}! <a href={publishResult.youtubeUrl} target="_blank" rel="noreferrer" style={{ color: ACCH }}>{publishResult.youtubeUrl}</a>
                      </div>
                    )}

                    <button onClick={publishToYouTube} disabled={publishing || !ytTitle.trim()}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: (publishing || !ytTitle.trim()) ? 'rgba(255,0,0,.25)' : '#FF0000', color: 'white', fontSize: 13, fontWeight: 600, cursor: (publishing || !ytTitle.trim()) ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {publishing ? (
                        <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />Uploading to YouTube…</>
                      ) : <>▶ Publish to YouTube</>}
                    </button>
                  </div>
                </div>
              )}

              {/* HeyGen Avatar Video Panel */}
              {job && job.result && job.result.script && (
                <div style={card()}>
                  <div style={hdr()}>
                    <span>🎭 HeyGen Avatar Video</span>
                    <span style={{ fontSize: 10, color: TXT3 }}>Avatar IV — photorealistic AI presenter</span>
                  </div>
                  <div style={body()}>

                    {/* Feature guide */}
                    <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(22,61,106,.35)', border: '1px solid rgba(93,202,165,.15)', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TXT, marginBottom: 8 }}>How to create an Avatar IV video</div>
                      {[
                        { step:'1', title:'Load avatars', desc:'Click Load Avatar Options to see all available HeyGen avatars. Use niche tabs (🏠 Home Biz, 💪 Fitness, 🥗 Healthy, 👨‍🍳 Cooking) to filter by your content type. Search by keyword like "office", "chef", or "casual".' },
                        { step:'2', title:'Choose or create an avatar', desc:'Click any avatar card to select it (green ✓ appears). Or expand "Create custom avatar for your niche" below the grid — click a niche tab first to see pre-written suggestions, then click a suggestion to auto-fill the creator. Adjust gender, age, ethnicity and click Generate.' },
                        { step:'3', title:'Choose a voice', desc:'Pick from the voice dropdown. These are HeyGen\'s own AI voices. The avatar will lip-sync to the selected voice reading your script.' },
                        { step:'4', title:'Optional: transparent background', desc:'Enable the green screen toggle if you plan to combine this avatar video with your Pexels scene clips. The avatar will float over the scene with no background box.' },
                        { step:'5', title:'Generate', desc:'Click Generate Avatar IV Video. HeyGen queues the job — it typically takes 10–30 minutes. ContentForge checks for 2.5 minutes, then shows a direct link to your HeyGen Projects page where the video appears when ready.' },
                        { step:'6', title:'Combine with scene clips', desc:'Once the avatar video is ready and shown below, scroll up and click ⬇ Combine & Download Final Video. Your Pexels scene clips fill the frame and the avatar appears in the bottom-right corner.' },
                      ].map(function(item) {
                        return (
                          <div key={item.step} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: ACC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 1 }}>{item.step}</div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: TXT, marginBottom: 2 }}>{item.title}</div>
                              <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.5 }}>{item.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 6, fontSize: 10, color: '#FAC775', lineHeight: 1.4 }}>
                        💡 Best results tip: Use a niche suggestion for a well-described avatar that matches your script topic. For home income content pick a casual professional. For cooking pick someone in an apron. The more specific your appearance description, the better the result.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button onClick={loadHeyGenConfig}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid ' + BORD, background: 'transparent', color: ACCH, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {heygenLoaded ? '↻ Refresh Avatars' : 'Load Avatar Options'}
                      </button>
                    </div>
                    {heygenLoaded && !heygenConfigured && (
                      <div style={{ padding: '10px', background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 8, fontSize: 12, color: '#FAC775', lineHeight: 1.5 }}>
                        HEYGEN_API_KEY not found in Railway. Add it to Railway variables and redeploy to enable avatar videos.
                      </div>
                    )}
                    {heygenLoaded && heygenConfigured && (
                      <div>
                        {/* Niche filter tabs */}
                        <div style={{ marginBottom: 8 }}>
                          <span style={lbl}>Filter by content niche</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {[
                              { id:'all',           label:'All',          icon:'👥' },
                              { id:'home-business', label:'Home Biz',     icon:'🏠' },
                              { id:'fitness',       label:'Fitness',      icon:'💪' },
                              { id:'healthy-eating',label:'Healthy',      icon:'🥗' },
                              { id:'cooking',       label:'Cooking',      icon:'👨‍🍳' },
                              { id:'lifestyle',     label:'Lifestyle',    icon:'✨' },
                            ].map(function(tab) {
                              const active = avatarNiche === tab.id;
                              return (
                                <button key={tab.id}
                                  onClick={function() {
                                    setAvatarNiche(tab.id);
                                    setAvatarPage(0);
                                    loadNicheSuggestions(tab.id);
                                  }}
                                  style={{ padding: '4px 9px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, border: '1px solid ' + (active ? ACC : BORD), background: active ? 'rgba(29,158,117,.15)' : 'transparent', color: active ? ACCH : TXT2 }}>
                                  {tab.icon} {tab.label}
                                </button>
                              );
                            })}
                          </div>
                          {nicheSuggestions.length > 0 && (
                            <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(29,158,117,.06)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 8 }}>
                              <div style={{ fontSize: 10, color: ACCH, fontWeight: 600, marginBottom: 5 }}>✨ Niche suggestions — click to auto-fill creator</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {nicheSuggestions.map(function(s, i) {
                                  return (
                                    <button key={i}
                                      onClick={function() {
                                      setCreateApp(s.appearance);
                                      setCreateGender(s.gender);
                                      setCreateAge(s.age || 'Unspecified');
                                      setCreateStyle(s.style);
                                      setCreateEth(s.ethnicity || 'Unspecified');
                                      setCreateBgType(s.backgroundType || 'color');
                                      setCreateBgUrl(s.backgroundUrl || '');
                                      setShowCreate(true);
                                      setTimeout(function() {
                                        if (creatorPanelRef.current) {
                                          creatorPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 100);
                                    }}
                                      style={{ padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, textAlign: 'left', border: '1px solid ' + BORD, background: 'rgba(22,61,106,.3)', color: TXT2, lineHeight: 1.4 }}>
                                      {s.label || (s.gender + ' · ' + (s.age || '') + ' — ' + s.appearance.slice(0, 60) + '...')}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <span style={lbl}>Choose avatar ({heygenAvatars.length} available)</span>
                        {heygenAvatars.length === 0 ? (
                          <div style={{ fontSize: 11, color: TXT3, marginBottom: 10 }}>Loading avatars...</div>
                        ) : (function() {
                          const PER_PAGE = 12;
                          const filtered = heygenAvatars.filter(function(a) {
                            const matchGender = avatarFilter === 'all' || (a.gender && a.gender.toLowerCase() === avatarFilter);
                            const matchNiche  = avatarNiche === 'all' || (a.niches && a.niches.includes(avatarNiche));
                            const searchTerm  = avatarSearch.trim().toLowerCase();
                            const nicheKwMap  = { 'home':['office','business','blazer','casual','desk'], 'kitchen':['chef','cook','apron','food'], 'fitness':['gym','sport','workout','active'], 'cooking':['chef','apron','cook','food'], 'professional':['blazer','suit','formal','business'], 'casual':['tshirt','t-shirt','sofa','casual','hoodie'] };
                            let matchSearch = true;
                            if (searchTerm) {
                              const nameMatch = a.avatar_name && a.avatar_name.toLowerCase().includes(searchTerm);
                              const kwMatch   = Object.entries(nicheKwMap).some(function(e) { return e[0].includes(searchTerm) && e[1].some(function(kw) { return a.avatar_name && a.avatar_name.toLowerCase().includes(kw); }); });
                              matchSearch = nameMatch || kwMatch;
                            }
                            return matchGender && matchNiche && matchSearch;
                          });
                          const totalPages = Math.ceil(filtered.length / PER_PAGE);
                          const safePage   = Math.min(avatarPage, Math.max(0, totalPages - 1));
                          const visible    = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
                          return (
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                                <input placeholder="Search by name or topic (office, chef, casual…)"
                                  value={avatarSearch}
                                  onChange={function(e) { setAvatarSearch(e.target.value); setAvatarPage(0); }}
                                  style={{ flex: 1, background: 'rgba(22,61,106,.5)', border: '1px solid ' + BORD, borderRadius: 6, padding: '4px 8px', fontSize: 10, color: TXT, fontFamily: 'inherit', outline: 'none' }} />
                                {['all','male','female'].map(function(g) {
                                  return (
                                    <button key={g} onClick={function() { setAvatarFilter(g); setAvatarPage(0); }}
                                      style={{ padding: '3px 7px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, border: '1px solid ' + (avatarFilter === g ? ACC : BORD), background: avatarFilter === g ? 'rgba(29,158,117,.15)' : 'transparent', color: avatarFilter === g ? ACCH : TXT2 }}>
                                      {g === 'all' ? 'All' : g === 'male' ? '♂' : '♀'}
                                    </button>
                                  );
                                })}
                              </div>
                              {filtered.length === 0 ? (
                                <div style={{ padding: '10px', textAlign: 'center', color: TXT3, fontSize: 10, background: 'rgba(22,61,106,.2)', borderRadius: 8, marginBottom: 8 }}>
                                  No avatars match — <span style={{ color: ACCH, cursor: 'pointer' }} onClick={function() { setAvatarSearch(''); setAvatarFilter('all'); setAvatarNiche('all'); }}>clear filters</span> or create one below.
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 6 }}>
                                  {visible.map(function(a) {
                                    const active = heygenAvatar === a.avatar_id;
                                    return (
                                      <button key={a.avatar_id} onClick={function() { setHeygenAvatar(a.avatar_id); }}
                                        style={{ padding: '5px 3px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', border: '2px solid ' + (active ? ACC : BORD), background: active ? 'rgba(29,158,117,.1)' : 'rgba(22,61,106,.2)', position: 'relative' }}>
                                        {active && <div style={{ position: 'absolute', top: 3, right: 3, width: 13, height: 13, borderRadius: '50%', background: ACC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', zIndex: 1 }}>✓</div>}
                                        <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: 5, overflow: 'hidden', marginBottom: 4, background: 'rgba(22,61,106,.4)' }}>
                                          {a.preview_image_url
                                            ? <img src={a.preview_image_url} alt={a.avatar_name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={function(e) { e.target.style.display='none'; }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>}
                                        </div>
                                        <div style={{ fontSize: 8, color: active ? ACCH : TXT2, fontWeight: active ? 600 : 400, lineHeight: 1.2 }}>{a.avatar_name?.slice(0,18) || 'Avatar'}</div>
                                        {a.niches && <div style={{ fontSize: 7, color: TXT3 }}>{a.niches.slice(0,2).join(' · ')}</div>}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              {totalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <button onClick={function() { setAvatarPage(function(p) { return Math.max(0,p-1); }); }} disabled={safePage===0}
                                    style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid '+BORD, background: 'transparent', color: safePage===0?TXT3:TXT2, cursor: safePage===0?'default':'pointer', fontFamily:'inherit', fontSize:10 }}>← Prev</button>
                                  <span style={{ fontSize: 9, color: TXT3 }}>{safePage+1}/{totalPages} · {filtered.length} shown</span>
                                  <button onClick={function() { setAvatarPage(function(p) { return Math.min(totalPages-1,p+1); }); }} disabled={safePage===totalPages-1}
                                    style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid '+BORD, background: 'transparent', color: safePage===totalPages-1?TXT3:TXT2, cursor: safePage===totalPages-1?'default':'pointer', fontFamily:'inherit', fontSize:10 }}>Next →</button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Photo Avatar Creator */}
                        <div ref={creatorPanelRef} style={{ marginBottom: 12, border: '1px solid ' + BORD, borderRadius: 10, overflow: 'hidden' }}>
                          <button onClick={function() { setShowCreate(function(v) { return !v; }); }}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(22,61,106,.4)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: TXT }}>✨ Create custom avatar for your niche</span>
                            <span style={{ fontSize: 10, color: TXT3 }}>{showCreateAvatar ? '▲' : '▼'}</span>
                          </button>
                          {showCreateAvatar && (
                            <div style={{ padding: '10px 12px', background: 'rgba(15,28,50,.5)' }}>
                              <div style={{ fontSize: 10, color: TXT3, marginBottom: 8, lineHeight: 1.5 }}>
                                Describe an avatar and HeyGen generates it. Click a niche tab above for pre-written suggestions, or write your own description. Uses API credits (~$0.50).
                              </div>
                              <span style={lbl}>Appearance description</span>
                              <textarea value={createAppearance} onChange={function(e) { setCreateApp(e.target.value); }}
                                placeholder="e.g. Confident professional woman in business casual attire at a bright home office, friendly warm smile, natural lighting"
                                rows={3}
                                style={{ width: '100%', background: 'rgba(22,61,106,.5)', border: '1px solid ' + BORD, borderRadius: 6, padding: '6px 8px', fontSize: 10, color: TXT, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                                {[
                                  { label:'Gender',    val: createGender,    set: setCreateGender,   opts:['Woman','Man','Non-binary'] },
                                  { label:'Age',       val: createAge,       set: setCreateAge,      opts:['Unspecified','Young Adult','Early Middle Age','Late Middle Age','Senior'] },
                                  { label:'Ethnicity', val: createEthnicity, set: setCreateEth,      opts:['Unspecified','White','Black','Asian American','East Asian','South East Asian','South Asian','Middle Eastern','Pacific','Hispanic'] },
                                  { label:'Style',     val: createStyle,     set: setCreateStyle,    opts:['Realistic','Cinematic','Natural'] },
                                ].map(function(f) {
                                  return (
                                    <div key={f.label}>
                                      <div style={{ fontSize: 9, color: TXT3, marginBottom: 3 }}>{f.label}</div>
                                      <select value={f.val} onChange={function(e) { f.set(e.target.value); }}
                                        style={{ width: '100%', background: 'rgba(22,61,106,.5)', border: '1px solid ' + BORD, borderRadius: 5, padding: '4px 6px', fontSize: 10, color: TXT, fontFamily: 'inherit' }}>
                                        {f.opts.map(function(o) { return <option key={o}>{o}</option>; })}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                              {createError && <div style={{ marginBottom: 6, padding: '5px 8px', background: 'rgba(226,75,74,.12)', borderRadius: 5, fontSize: 10, color: '#F09595' }}>{createError}</div>}
                              {createDone && <div style={{ marginBottom: 6, padding: '5px 8px', background: 'rgba(29,158,117,.1)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 5, fontSize: 10, color: ACCH }}>✅ Created! Click ↻ Refresh Avatars to see it in the grid.</div>}
                              <button onClick={createPhotoAvatar} disabled={creating || !createAppearance.trim()}
                                style={{ width: '100%', padding: '8px', borderRadius: 7, border: 'none', background: (creating||!createAppearance.trim()) ? 'rgba(29,158,117,.3)' : ACC, color: 'white', fontSize: 11, fontWeight: 600, cursor: (creating||!createAppearance.trim()) ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                {creating ? <><span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} /> Creating (1–3 min)…</> : <>✨ Generate custom avatar</>}
                              </button>
                            </div>
                          )}
                        </div>

                        <span style={lbl}>Choose voice</span>
                        <select value={heygenVoice} onChange={function(e) { setHeygenVoice(e.target.value); }}
                          style={{ ...inp, marginBottom: 12 }}>
                          {heygenVoices.map(function(v) {
                            return <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.gender})</option>;
                          })}
                        </select>

                        <button onClick={function() { setHeygenGS(!heygenGreenScreen); }}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, border: '1px solid ' + (heygenGreenScreen ? '#00c851' : BORD), background: heygenGreenScreen ? 'rgba(0,200,81,.1)' : 'rgba(22,61,106,.2)', color: heygenGreenScreen ? '#00c851' : TXT2, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 15, height: 15, borderRadius: 3, background: heygenGreenScreen ? '#00c851' : 'transparent', border: '2px solid ' + (heygenGreenScreen ? '#00c851' : BORD), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {heygenGreenScreen && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600 }}>Transparent background (green screen)</div>
                            <div style={{ fontSize: 9, color: TXT3, marginTop: 1 }}>Avatar floats over your scene video with no background box — best for PIP combine</div>
                          </div>
                        </button>

                        {/* Pre-generation preview — avatar + script */}
                        {heygenAvatar && (function() {
                          const selectedAvatar = heygenAvatars.find(function(a) { return a.avatar_id === heygenAvatar; });
                          const scriptText = job?.result?.script?.fullScript || '';
                          if (!selectedAvatar) return null;
                          return (
                            <div style={{ marginBottom: 12, border: '1px solid rgba(29,158,117,.25)', borderRadius: 10, overflow: 'hidden' }}>
                              <div style={{ padding: '8px 12px', background: 'rgba(29,158,117,.08)', fontSize: 10, fontWeight: 600, color: ACCH }}>
                                ✅ Preview — this avatar will speak this script
                              </div>
                              <div style={{ display: 'flex', gap: 0 }}>
                                {/* Avatar image */}
                                <div style={{ width: 90, flexShrink: 0, background: 'rgba(22,61,106,.4)' }}>
                                  {selectedAvatar.preview_image_url ? (
                                    <img src={selectedAvatar.preview_image_url} alt={selectedAvatar.avatar_name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>
                                  )}
                                </div>
                                {/* Script preview */}
                                <div style={{ flex: 1, padding: '10px 12px' }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: TXT, marginBottom: 4 }}>{selectedAvatar.avatar_name}</div>
                                  <div style={{ fontSize: 9, color: TXT3, marginBottom: 6 }}>
                                    {selectedAvatar.gender && <span style={{ marginRight: 6 }}>{selectedAvatar.gender}</span>}
                                    {selectedAvatar.niches && <span>{selectedAvatar.niches.slice(0,2).join(' · ')}</span>}
                                  </div>
                                  <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.6, maxHeight: 100, overflow: 'hidden' }}>
                                    {scriptText.slice(0, 220)}{scriptText.length > 220 ? '…' : ''}
                                  </div>
                                  <button onClick={function() { setHeygenAvatar(''); }}
                                    style={{ marginTop: 8, padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(226,75,74,.4)', background: 'transparent', color: '#F09595', fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ✕ Change avatar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {!heygenAvatar && (
                          <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 8, fontSize: 11, color: '#FAC775', lineHeight: 1.5 }}>
                            ⚠ No avatar selected — click an avatar card above before generating. The Generate button will activate once you choose one.
                          </div>
                        )}

                        <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(22,61,106,.3)', borderRadius: 8, fontSize: 11, color: TXT2, lineHeight: 1.5 }}>
                          This will submit your script to HeyGen for Avatar IV generation. It takes 10–30 minutes. ContentForge will check for 2.5 minutes, then give you a direct link to your HeyGen projects page where it will appear when ready. Uses your HeyGen API balance (~$0.50–$2 depending on length).
                        </div>

                        {heygenError && heygenError.startsWith('READY_CHECK:') ? (
                          <div style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.25)', borderRadius: 8, fontSize: 11, color: '#FAC775', lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>⏳ Video is generating on HeyGen's servers</div>
                            <div style={{ marginBottom: 8 }}>HeyGen typically takes 10–30 minutes for Avatar IV videos. Your video is in the queue and will appear in your HeyGen projects when ready.</div>
                            <a href={'https://app.heygen.com/projects'} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 6, background: 'rgba(245,166,35,.2)', color: '#FAC775', textDecoration: 'none', fontSize: 11, fontWeight: 600 }}>
                              Open HeyGen Projects →
                            </a>
                            <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(250,199,117,.6)' }}>Video ID: {heygenError.replace('READY_CHECK:', '')}</div>
                          </div>
                        ) : heygenError ? (
                          <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(226,75,74,.12)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 8, fontSize: 12, color: '#F09595', wordBreak: 'break-word' }}>
                            {heygenError}
                          </div>
                        ) : null}

                        {heygenVideoUrl && (
                          <div style={{ marginBottom: 12 }}>
                            <video src={heygenVideoUrl} controls
                              style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block', marginBottom: 8 }} />
                            <a href={heygenVideoUrl} download="heygen-avatar-video.mp4"
                              style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 8, background: ACC, color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 8 }}>
                              ⬇ Download Avatar Video (standalone)
                            </a>
                            <div style={{ padding: '8px 10px', background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 8, fontSize: 11, color: ACCH, lineHeight: 1.5 }}>
                              ✅ Avatar ready — scroll up and click <strong style={{ color: TXT }}>⬇ Combine &amp; Download Final Video</strong> to merge your Pexels scenes with this avatar as a corner overlay. The avatar will appear in the bottom-right of the frame.
                            </div>
                          </div>
                        )}

                        <button onClick={generateHeyGenVideo} disabled={heygenGenerating || !heygenAvatar || !heygenVoice}
                          style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                            background: (heygenGenerating || !heygenAvatar || !heygenVoice) ? 'rgba(29,158,117,.3)' : ACC,
                            color: 'white', fontSize: 13, fontWeight: 600, cursor: (heygenGenerating || !heygenAvatar || !heygenVoice) ? 'default' : 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          {heygenGenerating ? (
                            <>
                              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />
                              Submitting to HeyGen… checking for 2.5 min then showing dashboard link
                            </>
                          ) : heygenAvatar ? <>🎭 Generate Avatar IV Video</> : <>Select an avatar above first</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div style={{ maxWidth: 700 }}>

          {/* Saved auto-assembled videos section */}
          {jobs.filter(function(j) { return j.result && j.result.finalVideoUrl && j.result.autoAssembled; }).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ACCH, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚡ Saved Auto-Assembled Videos
              </div>
              {jobs.filter(function(j) { return j.result && j.result.finalVideoUrl && j.result.autoAssembled; }).map(function(j, i) {
                const topic = (j.data && j.data.topic) || 'Auto Video';
                const date  = j.result && j.result.savedAt ? new Date(j.result.savedAt).toLocaleString() : (j.createdAt ? new Date(j.createdAt).toLocaleString() : '');
                const ratio = j.result && j.result.aspectRatio || '';
                const clips = j.result && j.result.clipsCount || 0;
                return (
                  <div key={i} style={{ ...card(), marginBottom: 8, border: '1px solid rgba(29,158,117,.25)' }}>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: ACC, marginTop: 3 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: TXT, marginBottom: 2 }}>{topic}</div>
                          <div style={{ fontSize: 10, color: TXT3, lineHeight: 1.5 }}>
                            {date} · {ratio} · {clips} scenes · auto-assembled
                          </div>
                          {j.result && j.result.script && j.result.script.hook && (
                            <div style={{ fontSize: 11, color: TXT2, marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>
                              "{j.result.script.hook.slice(0, 100)}{j.result.script.hook.length > 100 ? '...' : ''}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={function() {
                            const url = j.result.finalVideoUrl;
                            const filename = 'contentforge-' + (ratio || '9-16').replace(':','-') + '-' + j.id + '.mp4';
                            fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
                              const blobUrl = URL.createObjectURL(blob);
                              const a = document.createElement('a'); a.href = blobUrl; a.download = filename;
                              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
                            }).catch(function() { window.open(url, '_blank'); });
                          }}
                          style={{ flex: 1, padding: '7px', borderRadius: 8, background: ACC, color: 'white', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ⬇ Download
                        </button>
                        <button onClick={function() { setJob(j); setTab('result'); }}
                          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          View
                        </button>
                        <button onClick={function() {
                          if (!window.confirm('Delete this video? This cannot be undone.')) return;
                          fetch(API + '/api/video/job/' + j.id, { method: 'DELETE' })
                            .then(function() { loadJobs(); })
                            .catch(function(e) { alert('Delete failed: ' + e.message); });
                        }}
                          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All jobs history */}
          <div style={{ fontSize: 12, fontWeight: 700, color: TXT3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            All Sessions
          </div>
          {jobs.length === 0 && (
            <div style={{ ...card(), textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 13, color: TXT2 }}>No videos generated yet</div>
            </div>
          )}
          {jobs.map(function(j, i) {
            const topic  = (j.data && j.data.topic) || 'Video';
            const date   = j.createdAt || j.created_at;
            const dateStr = date ? new Date(date).toLocaleString() : 'Unknown date';
            const isAuto = j.result && j.result.autoAssembled;
            const hasFinalVideo = j.result && j.result.finalVideoUrl;
            return (
              <div key={i} style={{ ...card(), marginBottom: 6 }}>
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: j.status === 'completed' ? ACC : j.status === 'failed' ? '#E24B4A' : '#F5A623' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: TXT }}>{topic} {isAuto && <span style={{ fontSize: 9, color: ACCH, marginLeft: 4 }}>⚡ auto</span>}</div>
                    <div style={{ fontSize: 10, color: TXT3 }}>{dateStr} · {j.status}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {hasFinalVideo && (
                      <a href={j.result.finalVideoUrl} download="contentforge-video.mp4"
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: ACC, color: 'white', textDecoration: 'none' }}>
                        ⬇
                      </a>
                    )}
                    <button onClick={function() { setJob(j); setTab('result'); }}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, cursor: 'pointer', fontFamily: 'inherit' }}>
                      View
                    </button>
                    <button onClick={function() {
                      if (!window.confirm('Delete this session?')) return;
                      fetch(API + '/api/video/job/' + j.id, { method: 'DELETE' })
                        .then(function() { loadJobs(); })
                        .catch(function(e) { console.warn('Delete failed:', e.message); });
                    }}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(226,75,74,.2)', background: 'transparent', color: '#F09595', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
    </div>
  );
}
