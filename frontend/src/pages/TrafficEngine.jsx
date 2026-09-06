import { useState, useEffect, useRef } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const API  = (typeof window !== 'undefined' && window.__CF_API__) || 'https://contentforge-production-6e13.up.railway.app';

const TABS = [
  { id:'daily',     label:'📅 Daily Plan',         icon:'📅' },
  { id:'dashboard', label:'📊 Traffic Dashboard',  icon:'📊' },
  { id:'reddit',    label:'🔴 Reddit Finder',      icon:'🔴' },
  { id:'multiply',  label:'✨ Content Multiplier',  icon:'✨' },
  { id:'pinterest', label:'📌 Pinterest Queue',     icon:'📌' },
  { id:'youtube',   label:'▶ YouTube Optimizer',   icon:'▶'  },
];

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, ...extra };
}
function inp(extra) {
  return { width:'100%', background:'rgba(22,61,106,.4)', border:`1px solid ${BORD}`, borderRadius:8, padding:'9px 12px', fontSize:12, color:TXT, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra };
}

// ── Traffic Dashboard ─────────────────────────────────────────────────────────
function TrafficDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const r = await fetch(API + '/api/traffic/dashboard');
      const d = await r.json();
      setData(d);
    } catch(e) { console.warn(e); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:TXT3 }}>⏳ Loading traffic data...</div>;
  if (!data) return <div style={{ padding:40, textAlign:'center', color:TXT3 }}>No data yet — generate some content first</div>;

  return (
    <div>
      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Pages', value:data.summary?.totalPages||0, icon:'📄' },
          { label:'Total Clicks', value:data.summary?.totalClicks||0, icon:'👆' },
          { label:'Affiliate Clicks', value:data.summary?.totalAffiliate||0, icon:'🔗' },
          { label:'Top Page', value:(data.summary?.topPage||'None').slice(0,20), icon:'🏆' },
        ].map(function(k,i){
          return (
            <div key={i} style={{ ...card(), textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{k.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:TXT }}>{k.value}</div>
              <div style={{ fontSize:11, color:TXT3 }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Pages table */}
      <div style={{ ...card() }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>📄 Your NichRoute Pages</div>
          <button onClick={loadData} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
            🔄 Refresh
          </button>
        </div>
        {(data.pages||[]).map(function(p,i){
          return (
            <div key={i} style={{ padding:'10px 0', borderBottom:`1px solid ${BORD}`, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:TXT, marginBottom:2 }}>{p.title}</div>
                <div style={{ fontSize:10, color:TXT3 }}>{p.niche} · {new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ display:'flex', gap:12, flexShrink:0 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:p.clicks>0?GRN:TXT3 }}>{p.clicks}</div>
                  <div style={{ fontSize:9, color:TXT3 }}>clicks</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:p.affiliateClicks>0?'#F59E0B':TXT3 }}>{p.affiliateClicks}</div>
                  <div style={{ fontSize:9, color:TXT3 }}>affiliate</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:p.recentClicks>0?'#818CF8':TXT3 }}>{p.recentClicks}</div>
                  <div style={{ fontSize:9, color:TXT3 }}>7 days</div>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer"
                  style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, textDecoration:'none' }}>
                  ↗
                </a>
              </div>
            </div>
          );
        })}
        {(!data.pages||data.pages.length===0) && (
          <div style={{ textAlign:'center', padding:20, color:TXT3, fontSize:12 }}>No pages yet — generate content in Command Center</div>
        )}
      </div>
    </div>
  );
}

