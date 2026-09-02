import { useState, useRef } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';

const PLATFORMS = [
  { id:'youtube',   label:'YouTube Shorts',   icon:'▶',  color:'#EF4444', uploadUrl:'https://studio.youtube.com',          imageSize:'1280×720px thumbnail (16:9)', videoSize:'1920×1080px, MP4/MOV, up to 60 seconds for Shorts', ratio:'9:16 vertical for Shorts', tips:['Upload as Shorts by keeping under 60 seconds','Add #Shorts to title','Include affiliate link in description — allowed on YouTube','First 3 seconds must hook viewers'] },
  { id:'tiktok',    label:'TikTok',           icon:'🎵', color:'#010101', uploadUrl:'https://www.tiktok.com/upload',        imageSize:'1080×1920px (9:16 vertical)', videoSize:'1080×1920px, MP4, 15 sec–10 min, under 500MB', ratio:'9:16 vertical', tips:['Hook in first 2 seconds or viewers scroll away','Use trending sounds for more reach','Link in bio — paste NichRoute URL','Post between 6-10am or 7-9pm for best reach'] },
  { id:'instagram', label:'Instagram Reels',  icon:'📸', color:'#E1306C', uploadUrl:'https://www.instagram.com',            imageSize:'1080×1080px square or 1080×1350px portrait', videoSize:'1080×1920px Reels, MP4, 15 sec–90 sec', ratio:'9:16 for Reels, 1:1 for feed', tips:['Same MP4 as TikTok — zero extra work','Add NichRoute URL to bio','Use 5-10 relevant hashtags','Share Reel to Stories for extra reach'] },
  { id:'pinterest', label:'Pinterest',        icon:'📌', color:'#E60023', uploadUrl:'https://pinterest.com/pin-builder/',   imageSize:'1000×1500px (2:3 ratio) — ideal', videoSize:'1:1 or 9:16, MP4, 4 sec–15 min, under 2GB', ratio:'2:3 vertical for images', tips:['Use keyword-rich title and description for SEO','Destination URL should be your NichRoute landing page','Add #ad to description for FTC compliance','Pinterest traffic is evergreen — Pins get found for years'] },
  { id:'reddit',    label:'Reddit',           icon:'🔴', color:'#FF4500', uploadUrl:'https://www.reddit.com/submit',        imageSize:'1200×628px landscape recommended', videoSize:'1920×1080px max, MP4, under 15 min, under 1GB', ratio:'16:9 landscape', tips:['Never post raw affiliate links — use NichRoute URL','Write as a helpful community member not a marketer','Read subreddit rules before posting','Comment on other posts first to build credibility'] },
  { id:'facebook',  label:'Facebook',         icon:'📘', color:'#1877F2', uploadUrl:'https://www.facebook.com',            imageSize:'1200×630px landscape or 1080×1080px square', videoSize:'1280×720px min, MP4, 15 sec–240 min, under 4GB', ratio:'16:9 or 1:1', tips:['Post video then boost with $5-10 for best reach','Organic reach is 1-3% — video gets more','Add NichRoute URL in post body','Post at 9am or 7pm for maximum reach'] },
];

const SUBREDDITS = {
  'meal-prep':   ['r/MealPrepSunday','r/EatCheapAndHealthy','r/mealprep','r/HealthyFood'],
  'health':      ['r/fitness','r/loseit','r/Health','r/Wellness'],
  'baking':      ['r/Baking','r/Breadit','r/AmateurFoodPics','r/FoodPorn'],
  'side-hustle': ['r/SideHustle','r/Entrepreneur','r/passive_income','r/WorkOnline'],
  'cooking':     ['r/Cooking','r/recipes','r/MealPrepSunday','r/EatCheapAndHealthy'],
  'mindset':     ['r/getdisciplined','r/selfimprovement','r/productivity','r/DecidingToBeBetter'],
  'remote-work': ['r/WorkFromHome','r/digitalnomad','r/RemoteWork','r/freelance'],
  'finance':     ['r/personalfinance','r/Frugal','r/financialindependence','r/Budgeting'],
};

