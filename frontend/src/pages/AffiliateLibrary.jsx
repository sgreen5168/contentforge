import { useState, useEffect } from 'react';

const API = (typeof window !== 'undefined' && window.__CF_API__) || 'https://stellar-achievement-production-ea9d.up.railway.app';

const BG2  = '#112240';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';
const ACCH = '#5DCAA5';

const PLATFORMS = [
  { id:'clickbank', label:'ClickBank',  icon:'💰', color:'#F59E0B' },
  { id:'amazon',    label:'Amazon',     icon:'📦', color:'#FF9900' },
  { id:'shareasale',label:'ShareASale', icon:'🤝', color:'#3B82F6' },
  { id:'digistore', label:'Digistore',  icon:'🛒', color:'#8B5CF6' },
  { id:'other',     label:'Other',      icon:'🔗', color:'#6B7280' },
];

const CATEGORIES = [
  'home-business','side-hustle','cooking','baking','remote-work',
  'entrepreneur','fitness','health','finance','general',
];

export default function AffiliateLibrary() {
  const [links, setLinks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [testTopic, setTestTopic] = useState('');
  const [testResults, setTestRes] = useState([]);
  const [testing, setTesting]   = useState(false);
  const [filterPlat, setFilterPlat] = useState('all');
  const [apiStatus, setApiStatus]   = useState(null);
  const [searching, setSearching]   = useState(false);
  const [bulkMode, setBulkMode]     = useState(false);
  const [bulkText, setBulkText]     = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState('');
  const [nrStatus, setNrStatus]     = useState(null);
  const [nrLinks, setNrLinks]       = useState([]);
  const [nrLoading, setNrLoading]   = useState(false);
  const [nrTable, setNrTable]       = useState('links');
  const [searchTopic, setSearchTopic] = useState('');
  const [searchCategory, setSearchCat] = useState('general');
  const [searchResults, setSearchRes] = useState(null);

  const [form, setForm] = useState({
    name: '', url: '', platform: 'clickbank', category: 'home-business',
    keywords: '', description: '',
  });

  useEffect(() => {
    loadLinks();
    fetch(`${API}/api/affiliate/status`)
      .then(function(r) { return r.json(); })
      .then(function(d) { setApiStatus(d); })
      .catch(function() {});
    checkNichroute();
  }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/affiliate/links`);
      const d = await r.json();
      setLinks(d.links || []);
    } catch(e) { console.warn('Load failed:', e.message); }
    setLoading(false);
  }

  // ── Nichroute functions ──────────────────────────────────────────────────
  async function checkNichroute() {
    try {
      const r = await fetch(`${API}/api/nichroute/status`);
      const d = await r.json();
      setNrStatus(d);
      if (d.connected) loadNichrouteLinks();
    } catch(e) { setNrStatus({ connected: false }); }
  }

  async function loadNichrouteLinks() {
    setNrLoading(true);
    try {
      const r = await fetch(`${API}/api/nichroute/links`);
      const d = await r.json();
      if (d.found) {
        setNrLinks(d.sample || []);
        setNrTable(d.table);
        loadLinks(); // refresh library too
      }
    } catch(e) { console.warn('Nichroute load failed:', e.message); }
    setNrLoading(false);
  }

  async function searchNichroute(topic) {
    try {
      const r = await fetch(`${API}/api/nichroute/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, table: nrTable }),
      });
      const d = await r.json();
      if (d.links?.length > 0) {
        loadLinks(); // refresh to show newly saved links
        return d.links;
      }
    } catch(e) { console.warn('Nichroute search failed:', e.message); }
    return [];
  }

  async function bulkImport() {
    if (!bulkText.trim()) return;
    setBulkSaving(true); setBulkResult('');
    // Extract all URLs from pasted text
    const urlPattern = new RegExp('https?://[^\\s<>"]+hop\.clickbank\.net[^\\s<>"]*', 'gi');
    const urls = [...new Set(bulkText.match(urlPattern) || [])];
    if (urls.length === 0) {
      setBulkResult('❌ No ClickBank hoplinks found — make sure URLs contain hop.clickbank.net');
      setBulkSaving(false); return;
    }
    let saved = 0;
    for (const url of urls) {
      // Auto-detect category from any surrounding text near the URL
      const urlIndex = bulkText.indexOf(url);
      const context = bulkText.slice(Math.max(0, urlIndex-100), urlIndex+100).toLowerCase();
      let category = 'home-income';
      const bakingKw = ['bak','cook','recipe','food','meal','kitchen'];
      const healthKw = ['fitness','weight','health','diet','keto'];
      const mindsetKw = ['mindset','manifest','success','habit'];
      const ecommKw = ['shopify','ecomm','amazon','etsy'];
      if (bakingKw.some(function(k){return context.includes(k);})) category = 'baking';
      else if (healthKw.some(function(k){return context.includes(k);})) category = 'health';
      else if (mindsetKw.some(function(k){return context.includes(k);})) category = 'mindset';
      else if (ecommKw.some(function(k){return context.includes(k);})) category = 'side-hustle';
      try {
        const r = await fetch(`${API}/api/affiliate/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'ClickBank Product ' + (saved + 1),
            url,
            platform: 'clickbank',
            category,
            keywords: category,
            description: 'Imported from ClickBank — edit name and keywords',
          }),
        });
        if (r.ok) saved++;
      } catch(e) { console.warn('Save failed:', e.message); }
    }
    setBulkResult(`✅ Saved ${saved} of ${urls.length} links — edit names and keywords in the library below`);
    setBulkSaving(false);
    setBulkMode(false);
    setBulkText('');
    loadLinks();
  }

  async function liveSearch() {
    if (!searchTopic.trim()) return;
    setSearching(true); setSearchRes(null);
    try {
      const r = await fetch(`${API}/api/affiliate/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchTopic, category: searchCategory, platforms: ['clickbank','amazon'] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Search failed');
      setSearchRes(d);
      // Reload library to show auto-saved products
      loadLinks();
      // Also search Nichroute database
      const nrMatches = await searchNichroute(searchTopic);
      if (nrMatches.length > 0 && (!d.total || d.total === 0)) {
        setSearchRes({ ...d, results: nrMatches, total: nrMatches.length, source: 'nichroute' });
      }
    } catch(e) { setSearchRes({ error: e.message }); }
    setSearching(false);
  }

  async function saveLink() {
    if (!form.name.trim() || !form.url.trim()) { setSaveMsg('Name and URL are required'); return; }
    if (!form.url.startsWith('http')) { setSaveMsg('URL must start with http:// or https://'); return; }
    setSaving(true); setSaveMsg('');
    try {
      const r = await fetch(`${API}/api/affiliate/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setSaveMsg('✅ Link saved!');
        setForm({ name:'', url:'', platform:'clickbank', category:'home-business', keywords:'', description:'' });
        setShowForm(false);
        loadLinks();
      } else throw new Error(d.error);
    } catch(e) { setSaveMsg('❌ ' + e.message); }
    setSaving(false);
  }

  async function deleteLink(id) {
    if (!confirm('Remove this affiliate link?')) return;
    await fetch(`${API}/api/affiliate/links/${id}`, { method: 'DELETE' });
    loadLinks();
  }

  async function testMatch() {
    if (!testTopic.trim()) return;
    setTesting(true); setTestRes([]);
    try {
      const r = await fetch(`${API}/api/affiliate/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: testTopic, count: 3 }),
      });
      const d = await r.json();
      setTestRes(d.links || []);
    } catch(e) { console.warn(e); }
    setTesting(false);
  }

  function getPlatform(id) { return PLATFORMS.find(p => p.id === id) || PLATFORMS[4]; }

  const filtered = filterPlat === 'all' ? links : links.filter(l => l.platform === filterPlat);

  const card = (extra = {}) => ({ background: BG2, border: `1px solid ${BORD}`, borderRadius: 12, ...extra });
  const inp = { width: '100%', background: 'rgba(22,61,106,.5)', border: `1px solid ${BORD}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: TXT, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: 20, maxWidth: 1000, fontFamily: 'inherit', color: TXT }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>🔗</span> Affiliate Link Library
          </div>
          <div style={{ fontSize: 12, color: TXT3, marginTop: 4 }}>
            Save your ClickBank and Amazon affiliate links — ContentForge auto-inserts the best match into posts and videos
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setSaveMsg(''); }}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: ACC, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Affiliate Link
        </button>
      </div>

      {/* How it works */}
      <div style={{ ...card(), padding: '12px 16px', marginBottom: 16, background: 'rgba(29,158,117,.04)', border: '1px solid rgba(29,158,117,.15)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCH, marginBottom: 8 }}>⚡ How auto-insertion works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            ['📝 Content Calendar', 'When generating a Facebook post or video script, ContentForge matches the topic to your saved links and adds a compliant affiliate disclosure at the end.'],
            ['🎬 AI Video Engine', 'The Auto Workflow and Video Builder burn your affiliate link into the final 5 seconds of videos, and add it to YouTube descriptions automatically.'],
            ['📺 YouTube Studio', 'When uploading a video, the best matching link is auto-inserted into the description with proper disclosure language.'],
          ].map(function(item) {
            return (
              <div key={item[0]} style={{ padding: '8px 10px', background: 'rgba(22,61,106,.3)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TXT, marginBottom: 4 }}>{item[0]}</div>
                <div style={{ fontSize: 10, color: TXT3, lineHeight: 1.5 }}>{item[1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Connection Status */}
      {apiStatus && (
        <div style={{ ...card(), padding:'10px 16px', marginBottom:12, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:700, color:TXT }}>API Connections:</span>
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, background:apiStatus.clickbank?'rgba(245,158,11,.12)':'rgba(226,75,74,.1)', color:apiStatus.clickbank?'#FCD34D':'#F09595', border:'1px solid '+(apiStatus.clickbank?'rgba(245,158,11,.3)':'rgba(226,75,74,.2)') }}>
            💰 ClickBank {apiStatus.clickbank?'✅ Connected':'❌ Not connected'}
          </span>
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, background:apiStatus.amazon?'rgba(255,153,0,.12)':'rgba(226,75,74,.1)', color:apiStatus.amazon?'#FF9900':'#F09595', border:'1px solid '+(apiStatus.amazon?'rgba(255,153,0,.3)':'rgba(226,75,74,.2)') }}>
            📦 Amazon {apiStatus.amazon?'✅ Connected':'❌ Not connected'}
          </span>
          <span style={{ fontSize:10, color:TXT3 }}>{apiStatus.library || 0} links in library</span>
          {(!apiStatus.clickbank || !apiStatus.amazon) && (
            <span style={{ fontSize:10, color:'#FAC775' }}>
              ⚠ Add missing keys to Railway Variables: {!apiStatus.clickbank?'CLICKBANK_API_KEY, CLICKBANK_CLERK_ID':''}
              {!apiStatus.amazon?' AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_ASSOCIATE_TAG':''}
            </span>
          )}
        </div>
      )}

      {/* Nichroute Status */}
      {nrStatus && (
        <div style={{ ...card(), padding:'10px 16px', marginBottom:12, border: nrStatus.connected ? '1px solid rgba(29,158,117,.2)' : `1px solid ${BORD}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>🗄</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:TXT }}>
                  Nichroute Database {nrStatus.connected ? '✅ Connected' : '❌ Not connected'}
                </div>
                <div style={{ fontSize:10, color:TXT3 }}>
                  {nrStatus.connected
                    ? `Supabase project connected · Table: "${nrTable}" · ${nrLinks.length} links found`
                    : 'Add NICHROUTE_URL and NICHROUTE_KEY to Railway Variables'}
                </div>
              </div>
            </div>
            {nrStatus.connected && (
              <button onClick={loadNichrouteLinks} disabled={nrLoading}
                style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${BORD}`, background:'transparent', color:TXT3, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                {nrLoading ? 'Loading…' : '↻ Sync Links'}
              </button>
            )}
          </div>
          {nrLinks.length > 0 && (
            <div style={{ marginTop:10, padding:'8px', background:'rgba(22,61,106,.3)', borderRadius:6 }}>
              <div style={{ fontSize:10, color:TXT3, marginBottom:6 }}>Sample links from your Nichroute database:</div>
              {nrLinks.slice(0,3).map(function(link, i) {
                var url = link.url || link.destination || link.affiliate_url || link.link || '';
                var title = link.title || link.name || link.product_name || ('Link '+(i+1));
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:10, color:ACCH }}>📦</span>
                    <span style={{ fontSize:10, color:TXT2, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
                    {url && <a href={url} target="_blank" rel="noreferrer" style={{ fontSize:9, color:'#3B82F6', textDecoration:'none' }}>View ↗</a>}
                  </div>
                );
              })}
              {nrLinks.length > 3 && <div style={{ fontSize:9, color:TXT3 }}>+{nrLinks.length-3} more in database</div>}
            </div>
          )}
        </div>
      )}

      {/* How to get real ClickBank hoplinks */}
      <div style={{ ...card(), padding:16, marginBottom:16, border:'1px solid rgba(245,158,11,.2)', background:'rgba(245,158,11,.03)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:TXT, marginBottom:8 }}>💰 How to Add Your ClickBank Links</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          {[
            ['1️⃣','Go to marketplace.clickbank.com','Log in with your ClickBank account (sgreen5168)'],
            ['2️⃣','Find a product → click Promote','Search your niche, pick a product, click the orange Promote button → Generate Hoplinks → copy the URL'],
            ['3️⃣','Paste into Bulk Importer below','Click + Bulk Import, paste your hoplinks, click Save — ContentForge handles the rest'],
          ].map(function(step) {
            return (
              <div key={step[0]} style={{ padding:'10px', background:'rgba(22,61,106,.4)', borderRadius:8 }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{step[0]}</div>
                <div style={{ fontSize:11, fontWeight:600, color:TXT, marginBottom:4 }}>{step[1]}</div>
                <div style={{ fontSize:10, color:TXT3, lineHeight:1.5 }}>{step[2]}</div>
              </div>
            );
          })}
        </div>
        <a href="https://marketplace.clickbank.com" target="_blank" rel="noreferrer"
          style={{ display:'inline-block', marginTop:12, padding:'8px 20px', borderRadius:8, background:'#F59E0B', color:'white', fontSize:12, fontWeight:700, textDecoration:'none' }}>
          Open ClickBank Marketplace ↗
        </a>
      </div>

      {/* Bulk Importer */}
      <div style={{ ...card(), padding:16, marginBottom:16, border:'1px solid rgba(99,102,241,.2)', background:'rgba(99,102,241,.03)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: bulkMode ? 12 : 0 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:TXT }}>📥 Bulk Hoplink Importer</div>
            {!bulkMode && <div style={{ fontSize:11, color:TXT3, marginTop:2 }}>Paste multiple ClickBank hoplinks at once — saves them all instantly</div>}
          </div>
          <button onClick={function() { setBulkMode(function(b){return !b;}); setBulkResult(''); }}
            style={{ padding:'6px 14px', borderRadius:7, border:'1px solid rgba(99,102,241,.3)', background: bulkMode?'rgba(99,102,241,.15)':'transparent', color:'#818CF8', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {bulkMode ? '✕ Cancel' : '+ Bulk Import'}
          </button>
        </div>
        {bulkMode && (
          <div>
            <div style={{ fontSize:11, color:TXT3, marginBottom:8, lineHeight:1.6 }}>
              Go to <strong style={{ color:TXT }}>marketplace.clickbank.com</strong> → find products → click Promote → Generate Hoplinks → copy each URL. Paste all of them below (one per line or mixed with other text).
            </div>
            <textarea value={bulkText} onChange={function(e){setBulkText(e.target.value);}} rows={6}
              placeholder="Paste your ClickBank hoplinks here — one per line or mixed with text. ContentForge extracts all hop.clickbank.net URLs automatically." 
              style={{ width:'100%', background:'rgba(22,61,106,.5)', border:`1px solid ${BORD}`, borderRadius:8, padding:'10px', fontSize:11, color:TXT, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.6, marginBottom:8 }} />
            {bulkResult && (
              <div style={{ marginBottom:8, padding:'7px 10px', background: bulkResult.startsWith('✅')?'rgba(29,158,117,.1)':'rgba(226,75,74,.1)', border:`1px solid ${bulkResult.startsWith('✅')?'rgba(29,158,117,.2)':'rgba(226,75,74,.2)'}`, borderRadius:6, fontSize:11, color: bulkResult.startsWith('✅')?ACCH:'#F09595' }}>
                {bulkResult}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={bulkImport} disabled={bulkSaving || !bulkText.trim()}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background: bulkSaving||!bulkText.trim()?'rgba(99,102,241,.3)':'#6366F1', color:'white', fontSize:12, fontWeight:700, cursor: bulkSaving||!bulkText.trim()?'default':'pointer', fontFamily:'inherit' }}>
                {bulkSaving ? '💾 Saving…' : '💾 Import All Links'}
              </button>
            </div>
            <div style={{ marginTop:8, fontSize:10, color:TXT3, lineHeight:1.5 }}>
              After importing, edit each link's name and keywords in the library below so ContentForge matches them to the right posts.
            </div>
          </div>
        )}
      </div>

      {/* Add Link Form */}
      {showForm && (
        <div style={{ ...card(), padding: 16, marginBottom: 16, border: '1px solid rgba(29,158,117,.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 14 }}>Add Affiliate Link</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: TXT3, marginBottom: 4 }}>Product / Link Name *</div>
              <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                placeholder="e.g. Home Business Blueprint" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: TXT3, marginBottom: 4 }}>Affiliate URL *</div>
              <input value={form.url} onChange={e => setForm(p => ({...p, url: e.target.value}))}
                placeholder="https://hop.clickbank.net/..." style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: TXT3, marginBottom: 4 }}>Platform</div>
              <select value={form.platform} onChange={e => setForm(p => ({...p, platform: e.target.value}))}
                style={{ ...inp }}>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: TXT3, marginBottom: 4 }}>Category</div>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                style={{ ...inp }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: TXT3, marginBottom: 4 }}>Keywords (comma-separated)</div>
              <input value={form.keywords} onChange={e => setForm(p => ({...p, keywords: e.target.value}))}
                placeholder="baking, home business, income" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: TXT3, marginBottom: 4 }}>Short description (helps AI match)</div>
            <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
              placeholder="e.g. Step-by-step guide to starting a profitable home business" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={saveLink} disabled={saving}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? 'rgba(29,158,117,.4)' : ACC, color: 'white', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : '💾 Save Link'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            {saveMsg && <div style={{ fontSize: 11, color: saveMsg.startsWith('✅') ? ACCH : '#F09595' }}>{saveMsg}</div>}
          </div>
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 7, fontSize: 10, color: '#FCD34D', lineHeight: 1.5 }}>
            ⚠ <strong>FTC Compliance:</strong> ContentForge automatically adds "#ad #affiliate" disclosures when inserting links into posts. Always disclose affiliate relationships as required by FTC guidelines and Facebook's policies.
          </div>
        </div>
      )}

      {/* Test Matching */}
      {links.length > 0 && (
        <div style={{ ...card(), padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TXT, marginBottom: 10 }}>🧪 Test Link Matching</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={testTopic} onChange={e => setTestTopic(e.target.value)}
              placeholder="Enter a post topic to see which links would be auto-inserted…"
              style={{ ...inp, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && testMatch()} />
            <button onClick={testMatch} disabled={testing || !testTopic.trim()}
              style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: testing ? 'rgba(59,130,246,.3)' : '#3B82F6', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {testing ? 'Matching…' : 'Test Match'}
            </button>
          </div>
          {testResults.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: TXT3, marginBottom: 6 }}>Best matches for this topic:</div>
              {testResults.map((link, i) => {
                const plat = getPlatform(link.platform);
                return (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(22,61,106,.3)', borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <span style={{ fontSize: 14 }}>{plat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TXT }}>{link.name}</div>
                      <div style={{ fontSize: 9, color: TXT3 }}>{link.category} · {(link.keywords || []).slice(0,3).join(', ')}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${plat.color}22`, color: plat.color }}>{plat.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Platform filter */}
      {links.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterPlat('all')}
            style={{ padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, border: filterPlat==='all' ? `2px solid ${ACC}` : `1px solid ${BORD}`, background: filterPlat==='all' ? 'rgba(29,158,117,.1)' : 'transparent', color: filterPlat==='all' ? ACCH : TXT3 }}>
            All ({links.length})
          </button>
          {PLATFORMS.map(p => {
            const count = links.filter(l => l.platform === p.id).length;
            if (!count) return null;
            return (
              <button key={p.id} onClick={() => setFilterPlat(p.id)}
                style={{ padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, border: filterPlat===p.id ? `2px solid ${p.color}` : `1px solid ${BORD}`, background: filterPlat===p.id ? `${p.color}22` : 'transparent', color: filterPlat===p.id ? p.color : TXT3 }}>
                {p.icon} {p.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Links list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: TXT3 }}>Loading links…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card(), padding: 50, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: TXT, marginBottom: 8 }}>
            {links.length === 0 ? 'No affiliate links saved yet' : 'No links in this category'}
          </div>
          <div style={{ fontSize: 12, color: TXT3, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
            Add your ClickBank or Amazon affiliate links above. ContentForge will automatically match and insert the most relevant link into your posts and video descriptions based on the topic.
          </div>
          {links.length === 0 && (
            <button onClick={() => setShowForm(true)}
              style={{ marginTop: 16, padding: '10px 24px', borderRadius: 9, border: 'none', background: ACC, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Your First Link
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(link => {
            const plat = getPlatform(link.platform);
            return (
              <div key={link.id} style={card({ padding: '12px 16px' })}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${plat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {plat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{link.name}</span>
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${plat.color}22`, color: plat.color }}>{plat.label}</span>
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(29,158,117,.1)', color: ACCH }}>{link.category}</span>
                    </div>
                    {link.description && (
                      <div style={{ fontSize: 11, color: TXT2, marginBottom: 4 }}>{link.description}</div>
                    )}
                    <div style={{ fontSize: 10, color: TXT3, marginBottom: 4, wordBreak: 'break-all' }}>
                      🔗 {link.url.slice(0, 60)}{link.url.length > 60 ? '…' : ''}
                    </div>
                    {(link.keywords || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {link.keywords.map((kw, i) => (
                          <span key={i} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: 'rgba(255,255,255,.06)', color: TXT3 }}>#{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => navigator.clipboard.writeText(link.url)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                      📋 Copy
                    </button>
                    <button onClick={() => deleteLink(link.id)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(226,75,74,.3)', background: 'transparent', color: '#F09595', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🗑 Remove
                    </button>
                    {link.clicks > 0 && (
                      <div style={{ fontSize: 9, color: TXT3, textAlign: 'center' }}>{link.clicks} clicks</div>
                    )}
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
