import React, { useState, useRef } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const STYLES = [
  { id:'photorealistic', label:'Photorealistic',  icon:'📸' },
  { id:'lifestyle',      label:'Lifestyle',        icon:'🌿' },
  { id:'professional',   label:'Professional',     icon:'💼' },
  { id:'minimalist',     label:'Minimalist',       icon:'◻' },
  { id:'vibrant',        label:'Vibrant & Bold',   icon:'🎨' },
  { id:'social',         label:'Social Media',     icon:'📱' },
];

const PLATFORMS_SIZES = {
  facebook: [
    { id:'fb-feed',    label:'Feed Post',    w:1200, h:630,  icon:'📰', use:'Facebook feed — 1200x630' },
    { id:'fb-square',  label:'Square Post',  w:1080, h:1080, icon:'⬜', use:'Facebook square — 1080x1080' },
    { id:'fb-story',   label:'Story / Reel', w:1080, h:1920, icon:'📲', use:'Facebook Story/Reel — 1080x1920' },
    { id:'fb-cover',   label:'Cover Photo',  w:851,  h:315,  icon:'🖼', use:'Facebook cover — 851x315' },
  ],
  instagram: [
    { id:'ig-square',  label:'Square Post',  w:1080, h:1080, icon:'⬜', use:'Instagram square — 1080x1080 ★ most popular' },
    { id:'ig-portrait',label:'Portrait Post', w:1080, h:1350, icon:'📱', use:'Instagram portrait — 1080x1350 ★ highest reach' },
    { id:'ig-landscape',label:'Landscape',   w:1080, h:566,  icon:'🖥', use:'Instagram landscape — 1080x566' },
    { id:'ig-story',   label:'Story / Reel', w:1080, h:1920, icon:'📲', use:'Instagram Story/Reel — 1080x1920' },
  ],
  pinterest: [
    { id:'pin-standard',label:'Standard Pin', w:1000, h:1500, icon:'📌', use:'Pinterest standard — 1000x1500 ★ best performer' },
    { id:'pin-square',  label:'Square Pin',   w:1000, h:1000, icon:'⬜', use:'Pinterest square — 1000x1000' },
    { id:'pin-long',    label:'Long Pin',     w:1000, h:2100, icon:'📏', use:'Pinterest long — 1000x2100' },
    { id:'pin-story',   label:'Story Pin',    w:1080, h:1920, icon:'📲', use:'Pinterest Story — 1080x1920' },
  ],
  youtube: [
    { id:'yt-thumb',   label:'Thumbnail',    w:1280, h:720,  icon:'▶', use:'YouTube thumbnail — 1280x720 ★ required' },
    { id:'yt-shorts',  label:'Shorts',       w:1080, h:1920, icon:'📲', use:'YouTube Shorts — 1080x1920' },
    { id:'yt-banner',  label:'Channel Art',  w:2560, h:1440, icon:'🖥', use:'YouTube channel art — 2560x1440' },
  ],
  tiktok: [
    { id:'tt-cover',   label:'Video Cover',  w:1080, h:1920, icon:'📲', use:'TikTok cover — 1080x1920' },
    { id:'tt-square',  label:'Square',       w:1080, h:1080, icon:'⬜', use:'TikTok square — 1080x1080' },
  ],
  universal: [
    { id:'uni-square', label:'Square 1:1',   w:1080, h:1080, icon:'⬜', use:'Works on Facebook, Instagram, Pinterest' },
    { id:'uni-portrait',label:'Portrait 4:5',w:1080, h:1350, icon:'📱', use:'Works on Instagram + Facebook feed' },
    { id:'uni-vertical',label:'Vertical 9:16',w:1080,h:1920, icon:'📲', use:'Works on all Stories + Reels + TikTok' },
    { id:'uni-landscape',label:'Landscape 16:9',w:1280,h:720,icon:'🖥', use:'Works on YouTube + Facebook cover' },
    { id:'uni-pinterest',label:'Pinterest 2:3',w:1000,h:1500,icon:'📌', use:'Optimised for Pinterest' },
  ],
};

const PLATFORM_LABELS = {
  facebook:'Facebook', instagram:'Instagram', pinterest:'Pinterest',
  youtube:'YouTube', tiktok:'TikTok', universal:'Universal (multi-platform)',
};

const SIZES = PLATFORMS_SIZES.universal; // default

const THEMES = [
  'Make Money Online', 'Health & Wellness', 'Fitness', 'Beauty & Skincare',
  'Personal Finance', 'Self Improvement', 'Home & Garden', 'Technology',
  'Food & Nutrition', 'Travel & Lifestyle',
];

