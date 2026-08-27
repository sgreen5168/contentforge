import { useState, useRef, useEffect } from 'react';

const API = (typeof window !== 'undefined' && window.__CF_API__) || 'https://contentforge-production-6e13.up.railway.app';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BG3  = '#122545';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1877F2'; // Facebook blue
const ACCH = '#4FA3FF';
const GRN  = '#1D9E75';

function card() {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12 };
}
function inp(extra) {
  return { width:'100%', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:8,
    padding:'10px 12px', fontSize:12, color:TXT, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra };
}

export default function FacebookStudio({ onNavigate }) {
  // Restore saved session if available
  const saved = (function() {
    try { return JSON.parse(localStorage.getItem('cf_fbstudio') || '{}'); } catch { return {}; }
  })();

  const [videoFile, setVideoFile]       = useState(null); // can't persist File objects
  const [videoPreview, setVideoPreview] = useState(saved.videoPreview || null);
  const [title, setTitle]               = useState(saved.title || '');
  const [description, setDescription]   = useState(saved.description || '');
  const [tags, setTags]                 = useState(saved.tags || '');
  const [privacy, setPrivacy]           = useState(saved.privacy || 'EVERYONE');
  const [affLink, setAffLink]           = useState(saved.affLink || '');
  const [affLinks, setAffLinks]         = useState([]);
  const [generating, setGenerating]     = useState(false);
  const [copied, setCopied]             = useState('');
  const [step, setStep]                 = useState(saved.step || 1);
  const [topic, setTopic]               = useState(saved.topic || '');
  const [videoName, setVideoName]       = useState(saved.videoName || '');
  const [editing, setEditing]           = useState(false);
  const [captions, setCaptions]         = useState(saved.captions || {});
  const [genCaptions, setGenCaptions]   = useState(false);
  const [activeCaption, setActiveCaption] = useState('facebook');
  const [reading, setReading]           = useState(false);
  const [readSpeed, setReadSpeed]       = useState(1.0);
  const fileRef = useRef(null);

  // Save session whenever key fields change
  useEffect(function() {
    try {
      localStorage.setItem('cf_fbstudio', JSON.stringify({
        title, description, tags, privacy, affLink, step, topic, captions,
        videoName, videoPreview: null, // can't store blob URLs
      }));
    } catch(e) {}
  }, [title, description, tags, privacy, affLink, step, topic, videoName]);

  // Load affiliate links on mount
  useEffect(function() {
    fetch(API + '/api/affiliate/links')
      .then(function(r) { return r.json(); })
      .then(function(d) { setAffLinks(d.links || []); })
      .catch(function() {});
  }, []);

  function handleFile(file) {
    if (!file || !file.type.startsWith('video/')) return;
    setVideoFile(file);
    const blobUrl = URL.createObjectURL(file);
    setVideoPreview(blobUrl);
    setVideoName(file.name);
    // Auto-detect topic from filename
    const name = file.name.replace(/[_\-]/g,' ').replace(/\.mp4|\.mov|\.avi/gi,'').trim();
    setTopic(name);
    setStep(2);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  async function autoFill() {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      // Auto-match affiliate link first
      const matchR = await fetch(API + '/api/affiliate/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: 1 }),
      });
      const matchD = await matchR.json();
      const link = matchD.links?.[0];

      // Generate description using Claude
      const genR = await fetch(API + '/api/nichroute/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          type: 'facebook_video_description',
          affiliateName: link?.name || '',
          affiliateUrl: link?.url || '',
        }),
      });

      let description = '';
      if (genR.ok) {
        const genD = await genR.json();
        description = genD.content || genD.text || '';
      }

      // Fallback description if API fails
      if (!description) {
        description = 'Check out this video about ' + topic + '.\n\nIf you found this helpful, share it with someone who needs to see it!\n\nDrop a comment below with your thoughts 👇';
      }

      // Build title from topic
      const autoTitle = topic.split(' ').map(function(w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(' ');

      // Auto-generate tags from topic
      const topicTags = topic.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter(function(w) { return w.length > 2; })
        .join(',');

      // Create NichRoute landing page and use that URL instead of raw affiliate link
      let landingUrl = '';
      try {
        const landingR = await fetch(API + '/api/nichroute/create-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            postContent: description,
            affiliateUrl: link?.url || '',
            affiliateName: link?.name || '',
            category: 'general',
          }),
        });
        const landingD = await landingR.json();
        if (landingD.url) landingUrl = landingD.url;
      } catch(e) { console.warn('Landing page failed:', e.message); }

      // Add landing page URL to description — not raw affiliate link
      const finalDesc = description + (landingUrl ? '\n\nFull details: ' + landingUrl : '') + '\n\nDrop a comment with your thoughts below! 👇';

      setTitle(autoTitle);
      setDescription(finalDesc);
      // Smart topic-based tags
      const topicTag = topic.toLowerCase().replace(/[^a-z0-9]/g,'');
      const t = topic.toLowerCase();
      let extraTags = 'homebusiness,contentcreator,sidehustle';
      if (t.includes('bak')) extraTags = 'homebakery,bakingtips,bakingbusiness,foodbusiness,homecook';
      else if (t.includes('meal')) extraTags = 'mealprep,mealprepideas,healthyeating,foodprep,cookingideas';
      else if (t.includes('health') || t.includes('fitness')) extraTags = 'healthtips,wellnesstips,healthyhabits,selfcare,fitnesstips';
      else if (t.includes('mindset') || t.includes('habit')) extraTags = 'mindset,personaldevelopment,selfimprovement,successmindset,motivation';
      else if (t.includes('remote') || t.includes('office')) extraTags = 'remotework,workfromhome,wfhlife,homeoffice,digitalnomad';
      else if (t.includes('hustle') || t.includes('income')) extraTags = 'sidehustle,sidehustleideas,extramoney,makemoney,passiveincome';
      else if (t.includes('financ') || t.includes('budget')) extraTags = 'personalfinance,budgeting,moneytips,financialfreedom,savingmoney';
      else if (t.includes('live') || t.includes('sell')) extraTags = 'liveselling,facebooklive,socialselling,onlineselling,ecommerce';
      setTags(topicTag + ',' + extraTags);
      if (landingUrl) setAffLink(landingUrl); // show landing page URL not raw affiliate
      else if (link) setAffLink(link.url);
    } catch(e) {
      console.error('AutoFill error:', e);
      setTitle(topic);
      setDescription('Watch this video about ' + topic + '. Drop a comment with your thoughts below! 👇');
      setTags(topic.toLowerCase().replace(/\s+/g,',') + ',video,content');
    }
    setGenerating(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  const fullDescription = description +
    (affLink && !description.includes(affLink) && affLink.includes('nichroute.com')
      ? '\n\nFull details: ' + affLink + '\n#ad This post contains an affiliate link. I may earn a small commission at no extra cost to you.'
      : '') +
    (tags ? '\n\n' + tags.split(',').map(function(t){ return '#' + t.trim().replace(/\s+/g,''); }).join(' ') : '');

  function readAloud(text) {
    if (!text) return;
    if (!window.speechSynthesis) { alert('Read Aloud requires Chrome or Edge.'); return; }
    window.speechSynthesis.cancel();
    const clean = text.replace(/https?:\/\/\S+/g, '').replace(/[#*_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(function(v){ return v.lang==='en-US' && v.name.includes('Natural'); })
      || voices.find(function(v){ return v.lang==='en-US'; }) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = readSpeed;
    utterance.pitch = 1.05;
    utterance.onend = function(){ setReading(false); };
    utterance.onerror = function(){ setReading(false); };
    setReading(true);
    setTimeout(function(){ window.speechSynthesis.speak(utterance); }, 100);
  }

  async function generateCaptions() {
    if (!topic.trim() || !description.trim()) return;
    setGenCaptions(true);
    try {
      const r = await fetch(API + '/api/studio/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          description,
          affiliateUrl: affLink,
          title,
        }),
      });
      const d = await r.json();
      if (d.captions) {
        setCaptions(d.captions);
        setActiveCaption('instagram');
      }
    } catch(e) { console.error('Caption gen failed:', e); }
    setGenCaptions(false);
  }

  function stopReading() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setReading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:BG, color:TXT, fontFamily:'system-ui,sans-serif', padding:'24px 20px' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(24,119,242,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📘</div>
            <div>
              <div style={{ fontSize:20, fontWeight:800 }}>Facebook Video Studio</div>
              <div style={{ fontSize:12, color:TXT3 }}>Upload your video, auto-fill details, add affiliate link — post to Facebook</div>
            </div>
          </div>
          {(title || description || topic) && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:GRN }}>✅ Session saved</span>
              <button onClick={function(){
                localStorage.removeItem('cf_fbstudio');
                setTitle(''); setDescription(''); setTags(''); setAffLink('');
                setTopic(''); setVideoName(''); setVideoFile(null); setVideoPreview(null); setStep(1);
              }} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(226,75,74,.3)', background:'transparent', color:'#F09595', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                🗑 Clear
              </button>
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div style={{ display:'flex', gap:0, marginBottom:24 }}>
          {[['1','Upload Video'],['2','Add Details'],['3','Publish']].map(function(s,i) {
            const active = step === i+1;
            const done = step > i+1;
            return (
              <div key={i} style={{ flex:1, display:'flex', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8,
                  background: active ? 'rgba(24,119,242,.15)' : done ? 'rgba(29,158,117,.1)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(24,119,242,.4)' : done ? 'rgba(29,158,117,.3)' : BORD}`,
                  flex:1 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700,
                    background: done ? GRN : active ? ACC : 'rgba(255,255,255,.08)',
                    color: done||active ? 'white' : TXT3 }}>
                    {done ? '✓' : s[0]}
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color: active ? ACCH : done ? GRN : TXT3 }}>{s[1]}</div>
                </div>
                {i < 2 && <div style={{ width:16, height:1, background:BORD, flexShrink:0 }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Upload */}
        {step === 1 && (
          <div style={{ ...card(), padding:32, textAlign:'center' }}
            onDragOver={function(e){e.preventDefault();}}
            onDrop={handleDrop}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎬</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>Drop your video here</div>
            <div style={{ fontSize:12, color:TXT3, marginBottom:20 }}>MP4, MOV, or AVI — up to 4GB for Facebook</div>
            <button onClick={function(){fileRef.current?.click();}}
              style={{ padding:'12px 32px', borderRadius:9, border:'none', background:ACC, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Browse Files
            </button>
            <input ref={fileRef} type="file" accept="video/*" style={{ display:'none' }}
              onChange={function(e){ handleFile(e.target.files[0]); }} />
            <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(24,119,242,.06)', border:`1px solid rgba(24,119,242,.15)`, borderRadius:8, fontSize:11, color:TXT3, textAlign:'left' }}>
              💡 Videos downloaded from Command Center auto-fill title, description, and affiliate link based on the topic
            </div>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Video preview or saved name */}
            {videoPreview && videoFile && (
              <div style={{ ...card(), padding:12 }}>
                <video src={videoPreview} controls style={{ width:'100%', borderRadius:8, maxHeight:200, background:'#000' }} />
                <div style={{ fontSize:11, color:TXT3, marginTop:6 }}>{videoFile.name} — {(videoFile.size/1024/1024).toFixed(1)} MB</div>
              </div>
            )}
            {!videoFile && videoName && (
              <div style={{ ...card(), padding:12, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>🎬</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{videoName}</div>
                  <div style={{ fontSize:10, color:TXT3 }}>Session restored — re-upload file to preview or post directly to Facebook</div>
                </div>
                <button onClick={function(){fileRef.current?.click();}} style={{ marginLeft:'auto', padding:'6px 12px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                  Re-upload
                </button>
              </div>
            )}

            {/* Topic + Auto-fill */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>🎯 Topic — used to auto-fill everything</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={topic} onChange={function(e){setTopic(e.target.value);}}
                  placeholder="e.g. Home Bakery Business, Meal Prep Tips, Side Hustle Ideas"
                  style={inp({ flex:1 })} />
                <button onClick={autoFill} disabled={generating || !topic.trim()}
                  style={{ padding:'8px 16px', borderRadius:8, border:'none',
                    background: generating||!topic.trim() ? 'rgba(24,119,242,.3)' : ACC,
                    color:'white', fontSize:12, fontWeight:700, cursor: generating||!topic.trim()?'default':'pointer', fontFamily:'inherit', flexShrink:0 }}>
                  {generating ? '⚡ Filling…' : '⚡ Auto-Fill'}
                </button>
              </div>
            </div>

            {/* Title */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>📝 Video Title</div>
              <input value={title} onChange={function(e){setTitle(e.target.value);}}
                placeholder="Enter a compelling video title"
                style={inp()} />
              <div style={{ fontSize:10, color:TXT3, marginTop:4 }}>{title.length}/100 characters</div>
            </div>

            {/* Description with editor and reader */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>📄 Description</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={function(){ setEditing(!editing); }}
                    style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${editing?'rgba(99,102,241,.4)':BORD}`, background:editing?'rgba(99,102,241,.1)':'transparent', color:editing?'#818CF8':TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {editing ? '✅ Done' : '✏️ Edit'}
                  </button>
                  <button onClick={function(){ if(reading){ stopReading(); } else { readAloud(description); } }}
                    style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${reading?'rgba(29,158,117,.4)':BORD}`, background:reading?'rgba(29,158,117,.1)':'transparent', color:reading?GRN:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {reading ? '⏹ Stop' : '🔊 Read'}
                  </button>
                  {reading && (
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      {[0.75, 1.0, 1.25, 1.5].map(function(s) {
                        return (
                          <button key={s} onClick={function(){ setReadSpeed(s); stopReading(); setTimeout(function(){ readAloud(description); }, 200); }}
                            style={{ padding:'3px 6px', borderRadius:4, border:`1px solid ${readSpeed===s?GRN:BORD}`, background:readSpeed===s?'rgba(29,158,117,.15)':'transparent', color:readSpeed===s?GRN:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                            {s}x
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {editing ? (
                <textarea value={description} onChange={function(e){setDescription(e.target.value);}}
                  rows={8} autoFocus
                  style={{ ...inp(), resize:'vertical', lineHeight:1.7, borderColor:'rgba(99,102,241,.4)' }} />
              ) : (
                <div style={{ fontSize:12, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:7, border:`1px solid ${BORD}`, minHeight:80, cursor:'text' }}
                  onClick={function(){ setEditing(true); }}>
                  {description || <span style={{ color:TXT3, fontStyle:'italic' }}>Click to edit description or use ⚡ Auto-Fill above</span>}
                </div>
              )}
              <div style={{ fontSize:10, color:TXT3, marginTop:4 }}>{description.length} characters</div>
            </div>

            {/* Platform Captions */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>📱 Platform Captions</div>
                <button onClick={generateCaptions} disabled={genCaptions || !description.trim()}
                  style={{ padding:'5px 12px', borderRadius:7, border:'none', background:genCaptions||!description.trim()?'rgba(29,158,117,.3)':GRN, color:'white', fontSize:11, fontWeight:700, cursor:genCaptions||!description.trim()?'default':'pointer', fontFamily:'inherit' }}>
                  {genCaptions ? '✨ Generating…' : '✨ Generate All Captions'}
                </button>
              </div>
              <div style={{ fontSize:11, color:TXT3, marginBottom:10 }}>
                One click generates optimized captions for every platform — each with the right length, tone, and hashtags.
              </div>

              {/* Platform tabs */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                {[
                  { id:'facebook', icon:'📘', label:'Facebook' },
                  { id:'instagram', icon:'📸', label:'Instagram' },
                  { id:'tiktok', icon:'🎵', label:'TikTok' },
                  { id:'youtube', icon:'▶', label:'YouTube' },
                  { id:'pinterest', icon:'📌', label:'Pinterest' },
                  { id:'twitter', icon:'𝕏', label:'X / Twitter' },
                ].map(function(p) {
                  const hasCap = p.id === 'facebook' ? !!description : !!captions[p.id];
                  return (
                    <button key={p.id} onClick={function(){ setActiveCaption(p.id); }}
                      style={{ padding:'5px 12px', borderRadius:7,
                        border:`1px solid ${activeCaption===p.id?'rgba(29,158,117,.5)':BORD}`,
                        background:activeCaption===p.id?'rgba(29,158,117,.1)':'transparent',
                        color:activeCaption===p.id?GRN:hasCap?TXT2:TXT3,
                        fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                        display:'flex', alignItems:'center', gap:4 }}>
                      {p.icon} {p.label}
                      {hasCap && <span style={{ width:5, height:5, borderRadius:'50%', background:GRN, display:'inline-block' }} />}
                    </button>
                  );
                })}
              </div>

              {/* Active caption display */}
              {activeCaption === 'facebook' ? (
                <div>
                  <div style={{ fontSize:10, color:TXT3, marginBottom:6 }}>Your Facebook description (from above)</div>
                  <div style={{ fontSize:11, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:7, border:`1px solid ${BORD}`, maxHeight:120, overflow:'auto' }}>
                    {description || 'Fill in the description above first'}
                  </div>
                  <button onClick={function(){ copy(description,'fb_cap'); }} style={{ marginTop:6, padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied==='fb_cap'?'✓ Copied!':'📋 Copy'}
                  </button>
                </div>
              ) : captions[activeCaption] ? (
                <div>
                  <div style={{ fontSize:10, color:TXT3, marginBottom:6 }}>
                    {activeCaption==='instagram' && '📸 Instagram Reels — short, punchy, hashtags at end'}
                    {activeCaption==='tiktok' && '🎵 TikTok — hook first, trending sounds, CTA to bio link'}
                    {activeCaption==='youtube' && '▶ YouTube — detailed description with affiliate link allowed directly'}
                    {activeCaption==='pinterest' && '📌 Pinterest — keyword-rich, searchable, evergreen'}
                    {activeCaption==='twitter' && '𝕏 X/Twitter — concise, punchy, link at end'}
                  </div>
                  <div style={{ fontSize:11, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:7, border:`1px solid ${BORD}`, maxHeight:160, overflow:'auto' }}>
                    {captions[activeCaption]}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <button onClick={function(){ copy(captions[activeCaption], activeCaption+'_cap'); }}
                      style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      {copied===activeCaption+'_cap'?'✓ Copied!':'📋 Copy'}
                    </button>
                    <button onClick={function(){ readAloud(captions[activeCaption]); }}
                      style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      🔊 Read
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'16px', textAlign:'center', color:TXT3, fontSize:11 }}>
                  {genCaptions ? '✨ Generating captions…' : 'Click ✨ Generate All Captions to create platform-specific versions'}
                </div>
              )}
            </div>

            {/* Affiliate Link */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>🔗 Affiliate Link (added to description)</div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <input value={affLink} onChange={function(e){setAffLink(e.target.value);}}
                  placeholder="Paste affiliate link or select from library below"
                  style={inp({ flex:1 })} />
              </div>
              {affLinks.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {affLinks.slice(0,8).map(function(l) {
                    return (
                      <button key={l.id} onClick={function(){setAffLink(l.url);}}
                        style={{ padding:'4px 10px', borderRadius:6,
                          border:`1px solid ${affLink===l.url?'rgba(29,158,117,.5)':BORD}`,
                          background: affLink===l.url?'rgba(29,158,117,.1)':'transparent',
                          color: affLink===l.url?GRN:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                        {l.name.slice(0,30)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>🏷️ Tags (comma separated)</div>
              <input value={tags} onChange={function(e){setTags(e.target.value);}}
                placeholder="homebusiness, sidehustle, earnfromhome, bakery"
                style={inp()} />
            </div>

            {/* Privacy */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>👥 Privacy Setting</div>
              <div style={{ display:'flex', gap:8 }}>
                {[['EVERYONE','🌍 Public'],['FRIENDS','👥 Friends'],['ONLY_ME','🔒 Only Me']].map(function(p) {
                  return (
                    <button key={p[0]} onClick={function(){setPrivacy(p[0]);}}
                      style={{ flex:1, padding:'8px', borderRadius:8,
                        border:`1px solid ${privacy===p[0]?'rgba(24,119,242,.5)':BORD}`,
                        background: privacy===p[0]?'rgba(24,119,242,.12)':'transparent',
                        color: privacy===p[0]?ACCH:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                      {p[1]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={function(){setStep(3);}}
              style={{ padding:'14px', borderRadius:10, border:'none', background:ACC, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Continue to Publish →
            </button>
          </div>
        )}

        {/* Step 3 — Publish */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Preview card */}
            <div style={{ ...card(), padding:16, border:'1px solid rgba(24,119,242,.25)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:ACCH, marginBottom:12 }}>📋 Post Preview</div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{title || 'No title set'}</div>
              <div style={{ fontSize:11, color:TXT2, lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:150, overflow:'auto', marginBottom:10 }}>
                {fullDescription || 'No description set'}
              </div>
              {tags && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {tags.split(',').map(function(t,i) {
                    return <span key={i} style={{ fontSize:10, color:ACCH, padding:'2px 6px', background:'rgba(24,119,242,.1)', borderRadius:4 }}>#{t.trim()}</span>;
                  })}
                </div>
              )}
            </div>

            {/* Step by step instructions */}
            <div style={{ ...card(), padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>📤 How to post on Facebook — follow in order</div>
              {[
                ['1', 'Copy the full description', 'Click the button below to copy your complete description with affiliate link and hashtags.', null],
                ['2', 'Go to Facebook', 'Open facebook.com or the Facebook app → click "Photo/Video" → select your video file from your computer.', 'https://www.facebook.com'],
                ['3', 'Paste title and description', 'Enter your title in the title field, then paste your copied description into the description box.', null],
                ['4', 'Set privacy and post', 'Choose your audience (Public recommended for maximum reach) → click Post.', null],
                ['5', 'Add first comment', 'Right after posting, add a comment with your engagement question and landing page URL to boost reach.', null],
              ].map(function(s,i) {
                return (
                  <div key={i} style={{ display:'flex', gap:12, marginBottom:12, padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${BORD}` }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(24,119,242,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:ACCH, flexShrink:0 }}>{s[0]}</div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{s[1]}</div>
                      <div style={{ fontSize:11, color:TXT3, lineHeight:1.5 }}>{s[2]}</div>
                      {s[3] && <a href={s[3]} target="_blank" rel="noreferrer" style={{ fontSize:10, color:ACCH, textDecoration:'none', marginTop:4, display:'inline-block' }}>Open Facebook ↗</a>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button onClick={function(){copy(title,'title');}}
                style={{ padding:'12px', borderRadius:9, border:`1px solid ${BORD}`, background:'transparent', color:TXT2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='title'?'✓ Copied!':'📋 Copy Title'}
              </button>
              <button onClick={function(){copy(fullDescription,'desc');}}
                style={{ padding:'12px', borderRadius:9, border:'none', background:ACC, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='desc'?'✓ Copied!':'📋 Copy Full Description'}
              </button>
              <button onClick={function(){copy(tags.split(',').map(function(t){return '#'+t.trim();}).join(' '),'tags');}}
                style={{ padding:'12px', borderRadius:9, border:`1px solid ${BORD}`, background:'transparent', color:TXT2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='tags'?'✓ Copied!':'🏷️ Copy Hashtags'}
              </button>
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer"
                style={{ padding:'12px', borderRadius:9, border:'none', background:'#1877F2', color:'white', fontSize:12, fontWeight:700, textDecoration:'none', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                📘 Open Facebook
              </a>
            </div>

            <button onClick={function(){setStep(2);}}
              style={{ padding:'10px', borderRadius:9, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              ← Back to Edit
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
