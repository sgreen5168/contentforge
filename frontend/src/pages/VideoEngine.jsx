import React, { useState, useEffect, useRef } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const VIDEO_TYPES = [
  { id:'ugc-persona', icon:'👤', label:'UGC Persona',   desc:'Authentic first-person review' },
  { id:'ai-vsl',      icon:'💰', label:'AI VSL',         desc:'Video sales letter' },
  { id:'reel-ads',    icon:'⚡', label:'Reel Ads',       desc:'Short punchy vertical ad' },
  { id:'product-ads', icon:'🛍', label:'Product Ad',     desc:'Direct-response product' },
  { id:'commercial',  icon:'🎬', label:'Commercial',     desc:'Cinematic brand video' },
  { id:'educator',    icon:'📚', label:'Educational',    desc:'Expert tips format' },
];

const PERSONAS = [
  { id:'ugc',         label:'UGC Creator' },
  { id:'testimonial', label:'Testimonial' },
  { id:'demo',        label:'Product Demo' },
  { id:'influencer',  label:'Influencer' },
  { id:'educator',    label:'Educator' },
];

const DURATIONS = ['15s','30s','45s','60s'];

const PLATFORMS = [
  { id:'tiktok',    label:'TikTok',          icon:'🎵' },
  { id:'instagram', label:'Instagram Reels', icon:'📷' },
  { id:'youtube',   label:'YouTube Shorts',  icon:'▶' },
  { id:'facebook',  label:'Facebook Reels',  icon:'📘' },
];

const PEXELS_SITUATIONS = [
  'lifestyle','productivity','morning','office','fitness','cooking',
  'nature','city','home','business','technology','travel',
];