export default function ImageGenerator({ onImageSelect, compact = false }) {
  const [prompt, setPrompt]     = useState('');
  const [style, setStyle]       = useState('lifestyle');
  const [platform, setPlatform] = useState('universal');
  const [size, setSize]         = useState('uni-square');
  const [theme, setTheme]       = useState('');
  const [negPrompt, setNeg]     = useState('text, watermark, logo, blurry, low quality, distorted');
  const [generating, setGen]    = useState(false);
  const [images, setImages]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError]       = useState('');
  const [editing, setEditing]   = useState(false);
  const [editPrompt, setEditP]  = useState('');
  const [count, setCount]       = useState(2);
  const canvasRef               = useRef(null);

  const currentSizes = PLATFORMS_SIZES[platform] || PLATFORMS_SIZES.universal;
  const selectedSize = currentSizes.find(s => s.id === size) || currentSizes[0];

  async function generate(editMode = false) {
    const finalPrompt = editMode ? editPrompt : buildPrompt();
    if (!finalPrompt.trim()) return;
    setGen(true); setError('');
    if (!editMode) setImages([]);

    try {
      const res = await fetch(`${API}/api/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:          finalPrompt,
          negative_prompt: negPrompt,
          width:           selectedSize.w,
          height:          selectedSize.h,
          n:               editMode ? 1 : count,
          style,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');

      const newImages = data.images || [];
      if (editMode) {
        setImages(prev => [...newImages, ...prev]);
      } else {
        setImages(newImages);
      }
      if (newImages[0]) setSelected(newImages[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setGen(false);
      setEditing(false);
    }
  }

  function buildPrompt() {
    const styleMap = {
      photorealistic: 'photorealistic, high quality photography, professional photo',
      lifestyle:      'lifestyle photography, natural light, authentic, warm tones',
      professional:   'professional corporate photography, clean background, business style',
      minimalist:     'minimalist, clean, simple, white background, elegant',
      vibrant:        'vibrant colors, bold, eye-catching, dynamic composition',
      social:         'social media ready, engaging, modern, trendy aesthetic',
    };
    const parts = [prompt.trim()];
    if (theme) parts.push(`${theme} niche`);
    parts.push(styleMap[style] || style);
    parts.push('no text, no watermarks, no logos');
    return parts.join(', ');
  }

  function selectImage(img) {
    setSelected(img);
    onImageSelect?.(img);
  }

  function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentforge-image-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  }

  function copyImageUrl(url) {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  if (compact) {
    return (
      <div style={{ background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, padding:'14px 16px' }}>
        <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
          🖼 Add image
          <span style={{ fontSize:10, color:'#7BAAA0', fontWeight:400 }}>AI-generated, ready to post</span>
        </div>
        <input value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the image you want..."
          style={{ width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:12, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:8, boxSizing:'border-box' }}
        />
        <div style={{ display:'flex', gap:4, marginBottom:8, flexWrap:'wrap' }}>
          {Object.entries(PLATFORM_LABELS).slice(0,5).map(([key, label]) => (
            <button key={key} onClick={() => {
              setPlatform(key);
              const firstSize = PLATFORMS_SIZES[key]?.[0];
              if (firstSize) setSize(firstSize.id);
            }}
              style={{ fontSize:10, padding:'3px 8px', borderRadius:6, cursor:'pointer', fontFamily:'inherit',
                border: `1px solid ${platform===key ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                background: platform===key ? 'rgba(29,158,117,.15)' : 'transparent',
                color: platform===key ? '#5DCAA5' : '#7BAAA0' }}>
              {key==='facebook'?'📘':key==='instagram'?'📷':key==='pinterest'?'📌':key==='youtube'?'▶':'🎵'} {label}
            </button>
          ))}
        </div>
        {/* Show selected format */}
        <div style={{ fontSize:10, color:'#4A7A72', marginBottom:6 }}>
          Format: {selectedSize?.label} — {selectedSize?.use}
        </div>
        <button onClick={() => generate(false)} disabled={generating || !prompt.trim()}
          style={{ width:'100%', padding:'8px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity: generating||!prompt.trim() ? 0.5 : 1 }}>
          {generating ? '⏳ Generating...' : '🖼 Generate Image'}
        </button>
        {error && <div style={{ fontSize:11, color:'#F09595', marginTop:6 }}>⚠ {error}</div>}
        {images.length > 0 && (
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position:'relative', cursor:'pointer' }} onClick={() => selectImage(img)}>
                <img src={img.url} alt={`Generated ${i+1}`}
                  style={{ width:'100%', borderRadius:8, border: selected?.url===img.url ? '2px solid #1D9E75' : '2px solid transparent', display:'block' }} />
                {selected?.url === img.url && (
                  <div style={{ position:'absolute', top:4, right:4, background:'#1D9E75', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>✓</div>
                )}
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div style={{ marginTop:8, display:'flex', gap:6 }}>
            <button onClick={() => downloadImage(selected.url)}
              style={{ flex:1, padding:'6px', borderRadius:6, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              ⬇ Download
            </button>
            <button onClick={() => copyImageUrl(selected.url)}
              style={{ flex:1, padding:'6px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              Copy URL
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding:24, maxWidth:1100, fontFamily:'inherit' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 }}>
          🖼 AI Image Generator
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>DALL-E 3</span>
        </div>
        <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Generate platform-ready images for your posts, landing pages and content</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:16 }}>

        {/* Controls */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          <div style={{ background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>Image settings</div>
            <div style={{ padding:'14px 15px' }}>
              <div style={{ fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:5 }}>Describe your image</div>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Person working from home on laptop, natural light, coffee on desk, relaxed and productive atmosphere"
                style={{ width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:12, boxSizing:'border-box', minHeight:80, resize:'vertical', lineHeight:1.5 }}
              />

              <div style={{ fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:5 }}>Niche (optional)</div>
              <select value={theme} onChange={e => setTheme(e.target.value)}
                style={{ width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:12, boxSizing:'border-box', cursor:'pointer' }}>
                <option value="">No specific niche</option>
                {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <div style={{ fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Visual style</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginBottom:12 }}>
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    style={{ padding:'7px 8px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:6,
                      border: `1px solid ${style===s.id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: style===s.id ? 'rgba(29,158,117,.12)' : 'transparent' }}>
                    <span style={{ fontSize:14 }}>{s.icon}</span>
                    <span style={{ fontSize:11, color: style===s.id ? '#5DCAA5' : '#7BAAA0' }}>{s.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Target platform</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:12 }}>
                {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => {
                    setPlatform(key);
                    const firstSize = PLATFORMS_SIZES[key]?.[0];
                    if (firstSize) setSize(firstSize.id);
                  }}
                    style={{ padding:'7px 8px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:11, textAlign:'center',
                      border: `1px solid ${platform===key ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: platform===key ? 'rgba(29,158,117,.12)' : 'transparent',
                      color: platform===key ? '#5DCAA5' : '#7BAAA0' }}>
                    {key==='facebook'?'📘':key==='instagram'?'📷':key==='pinterest'?'📌':key==='youtube'?'▶':key==='tiktok'?'🎵':'🌐'} {label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Image format</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
                {currentSizes.map(s => (
                  <button key={s.id} onClick={() => setSize(s.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                      border: `1px solid ${size===s.id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: size===s.id ? 'rgba(29,158,117,.12)' : 'transparent' }}>
                    <span style={{ fontSize:14 }}>{s.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color: size===s.id ? '#5DCAA5' : '#E8F4F0' }}>{s.label}</div>
                      <div style={{ fontSize:10, color:'#4A7A72' }}>{s.use}</div>
                    </div>
                    {size===s.id && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Number of images</div>
                <div style={{ display:'flex', gap:4 }}>
                  {[1,2,3,4].map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      style={{ width:28, height:28, borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:12,
                        border: `1px solid ${count===n ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                        background: count===n ? 'rgba(29,158,117,.15)' : 'transparent',
                        color: count===n ? '#5DCAA5' : '#7BAAA0' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => generate(false)} disabled={generating || !prompt.trim()}
                style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:'#1D9E75', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: generating||!prompt.trim() ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {generating ? <><span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block' }} /> Generating...</> : '🖼 Generate Images'}
              </button>
            </div>
          </div>

          {/* Negative prompt */}
          <div style={{ background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, padding:'12px 15px' }}>
            <div style={{ fontSize:11, color:'#4A7A72', fontWeight:500, marginBottom:6 }}>EXCLUDE FROM IMAGE</div>
            <textarea value={negPrompt} onChange={e => setNeg(e.target.value)}
              style={{ width:'100%', border:'1px solid rgba(29,158,117,.15)', borderRadius:6, padding:'7px 9px', fontSize:11, fontFamily:'inherit', color:'#7BAAA0', background:'rgba(22,61,106,.4)', outline:'none', boxSizing:'border-box', minHeight:60, resize:'vertical', lineHeight:1.4 }}
            />
          </div>
        </div>

        {/* Results */}
        <div>
          {error && (
            <div style={{ padding:'12px 14px', background:'rgba(226,75,74,.1)', border:'1px solid rgba(226,75,74,.2)', borderRadius:10, color:'#F09595', fontSize:13, marginBottom:14 }}>
              ⚠ {error}
              <div style={{ fontSize:11, color:'#7BAAA0', marginTop:4 }}>Make sure OPENAI_API_KEY is set in Railway — DALL-E 3 requires an OpenAI API key.</div>
            </div>
          )}

          {!generating && images.length === 0 && !error && (
            <div style={{ background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, padding:'60px 20px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🖼</div>
              <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>Your images will appear here</div>
              <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:4 }}>Describe what you want and click Generate</div>
              <div style={{ fontSize:11, color:'#4A7A72' }}>Powered by DALL-E 3 — no watermarks, commercial use ready</div>
            </div>
          )}

          {generating && (
            <div style={{ background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, padding:'60px 20px', textAlign:'center' }}>
              <div style={{ width:48,height:48,border:'3px solid rgba(29,158,117,.2)',borderTopColor:'#1D9E75',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px' }} />
              <div style={{ fontSize:14, color:'#5DCAA5', marginBottom:6 }}>Generating your images...</div>
              <div style={{ fontSize:12, color:'#7BAAA0' }}>DALL-E 3 takes 10-20 seconds per image</div>
            </div>
          )}

          {images.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Image grid */}
              <div style={{ display:'grid', gridTemplateColumns: count <= 2 ? '1fr 1fr' : '1fr 1fr 1fr', gap:10 }}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => selectImage(img)}
                    style={{ cursor:'pointer', borderRadius:10, overflow:'hidden', border: selected?.url===img.url ? '2px solid #1D9E75' : '2px solid transparent', position:'relative', transition:'border .2s' }}>
                    <img src={img.url} alt={`Generated ${i+1}`} style={{ width:'100%', display:'block' }} />
                    <div style={{ position:'absolute', inset:0, background: selected?.url===img.url ? 'rgba(29,158,117,.1)' : 'transparent', transition:'background .2s' }} />
                    {selected?.url === img.url && (
                      <div style={{ position:'absolute', top:8, right:8, background:'#1D9E75', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white' }}>✓</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected image actions */}
              {selected && (
                <div style={{ background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>
                    Selected image actions
                  </div>
                  <div style={{ padding:'12px 15px', display:'flex', flexDirection:'column', gap:10 }}>

                    {/* Edit prompt */}
                    {editing ? (
                      <div>
                        <div style={{ fontSize:11, color:'#4A7A72', marginBottom:6 }}>Edit prompt — describe the change you want</div>
                        <textarea value={editPrompt} onChange={e => setEditP(e.target.value)}
                          placeholder="e.g. Make it brighter, add a coffee cup, change background to white..."
                          style={{ width:'100%', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, padding:'8px 11px', fontSize:12, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', boxSizing:'border-box', minHeight:60, resize:'vertical', lineHeight:1.4, marginBottom:8 }}
                        />
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => generate(true)} disabled={generating || !editPrompt.trim()}
                            style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:!editPrompt.trim()?0.5:1 }}>
                            ⚡ Generate variation
                          </button>
                          <button onClick={() => setEditing(false)}
                            style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        <button onClick={() => downloadImage(selected.url)}
                          style={{ padding:'9px', borderRadius:8, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                          ⬇ Download image
                        </button>
                        <button onClick={() => copyImageUrl(selected.url)}
                          style={{ padding:'9px', borderRadius:8, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                          🔗 Copy image URL
                        </button>
                        <button onClick={() => { setEditing(true); setEditP(''); }}
                          style={{ padding:'9px', borderRadius:8, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                          ✎ Edit / Variation
                        </button>
                        <button onClick={() => { onImageSelect?.(selected); }}
                          style={{ padding:'9px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                          ✓ Use this image
                        </button>
                      </div>
                    )}

                    {/* Platform size guide */}
                    <div style={{ background:'rgba(22,61,106,.4)', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:11, color:'#4A7A72', marginBottom:6 }}>Current size: {selectedSize.label} — Best for: {selectedSize.use}</div>
                      <div style={{ fontSize:11, color:'#7BAAA0' }}>
                        💡 Tip: Download and use directly in your posts. Image URL can be pasted into landing page builder or AI Composer.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regenerate */}
              <button onClick={() => generate(false)} disabled={generating}
                style={{ padding:'9px', borderRadius:8, border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                ↻ Regenerate all images
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: #102D4F; }`}</style>
    </div>
  );
}