// ── Reddit Community Finder ───────────────────────────────────────────────────
function RedditFinder() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('side-hustle');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState('');

  async function search() {
    if (!topic.trim()) return;
    setLoading(true); setResults(null);
    try {
      const r = await fetch(API + '/api/reddit/find?topic=' + encodeURIComponent(topic) + '&category=' + category);
      const d = await r.json();
      setResults(d);
    } catch(e) { console.warn(e); }
    setLoading(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  const CATS = ['cooking','health','meal-prep','side-hustle','mindset','remote-work','finance','baking','home-income'];

  return (
    <div>
      <div style={{ ...card(), marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>🔍 Find Reddit communities talking about your topic</div>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <input value={topic} onChange={function(e){ setTopic(e.target.value); }}
            onKeyDown={function(e){ if(e.key==='Enter') search(); }}
            placeholder="Enter your topic — e.g. air fryer meals, morning routine, portable blender"
            style={{ ...inp(), flex:1 }} />
          <select value={category} onChange={function(e){ setCategory(e.target.value); }}
            style={{ ...inp({ width:'auto', minWidth:120 }) }}>
            {CATS.map(function(c){ return <option key={c} value={c} style={{ background:'#0B1829' }}>{c}</option>; })}
          </select>
          <button onClick={search} disabled={loading}
            style={{ padding:'9px 18px', borderRadius:8, border:'none', background:loading?'rgba(29,158,117,.3)':GRN, color:'white', fontSize:12, fontWeight:700, cursor:loading?'default':'pointer', fontFamily:'inherit', flexShrink:0 }}>
            {loading?'⏳ Searching...':'🔍 Find Posts'}
          </button>
        </div>
      </div>

      {results && (
        <div>
          {/* Reply suggestion */}
          {results.replySuggestion && (
            <div style={{ ...card({ marginBottom:12, border:'1px solid rgba(255,69,0,.2)', background:'rgba(255,69,0,.04)' }) }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#FF4500' }}>💬 AI-Generated Reply — paste this in relevant posts</div>
                <button onClick={function(){ copy(results.replySuggestion,'reply'); }}
                  style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,69,0,.3)', background:'transparent', color:'#FF4500', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                  {copied==='reply'?'✓ Copied!':'📋 Copy Reply'}
                </button>
              </div>
              <div style={{ fontSize:12, color:TXT2, lineHeight:1.7, padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8 }}>
                {results.replySuggestion}
              </div>
            </div>
          )}

          {/* Subreddits */}
          <div style={{ ...card({ marginBottom:12 }) }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>📌 Best subreddits for this topic</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {(results.subreddits||[]).map(function(sub,i){
                return (
                  <a key={i} href={'https://reddit.com/r/'+sub} target="_blank" rel="noreferrer"
                    style={{ padding:'5px 12px', borderRadius:6, border:'1px solid rgba(255,69,0,.3)', background:'rgba(255,69,0,.06)', color:'#FF4500', fontSize:11, textDecoration:'none' }}>
                    r/{sub}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Hot posts */}
          {results.posts && results.posts.length > 0 && (
            <div style={{ ...card() }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>🔥 Hot posts — engage with these to drive traffic</div>
              {results.posts.map(function(post,i){
                return (
                  <div key={i} style={{ padding:'10px 0', borderBottom:`1px solid ${BORD}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:'#FF4500', marginBottom:2 }}>{post.subreddit}</div>
                        <div style={{ fontSize:12, color:TXT, marginBottom:4, lineHeight:1.4 }}>{post.title}</div>
                        <div style={{ fontSize:10, color:TXT3 }}>⬆ {post.upvotes} · 💬 {post.comments} comments</div>
                      </div>
                      <a href={post.url} target="_blank" rel="noreferrer"
                        style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,69,0,.3)', background:'transparent', color:'#FF4500', fontSize:10, textDecoration:'none', flexShrink:0 }}>
                        View →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Content Multiplier ────────────────────────────────────────────────────────
function ContentMultiplier() {
  const [post, setPost] = useState('');
  const [topic, setTopic] = useState('');
  const [landingUrl, setLandingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState('');
  const [activeTab, setActiveTab] = useState('youtube');

  // Load from Command Center session
  useEffect(function() {
    try {
      const saved = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const savedTopic = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      if (saved?.post) setPost(saved.post);
      if (saved?.landingUrl) setLandingUrl(saved.landingUrl);
      if (savedTopic?.label) setTopic(savedTopic.label);
    } catch(e) {}
  }, []);

  async function multiply() {
    if (!post.trim() && !topic.trim()) return;
    setLoading(true); setResults(null);
    try {
      const r = await fetch(API + '/api/content/multiply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post, topic, landingUrl }),
      });
      const d = await r.json();
      setResults(d);
    } catch(e) { console.warn(e); }
    setLoading(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  const PLATFORMS = [
    { id:'youtube',   label:'▶ YouTube',   color:'#EF4444' },
    { id:'tiktok',    label:'🎵 TikTok',   color:'#010101' },
    { id:'instagram', label:'📸 Instagram',color:'#E1306C' },
    { id:'pinterest', label:'📌 Pinterest',color:'#E60023' },
    { id:'reddit',    label:'🔴 Reddit',   color:'#FF4500' },
    { id:'email',     label:'✉️ Email',    color:'#6366F1' },
  ];

  return (
    <div>
      <div style={{ ...card({ marginBottom:12 }) }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>✨ Content Multiplier</div>
        <div style={{ fontSize:11, color:TXT3, marginBottom:10 }}>Paste your generated post or load from Command Center — get 6 platform-optimized versions instantly</div>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <input value={topic} onChange={function(e){ setTopic(e.target.value); }}
            placeholder="Topic / title"
            style={{ ...inp({ flex:'0 0 200px' }) }} />
          <input value={landingUrl} onChange={function(e){ setLandingUrl(e.target.value); }}
            placeholder="NichRoute landing page URL"
            style={{ ...inp() }} />
        </div>
        <textarea value={post} onChange={function(e){ setPost(e.target.value); }}
          placeholder="Paste your Facebook post here — or it auto-loads from your last Command Center session"
          rows={4} style={{ ...inp({ resize:'vertical', marginBottom:8, lineHeight:1.6 }) }} />
        <button onClick={multiply} disabled={loading}
          style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:loading?'rgba(99,102,241,.3)':'#6366F1', color:'white', fontSize:12, fontWeight:700, cursor:loading?'default':'pointer', fontFamily:'inherit' }}>
          {loading?'⏳ Creating 6 platform versions...':'✨ Multiply to All Platforms'}
        </button>
      </div>

      {results && (
        <div style={{ ...card() }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {PLATFORMS.map(function(p){
              return (
                <button key={p.id} onClick={function(){ setActiveTab(p.id); }}
                  style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${activeTab===p.id?p.color+'80':BORD}`, background:activeTab===p.id?p.color+'22':'transparent', color:activeTab===p.id?p.color:TXT3, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {p.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'youtube' && results.youtube && (
            <div>
              {[
                { label:'Title', value:results.youtube.title, id:'yt_title' },
                { label:'Description', value:results.youtube.description, id:'yt_desc' },
                { label:'Tags', value:results.youtube.tags, id:'yt_tags' },
              ].map(function(f){
                return (
                  <div key={f.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#EF4444' }}>{f.label}</div>
                      <button onClick={function(){ copy(f.value,f.id); }}
                        style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied===f.id?'✓':'📋 Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6, maxHeight:100, overflowY:'auto' }}>{f.value}</div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'tiktok' && results.tiktok && (
            <div>
              <div style={{ marginBottom:8, padding:'8px 10px', background:'rgba(1,1,1,.3)', borderRadius:8, fontSize:13, fontWeight:700, color:TXT }}>🎣 Hook: {results.tiktok.hook}</div>
              <button onClick={function(){ copy(results.tiktok.caption,'tt'); }} style={{ width:'100%', padding:'7px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit', marginBottom:8 }}>
                {copied==='tt'?'✓ Copied!':'📋 Copy TikTok Caption'}
              </button>
              <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6 }}>{results.tiktok.caption}</div>
            </div>
          )}

          {activeTab === 'instagram' && results.instagram && (
            <div>
              <button onClick={function(){ copy(results.instagram.caption,'ig'); }} style={{ width:'100%', padding:'7px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit', marginBottom:8 }}>
                {copied==='ig'?'✓ Copied!':'📋 Copy Instagram Caption'}
              </button>
              <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6 }}>{results.instagram.caption}</div>
            </div>
          )}

          {activeTab === 'pinterest' && results.pinterest && (
            <div>
              {[
                { label:'Pin Title', value:results.pinterest.title, id:'pin_t' },
                { label:'Pin Description', value:results.pinterest.description, id:'pin_d' },
              ].map(function(f){
                return (
                  <div key={f.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#E60023' }}>{f.label}</div>
                      <button onClick={function(){ copy(f.value,f.id); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied===f.id?'✓':'📋 Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6 }}>{f.value}</div>
                  </div>
                );
              })}
              <a href="https://pinterest.com/pin-builder/" target="_blank" rel="noreferrer"
                style={{ display:'block', padding:'8px', borderRadius:7, border:'none', background:'#E60023', color:'white', fontSize:11, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                📌 Open Pinterest — Create Pin
              </a>
            </div>
          )}

          {activeTab === 'reddit' && results.reddit && (
            <div>
              {[
                { label:'Post Title', value:results.reddit.title, id:'rd_t' },
                { label:'Post Body', value:results.reddit.body, id:'rd_b' },
              ].map(function(f){
                return (
                  <div key={f.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#FF4500' }}>{f.label}</div>
                      <button onClick={function(){ copy(f.value,f.id); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied===f.id?'✓':'📋 Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6 }}>{f.value}</div>
                  </div>
                );
              })}
              <a href="https://www.reddit.com/submit" target="_blank" rel="noreferrer"
                style={{ display:'block', padding:'8px', borderRadius:7, border:'none', background:'#FF4500', color:'white', fontSize:11, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                🔴 Open Reddit — Submit Post
              </a>
            </div>
          )}

          {activeTab === 'email' && results.email && (
            <div>
              {[
                { label:'Subject Line', value:results.email.subject, id:'em_s' },
                { label:'Preview Text', value:results.email.preview, id:'em_p' },
                { label:'Email Body', value:results.email.body, id:'em_b' },
              ].map(function(f){
                return (
                  <div key={f.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#6366F1' }}>{f.label}</div>
                      <button onClick={function(){ copy(f.value,f.id); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                        {copied===f.id?'✓':'📋 Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:TXT2, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:6, lineHeight:1.6 }}>{f.value}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pinterest Queue ───────────────────────────────────────────────────────────
function PinterestQueue() {
  const [queue, setQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_pin_queue') || '[]'); } catch { return []; }
  });
  const [copied, setCopied] = useState('');

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  function loadFromSession() {
    try {
      const saved = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const savedTopic = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      if (!saved) { alert('Generate content in Command Center first'); return; }
      const newPin = {
        id: Date.now(),
        title: saved.youtubeTitle || savedTopic?.label || 'Pin',
        description: (saved.post||'').slice(0,300) + '\n\nFull details at the link below 🔗 #ad',
        url: saved.landingUrl || '',
        hashtags: '#' + (savedTopic?.id||'content').replace(/-/g,'') + ' #homebusiness #sidehustle #contentcreator',
        scheduledFor: new Date(Date.now() + queue.length * 86400000).toLocaleDateString(),
        status: 'queued',
      };
      const newQueue = [...queue, newPin];
      setQueue(newQueue);
      localStorage.setItem('cf_pin_queue', JSON.stringify(newQueue));
    } catch(e) { console.warn(e); }
  }

  function removePin(id) {
    const newQueue = queue.filter(function(p){ return p.id !== id; });
    setQueue(newQueue);
    localStorage.setItem('cf_pin_queue', JSON.stringify(newQueue));
  }

  return (
    <div>
      <div style={{ ...card({ marginBottom:12 }) }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>📌 Pinterest Pin Queue</div>
        <div style={{ fontSize:11, color:TXT3, marginBottom:10 }}>Queue up to 7 days of pins at once — each day's pin auto-fills from your generated content</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={loadFromSession}
            style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#E60023', color:'white', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            📌 Add Current Session to Queue
          </button>
          <a href="https://pinterest.com/pin-builder/" target="_blank" rel="noreferrer"
            style={{ padding:'9px 16px', borderRadius:8, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:11, textDecoration:'none' }}>
            Open Pinterest →
          </a>
        </div>
      </div>

      {queue.length === 0 ? (
        <div style={{ ...card(), textAlign:'center', padding:30, color:TXT3 }}>
          No pins queued yet. Generate content in Command Center then click Add to Queue.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {queue.map(function(pin, i){
            return (
              <div key={pin.id} style={{ ...card(), display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#E60023', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>📌</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:TXT }}>{pin.title}</div>
                    <div style={{ fontSize:10, color:TXT3 }}>Day {i+1} · {pin.scheduledFor}</div>
                  </div>
                  <div style={{ fontSize:10, color:TXT3, marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pin.description}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={function(){ copy([pin.title, pin.description, pin.url, pin.hashtags].join('\n\n'), 'pin_'+pin.id); }}
                      style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                      {copied==='pin_'+pin.id?'✓ Copied!':'📋 Copy All Fields'}
                    </button>
                    <button onClick={function(){ copy(pin.url, 'pinurl_'+pin.id); }}
                      style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                      {copied==='pinurl_'+pin.id?'✓':'📋 Copy URL'}
                    </button>
                    <button onClick={function(){ removePin(pin.id); }}
                      style={{ padding:'4px 8px', borderRadius:5, border:'1px solid rgba(226,75,74,.3)', background:'transparent', color:'#F09595', fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── YouTube Optimizer ─────────────────────────────────────────────────────────
function YouTubeOptimizer() {
  const [ytTitle, setYtTitle] = useState('');
  const [ytDesc, setYtDesc] = useState('');
  const [ytTags, setYtTags] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(function() {
    try {
      const saved = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      if (saved?.youtubeTitle) setYtTitle(saved.youtubeTitle);
      if (saved?.youtubeDescription) setYtDesc(saved.youtubeDescription);
      if (saved?.youtubeTags) setYtTags(saved.youtubeTags);
    } catch(e) {}
  }, []);

  function copy(text, id) {
    navigator.clipboard.writeText(text).catch(function(){});
    setCopied(id);
    setTimeout(function(){ setCopied(''); }, 2000);
  }

  const BEST_TIMES = ['6:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '7:00 PM', '9:00 PM'];
  const SHORTS_TIPS = [
    'Keep under 60 seconds for Shorts monetization',
    'Add #Shorts to title for Shorts feed placement',
    'Hook in first 3 seconds or viewers scroll away',
    'Vertical 9:16 format required for Shorts',
    'Affiliate link goes in description — allowed on YouTube',
    'Add chapters if video is over 3 minutes',
    'End screen at 55-58 seconds drives subscriptions',
    'Post consistently — YouTube rewards daily uploads',
  ];

  return (
    <div>
      <div style={{ ...card({ marginBottom:12 }) }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>▶ YouTube Optimizer</div>
        <div style={{ fontSize:11, color:TXT3, marginBottom:10 }}>Auto-loaded from your last Command Center session — edit and copy each field for YouTube Studio</div>

        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#EF4444' }}>Video Title</div>
            <button onClick={function(){ copy(ytTitle,'yt_t'); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
              {copied==='yt_t'?'✓ Copied!':'📋 Copy'}
            </button>
          </div>
          <input value={ytTitle} onChange={function(e){ setYtTitle(e.target.value); }}
            placeholder="SEO-optimized video title with buyer keyword" style={inp()} />
        </div>

        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#EF4444' }}>Description</div>
            <button onClick={function(){ copy(ytDesc,'yt_d'); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
              {copied==='yt_d'?'✓ Copied!':'📋 Copy'}
            </button>
          </div>
          <textarea value={ytDesc} onChange={function(e){ setYtDesc(e.target.value); }}
            rows={6} placeholder="Full video description with affiliate link and hashtags"
            style={{ ...inp({ resize:'vertical', lineHeight:1.6 }) }} />
        </div>

        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#EF4444' }}>Tags</div>
            <button onClick={function(){ copy(ytTags,'yt_tg'); }} style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
              {copied==='yt_tg'?'✓ Copied!':'📋 Copy'}
            </button>
          </div>
          <input value={ytTags} onChange={function(e){ setYtTags(e.target.value); }}
            placeholder="comma, separated, tags" style={inp()} />
        </div>

        <a href="https://studio.youtube.com" target="_blank" rel="noreferrer"
          style={{ display:'block', padding:'10px', borderRadius:8, border:'none', background:'#EF4444', color:'white', fontSize:12, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
          ▶ Open YouTube Studio — Upload Now
        </a>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ ...card() }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>⏰ Best posting times</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {BEST_TIMES.map(function(t,i){
              return <span key={i} style={{ padding:'4px 10px', borderRadius:6, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', fontSize:11, color:'#FC8F8F' }}>{t}</span>;
            })}
          </div>
        </div>
        <div style={{ ...card() }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>💡 YouTube Shorts tips</div>
          {SHORTS_TIPS.slice(0,4).map(function(tip,i){
            return <div key={i} style={{ fontSize:10, color:TXT2, marginBottom:4, display:'flex', gap:6 }}><span style={{ color:'#EF4444' }}>→</span>{tip}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ── Daily Action Plan ────────────────────────────────────────────────────────
function DailyPlan() {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_daily_checked') || '{}'); } catch { return {}; }
  });

  const today = new Date().toDateString();

  function toggle(id) {
    const key = today + '_' + id;
    const newChecked = { ...checked, [key]: !checked[key] };
    setChecked(newChecked);
    localStorage.setItem('cf_daily_checked', JSON.stringify(newChecked));
  }

  function isChecked(id) { return !!checked[today + '_' + id]; }

  const DAILY_TASKS = [
    {
      time: '⏱ 2 min', platform: '🚀 Command Center', color: GRN, id: 'cmd',
      task: 'Generate new content topic',
      steps: ['Open Command Center → pick a trending topic from the Buyer Trends search','Click ⚡ Generate Everything → wait 60 seconds','Copy the Facebook post + landing URL'],
      why: 'Creates your NichRoute page and affiliate-matched content for the day',
    },
    {
      time: '⏱ 5 min', platform: '🎬 HeyGen + YouTube', color: '#EF4444', id: 'yt',
      task: 'Post one YouTube Short',
      steps: ['Copy script from Command Center → click 🎬 Use in HeyGen','Paste title and script into HeyGen → select Abigail → generate (2-3 min)','Download MP4 → open YouTube Studio → upload → paste title, description, tags → publish as Short'],
      why: 'YouTube Shorts builds toward monetization (1000 subscribers + 4000 watch hours)',
    },
    {
      time: '⏱ 2 min', platform: '📌 Pinterest', color: '#E60023', id: 'pin',
      task: 'Pin one video or image',
      steps: ['Click 📌 Pinterest Queue tab → Add Current Session to Queue','Copy all fields → open Pinterest → Create Pin → paste title, description, URL','Upload your thumbnail or MP4 → publish'],
      why: 'Pinterest traffic is evergreen — pins get discovered for months after posting',
    },
    {
      time: '⏱ 3 min', platform: '🔍 Google Search Console', color: '#4285F4', id: 'gsc',
      task: 'Submit new page to Google',
      steps: ['In Command Center Step 3 → click 🔍 Submit to Google & Bing','Open Google Search Console → URL Inspection → paste landing page URL','Click Request Indexing'],
      why: 'Gets your new content indexed by Google same day instead of waiting a week',
    },
    {
      time: '⏱ 1 min', platform: '📘 Facebook', color: '#1877F2', id: 'fb',
      task: 'Post to Facebook page',
      steps: ['Copy post from Command Center Step 1','Paste into your Facebook page → publish','Post at 9am or 7pm for maximum reach'],
      why: 'Even at 1-3% organic reach, consistent posting builds your page audience over time',
    },
  ];

  const WEEKLY_TASKS = [
    { id:'w1', day:'Mon/Thu', task:'Post in 2 Reddit communities', time:'5 min each', detail:'Reddit Finder tab → search your topic → engage with hot posts → share your reply with NichRoute link' },
    { id:'w2', day:'Any 3 days', task:'Generate 3 new NichRoute pages', time:'2 min each', detail:'Command Center → different topic each time → builds your SEO content library' },
    { id:'w3', day:'Weekly', task:'Check Traffic Dashboard', time:'2 min', detail:'See which pages are getting clicks → double down on what works → drop what does not' },
    { id:'w4', day:'Weekly', task:'Add affiliate products from JVZoo/WarriorPlus', time:'5 min', detail:'Find products with 50%+ commission → add to Affiliate Library → they auto-match to content' },
  ];

  const completedToday = DAILY_TASKS.filter(function(t){ return isChecked(t.id); }).length;
  const totalMinutes = completedToday * 3;

  return (
    <div>
      {/* Progress */}
      <div style={{ ...card({ marginBottom:16, background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)' }) }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:GRN }}>📅 Today's Action Plan — {today}</div>
          <div style={{ fontSize:12, color:GRN, fontWeight:700 }}>{completedToday}/{DAILY_TASKS.length} done · ~{13-totalMinutes} min remaining</div>
        </div>
        <div style={{ height:8, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:(completedToday/DAILY_TASKS.length*100)+'%', background:GRN, borderRadius:4, transition:'width .3s' }} />
        </div>
        <div style={{ fontSize:11, color:TXT3, marginTop:6 }}>
          Complete all 5 tasks daily for 30 days → 10x traffic potential
        </div>
      </div>

      {/* Daily tasks */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
        {DAILY_TASKS.map(function(t){
          const done = isChecked(t.id);
          return (
            <div key={t.id} style={{ ...card({ opacity:done?0.7:1, border:`1px solid ${done?'rgba(29,158,117,.3)':BORD}` }) }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <button onClick={function(){ toggle(t.id); }}
                  style={{ width:24, height:24, borderRadius:6, border:`2px solid ${done?GRN:BORD}`, background:done?GRN:'transparent', color:'white', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  {done?'✓':''}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:t.color }}>{t.platform}</span>
                    <span style={{ fontSize:10, color:TXT3 }}>{t.time}</span>
                    {done && <span style={{ fontSize:10, color:GRN }}>✅ Done</span>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:done?TXT3:TXT, marginBottom:6, textDecoration:done?'line-through':'none' }}>{t.task}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:6 }}>
                    {t.steps.map(function(step, i){
                      return (
                        <div key={i} style={{ display:'flex', gap:6, fontSize:11, color:TXT2 }}>
                          <span style={{ color:t.color, flexShrink:0 }}>{i+1}.</span>
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:TXT3, fontStyle:'italic' }}>💡 {t.why}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly tasks */}
      <div style={{ ...card() }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>📆 Weekly Tasks</div>
        {WEEKLY_TASKS.map(function(t){
          const done = isChecked(t.id);
          return (
            <div key={t.id} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:`1px solid ${BORD}`, alignItems:'flex-start' }}>
              <button onClick={function(){ toggle(t.id); }}
                style={{ width:20, height:20, borderRadius:4, border:`2px solid ${done?GRN:BORD}`, background:done?GRN:'transparent', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                {done?'✓':''}
              </button>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:done?TXT3:TXT, textDecoration:done?'line-through':'none' }}>{t.task}</div>
                  <span style={{ fontSize:10, color:TXT3 }}>{t.day} · {t.time}</span>
                </div>
                <div style={{ fontSize:11, color:TXT3 }}>{t.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 30-day projection */}
      <div style={{ ...card({ marginTop:12, background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.2)' }) }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#818CF8', marginBottom:10 }}>📈 30-Day Traffic Projection</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { label:'YouTube Shorts posted', value:'30', sub:'builds toward monetization' },
            { label:'Pinterest pins created', value:'30', sub:'evergreen traffic for months' },
            { label:'Reddit posts/replies', value:'8-10', sub:'community traffic' },
            { label:'NichRoute pages', value:'12+', sub:'indexed by Google & Bing' },
            { label:'Affiliate links exposed', value:'1,000+', sub:'potential click opportunities' },
            { label:'Daily time investment', value:'13 min', sub:'per day total' },
          ].map(function(s,i){
            return (
              <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${BORD}` }}>
                <div style={{ fontSize:20, fontWeight:700, color:'#818CF8' }}>{s.value}</div>
                <div style={{ fontSize:11, color:TXT2, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:10, color:TXT3 }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrafficEngine({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div style={{ minHeight:'100vh', background:BG, color:TXT, fontFamily:'system-ui,sans-serif', padding:'24px 20px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>🚀 Traffic Engine</div>
          <div style={{ fontSize:12, color:TXT3 }}>Drive real traffic to your affiliate content across every platform</div>
        </div>

        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
          {TABS.map(function(t){
            return (
              <button key={t.id} onClick={function(){ setActiveTab(t.id); }}
                style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${activeTab===t.id?'rgba(29,158,117,.5)':BORD}`, background:activeTab===t.id?'rgba(29,158,117,.15)':'transparent', color:activeTab===t.id?GRN:TXT3, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'daily'     && <DailyPlan />}
        {activeTab === 'dashboard' && <TrafficDashboard />}
        {activeTab === 'reddit'    && <RedditFinder />}
        {activeTab === 'multiply'  && <ContentMultiplier />}
        {activeTab === 'pinterest' && <PinterestQueue />}
        {activeTab === 'youtube'   && <YouTubeOptimizer />}

      </div>
    </div>
  );
}