export default function VideoEngine() {
  const [tab, setTab]           = useState('generate');
  const [mode, setMode]         = useState('topic');
  const [topic, setTopic]       = useState('');
  const [videoType, setVType]   = useState('ugc-persona');
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDur]      = useState('30s');
  const [platforms, setPlats]   = useState(['tiktok']);
  const [captions, setCaptions] = useState(true);
  const [captionStyle, setCapStyle] = useState('bottom');
  const [loading, setLoad]      = useState(false);
  const [jobId, setJobId]       = useState(null);
  const [job, setJob]           = useState(null);
  const [error, setError]       = useState('');
  const [jobs, setJobs]         = useState([]);

  // Scene editor state
  const [scenes, setScenes]       = useState([]);
  const [scenesReady, setScenesR] = useState(false);
  const [activeScene, setActiveS] = useState(0);
  const [alternatives, setAlts]   = useState({});
  const [loadingAlts, setLoadA]   = useState({});

  const pollRef = useRef(null);

  useEffect(() => { if (tab === 'history') loadJobs(); }, [tab]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // When job completes build scene editor
  useEffect(() => {
    if (job?.status === 'completed' && job.result?.script && !scenesReady) {
      const scriptScenes = job.result.script.sceneDescriptions || [];
      const clips = job.result.clips || [];
      const built = scriptScenes.map((s, i) => ({
        sceneNum:    s.scene || i + 1,
        scriptText:  s.visual || '',
        duration:    s.duration || 5,
        keywords:    extractKeywords(s.visual || ''),
        selectedKw:  [],
        clipUrl:     clips[i]?.videoUrl || null,
        clipStatus:  clips[i]?.status || 'none',
        situation:   '',
      }));
      setScenes(built);
      setScenesR(true);
    }
  }, [job?.status]);

  function extractKeywords(text) {
    const stop = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with',
      'by','from','is','are','was','were','be','been','being','have','has','had',
      'do','does','did','will','would','could','should','may','might','this','that',
      'these','those','their','they','them','into','over','after','before','while',
      'during','showing','person','people','shot','style','camera','close','quick',
      'cut','side','screen','left','right','full','view','split']);
    return [...new Set(
      text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stop.has(w))
        .slice(0, 8)
    )];
  }

  async function loadJobs() {
    try {
      const r = await fetch(`${API}/api/video/jobs`);
      const d = await r.json();
      setJobs(Array.isArray(d) ? d : []);
    } catch {}
  }

  async function generate() {
    const input = topic;
    if (!input.trim()) return;
    setLoad(true); setJob(null); setError('');
    setJobId(null); setScenes([]); setScenesR(false);
    try {
      const res = await fetch(`${API}/api/video/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputMode: mode, topic: input, videoType, persona, duration, platforms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobId(data.jobId);
      setTab('result');
      pollRef.current = setInterval(() => pollJob(data.jobId), 3000);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  }

  async function pollJob(id) {
    try {
      const r = await fetch(`${API}/api/video/job/${id}`);
      const d = await r.json();
      setJob(d);
      if (d.status === 'completed' || d.status === 'failed') {
        clearInterval(pollRef.current);
        loadJobs();
      }
    } catch {}
  }

  // Fetch alternative clips for a scene based on selected keywords
  async function fetchAlternatives(sceneIdx) {
    const scene = scenes[sceneIdx];
    const query = scene.selectedKw.length > 0
      ? scene.selectedKw.join(' ')
      : scene.keywords.slice(0, 3).join(' ');

    setLoadA(prev => ({ ...prev, [sceneIdx]: true }));
    try {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=6&size=medium`,
        { headers: { Authorization: '' } }
      );
      // Since we can't call Pexels from browser (needs API key server-side)
      // use our backend proxy
      const proxyRes = await fetch(`${API}/api/pexels/search?q=${encodeURIComponent(query)}&count=6`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        setAlts(prev => ({ ...prev, [sceneIdx]: data.videos || [] }));
      }
    } catch(e) {
      console.warn('Alternatives fetch failed:', e.message);
    } finally {
      setLoadA(prev => ({ ...prev, [sceneIdx]: false }));
    }
  }

  function toggleKeyword(sceneIdx, kw) {
    setScenes(prev => prev.map((s, i) => {
      if (i !== sceneIdx) return s;
      const sel = s.selectedKw.includes(kw)
        ? s.selectedKw.filter(k => k !== kw)
        : [...s.selectedKw, kw];
      return { ...s, selectedKw: sel };
    }));
  }

  function addScene() {
    setScenes(prev => [...prev, {
      sceneNum:   prev.length + 1,
      scriptText: '',
      duration:   5,
      keywords:   [],
      selectedKw: [],
      clipUrl:    null,
      clipStatus: 'none',
      situation:  '',
    }]);
  }

  function removeScene(idx) {
    setScenes(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sceneNum: i + 1 })));
  }

  function updateSceneText(idx, text) {
    setScenes(prev => prev.map((s, i) =>
      i === idx ? { ...s, scriptText: text, keywords: extractKeywords(text) } : s
    ));
  }

  function setSituation(idx, sit) {
    setScenes(prev => prev.map((s, i) => i === idx ? { ...s, situation: sit } : s));
  }

  function selectAlternative(sceneIdx, clipUrl) {
    setScenes(prev => prev.map((s, i) =>
      i === sceneIdx ? { ...s, clipUrl, clipStatus: 'success' } : s
    ));
    setAlts(prev => ({ ...prev, [sceneIdx]: [] }));
  }

  function togglePlatform(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  function download(url) {
    const a = document.createElement('a');
    a.href = url; a.download = `contentforge-${Date.now()}.mp4`;
    a.target = '_blank'; a.click();
  }

  const C = '#0D2137';
  const S = {
    card: {
      background: 'rgba(16,45,79,.9)',
      border: '1px solid rgba(29,158,117,.2)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    },
    hdr: {
      padding: '10px 14px',
      borderBottom: '1px solid rgba(29,158,117,.12)',
      fontSize: 13,
      fontWeight: 500,
      color: '#E8F4F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    body: { padding: '12px 14px' },
    inp: {
      width: '100%',
      border: '1px solid rgba(29,158,117,.2)',
      borderRadius: 8,
      padding: '8px 11px',
      fontSize: 13,
      fontFamily: 'inherit',
      color: '#E8F4F0',
      background: 'rgba(22,61,106,.6)',
      outline: 'none',
      marginBottom: 10,
      boxSizing: 'border-box',
    },
    lbl: {
      fontSize: 10,
      color: '#4A7A72',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: .5,
      display: 'block',
      marginBottom: 6,
    },
    chip: (on) => ({
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: 500,
      border: `1px solid ${on ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
      background: on ? 'rgba(29,158,117,.15)' : 'transparent',
      color: on ? '#5DCAA5' : '#7BAAA0',
      margin: '0 4px 4px 0',
      display: 'inline-block',
    }),
    kwChip: (on) => ({
      padding: '3px 8px',
      borderRadius: 12,
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'inherit',
      border: `1px solid ${on ? '#5DCAA5' : 'rgba(29,158,117,.15)'}`,
      background: on ? 'rgba(93,202,165,.2)' : 'rgba(22,61,106,.4)',
      color: on ? '#5DCAA5' : '#7BAAA0',
      margin: '0 3px 3px 0',
      display: 'inline-block',
    }),
  };

  const input = topic;
  const progressSteps = [
    { label: 'Script',    thresh: 30  },
    { label: 'Voiceover', thresh: 50  },
    { label: 'Clips',     thresh: 88  },
    { label: 'Assembly',  thresh: 96  },
    { label: 'Complete',  thresh: 100 },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1100, fontFamily: 'inherit', background: C, minHeight: '100vh', borderRadius: 12 }}>

      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#E8F4F0', display: 'flex', alignItems: 'center', gap: 10 }}>
            🎬 AI Video <span style={{ color: '#5DCAA5' }}>Engine</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(29,158,117,.2)', color: '#5DCAA5', fontWeight: 400 }}>4.0</span>
          </div>
          <div style={{ fontSize: 12, color: '#7BAAA0', marginTop: 3 }}>Script · Voiceover · Pexels clips · Scene editor · Captions · FREE</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['Claude','Script','#5DCAA5'],['OpenAI','Voice','#7BAAA0'],['Pexels','Clips FREE','#1D9E75'],['FFmpeg','Captions FREE','#1D9E75']].map(([n,t,c]) => (
            <div key={n} style={{ padding: '5px 8px', background: 'rgba(16,45,79,.8)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4A7A72', marginBottom: 1 }}>{t}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c }}>{n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['generate','⚡ Generate'],['result','📊 Result'],['scenes','🎬 Scene Editor'],['history','📋 History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
              border: `1px solid ${tab === id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
              background: tab === id ? 'rgba(29,158,117,.15)' : 'transparent',
              color: tab === id ? '#5DCAA5' : '#7BAAA0' }}>
            {label}
            {id === 'result' && job && (
              <span style={{ marginLeft: 6, width: 7, height: 7, borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle',
                background: job.status === 'completed' ? '#1D9E75' : job.status === 'failed' ? '#E24B4A' : '#F5A623' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
          <div>
            <div style={S.card}>
              <div style={S.hdr}>Source</div>
              <div style={S.body}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[['topic','Topic'],['url','URL'],['affiliate','Affiliate']].map(([id,l]) => (
                    <button key={id} onClick={() => setMode(id)} style={S.chip(mode === id)}>{l}</button>
                  ))}
                </div>
                <input style={S.inp} placeholder='"morning productivity tips"' value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Video type</div>
              <div style={{ padding: '6px 8px' }}>
                {VIDEO_TYPES.map(t => (
                  <button key={t.id} onClick={() => setVType(t.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 3,
                      border: `1px solid ${videoType === t.id ? '#1D9E75' : 'transparent'}`,
                      background: videoType === t.id ? 'rgba(29,158,117,.1)' : 'transparent' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#E8F4F0' }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: '#7BAAA0' }}>{t.desc}</div>
                    </div>
                    {videoType === t.id && <span style={{ marginLeft: 'auto', color: '#1D9E75', fontSize: 12 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Persona</div>
              <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PERSONAS.map(p => (
                  <button key={p.id} onClick={() => setPersona(p.id)} style={S.chip(persona === p.id)}>{p.label}</button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Duration</div>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDur(d)}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                      border: `1px solid ${duration === d ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: duration === d ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: duration === d ? '#5DCAA5' : '#7BAAA0' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.hdr}>Publish to</div>
              <div style={{ padding: '8px 10px' }}>
                {PLATFORMS.map(p => (
                  <div key={p.id} onClick={() => togglePlatform(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                      background: platforms.includes(p.id) ? 'rgba(29,158,117,.08)' : 'transparent',
                      border: `1px solid ${platforms.includes(p.id) ? 'rgba(29,158,117,.3)' : 'transparent'}` }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <div style={{ flex: 1, fontSize: 12, color: '#E8F4F0' }}>{p.label}</div>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${platforms.includes(p.id) ? '#1D9E75' : 'rgba(29,158,117,.3)'}`, background: platforms.includes(p.id) ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {platforms.includes(p.id) && <span style={{ fontSize: 9, color: 'white' }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div>
            {/* Captions panel */}
            <div style={S.card}>
              <div style={S.hdr}>
                <span>💬 Captions</span>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: captions ? '#1D9E75' : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer' }}
                  onClick={() => setCaptions(!captions)}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: captions ? 18 : 2, transition: 'left .2s' }} />
                </div>
              </div>
              {captions && (
                <div style={S.body}>
                  <span style={S.lbl}>Caption position</span>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {[['bottom','Bottom'],['middle','Middle'],['top','Top']].map(([id, l]) => (
                      <button key={id} onClick={() => setCapStyle(id)} style={S.chip(captionStyle === id)}>{l}</button>
                    ))}
                  </div>
                  <div style={{ padding: '8px 10px', background: 'rgba(29,158,117,.06)', borderRadius: 8, fontSize: 11, color: '#7BAAA0' }}>
                    ✅ FREE — burned in via FFmpeg · White text · Auto-synced to voiceover · No extra cost
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline overview */}
            <div style={S.card}>
              <div style={S.hdr}>
                <span>Pipeline overview</span>
                <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>~$0.03 per video</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Script','Claude AI — hook + scenes','~$0.01'],
                  ['Voiceover','OpenAI TTS — persona voice','~$0.02'],
                  ['Clips','Pexels HD stock — FREE','FREE'],
                  ['Captions','FFmpeg burned-in text','FREE'],
                  ['Assembly','FFmpeg combine + audio','FREE'],
                  ['Scene editor','Pick clips per scene','FREE'],
                ].map(([title, sub, cost]) => (
                  <div key={title} style={{ padding: '10px 12px', background: 'rgba(22,61,106,.4)', borderRadius: 10, border: '1px solid rgba(29,158,117,.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#E8F4F0' }}>{title}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: cost === 'FREE' ? '#1D9E75' : '#5DCAA5' }}>{cost}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#7BAAA0' }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div style={{ padding: '10px 12px', background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 10, color: '#F09595', fontSize: 12, marginBottom: 10 }}>⚠ {error}</div>}

            <button onClick={generate} disabled={loading || !input.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1D9E75', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                opacity: loading || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading
                ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />Queuing...</>
                : '⚡ Generate Video'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT TAB ── */}
      {tab === 'result' && (
        <div style={{ maxWidth: 700 }}>
          {!job && !jobId && (
            <div style={{ ...S.card, textAlign: 'center', padding: '50px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
              <div style={{ fontSize: 14, color: '#E8F4F0' }}>Generate a video to see results here</div>
            </div>
          )}

          {job && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Progress */}
              <div style={S.card}>
                <div style={S.hdr}>
                  <span>Generation progress</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: job.status === 'completed' ? '#1D9E75' : job.status === 'failed' ? '#F09595' : '#F5A623' }}>
                    {job.status === 'completed' ? '✅ Complete' : job.status === 'failed' ? '❌ Failed' : '⏳ Processing'}
                  </span>
                </div>
                <div style={S.body}>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: (job.progress || 0) + '%', background: job.status === 'failed' ? '#E24B4A' : '#1D9E75', borderRadius: 3, transition: 'width .5s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#7BAAA0', marginBottom: 12 }}>{job.step || 'Waiting...'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {progressSteps.map((step, i) => {
                      const prog = job.progress || 0;
                      const prev = progressSteps[i - 1]?.thresh || 0;
                      const done = prog >= step.thresh;
                      const active = prog >= prev && prog < step.thresh;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8,
                          background: done ? 'rgba(29,158,117,.08)' : active ? 'rgba(29,158,117,.04)' : 'transparent' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                            background: done ? '#1D9E75' : active ? 'rgba(29,158,117,.2)' : 'rgba(255,255,255,.05)',
                            color: done ? 'white' : active ? '#5DCAA5' : '#4A7A72' }}>
                            {done ? '✓' : active
                              ? <span style={{ width: 10, height: 10, border: '1.5px solid rgba(29,158,117,.5)', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                              : i + 1}
                          </div>
                          <span style={{ fontSize: 12, color: done ? '#E8F4F0' : '#7BAAA0' }}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Script preview */}
              {job.result?.script && (
                <div style={S.card}>
                  <div style={S.hdr}>
                    <span>✦ Script</span>
                    {scenesReady && (
                      <button onClick={() => setTab('scenes')}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: 'none', background: '#1D9E75', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        🎬 Open Scene Editor
                      </button>
                    )}
                  </div>
                  <div style={S.body}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#5DCAA5', marginBottom: 4 }}>Hook</div>
                    <div style={{ fontSize: 13, color: '#E8F4F0', marginBottom: 10, padding: '8px 10px', background: 'rgba(29,158,117,.06)', borderRadius: 6 }}>{job.result.script.hook}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#5DCAA5', marginBottom: 4 }}>Full script</div>
                    <div style={{ fontSize: 12, color: '#7BAAA0', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto', padding: '8px 10px', background: 'rgba(22,61,106,.4)', borderRadius: 6 }}>
                      {job.result.script.fullScript}
                    </div>
                    {job.result.script.hashtags?.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#5DCAA5' }}>{job.result.script.hashtags.join(' ')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Inline video preview */}
              {(job.previewUrl || job.result?.previewUrl || job.result?.finalVideoUrl) && (
                <div style={S.card}>
                  <div style={S.hdr}>
                    <span>🎬 Final video</span>
                    <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>
                      {captions ? '💬 Captions included' : 'No captions'}
                    </span>
                  </div>
                  <div style={{ padding: 12 }}>
                    <video
                      key={job.previewUrl || job.result?.previewUrl || job.result?.finalVideoUrl}
                      src={job.previewUrl || job.result?.previewUrl || job.result?.finalVideoUrl}
                      controls autoPlay={false}
                      style={{ width: '100%', maxHeight: 500, borderRadius: 8, background: '#000', display: 'block', marginBottom: 10 }}
                      playsInline
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button onClick={() => download(job.previewUrl || job.result?.previewUrl || job.result?.finalVideoUrl)}
                        style={{ padding: 11, borderRadius: 8, border: 'none', background: '#1D9E75', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        ⬇ Download MP4
                      </button>
                      {scenesReady && (
                        <button onClick={() => setTab('scenes')}
                          style={{ padding: 11, borderRadius: 8, border: '1px solid rgba(29,158,117,.3)', background: 'transparent', color: '#5DCAA5', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                          🎬 Edit Scenes
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {job.clipError && (
                <div style={{ padding: '12px 14px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#FAC775', marginBottom: 4 }}>⚠ Video clips skipped</div>
                  <div style={{ fontSize: 12, color: '#7BAAA0' }}>{job.clipError}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SCENE EDITOR TAB ── */}
      {tab === 'scenes' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#E8F4F0' }}>🎬 Scene Editor</div>
              <div style={{ fontSize: 12, color: '#7BAAA0', marginTop: 2 }}>Select keywords to find matching clips · Add or remove scenes · Mix any Pexels content</div>
            </div>
            <button onClick={addScene}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1D9E75', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Scene
            </button>
          </div>

          {scenes.length === 0 && (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 13, color: '#7BAAA0' }}>Generate a video first to load scenes — or click + Add Scene to start from scratch</div>
            </div>
          )}

          {scenes.map((scene, idx) => (
            <div key={idx} style={{ ...S.card, border: activeScene === idx ? '1px solid #1D9E75' : '1px solid rgba(29,158,117,.2)' }}>
              <div style={{ ...S.hdr, cursor: 'pointer' }} onClick={() => setActiveS(activeScene === idx ? -1 : idx)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: scene.clipUrl ? '#1D9E75' : 'rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: scene.clipUrl ? 'white' : '#5DCAA5', fontWeight: 600, flexShrink: 0 }}>
                    {scene.sceneNum}
                  </div>
                  <span>Scene {scene.sceneNum}</span>
                  {scene.clipUrl && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'rgba(29,158,117,.15)', color: '#1D9E75' }}>✓ Clip selected</span>}
                  {scene.selectedKw.length > 0 && <span style={{ fontSize: 10, color: '#5DCAA5' }}>Keywords: {scene.selectedKw.join(', ')}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {scenes.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); removeScene(idx); }}
                      style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: '#4A7A72' }}>{activeScene === idx ? '▲' : '▼'}</span>
                </div>
              </div>

              {activeScene === idx && (
                <div style={S.body}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Left: script + keywords */}
                    <div>
                      <span style={S.lbl}>Scene description</span>
                      <textarea
                        value={scene.scriptText}
                        onChange={e => updateSceneText(idx, e.target.value)}
                        placeholder="Describe what should happen in this scene..."
                        style={{ ...S.inp, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
                      />

                      {scene.keywords.length > 0 && (
                        <div>
                          <span style={S.lbl}>Keywords — click to select for Pexels search</span>
                          <div style={{ marginBottom: 8 }}>
                            {scene.keywords.map(kw => (
                              <span key={kw} onClick={() => toggleKeyword(idx, kw)} style={S.kwChip(scene.selectedKw.includes(kw))}>
                                {kw}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: '#4A7A72', marginBottom: 8 }}>
                            {scene.selectedKw.length > 0
                              ? `Searching Pexels for: "${scene.selectedKw.join(' ')}"`
                              : 'Select keywords above to find matching clips'}
                          </div>
                        </div>
                      )}

                      <span style={S.lbl}>Or browse by situation</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
                        {PEXELS_SITUATIONS.map(sit => (
                          <span key={sit} onClick={() => setSituation(idx, sit)}
                            style={S.kwChip(scene.situation === sit)}>
                            {sit}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => fetchAlternatives(idx)}
                        disabled={loadingAlts[idx]}
                        style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'rgba(29,158,117,.2)', color: '#5DCAA5', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: loadingAlts[idx] ? 0.5 : 1 }}>
                        {loadingAlts[idx] ? '⏳ Searching Pexels...' : '🔍 Find matching clips'}
                      </button>
                    </div>

                    {/* Right: current clip + alternatives */}
                    <div>
                      <span style={S.lbl}>Current clip</span>
                      {scene.clipUrl ? (
                        <div>
                          <video src={scene.clipUrl} controls muted loop
                            style={{ width: '100%', aspectRatio: '9/16', maxHeight: 200, borderRadius: 8, background: '#000', display: 'block', marginBottom: 8, objectFit: 'cover' }}
                          />
                          <button onClick={() => setScenes(prev => prev.map((s, i) => i === idx ? { ...s, clipUrl: null } : s))}
                            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', cursor: 'pointer', fontFamily: 'inherit' }}>
                            × Remove clip
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '9/16', maxHeight: 200, borderRadius: 8, background: 'rgba(22,61,106,.4)', border: '1px dashed rgba(29,158,117,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4A7A72' }}>
                          No clip selected
                        </div>
                      )}

                      {/* Alternatives grid */}
                      {alternatives[idx]?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span style={S.lbl}>Choose a clip</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {alternatives[idx].map((clip, ci) => (
                              <div key={ci} onClick={() => selectAlternative(idx, clip.url)}
                                style={{ cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(29,158,117,.2)', transition: 'border-color .2s' }}>
                                <video src={clip.url} muted loop
                                  style={{ width: '100%', aspectRatio: '9/16', maxHeight: 100, objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{ padding: '4px 6px', fontSize: 10, color: '#5DCAA5', background: 'rgba(22,61,106,.8)' }}>
                                  {clip.duration}s · {clip.quality}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {scenes.length > 0 && (
            <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(29,158,117,.06)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 10, fontSize: 12, color: '#7BAAA0' }}>
              ✦ Scene editor changes apply on next video generation · Clip selections enhance Pexels search results · All FREE
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div style={{ maxWidth: 700 }}>
          {jobs.length === 0 && (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 13, color: '#7BAAA0' }}>No videos generated yet</div>
            </div>
          )}
          {jobs.map((j, i) => (
            <div key={i} style={S.card}>
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: j.status === 'completed' ? '#1D9E75' : j.status === 'failed' ? '#E24B4A' : '#F5A623' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#E8F4F0' }}>{j.data?.topic || j.data?.url || 'Video'}</div>
                  <div style={{ fontSize: 11, color: '#4A7A72' }}>{new Date(j.createdAt).toLocaleString()} · {j.status}</div>
                </div>
                {j.result?.finalVideoUrl && (
                  <button onClick={() => download(j.result.finalVideoUrl)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1D9E75', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⬇
                  </button>
                )}
                <button onClick={() => { setJob(j); setTab('result'); }}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(29,158,117,.2)', background: 'transparent', color: '#7BAAA0', cursor: 'pointer', fontFamily: 'inherit' }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