const SIZE_MAP = { youtube:{w:1280,h:720}, tiktok:{w:1080,h:1920}, instagram:{w:1080,h:1920}, pinterest:{w:1000,h:1500}, reddit:{w:1200,h:628}, facebook:{w:1200,h:630} };

export default function SocialHub({ onNavigate }) {
  const [active, setActive]           = useState('youtube');
  const [copied, setCopied]           = useState('');
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType]     = useState('');
  const [resized, setResized]         = useState(null);
  const [resizing, setResizing]       = useState(false);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [landingUrl, setLandingUrl]   = useState('');
  const [hashtags, setHashtags]       = useState('');
  const [subreddit, setSubreddit]     = useState('');
  const [category, setCategory]       = useState('side-hustle');
  const fileRef = useRef(null);

  const platform = PLATFORMS.find(function(p){ return p.id === active; }) || PLATFORMS[0];

  function copy(text, id) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  function handleFile(file) {
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type);
    setMediaPreview(URL.createObjectURL(file));
    setResized(null);
  }

  function resizeImage(targetW, targetH) {
    if (!mediaFile || !mediaType.startsWith('image/')) return;
    setResizing(true);
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
      canvas.toBlob(function(blob){ setResized(URL.createObjectURL(blob)); setResizing(false); }, 'image/jpeg', 0.92);
    };
    img.src = URL.createObjectURL(mediaFile);
  }

  function inp(extra) {
    return { width:'100%', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:8, padding:'9px 12px', fontSize:12, color:TXT, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra };
  }

  function card(extra) {
    return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, ...extra };
  }

  const sz = SIZE_MAP[active];

  return (
    <div style={{ minHeight:'100vh', background:BG, color:TXT, fontFamily:'system-ui,sans-serif', padding:'24px 20px' }}>
      <div style={{ maxWidth:820, margin:'0 auto' }}>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>📱 Social Media Hub</div>
          <div style={{ fontSize:12, color:TXT3 }}>Upload media, get size guides, copy captions — all platforms in one place</div>
        </div>

        {/* Workflow Guide */}
        <div style={{ ...card(), marginBottom:16, border:'1px solid rgba(29,158,117,.25)', background:'rgba(29,158,117,.04)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:10 }}>📋 How to use this hub — where to get each piece of information</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { field:'📝 Title', source:'Copy a trending title from 📊 Strategy Hub → 🔥 Trending Topics, or use the title generated in 🚀 Command Center' },
              { field:'📄 Description / Caption', source:'Copy from 📘 Facebook Studio → ✨ Generate All Captions — each platform tab has the right caption already written' },
              { field:'🔗 NichRoute URL', source:'Copy from 🚀 Command Center → Step 3 → Copy Landing Page URL. This is the link that goes everywhere' },
              { field:'🏷️ Hashtags', source:'Copy from 📘 Facebook Studio captions — each platform tab includes the right hashtags for that audience' },
              { field:'🎬 Photo or Video', source:'Download your MP4 from 🚀 Command Center → click Download MP4. Same file uploads to all platforms' },
              { field:'📐 Image resize', source:'Upload any photo here → click the Resize button to get the exact right size for that platform automatically' },
            ].map(function(item, i){
              return (
                <div key={i} style={{ padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${BORD}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:GRN, marginBottom:3 }}>{item.field}</div>
                  <div style={{ fontSize:10, color:TXT3, lineHeight:1.5 }}>{item.source}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(79,163,255,.06)', borderRadius:8, border:'1px solid rgba(79,163,255,.15)', fontSize:11, color:'rgba(79,163,255,.9)', lineHeight:1.6 }}>
            <strong>Recommended workflow:</strong> Generate content in Command Center → open Facebook Studio → click ✨ Generate All Captions → come here → pick your platform → paste the caption → paste the NichRoute URL → upload your MP4 → click Open Platform → post.
          </div>
        </div>

        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
          {PLATFORMS.map(function(p){
            return (
              <button key={p.id} onClick={function(){ setActive(p.id); }}
                style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${active===p.id?p.color+'80':BORD}`, background:active===p.id?p.color+'22':'transparent', color:active===p.id?p.color:TXT3, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {p.icon} {p.label}
              </button>
            );
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* Left — Media + Size guide */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            <div style={{ ...card(), border:`1px solid ${platform.color}33` }}>
              <div style={{ fontSize:12, fontWeight:700, color:platform.color, marginBottom:10 }}>{platform.icon} {platform.label} — Size Guide</div>
              <div style={{ fontSize:11, color:TXT2, lineHeight:1.8 }}>
                <div>🖼 <strong>Image:</strong> {platform.imageSize}</div>
                <div>🎬 <strong>Video:</strong> {platform.videoSize}</div>
                <div>📐 <strong>Ratio:</strong> {platform.ratio}</div>
              </div>
              {mediaType.startsWith('image/') && sz && (
                <button onClick={function(){ resizeImage(sz.w, sz.h); }} disabled={resizing}
                  style={{ marginTop:10, width:'100%', padding:'7px', borderRadius:7, border:'none', background:resizing?'rgba(29,158,117,.3)':GRN, color:'white', fontSize:11, fontWeight:700, cursor:resizing?'default':'pointer', fontFamily:'inherit' }}>
                  {resizing ? '⏳ Resizing…' : ('📐 Resize to '+sz.w+'×'+sz.h+'px')}
                </button>
              )}
              {resized && (
                <a href={resized} download={active+'-optimized.jpg'}
                  style={{ display:'block', marginTop:8, padding:'7px', borderRadius:7, border:`1px solid ${GRN}`, background:'transparent', color:GRN, fontSize:11, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                  ⬇ Download Resized Image
                </a>
              )}
            </div>

            <div style={{ ...card() }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>📁 Upload Photo or Video</div>
              {mediaPreview ? (
                <div>
                  {mediaType.startsWith('video') ? (
                    <video src={resized||mediaPreview} controls style={{ width:'100%', maxHeight:160, borderRadius:8, background:'#000' }} />
                  ) : (
                    <img src={resized||mediaPreview} alt="Preview" style={{ width:'100%', maxHeight:160, borderRadius:8, objectFit:'cover' }} />
                  )}
                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                    <button onClick={function(){ fileRef.current && fileRef.current.click(); }}
                      style={{ flex:1, padding:'6px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      🔄 Replace
                    </button>
                    <button onClick={function(){ setMediaFile(null); setMediaPreview(null); setResized(null); setMediaType(''); }}
                      style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(226,75,74,.3)', background:'transparent', color:'#F09595', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'24px 16px', background:'rgba(255,255,255,.02)', border:`2px dashed ${BORD}`, borderRadius:10, cursor:'pointer' }}>
                  <span style={{ fontSize:32 }}>📁</span>
                  <div style={{ fontSize:11, color:TXT2, textAlign:'center' }}>
                    <div style={{ fontWeight:600, marginBottom:3 }}>Drop or click to upload</div>
                    <div style={{ color:TXT3, fontSize:10 }}>JPG, PNG, GIF, MP4, MOV</div>
                  </div>
                  <input type="file" accept="image/*,video/*" style={{ display:'none' }}
                    onChange={function(e){ handleFile(e.target.files[0]); }} />
                </label>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }}
                onChange={function(e){ handleFile(e.target.files[0]); }} />
            </div>

            <div style={{ ...card() }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>💡 {platform.label} Tips</div>
              {platform.tips.map(function(tip, i){
                return (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <span style={{ color:platform.color, flexShrink:0 }}>→</span>
                    <div style={{ fontSize:11, color:TXT2, lineHeight:1.5 }}>{tip}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — Content fields */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            <div style={{ ...card() }}>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>📝 Title</div>
              <input value={title} onChange={function(e){ setTitle(e.target.value); }}
                placeholder={active==='reddit' ? 'Helpful Reddit post title — no promotional language' : 'Your video or post title'}
                style={inp()} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontSize:9, color:TXT3 }}>{title.length} chars</span>
                <button onClick={function(){ copy(title,'title'); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                  {copied==='title'?'✓':'📋 Copy'}
                </button>
              </div>
            </div>

            <div style={{ ...card() }}>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>📄 Description / Caption</div>
              <textarea value={description} onChange={function(e){ setDescription(e.target.value); }}
                placeholder={active==='reddit' ? 'Write as a helpful community member. No promotional language. End with a question.' : 'Your post caption or video description'}
                rows={5} style={{ ...inp(), resize:'vertical', lineHeight:1.6 }} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontSize:9, color:TXT3 }}>{description.length} chars</span>
                <button onClick={function(){ copy(description,'desc'); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                  {copied==='desc'?'✓':'📋 Copy'}
                </button>
              </div>
            </div>

            <div style={{ ...card() }}>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>🔗 NichRoute Landing Page URL</div>
              <input value={landingUrl} onChange={function(e){ setLandingUrl(e.target.value); }}
                placeholder="https://nichroute.com/content.html?slug=..."
                style={inp()} />
              <button onClick={function(){ copy(landingUrl,'url'); }} style={{ marginTop:6, width:'100%', padding:'6px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                {copied==='url'?'✓ Copied!':'📋 Copy URL'}
              </button>
            </div>

            {active !== 'reddit' && (
              <div style={{ ...card() }}>
                <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>🏷️ Hashtags</div>
                <input value={hashtags} onChange={function(e){ setHashtags(e.target.value); }}
                  placeholder="#homebusiness #sidehustle #contentcreator"
                  style={inp()} />
                <button onClick={function(){ copy(hashtags,'hash'); }} style={{ marginTop:6, width:'100%', padding:'6px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                  {copied==='hash'?'✓ Copied!':'📋 Copy Hashtags'}
                </button>
              </div>
            )}

            {active === 'reddit' && (
              <div style={{ ...card() }}>
                <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>🔴 Choose Subreddit</div>
                <select value={category} onChange={function(e){ setCategory(e.target.value); }}
                  style={{ ...inp({ marginBottom:8 }) }}>
                  {Object.keys(SUBREDDITS).map(function(cat){
                    return <option key={cat} value={cat} style={{ background:'#0B1829' }}>{cat}</option>;
                  })}
                </select>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(SUBREDDITS[category]||[]).map(function(sub, i){
                    return (
                      <button key={i} onClick={function(){ setSubreddit(sub); copy(sub,'sub'+i); }}
                        style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${subreddit===sub?'#FF4500':BORD}`, background:subreddit===sub?'rgba(255,69,0,.1)':'transparent', color:subreddit===sub?'#FF4500':TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied==='sub'+i?'✓ Copied!':sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <a href={platform.uploadUrl} target="_blank" rel="noreferrer"
              style={{ display:'block', padding:'13px', borderRadius:10, border:'none', background:platform.color, color:'white', fontSize:13, fontWeight:800, textDecoration:'none', textAlign:'center' }}>
              {platform.icon} Open {platform.label} — Upload Now
            </a>

            <button
              onClick={function(){ copy([title, description, landingUrl, hashtags].filter(Boolean).join('\n\n'), 'all'); }}
              style={{ padding:'10px', borderRadius:9, border:`1px solid ${BORD}`, background:'transparent', color:TXT2, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              {copied==='all'?'✓ All Copied!':'📋 Copy Everything at Once'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
