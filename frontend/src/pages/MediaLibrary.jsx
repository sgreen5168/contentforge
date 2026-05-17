import React, { useState, useRef, useCallback } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const PLATFORM_SIZES = {
  facebook:  { w:1200, h:630,  label:'Facebook Feed',     ratio:'1.91:1' },
  instagram: { w:1080, h:1080, label:'Instagram Square',  ratio:'1:1'    },
  pinterest: { w:1000, h:1500, label:'Pinterest Pin',     ratio:'2:3'    },
  youtube:   { w:1280, h:720,  label:'YouTube Thumbnail', ratio:'16:9'   },
  tiktok:    { w:1080, h:1920, label:'TikTok Cover',      ratio:'9:16'   },
  universal: { w:1080, h:1080, label:'Universal Square',  ratio:'1:1'    },
};

export default function MediaLibrary({ onSelect, compact = false }) {
  const [tab, setTab]             = useState('generate');
  const [prompt, setPrompt]       = useState('');
  const [platform, setPlatform]   = useState('instagram');
  const [style, setStyle]         = useState('lifestyle');
  const [generating, setGen]      = useState(false);
  const [images, setImages]       = useState([]);
  const [selected, setSelected]   = useState(null);
  const [uploaded, setUploaded]   = useState([]);
  const [videos, setVideos]       = useState([]);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const [editPrompt, setEditP]    = useState('');
  const [editing, setEditing]     = useState(false);
  const imgInput                  = useRef(null);
  const vidInput                  = useRef(null);

  const pSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.universal;

  // ── Generate image ──────────────────────────────────────────────────────────
  async function generate() {
    if (!prompt.trim()) return;
    setGen(true); setError('');
    try {
      const styleMap = {
        lifestyle:      'lifestyle photography, natural light, authentic, warm tones',
        photorealistic: 'photorealistic, high quality photography, professional, 4K',
        professional:   'professional corporate photography, clean background, business',
        minimalist:     'minimalist, clean, simple, elegant, modern, white space',
        vibrant:        'vibrant colors, bold, eye-catching, dynamic, high saturation',
      };
      const seoPrompt = [prompt, styleMap[style] || '', 'no text, no watermarks, no logos, high quality'].join(', ');
      const seoName   = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      const altText   = `${prompt} — ${pSize.label} image`;
      const seed      = Math.floor(Math.random() * 999999);
      const w         = Math.min(pSize.w, 1024);
      const h         = Math.min(pSize.h, 1024);
      const url       = `https://image.pollinations.ai/prompt/${encodeURIComponent(seoPrompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;
      const img       = { url, prompt: seoPrompt, altText, fileName: `${seoName}-${platform}.png`, platform, type: 'generated', id: Date.now() };
      setImages(prev => [img, ...prev]);
      setSelected(img);
    } catch (e) { setError(e.message); }
    finally { setGen(false); }
  }

  async function generateVariation() {
    if (!selected) return;
    setGen(true);
    try {
      const seed = Math.floor(Math.random() * 999999);
      const w    = Math.min(pSize.w, 1024);
      const h    = Math.min(pSize.h, 1024);
      const p    = editing && editPrompt ? editPrompt + ', lifestyle photography, no text, no watermarks' : selected.prompt;
      const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;
      const img  = { ...selected, url, prompt: p, id: Date.now() };
      setImages(prev => [img, ...prev]);
      setSelected(img);
      setEditing(false);
      setEditP('');
    } catch (e) { setError(e.message); }
    finally { setGen(false); }
  }

  // ── Upload image ─────────────────────────────────────────────────────────────
  function handleImageUpload(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = {
          url:      e.target.result,
          fileName: file.name,
          altText:  file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          type:     'uploaded',
          size:     `${(file.size/1024).toFixed(0)}KB`,
          id:       Date.now() + Math.random(),
          platform,
        };
        setUploaded(prev => [img, ...prev]);
        setSelected(img);
        setTab('uploaded');
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Upload video ─────────────────────────────────────────────────────────────
  function handleVideoUpload(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/')) return;
      const url = URL.createObjectURL(file);
      const vid = {
        url,
        fileName:  file.name,
        altText:   file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        type:      'video',
        size:      `${(file.size/1024/1024).toFixed(1)}MB`,
        duration:  null,
        id:        Date.now() + Math.random(),
        platform,
        fileObj:   file,
      };
      setVideos(prev => [vid, ...prev]);
      setSelected(vid);
      setTab('videos');
    });
  }

  // ── Drag and drop ────────────────────────────────────────────────────────────
  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const files = e.dataTransfer.files;
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    const vids = Array.from(files).filter(f => f.type.startsWith('video/'));
    if (imgs.length) handleImageUpload(imgs);
    if (vids.length) handleVideoUpload(vids);
  }, [platform]);

  function selectItem(item) {
    setSelected(item);
    onSelect?.(item);
  }

  function download(item) {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.fileName || 'contentforge-media.png';
    a.target = '_blank';
    a.click();
  }

  const allItems = [...images, ...uploaded];

  const S = {
    card:  { background:'rgba(16,45,79,.9)', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14 },
    hdr:   { padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
    body:  { padding:'14px 15px' },
    inp:   { width:'100%', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:10, boxSizing:'border-box' },
    btn:   { padding:'8px 14px', borderRadius:8, border:'1px solid rgba(29,158,117,.3)', background:'transparent', color:'#5DCAA5', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
    btnPrimary: { padding:'9px 18px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  };

  return (
    <div style={{ padding: compact ? 0 : 24, maxWidth:1100, fontFamily:'inherit' }}>
      {!compact && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 }}>
            🖼 Media Library
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>Manual Selection</span>
          </div>
          <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Generate, upload, or select images and videos for your posts</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: compact ? '1fr' : '300px 1fr', gap:16 }}>

        {/* Left — controls */}
        <div>
          {/* Platform selector */}
          <div style={S.card}>
            <div style={S.hdr}>Platform & format</div>
            <div style={S.body}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, marginBottom:10 }}>
                {Object.entries(PLATFORM_SIZES).map(([key, val]) => (
                  <button key={key} onClick={() => setPlatform(key)}
                    style={{ padding:'6px 4px', borderRadius:7, cursor:'pointer', fontFamily:'inherit', textAlign:'center', fontSize:10,
                      border: `1px solid ${platform===key ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: platform===key ? 'rgba(29,158,117,.12)' : 'transparent',
                      color: platform===key ? '#5DCAA5' : '#7BAAA0' }}>
                    {key==='facebook'?'📘':key==='instagram'?'📷':key==='pinterest'?'📌':key==='youtube'?'▶':key==='tiktok'?'🎵':'🌐'}
                    <div style={{ marginTop:2 }}>{key==='universal'?'All':key.charAt(0).toUpperCase()+key.slice(1)}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#4A7A72', padding:'6px 10px', background:'rgba(22,61,106,.4)', borderRadius:6 }}>
                {pSize.label} — {pSize.w}×{pSize.h}px ({pSize.ratio})
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:10 }}>
            {[['generate','✦ Generate'],['upload','⬆ Upload'],['videos','🎬 Video']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex:1, padding:'7px 4px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:500,
                  border: `1px solid ${tab===id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                  background: tab===id ? 'rgba(29,158,117,.15)' : 'transparent',
                  color: tab===id ? '#5DCAA5' : '#7BAAA0' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Generate tab */}
          {tab === 'generate' && (
            <div style={S.card}>
              <div style={S.hdr}>AI Image Generator</div>
              <div style={S.body}>
                <div style={{ fontSize:10, color:'#4A7A72', marginBottom:5, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Describe your image</div>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. Person working from home, laptop, coffee, natural light, productive atmosphere"
                  style={{ ...S.inp, minHeight:80, resize:'vertical', lineHeight:1.5 }}
                />
                <div style={{ fontSize:10, color:'#4A7A72', marginBottom:5, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Visual style</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:12 }}>
                  {[['lifestyle','🌿 Lifestyle'],['photorealistic','📸 Photo'],['professional','💼 Business'],['minimalist','◻ Minimal'],['vibrant','🎨 Vibrant']].map(([id,label]) => (
                    <button key={id} onClick={() => setStyle(id)}
                      style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:11, textAlign:'left',
                        border: `1px solid ${style===id ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                        background: style===id ? 'rgba(29,158,117,.12)' : 'transparent',
                        color: style===id ? '#5DCAA5' : '#7BAAA0' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {error && <div style={{ fontSize:11, color:'#F09595', marginBottom:8 }}>⚠ {error}</div>}
                <button onClick={generate} disabled={generating || !prompt.trim()}
                  style={{ ...S.btnPrimary, width:'100%', opacity: generating||!prompt.trim() ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {generating ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block' }} />Generating...</> : '🖼 Generate Image'}
                </button>
              </div>
            </div>
          )}

          {/* Upload tab */}
          {tab === 'upload' && (
            <div style={S.card}>
              <div style={S.hdr}>Upload your image</div>
              <div style={S.body}>
                <div
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => imgInput.current?.click()}
                  style={{ border:`2px dashed ${dragging ? '#1D9E75' : 'rgba(29,158,117,.3)'}`, borderRadius:10, padding:'28px 20px', textAlign:'center', cursor:'pointer', background: dragging ? 'rgba(29,158,117,.08)' : 'transparent', transition:'all .2s', marginBottom:10 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📁</div>
                  <div style={{ fontSize:13, color:'#E8F4F0', marginBottom:4 }}>Drop image here or click to browse</div>
                  <div style={{ fontSize:11, color:'#4A7A72' }}>JPG, PNG, GIF, WebP — any size</div>
                  <input ref={imgInput} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => handleImageUpload(e.target.files)} />
                </div>
                <div style={{ fontSize:11, color:'#4A7A72', lineHeight:1.5 }}>
                  💡 Upload your own product photos, lifestyle shots, or brand images. These will appear alongside AI-generated options so you can choose the best one.
                </div>
              </div>
            </div>
          )}

          {/* Video tab */}
          {tab === 'videos' && (
            <div style={S.card}>
              <div style={S.hdr}>Upload video from PC</div>
              <div style={S.body}>
                <div
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => vidInput.current?.click()}
                  style={{ border:`2px dashed ${dragging ? '#1D9E75' : 'rgba(29,158,117,.3)'}`, borderRadius:10, padding:'28px 20px', textAlign:'center', cursor:'pointer', background: dragging ? 'rgba(29,158,117,.08)' : 'transparent', transition:'all .2s', marginBottom:10 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🎬</div>
                  <div style={{ fontSize:13, color:'#E8F4F0', marginBottom:4 }}>Drop video here or click to browse</div>
                  <div style={{ fontSize:11, color:'#4A7A72' }}>MP4, MOV, AVI, WebM</div>
                  <input ref={vidInput} type="file" accept="video/*" multiple style={{ display:'none' }} onChange={e => handleVideoUpload(e.target.files)} />
                </div>
                {videos.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {videos.map(v => (
                      <div key={v.id} onClick={() => selectItem(v)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer',
                          border:`1px solid ${selected?.id===v.id ? '#1D9E75' : 'rgba(29,158,117,.15)'}`,
                          background: selected?.id===v.id ? 'rgba(29,158,117,.1)' : 'transparent' }}>
                        <span style={{ fontSize:20, flexShrink:0 }}>🎬</span>
                        <div style={{ flex:1, overflow:'hidden' }}>
                          <div style={{ fontSize:12, color:'#E8F4F0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.fileName}</div>
                          <div style={{ fontSize:10, color:'#4A7A72' }}>{v.size}</div>
                        </div>
                        {selected?.id===v.id && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — media grid + selected preview */}
        <div>
          {/* Selected media preview */}
          {selected && (
            <div style={{ ...S.card, marginBottom:14 }}>
              <div style={{ ...S.hdr, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>✓ Selected — {selected.type === 'video' ? '🎬 Video' : '🖼 Image'}</span>
                <div style={{ display:'flex', gap:6 }}>
                  {selected.type !== 'video' && (
                    <button onClick={() => setEditing(!editing)}
                      style={{ ...S.btn, fontSize:11 }}>✎ Edit prompt</button>
                  )}
                  <button onClick={() => download(selected)}
                    style={{ ...S.btn, fontSize:11 }}>⬇ Download</button>
                  <button onClick={() => { onSelect?.(selected); }}
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'#1D9E75', color:'white', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                    ✓ Use this
                  </button>
                </div>
              </div>
              <div style={{ padding:'12px 15px' }}>
                {selected.type === 'video' ? (
                  <video src={selected.url} controls style={{ width:'100%', maxHeight:300, borderRadius:8, background:'#000' }} />
                ) : (
                  <img src={selected.url} alt={selected.altText} style={{ width:'100%', maxHeight:300, objectFit:'contain', borderRadius:8, display:'block' }} />
                )}

                {/* Edit prompt */}
                {editing && (
                  <div style={{ marginTop:10 }}>
                    <input value={editPrompt} onChange={e => setEditP(e.target.value)}
                      placeholder="Describe what to change — e.g. brighter colors, add coffee cup, outdoor setting"
                      style={{ ...S.inp, marginBottom:8 }}
                      onKeyDown={e => { if(e.key==='Enter') generateVariation(); }}
                    />
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={generateVariation} disabled={generating}
                        style={{ ...S.btnPrimary, flex:1, opacity:generating?0.5:1 }}>
                        {generating ? '⏳ Generating...' : '⚡ Generate variation'}
                      </button>
                      <button onClick={() => { setEditing(false); setEditP(''); }} style={S.btn}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* SEO info */}
                <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(22,61,106,.4)', borderRadius:6 }}>
                  <div style={{ fontSize:10, color:'#4A7A72', marginBottom:3 }}>SEO details</div>
                  <div style={{ fontSize:11, color:'#7BAAA0' }}>Alt text: {selected.altText}</div>
                  <div style={{ fontSize:11, color:'#7BAAA0' }}>File name: {selected.fileName}</div>
                  <div style={{ fontSize:11, color:'#7BAAA0' }}>Platform: {pSize.label} ({pSize.w}×{pSize.h}px)</div>
                </div>
              </div>
            </div>
          )}

          {/* Media grid */}
          {allItems.length > 0 && (
            <div style={S.card}>
              <div style={S.hdr}>Media library ({allItems.length} items)</div>
              <div style={{ padding:'10px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:8 }}>
                {allItems.map(item => (
                  <div key={item.id} onClick={() => selectItem(item)}
                    style={{ cursor:'pointer', borderRadius:8, overflow:'hidden', position:'relative',
                      border: selected?.id===item.id ? '2px solid #1D9E75' : '2px solid transparent', aspectRatio:'1' }}>
                    <img src={item.url} alt={item.altText}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'4px 6px', background:'rgba(13,33,55,.85)', fontSize:9, color:'#7BAAA0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.type === 'uploaded' ? '⬆' : '✦'} {item.fileName?.slice(0,20)}
                    </div>
                    {selected?.id===item.id && (
                      <div style={{ position:'absolute', top:4, right:4, background:'#1D9E75', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'white' }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {allItems.length === 0 && !selected && (
            <div style={{ ...S.card, textAlign:'center' }}>
              <div style={{ padding:'50px 20px' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🖼</div>
                <div style={{ fontSize:14, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>No media yet</div>
                <div style={{ fontSize:13, color:'#7BAAA0' }}>Generate an AI image or upload your own photos and videos</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
