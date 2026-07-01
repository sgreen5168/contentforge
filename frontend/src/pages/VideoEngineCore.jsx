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

export default function VideoEngineCore({ jumpToTab, loadJob, quickStart } = {}) {
  const [tab, setTab]           = useState('generate');
  const [topic, setTopic]       = useState('');
  const [videoType, setVType]   = useState('ugc-persona');
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDur]      = useState('30s');
  const [platforms, setPlats]   = useState(['tiktok']);
  const [captions, setCaptions] = useState(true);
  const [captionStyle, setCapStyle] = useState('bottom');
  const [customCaptionStyling, setCustomCaptionStyling] = useState(false);
  const [captionFont, setCaptionFont] = useState('default');
  const [captionFontSize, setCaptionFontSize] = useState(28);
  const [captionTextColor, setCaptionTextColor] = useState('#FFFFFF');
  const [captionBgEnabled, setCaptionBgEnabled] = useState(false);
  const [captionBackgroundColor, setCaptionBackgroundColor] = useState('#000000');
  const [aspectRatio, setAspect] = useState('9:16');
  const [music, setMusic]       = useState('none');
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(30);
  const [loading, setLoad]      = useState(false);
  const [jobId, setJobId]       = useState(null);
  const [job, setJob]           = useState(null);
  const [error, setError]       = useState('');
  const [jobs, setJobs]         = useState([]);
  const [assembling, setAssembling] = useState(false);
  const [voice, setVoice]           = useState('nova');
  const [durMode, setDurMode]       = useState('short');
  const [selectedPhrases, setSelectedPhrases] = useState([]);
  const [phraseClips, setPhraseClips]         = useState([]);
  const [generatingPhraseClips, setGenPhraseClips] = useState(false);
  const [phraseClipError, setPhraseClipError] = useState('');
  const [sceneKeywords, setSceneKeywords] = useState({});
  const [sceneMatches, setSceneMatches] = useState({});
  const [sceneMatching, setSceneMatching] = useState({});
  const [sceneMatchError, setSceneMatchError] = useState({});
  const [scenesConfirmed, setScenesConfirmed] = useState(false);
  const [combineError, setCombineError] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState('unlisted');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishResult, setPublishResult] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleted, setDeleted] = useState(false);
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
      const QUICK_START_TO_VIDEO_TYPE = {
        ugc:        'ugc-persona',
        vsl:        'ai-vsl',
        reel:       'reel-ads',
        demo:       'product-ads',
        educator:   'educator',
        commercial: 'commercial',
      };
      const mapped = QUICK_START_TO_VIDEO_TYPE[quickStart.id];
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
      if (script.hook && !ytTitle) {
        setYtTitle(script.hook.slice(0, 100));
      }
      if (!ytDescription) {
        const hashtags = (script.hashtags || []).join(' ');
        const desc = (script.fullScript || '').slice(0, 200);
        setYtDescription(desc + (hashtags ? '\n\n' + hashtags : ''));
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
    const clips = (phraseClips || []).filter(c => c && c.status === 'success' && c.videoUrl);
    if (clips.length === 0) { setCombineError('No matched clips yet — select phrases above and click Generate first.'); return; }
    setAssembling(true);
    setCombineError('');
    try {
      const audioUrl = job.result.audioBase64 ||
        (job.result.hasAudio ? API + '/api/video/audio/' + jobId : null);
      const assembleUrl = API + '/api/video/assemble';
      const res = await fetch(assembleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipUrls: clips.map(c => c.videoUrl),
          audioUrl: audioUrl,
          jobId: jobId,
          aspectRatio: aspectRatio,
          music: music,
          voiceVolume: voiceVolume / 100,
          musicVolume: musicVolume / 100,
          captions: captions,
          captionStyle: captionStyle,
          captionText: (job.result.script && job.result.script.fullScript) || '',
          customCaptionStyling: customCaptionStyling,
          captionFont: captionFont,
          captionFontSize: captionFontSize,
          captionTextColor: captionTextColor,
          captionBackgroundColor: captionBgEnabled ? captionBackgroundColor : null,
        }),
      });
      if (!res.ok) {
        let detail = '';
        try { const err = await res.json(); detail = err.error || ''; } catch (e2) { detail = await res.text().catch(function() { return ''; }); }
        throw new Error('HTTP ' + res.status + ' from ' + assembleUrl + (detail ? (' — ' + detail) : ' (no error detail returned)'));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contentforge-' + aspectRatio.replace(':', '-') + '-' + Date.now() + '.mp4';
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      setCombineError(e.message);
    } finally {
      setAssembling(false);
    }
  }

  async function publishToYouTube() {
    if (!job || !job.result) return;
    if (!ytTitle.trim()) { setPublishError('A title is required before publishing.'); return; }
    const clips = (phraseClips || []).filter(c => c && c.status === 'success' && c.videoUrl);
    if (clips.length === 0) { setPublishError('No matched clips yet — select phrases above and click Generate first.'); return; }

    setPublishing(true);
    setPublishError('');
    setPublishResult(null);
    try {
      const audioUrl = job.result.audioBase64 ||
        (job.result.hasAudio ? API + '/api/video/audio/' + jobId : null);
      const publishUrl = API + '/api/video/publish-youtube';
      const res = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipUrls: clips.map(c => c.videoUrl),
          audioUrl: audioUrl,
          jobId: jobId,
          aspectRatio: aspectRatio,
          music: music,
          voiceVolume: voiceVolume / 100,
          musicVolume: musicVolume / 100,
          captions: captions,
          captionStyle: captionStyle,
          captionText: (job.result.script && job.result.script.fullScript) || '',
          customCaptionStyling: customCaptionStyling,
          captionFont: captionFont,
          captionFontSize: captionFontSize,
          captionTextColor: captionTextColor,
          captionBackgroundColor: captionBgEnabled ? captionBackgroundColor : null,
          title: ytTitle,
          description: ytDescription,
          privacy: ytPrivacy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ' from ' + publishUrl + (data.error ? (' — ' + data.error) : ' (no error detail returned)'));
      }
      setPublishResult(data);
    } catch(e) {
      setPublishError(e.message);
    } finally {
      setPublishing(false);
    }
  }

  async function deleteFromYouTube() {
    if (!publishResult || !publishResult.videoId) return;
    const confirmed = window.confirm(
      'Delete this video from YouTube? This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(API + '/api/youtube/video/' + publishResult.videoId, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + (data.error ? (' — ' + data.error) : ''));
      }
      setDeleted(true);
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  function splitIntoPhrases(text) {
    if (!text) return [];
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  function togglePhrase(phrase) {
    const isCurrentlySelected = selectedPhrases.includes(phrase);
    setSelectedPhrases(prev =>
      isCurrentlySelected ? prev.filter(p => p !== phrase) : [...prev, phrase]
    );
    setScenesConfirmed(false);

    if (isCurrentlySelected) {
      setSceneKeywords(prev => { const next = { ...prev }; delete next[phrase]; return next; });
      setSceneMatches(prev => { const next = { ...prev }; delete next[phrase]; return next; });
      setSceneMatchError(prev => { const next = { ...prev }; delete next[phrase]; return next; });
    } else {
      matchScene(phrase, null);
    }
  }

  async function matchScene(phrase, overrideKeyword) {
    setSceneMatching(prev => ({ ...prev, [phrase]: true }));
    setSceneMatchError(prev => { const next = { ...prev }; delete next[phrase]; return next; });
    try {
      const res = await fetch(API + '/api/video/scene-keyword-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: phrase, keyword: overrideKeyword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scene match failed');
      setSceneKeywords(prev => ({ ...prev, [phrase]: data.keyword }));
      setSceneMatches(prev => ({ ...prev, [phrase]: { videoUrl: data.videoUrl, thumb: data.thumb, matched: data.matched } }));
    } catch (e) {
      setSceneMatchError(prev => ({ ...prev, [phrase]: e.message }));
    } finally {
      setSceneMatching(prev => ({ ...prev, [phrase]: false }));
    }
  }

  function rematchScene(phrase) {
    const edited = sceneKeywords[phrase];
    if (!edited || !edited.trim()) return;
    matchScene(phrase, edited.trim());
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

  const progress = (job && job.progress) || 0;

  return (
    <div style={{ fontFamily: 'inherit' }}>

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
                {music !== 'none' && (
                    <div style={{ marginTop: 10 }}>
                      <span style={lbl}>Volume levels</span>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: TXT2 }}>🎙 Voiceover</span>
                          <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{voiceVolume}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={voiceVolume}
                          onChange={function(e) { setVoiceVolume(parseInt(e.target.value)); }}
                          style={{ width: '100%' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: TXT2 }}>🎵 Background music</span>
                          <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{musicVolume}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={musicVolume}
                          onChange={function(e) { setMusicVolume(parseInt(e.target.value)); }}
                          style={{ width: '100%' }} />
                      </div>
                    </div>
                )}

                <span style={lbl}>Captions</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div onClick={function() { setCaptions(!captions); }}
                    style={{ width: 36, height: 20, borderRadius: 10, background: captions ? ACC : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: captions ? 18 : 2, transition: 'left .2s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: TXT2 }}>{captions ? 'On — burned in via FFmpeg' : 'Off'}</span>
                </div>
                {captions && (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {['bottom','middle','top'].map(function(pos) {
                        return <button key={pos} onClick={function() { setCapStyle(pos); }} style={chip(captionStyle === pos)}>{pos}</button>;
                      })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: customCaptionStyling ? 10 : 0 }}>
                      <div onClick={function() { setCustomCaptionStyling(!customCaptionStyling); }}
                        style={{ width: 36, height: 20, borderRadius: 10, background: customCaptionStyling ? ACC : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: customCaptionStyling ? 18 : 2, transition: 'left .2s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: TXT2 }}>{customCaptionStyling ? 'Custom font & color on' : 'Plain default style'}</span>
                    </div>

                    {customCaptionStyling && (
                      <div style={{ padding: 10, background: 'rgba(22,61,106,.3)', borderRadius: 8 }}>
                        <span style={lbl}>Font</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                          {[['default','Roboto'],['montserrat','Montserrat'],['montserrat-bold','Montserrat Bold'],['anton','Anton (Impact-style)']].map(function(f) {
                            return <button key={f[0]} onClick={function() { setCaptionFont(f[0]); }} style={chip(captionFont === f[0])}>{f[1]}</button>;
                          })}
                        </div>

                        <span style={lbl}>Font size: {captionFontSize}px</span>
                        <input type="range" min="16" max="60" value={captionFontSize}
                          onChange={function(e) { setCaptionFontSize(parseInt(e.target.value)); }}
                          style={{ width: '100%', marginBottom: 10 }} />

                        <span style={lbl}>Text color</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <input type="color" value={captionTextColor}
                            onChange={function(e) { setCaptionTextColor(e.target.value); }}
                            style={{ width: 36, height: 28, borderRadius: 6, border: '1px solid ' + BORD, cursor: 'pointer', padding: 0 }} />
                          <span style={{ fontSize: 11, color: TXT3 }}>{captionTextColor}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: captionBgEnabled ? 8 : 0 }}>
                          <div onClick={function() { setCaptionBgEnabled(!captionBgEnabled); }}
                            style={{ width: 36, height: 20, borderRadius: 10, background: captionBgEnabled ? ACC : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: captionBgEnabled ? 18 : 2, transition: 'left .2s' }} />
                          </div>
                          <span style={{ fontSize: 12, color: TXT2 }}>Background box</span>
                        </div>
                        {captionBgEnabled && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="color" value={captionBackgroundColor}
                              onChange={function(e) { setCaptionBackgroundColor(e.target.value); }}
                              style={{ width: 36, height: 28, borderRadius: 6, border: '1px solid ' + BORD, cursor: 'pointer', padding: 0 }} />
                            <span style={{ fontSize: 11, color: TXT3 }}>{captionBackgroundColor}</span>
                          </div>
                        )}
                      </div>
                    )}
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

              {/* Phrase-based scene selector — per-sentence immediate keyword + clip matching */}
              {job.result && job.result.script && job.result.script.fullScript && (
                <div style={card()}>
                  <div style={hdr()}>
                    <span>Pick scenes from your script</span>
                    <span style={{ fontSize: 11, color: TXT3 }}>{selectedPhrases.length} selected</span>
                  </div>
                  <div style={body()}>
                    <div style={{ fontSize: 11, color: TXT2, marginBottom: 10, lineHeight: 1.5 }}>
                      Click any sentence to select it. We'll immediately suggest a keyword for the scene's main subject and find a matching clip — edit the keyword and click Re-match if it's not quite right.
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
                              style={{
                                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, lineHeight: 1.5,
                                border: '1px solid ' + (isSelected ? ACC : BORD),
                                background: isSelected ? 'rgba(29,158,117,.12)' : 'rgba(22,61,106,.3)',
                                color: isSelected ? TXT : TXT2,
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                              }}>
                              <span style={{
                                flexShrink: 0, width: 16, height: 16, borderRadius: 4, marginTop: 1,
                                border: '2px solid ' + (isSelected ? ACC : BORD),
                                background: isSelected ? ACC : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {isSelected && <span style={{ fontSize: 9, color: 'white' }}>✓</span>}
                              </span>
                              <span>{phrase}</span>
                            </div>

                            {isSelected && (
                              <div style={{ padding: '8px 10px 4px 34px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <span style={lbl}>Scene keyword</span>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                      style={{ ...inp, marginBottom: 0, flex: 1 }}
                                      value={keyword}
                                      placeholder={matching ? 'Suggesting keyword…' : 'e.g. elderly woman baking pie'}
                                      onClick={function(e) { e.stopPropagation(); }}
                                      onChange={function(e) {
                                        setSceneKeywords(prev => ({ ...prev, [phrase]: e.target.value }));
                                      }}
                                    />
                                    <button
                                      onClick={function(e) { e.stopPropagation(); rematchScene(phrase); }}
                                      disabled={matching || !keyword.trim()}
                                      style={{
                                        padding: '0 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                                        border: '1px solid ' + BORD, background: 'transparent', color: ACCH,
                                        cursor: (matching || !keyword.trim()) ? 'default' : 'pointer',
                                        opacity: (matching || !keyword.trim()) ? 0.5 : 1,
                                      }}>
                                      Re-match
                                    </button>
                                  </div>
                                  {matchError && (
                                    <div style={{ marginTop: 6, fontSize: 11, color: '#F09595' }}>{matchError}</div>
                                  )}
                                </div>

                                <div style={{ width: 90, flexShrink: 0 }}>
                                  <span style={lbl}>Match</span>
                                  <div style={{ width: 90, aspectRatio: '9/16', borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORD, background: 'rgba(22,61,106,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {matching ? (
                                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: ACCH, borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />
                                    ) : match && match.matched && match.videoUrl ? (
                                      <video src={match.videoUrl} muted loop autoPlay
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }} />
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

                    {phraseClipError && (
                      <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(226,75,74,.1)', borderRadius: 8, fontSize: 12, color: '#F09595' }}>
                        {phraseClipError}
                      </div>
                    )}

                    {selectedPhrases.length > 0 && (
                      <button onClick={function() { setScenesConfirmed(true); }}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none',
                          background: scenesConfirmed ? 'rgba(29,158,117,.3)' : ACC,
                          color: 'white', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        {scenesConfirmed ? '✓ Scenes confirmed — edit selections above to change' : 'Done picking scenes'}
                      </button>
                    )}

                    {scenesConfirmed && (function() {
                      const confirmedClips = selectedPhrases.map(function(phrase, i) {
                        const match = sceneMatches[phrase];
                        return {
                          scene: i + 1,
                          phrase,
                          status: (match && match.matched && match.videoUrl) ? 'success' : 'failed',
                          videoUrl: (match && match.matched) ? match.videoUrl : null,
                        };
                      });
                      if (JSON.stringify(confirmedClips) !== JSON.stringify(phraseClips)) {
                        setPhraseClips(confirmedClips);
                      }
                      return null;
                    })()}

                    {scenesConfirmed && phraseClips.some(function(c) { return c.status === 'success' && c.videoUrl; }) && (
                      <div style={{ marginTop: 14, padding: 12, background: 'rgba(29,158,117,.06)', border: '1px solid ' + BORD, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 4 }}>Combine clips into final video</div>
                        <div style={{ fontSize: 11, color: TXT2, marginBottom: 10, lineHeight: 1.5 }}>
                          Merges your matched scenes with the voiceover, chosen music, captions ({captionStyle}) and aspect ratio ({aspectRatio}) into one downloadable MP4.
                        </div>
                        {music !== 'none' && (
                          <div style={{ marginTop: 0, marginBottom: 10 }}>
                            <span style={lbl}>Volume levels</span>
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: TXT2 }}>🎙 Voiceover</span>
                                <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{voiceVolume}%</span>
                              </div>
                              <input type="range" min="0" max="100" step="1" value={voiceVolume}
                                onChange={function(e) { setVoiceVolume(parseInt(e.target.value)); }}
                                style={{ width: '100%' }} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: TXT2 }}>🎵 Background music</span>
                                <span style={{ fontSize: 11, color: ACCH, fontWeight: 600 }}>{musicVolume}%</span>
                              </div>
                              <input type="range" min="0" max="100" step="1" value={musicVolume}
                                onChange={function(e) { setMusicVolume(parseInt(e.target.value)); }}
                                style={{ width: '100%' }} />
                            </div>
                          </div>
                        )}
                        {combineError && (
                          <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(226,75,74,.12)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 8, fontSize: 12, color: '#F09595', wordBreak: 'break-word' }}>
                            <strong>Combine failed:</strong> {combineError}
                          </div>
                        )}
                        <button onClick={assembleAndDownload} disabled={assembling}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none',
                            background: assembling ? 'rgba(29,158,117,.4)' : ACC, color: 'white',
                            fontSize: 13, fontWeight: 600, cursor: assembling ? 'default' : 'pointer',
                            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}>
                          {assembling ? (
                            <>
                              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />
                              Combining clips, audio &amp; captions…
                            </>
                          ) : (
                            <>⬇ Combine &amp; Download Final Video</>
                          )}
                        </button>
                      </div>
                    )}

                    {scenesConfirmed && phraseClips.some(function(c) { return c.status === 'success' && c.videoUrl; }) && (
                      <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,0,0,.05)', border: '1px solid rgba(255,0,0,.2)', borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 4 }}>Publish to YouTube</div>
                        <div style={{ fontSize: 11, color: TXT2, marginBottom: 10, lineHeight: 1.5 }}>
                          {aspectRatio === '9:16'
                            ? 'This will publish as a YouTube Short (vertical, auto-detected from your 9:16 aspect ratio).'
                            : 'This will publish as a regular long-form YouTube video (auto-detected from your ' + aspectRatio + ' aspect ratio).'}
                        </div>

                        <span style={lbl}>Title (required)</span>
                        <input style={inp} placeholder="Give your video a title"
                          value={ytTitle} onChange={function(e) { setYtTitle(e.target.value); }} maxLength={100} />

                        <span style={lbl}>Description (optional)</span>
                        <textarea
                          value={ytDescription} onChange={function(e) { setYtDescription(e.target.value); }}
                          placeholder="Add a description..."
                          style={{ ...inp, minHeight: 60, resize: 'vertical' }}
                        />

                        <span style={lbl}>Privacy</span>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          {[['unlisted', 'Unlisted'], ['public', 'Public'], ['private', 'Private']].map(function(p) {
                            return (
                              <button key={p[0]} onClick={function() { setYtPrivacy(p[0]); }}
                                style={{
                                  flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, textAlign: 'center',
                                  border: '1px solid ' + (ytPrivacy === p[0] ? '#FF0000' : BORD),
                                  background: ytPrivacy === p[0] ? 'rgba(255,0,0,.12)' : 'transparent',
                                  color: ytPrivacy === p[0] ? '#FF6B6B' : TXT2,
                                }}>
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

                        {publishResult && publishResult.success && !deleted && (
                          <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.3)', borderRadius: 8, fontSize: 12, color: ACCH, wordBreak: 'break-word' }}>
                            <div style={{ marginBottom: 8 }}>
                              ✅ Published{publishResult.isShort ? ' as a Short' : ''}! <a href={publishResult.youtubeUrl} target="_blank" rel="noreferrer" style={{ color: ACCH, textDecoration: 'underline' }}>{publishResult.youtubeUrl}</a>
                            </div>
                            {deleteError && (
                              <div style={{ marginBottom: 8, padding: '6px 8px', background: 'rgba(226,75,74,.12)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 6, color: '#F09595' }}>
                                <strong>Delete failed:</strong> {deleteError}
                              </div>
                            )}
                            <button onClick={deleteFromYouTube} disabled={deleting}
                              style={{
                                padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(226,75,74,.4)',
                                background: 'transparent', color: '#F09595', fontSize: 11, fontWeight: 500,
                                cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
                              }}>
                              {deleting ? 'Deleting…' : '🗑 Delete from YouTube'}
                            </button>
                          </div>
                        )}
                        {deleted && (
                          <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORD, borderRadius: 8, fontSize: 12, color: TXT2 }}>
                            Video deleted from YouTube.
                          </div>
                        )}

                        <button onClick={publishToYouTube} disabled={publishing || !ytTitle.trim()}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none',
                            background: (publishing || !ytTitle.trim()) ? 'rgba(255,0,0,.25)' : '#FF0000', color: 'white',
                            fontSize: 13, fontWeight: 600, cursor: (publishing || !ytTitle.trim()) ? 'default' : 'pointer',
                            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}>
                          {publishing ? (
                            <>
                              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'cf-spin 0.8s linear infinite' }} />
                              Uploading to YouTube…
                            </>
                          ) : (
                            <>▶ Publish to YouTube</>
                          )}
                        </button>
                      </div>
                    )}
                    <style>{'@keyframes cf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
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
