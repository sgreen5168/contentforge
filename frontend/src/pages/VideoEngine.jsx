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
  { id:'facebook',  label:'Facebook Reels',  icon:'F' },
];

const ASPECT_RATIOS = [
  { id:'9:16',  label:'9:16', desc:'TikTok/Reels' },
  { id:'16:9',  label:'16:9', desc:'YouTube' },
  { id:'1:1',   label:'1:1',  desc:'Square' },
  { id:'4:5',   label:'4:5',  desc:'Instagram' },
];

const MUSIC_OPTIONS = [
  { id:'none',        label:'No music' },
  { id:'upbeat',      label:'Upbeat' },
  { id:'calm',        label:'Calm' },
  { id:'motivational',label:'Motivational' },
  { id:'corporate',   label:'Corporate' },
];

export default function VideoEngine() {
  const [tab, setTab]           = useState('generate');
  const [topic, setTopic]       = useState('');
  const [videoType, setVType]   = useState('ugc-persona');
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDur]      = useState('30s');
  const [platforms, setPlats]   = useState(['tiktok']);
  const [captions, setCaptions] = useState(true);
  const [captionStyle, setCapStyle] = useState('bottom');
  const [aspectRatio, setAspect] = useState('9:16');
  const [music, setMusic]       = useState('none');
  const [loading, setLoad]      = useState(false);
  const [jobId, setJobId]       = useState(null);
  const [job, setJob]           = useState(null);
  const [error, setError]       = useState('');
  const [jobs, setJobs]         = useState([]);
  const [assembling, setAssembling] = useState(false);
  const [voice, setVoice]           = useState('nova');
  const [durMode, setDurMode]       = useState('short');
  const pollRef = useRef(null);

  useEffect(() => {
    if (tab === 'history') loadJobs();
  }, [tab]);

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

  async function generate() {
    if (!topic.trim()) return;
    setLoad(true);
    setJob(null);
    setError('');
    setJobId(null);
    try {
      const res = await fetch(API + '/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode: 'topic',
          topic,
          videoType,
          persona,
          duration,
          platforms,
          voice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
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
      const r = await fetch(API + '/api/video/job/' + id);
      if (!r.ok) return;
      const d = await r.json();
      if (d && typeof d === 'object') {
        setJob(d);
        if (d.status === 'completed' || d.status === 'failed') {
          clearInterval(pollRef.current);
          loadJobs();
        }
      }
    } catch(e) { console.warn('pollJob:', e.message); }
  }

  async function assembleAndDownload() {
    if (!job || !job.result) return;
    const clips = (job.result.clips || []).filter(c => c && c.status === 'success' && c.videoUrl);
    if (clips.length === 0) { alert('No clips available'); return; }
    setAssembling(true);
    try {
      const audioUrl = job.result.audioBase64 ||
        (job.result.hasAudio ? API + '/api/video/audio/' + jobId : null);
      const res = await fetch(API + '/api/video/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipUrls: clips.map(c => c.videoUrl),
          audioUrl: audioUrl,
          jobId: jobId,
          aspectRatio: aspectRatio,
          music: music,
          captions: captions,
          captionStyle: captionStyle,
          captionText: (job.result.script && job.result.script.fullScript) || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Assembly failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contentforge-' + aspectRatio.replace(':', '-') + '-' + Date.now() + '.mp4';
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      alert('Assembly failed: ' + e.message);
    } finally {
      setAssembling(false);
    }
  }

  function togglePlatform(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.concat(id));
  }

  function download(url) {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contentforge-' + Date.now() + '.mp4';
    a.target = '_blank';
    a.click();
  }

  const BG    = '#0D2137';
  const CARD  = 'rgba(16,45,79,.9)';
  const BORD  = 'rgba(29,158,117,.2)';
  const ACC   = '#1D9E75';
  const ACCH  = '#5DCAA5';
  const TXT   = '#E8F4F0';
  const TXT2  = '#7BAAA0';
  const TXT3  = '#4A7A72';

  function chip(active) {
    return {
      padding: '5px 11px',
      borderRadius: 20,
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: 500,
      border: '1px solid ' + (active ? ACC : BORD),
      background: active ? 'rgba(29,158,117,.15)' : 'transparent',
      color: active ? ACCH : TXT2,
      margin: '0 4px 4px 0',
      display: 'inline-block',
    };
  }

  function card(extra) {
    return Object.assign({
      background: CARD,
      border: '1px solid ' + BORD,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    }, extra || {});
  }

  function hdr(extra) {
    return Object.assign({
      padding: '10px 14px',
      borderBottom: '1px solid rgba(29,158,117,.12)',
      fontSize: 13,
      fontWeight: 500,
      color: TXT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }, extra || {});
  }

  function body(extra) {
    return Object.assign({ padding: '12px 14px' }, extra || {});
  }

  const inp = {
    width: '100%',
    border: '1px solid ' + BORD,
    borderRadius: 8,
    padding: '8px 11px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: TXT,
    background: 'rgba(22,61,106,.6)',
    outline: 'none',
    marginBottom: 10,
    boxSizing: 'border-box',
  };

  const lbl = {
    fontSize: 10,
    color: TXT3,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: .5,
    display: 'block',
    marginBottom: 6,
  };

  const safeClips = job && job.result && Array.isArray(job.result.clips)
    ? job.result.clips.filter(c => c && c.status === 'success' && c.videoUrl)
    : [];

  const hasClips = safeClips.length > 0;
  const progress = (job && job.progress) || 0;

  return (
    <div style={{ padding: 20, maxWidth: 1100, fontFamily: 'inherit', background: BG, minHeight: '100vh', borderRadius: 12 }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: TXT }}>
          AI Video Engine
          <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(29,158,117,.2)', color: ACCH }}>4.0</span>
        </div>
        <div style={{ fontSize: 12, color: TXT2, marginTop: 3 }}>
          Script + Voiceover + FREE Pexels clips + Scene editor + Captions
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['generate','Generate'],['result','Result'],['history','History']].map(function(t) {
          var id = t[0]; var label = t[1];
          return (
            <button key={id} onClick={function() { setTab(id); }}
              style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                border: '1px solid ' + (tab === id ? ACC : BORD),
                background: tab === id ? 'rgba(29,158,117,.15)' : 'transparent',
                color: tab === id ? ACCH : TXT2,
              }}>
              {label}
              {id === 'result' && job && (
                <span style={{
                  marginLeft: 6, width: 7, height: 7, borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle',
                  background: job.status === 'completed' ? ACC : job.status === 'failed' ? '#E24B4A' : '#F5A623',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* GENERATE TAB */}
      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>

          {/* Left column */}
          <div>
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
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 3,
                        border: '1px solid ' + (videoType === t.id ? ACC : 'transparent'),
                        background: videoType === t.id ? 'rgba(29,158,117,.1)' : 'transparent',
                      }}>
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
                  <button onClick={function() { setDurMode('short'); setDur('30s'); }}
                    style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      border: '1px solid ' + (durMode === 'short' ? ACC : BORD),
                      background: durMode === 'short' ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: durMode === 'short' ? ACCH : TXT2 }}>Short</button>
                  <button onClick={function() { setDurMode('long'); setDur('5m'); }}
                    style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      border: '1px solid ' + (durMode === 'long' ? '#FF0000' : BORD),
                      background: durMode === 'long' ? 'rgba(255,0,0,.1)' : 'transparent',
                      color: durMode === 'long' ? '#FF6B6B' : TXT2 }}>Long (YouTube)</button>
                </div>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                {(durMode === 'long' ? DURATIONS_LONG : DURATIONS_SHORT).map(function(d) {
                  return (
                    <button key={d} onClick={function() { setDur(d); }}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, textAlign: 'center',
                        border: '1px solid ' + (duration === d ? ACC : BORD),
                        background: duration === d ? 'rgba(29,158,117,.15)' : 'transparent',
                        color: duration === d ? ACCH : TXT2,
                      }}>
                      {d}
                    </button>
                  );
                })}
              </div>
              {durMode === 'long' && (
                <div style={{ padding: '0 14px 10px', fontSize: 11, color: '#FF6B6B' }}>
                  Long videos generate more scenes + longer voiceover — YouTube only
                </div>
              )}
            </div>

            <div style={card()}>
              <div style={hdr()}>Platforms</div>
              <div style={{ padding: '8px 10px' }}>
                {PLATFORMS.map(function(p) {
                  var on = platforms.includes(p.id);
                  return (
                    <div key={p.id} onClick={function() { togglePlatform(p.id); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                        background: on ? 'rgba(29,158,117,.08)' : 'transparent',
                        border: '1px solid ' + (on ? 'rgba(29,158,117,.3)' : 'transparent'),
                      }}>
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

          {/* Right column */}
          <div>
            {/* Aspect ratio */}
            <div style={card()}>
              <div style={hdr()}>Video size</div>
              <div style={body()}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {ASPECT_RATIOS.map(function(r) {
                    return (
                      <button key={r.id} onClick={function() { setAspect(r.id); }}
                        style={{
                          padding: '10px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                          border: '1px solid ' + (aspectRatio === r.id ? ACC : BORD),
                          background: aspectRatio === r.id ? 'rgba(29,158,117,.15)' : 'transparent',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: aspectRatio === r.id ? ACCH : TXT }}>{r.label}</div>
                        <div style={{ fontSize: 9, color: TXT3, marginTop: 2 }}>{r.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <span style={lbl}>Background music</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {MUSIC_OPTIONS.map(function(m) {
                    return <button key={m.id} onClick={function() { setMusic(m.id); }} style={chip(music === m.id)}>{m.label}</button>;
                  })}
                </div>

                <span style={lbl}>Captions</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div onClick={function() { setCaptions(!captions); }}
                    style={{ width: 36, height: 20, borderRadius: 10, background: captions ? ACC : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: captions ? 18 : 2, transition: 'left .2s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: TXT2 }}>{captions ? 'On — burned in via FFmpeg' : 'Off'}</span>
                </div>
                {captions && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['bottom','middle','top'].map(function(pos) {
                      return <button key={pos} onClick={function() { setCapStyle(pos); }} style={chip(captionStyle === pos)}>{pos}</button>;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Voice selector */}
            <div style={card()}>
              <div style={hdr()}>Voiceover</div>
              <div style={body()}>
                <span style={lbl}>Female voices</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {[['nova','Nova','Warm & friendly'],['shimmer','Shimmer','Professional'],['alloy','Alloy','Versatile']].map(function(v) {
                    return (
                      <button key={v[0]} onClick={function() { setVoice(v[0]); }}
                        style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          border: '1px solid ' + (voice === v[0] ? '#E1306C' : BORD),
                          background: voice === v[0] ? 'rgba(225,48,108,.1)' : 'transparent' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: voice === v[0] ? '#E1306C' : TXT }}>{v[1]}</div>
                        <div style={{ fontSize: 9, color: TXT3 }}>{v[2]}</div>
                      </button>
                    );
                  })}
                </div>
                <span style={lbl}>Male voices</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[['onyx','Onyx','Deep & authoritative'],['echo','Echo','Confident & clear'],['fable','Fable','Warm & expressive']].map(function(v) {
                    return (
                      <button key={v[0]} onClick={function() { setVoice(v[0]); }}
                        style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          border: '1px solid ' + (voice === v[0] ? '#1877F2' : BORD),
                          background: voice === v[0] ? 'rgba(24,119,242,.1)' : 'transparent' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: voice === v[0] ? '#5B9BD5' : TXT }}>{v[1]}</div>
                        <div style={{ fontSize: 9, color: TXT3 }}>{v[2]}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: TXT3 }}>Selected: <span style={{ color: ACCH }}>{voice}</span> — OpenAI TTS-1 HD</div>
              </div>
            </div>

            {/* Cost info */}
            <div style={card()}>
              <div style={hdr()}>Cost per video</div>
              <div style={body()}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['Claude script','~$0.01'],['OpenAI voice','~$0.02'],['Pexels clips','FREE'],['FFmpeg assembly','FREE'],['Captions','FREE'],['Music','FREE']].map(function(item) {
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

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 10, color: '#F09595', fontSize: 12, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <button onClick={generate} disabled={loading || !topic.trim()}
              style={{
                width: '100%', padding: 13, borderRadius: 10, border: 'none', background: ACC, color: 'white', fontSize: 15, fontWeight: 700,
                cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: loading || !topic.trim() ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
              {loading ? 'Queuing...' : 'Generate Video'}
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

              {/* Progress card */}
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

              {/* Script card */}
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
                      <div style={{ marginTop: 8, fontSize: 12, color: ACCH }}>
                        {job.result.script.hashtags.join(' ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clips card */}
              {job.status === 'completed' && hasClips && (
                <div style={card()}>
                  <div style={hdr()}>
                    <span>Video Clips Ready</span>
                    <span style={{ fontSize: 11, color: ACC }}>{safeClips.length} clips</span>
                  </div>
                  <div style={body()}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                      {safeClips.map(function(clip, i) {
                        return (
                          <video key={i} src={clip.videoUrl} muted loop
                            style={{ width: '100%', aspectRatio: '9/16', maxHeight: 140, borderRadius: 6, background: '#000', objectFit: 'cover', display: 'block' }}
                          />
                        );
                      })}
                    </div>
                    {/* Scene-by-scene exports */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: TXT3, marginBottom: 6 }}>Download individual scenes (raw footage):</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {safeClips.map(function(clip, i) {
                          return (
                            <button key={i} onClick={function() { download(clip.videoUrl); }}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid ' + BORD, background: 'rgba(22,61,106,.4)', color: TXT2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14 }}>⬇</span>
                              <span>Scene {i+1} — raw HD clip ({aspectRatio})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px', background: 'rgba(29,158,117,.05)', border: '1px solid rgba(29,158,117,.1)', borderRadius: 8, fontSize: 11, color: TXT3 }}>
                      Import these clips into your video editor (CapCut, DaVinci Resolve, Premiere) to arrange scenes, add text overlays and sync to your script
                    </div>
                  </div>
                </div>
              )}

              {/* Clip error */}
              {job.clipError && (
                <div style={{ padding: '12px 14px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#FAC775', marginBottom: 4 }}>Video clips skipped</div>
                  <div style={{ fontSize: 12, color: TXT2 }}>{job.clipError}</div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div style={{ maxWidth: 700 }}>
          {jobs.length === 0 && (
            <div style={{ ...card(), textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 13, color: TXT2 }}>No videos generated yet</div>
            </div>
          )}
          {jobs.map(function(j, i) {
            return (
              <div key={i} style={card()}>
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: j.status === 'completed' ? ACC : j.status === 'failed' ? '#E24B4A' : '#F5A623' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: TXT }}>{(j.data && j.data.topic) || 'Video'}</div>
                    <div style={{ fontSize: 11, color: TXT3 }}>{new Date(j.createdAt).toLocaleString()} - {j.status}</div>
                  </div>
                  <button onClick={function() { setJob(j); setTab('result'); }}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, cursor: 'pointer', fontFamily: 'inherit' }}>
                    View
                  </button>
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
