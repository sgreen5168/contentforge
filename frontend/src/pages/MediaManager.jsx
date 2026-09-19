import { useState, useEffect, useRef } from 'react';

const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const AMB  = '#F59E0B';
const RED  = '#EF4444';
const API  = 'https://contentforge-production-6e13.up.railway.app';

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:14, ...extra };
}

export default function MediaManager({ onClose }) {
  const [slugs, setSlugs]         = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [field, setField]         = useState('hero_image');
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    fetch(API + '/api/media/slugs')
      .then(r => r.json())
      .then(d => setSlugs(d.slugs || []))
      .catch(() => {});
  }, []);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setUploadedUrl('');
    setDone(false);
    setError('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
    // Auto-detect field from file type
    if (f.type.startsWith('video/')) setField('video_url');
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      // Convert file to base64 for JSON upload — no multer needed on server
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const r = await fetch(API + '/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileData: base64 }),
      });
      const d = await r.json();
      if (!d.url) throw new Error(d.error || 'Upload failed');
      setUploadedUrl(d.url);
    } catch(e) {
      setError(e.message);
    }
    setUploading(false);
  }

  async function assign() {
    if (!uploadedUrl || !selectedSlug) return;
    setAssigning(true);
    setError('');
    try {
      const r = await fetch(API + '/api/media/assign', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ slug: selectedSlug, url: uploadedUrl, field }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Assign failed');
      setDone(true);
    } catch(e) {
      setError(e.message);
    }
    setAssigning(false);
  }

  const isVideo = file?.type?.startsWith('video/');
  const fieldLabels = {
    hero_image: '🖼 Hero image (top of page)',
    inline_image: '📷 Inline image (inside article)',
    video_url: '🎬 Video (after first paragraph)',
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0B1829', borderRadius:16, border:`1px solid ${BORD}`, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:20 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:TXT }}>📁 Media Manager</div>
            <div style={{ fontSize:12, color:TXT3 }}>Upload from PC → assign to any landing page</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:TXT3, fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        {/* Step 1 — Upload */}
        <div style={{ ...card() }}>
          <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:12 }}>Step 1 — Choose file</div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{ border:`2px dashed ${dragOver ? GRN : BORD}`, borderRadius:10, padding:'24px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(29,158,117,.05)':'transparent', transition:'all .2s' }}>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
              isVideo
                ? <video src={preview} style={{ maxWidth:'100%', maxHeight:160, borderRadius:8 }} controls />
                : <img src={preview} style={{ maxWidth:'100%', maxHeight:160, borderRadius:8, objectFit:'cover' }} alt="preview" />
            ) : (
              <div>
                <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
                <div style={{ fontSize:13, color:TXT2 }}>Drag & drop or click to browse</div>
                <div style={{ fontSize:11, color:TXT3, marginTop:4 }}>JPG, PNG, WebP, MP4, WebM — max 100MB</div>
              </div>
            )}
          </div>

          {file && (
            <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:12, color:TXT2 }}>{file.name} ({(file.size/1024/1024).toFixed(1)}MB)</div>
              <button onClick={() => { setFile(null); setPreview(''); setUploadedUrl(''); setDone(false); }}
                style={{ background:'transparent', border:`1px solid ${BORD}`, color:TXT3, borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Step 2 — Upload to R2 */}
        {file && !uploadedUrl && (
          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:12 }}>Step 2 — Upload to CDN</div>
            <button onClick={upload} disabled={uploading}
              style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:uploading?'rgba(29,158,117,.3)':GRN, color:'#fff', fontSize:13, fontWeight:600, cursor:uploading?'default':'pointer', fontFamily:'inherit' }}>
              {uploading ? '⏳ Uploading...' : '⬆ Upload file'}
            </button>
          </div>
        )}

        {/* Step 3 — Assign to page */}
        {uploadedUrl && !done && (
          <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.2)' }) }}>
            <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:12 }}>Step 3 — Assign to page</div>

            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Select landing page</div>
            <select value={selectedSlug} onChange={e => setSelectedSlug(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', borderRadius:7, border:`1px solid ${BORD}`, background:'#0B1829', color:TXT, fontSize:12, marginBottom:12, fontFamily:'inherit' }}>
              <option value="">— pick a page —</option>
              {slugs.map(s => (
                <option key={s.slug} value={s.slug}>{s.title || s.slug} ({s.niche})</option>
              ))}
            </select>

            <div style={{ fontSize:11, color:TXT3, marginBottom:4 }}>Place as</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
              {Object.entries(fieldLabels).map(([val, label]) => (
                <label key={val} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="radio" name="field" value={val} checked={field===val} onChange={() => setField(val)} />
                  <span style={{ fontSize:12, color:TXT }}>{label}</span>
                </label>
              ))}
            </div>

            <button onClick={assign} disabled={assigning || !selectedSlug}
              style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:assigning||!selectedSlug?'rgba(29,158,117,.3)':GRN, color:'#fff', fontSize:13, fontWeight:600, cursor:assigning||!selectedSlug?'default':'pointer', fontFamily:'inherit' }}>
              {assigning ? '⏳ Saving...' : '✅ Assign to page'}
            </button>

            <div style={{ fontSize:11, color:TXT3, marginTop:8, wordBreak:'break-all' }}>
              CDN URL: <span style={{ color:GRN }}>{uploadedUrl.slice(0,60)}...</span>
            </div>
          </div>
        )}

        {/* Done */}
        {done && (
          <div style={{ ...card({ background:'rgba(29,158,117,.1)', border:'1px solid rgba(29,158,117,.3)', textAlign:'center' }) }}>
            <div style={{ fontSize:24, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:14, fontWeight:700, color:GRN, marginBottom:4 }}>Media assigned successfully</div>
            <div style={{ fontSize:12, color:TXT2, marginBottom:12 }}>
              {fieldLabels[field]} updated on <strong>{selectedSlug}</strong>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={() => { setFile(null); setPreview(''); setUploadedUrl(''); setDone(false); setSelectedSlug(''); setError(''); }}
                style={{ padding:'8px 16px', borderRadius:7, border:`1px solid ${BORD}`, background:'transparent', color:TXT2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                Upload another
              </button>
              <a href={'https://contentforge-production-6e13.up.railway.app/api/page/' + selectedSlug}
                target="_blank" rel="noreferrer"
                style={{ padding:'8px 16px', borderRadius:7, border:'none', background:GRN, color:'#fff', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                View page →
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ ...card({ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)' }) }}>
            <div style={{ fontSize:12, color:'#FC8F8F' }}>❌ {error}</div>
          </div>
        )}

      </div>
    </div>
  );
}
