import { useState } from 'react';

const ASSOCIATE_TAG = 'nichroute-20';
const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';

// Pre-built Amazon product catalog with real ASINs
// Each generates a valid affiliate link with nichroute-20 tag
const CATALOG = [
  {
    category: 'Meal Prep & Food',
    icon: '🥗',
    products: [
      { name: 'Prep Naturals Glass Meal Prep Containers (20 Pack)', asin: 'B07PVNKQV3', price: '$32.99', commission: '~$1.32', keywords: 'meal prep, containers, food storage, healthy eating' },
      { name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker', asin: 'B00FLYWNYQ', price: '$89.99', commission: '~$3.60', keywords: 'meal prep, instant pot, cooking, pressure cooker' },
      { name: 'Food Scale Digital Kitchen Scale', asin: 'B073JTMWWL', price: '$11.99', commission: '~$0.48', keywords: 'meal prep, food scale, cooking, nutrition' },
      { name: 'Bento Box Lunch Container 3 Compartment', asin: 'B01N5FSYOM', price: '$24.99', commission: '~$1.00', keywords: 'meal prep, lunch box, bento, food containers' },
    ]
  },
  {
    category: 'Health & Wellness',
    icon: '💪',
    products: [
      { name: 'Fitbit Charge 6 Fitness Tracker', asin: 'B0CDW7XPVH', price: '$159.95', commission: '~$6.40', keywords: 'fitness tracker, health, wellness, steps, heart rate' },
      { name: 'Resistance Bands Set for Working Out', asin: 'B01AVDVHTI', price: '$29.99', commission: '~$1.20', keywords: 'fitness, resistance bands, workout, health, exercise' },
      { name: 'Water Bottle with Time Marker 64oz', asin: 'B07WGX6CS4', price: '$19.99', commission: '~$0.80', keywords: 'health, hydration, water bottle, wellness, fitness' },
      { name: 'Yoga Mat Non Slip Exercise Mat', asin: 'B0B3HTBJ9M', price: '$29.99', commission: '~$1.20', keywords: 'fitness, yoga, exercise, health, workout' },
    ]
  },
  {
    category: 'Home Office & Remote Work',
    icon: '💻',
    products: [
      { name: 'FLEXISPOT Electric Standing Desk Converter', asin: 'B07D97XHWV', price: '$169.99', commission: '~$6.80', keywords: 'standing desk, home office, remote work, ergonomic' },
      { name: 'Ring Light 10 inch with Tripod Stand', asin: 'B07XNXL91F', price: '$35.99', commission: '~$1.44', keywords: 'ring light, video, content creator, live selling, streaming' },
      { name: 'Blue Light Blocking Glasses', asin: 'B07MFFL6JX', price: '$16.95', commission: '~$0.68', keywords: 'blue light glasses, remote work, home office, computer' },
      { name: 'Laptop Stand Adjustable', asin: 'B07DSB7M98', price: '$23.99', commission: '~$0.96', keywords: 'laptop stand, home office, remote work, ergonomic' },
    ]
  },
  {
    category: 'Mindset & Self Development',
    icon: '💡',
    products: [
      { name: 'Atomic Habits by James Clear', asin: 'B07D23CFGR', price: '$14.99', commission: '~$0.60', keywords: 'mindset, habits, self help, success, atomic habits' },
      { name: 'The 5 AM Club by Robin Sharma', asin: 'B07DPGKBZZ', price: '$13.99', commission: '~$0.56', keywords: 'mindset, morning routine, success, self help, productivity' },
      { name: 'Five Minute Journal Daily Gratitude', asin: 'B00GXUFMVE', price: '$27.95', commission: '~$1.12', keywords: 'mindset, journal, gratitude, self help, habits' },
      { name: 'Think and Grow Rich Napoleon Hill', asin: 'B07V6DGJQY', price: '$9.99', commission: '~$0.40', keywords: 'mindset, success, wealth, self help, entrepreneur' },
    ]
  },
  {
    category: 'Home Bakery & Cooking',
    icon: '🧁',
    products: [
      { name: 'KitchenAid Classic Stand Mixer 4.5 Qt', asin: 'B00005UP2P', price: '$279.99', commission: '~$11.20', keywords: 'baking, stand mixer, bakery, kitchen, home bakery' },
      { name: 'Nonstick Baking Pans Set of 3', asin: 'B08CZYVSKM', price: '$34.99', commission: '~$1.40', keywords: 'baking, pans, bakery, home bakery, cooking' },
      { name: 'Cake Decorating Kit 46 Pieces', asin: 'B08MWGPVXK', price: '$19.99', commission: '~$0.80', keywords: 'baking, cake decorating, bakery, home bakery, cooking' },
      { name: 'Food Packaging Bags for Bakery Business', asin: 'B08FKRT2KY', price: '$15.99', commission: '~$0.64', keywords: 'bakery, packaging, home bakery, baking business' },
    ]
  },
  {
    category: 'Side Hustle & Finance',
    icon: '💰',
    products: [
      { name: 'The Side Hustle Path Book', asin: 'B074WC2TT4', price: '$12.99', commission: '~$0.52', keywords: 'side hustle, income, entrepreneur, business, money' },
      { name: 'Budget Planner Monthly Bill Organizer', asin: 'B083K5DPN4', price: '$19.99', commission: '~$0.80', keywords: 'financial freedom, budget, money, finance, planning' },
      { name: 'Rich Dad Poor Dad by Robert Kiyosaki', asin: 'B07HPG8KJQ', price: '$9.99', commission: '~$0.40', keywords: 'financial freedom, money, investing, wealth, entrepreneur' },
      { name: 'Phone Tripod with Remote Shutter', asin: 'B08PGPBVVH', price: '$19.99', commission: '~$0.80', keywords: 'live selling, content creator, social media, video, streaming' },
    ]
  },
];

function buildLink(asin) {
  return "https://www.amazon.com/dp/" + asin + "/?tag=" + ASSOCIATE_TAG;
}

function buildSearchLink(name) {
  return "https://www.amazon.com/s?k=" + encodeURIComponent(name) + "&tag=" + ASSOCIATE_TAG;
}

export default function AmazonPicker({ onNavigate }) {
  const [selected, setSelected]   = useState([]);
  const [copied, setCopied]       = useState('');
  const [activecat, setActiveCat] = useState('All');
  const [imported, setImported]   = useState(false);

  const categories = ['All', ...CATALOG.map(c => c.category)];
  const filtered = activecat === 'All' ? CATALOG : CATALOG.filter(c => c.category === activecat);

  function toggleSelect(asin) {
    setSelected(prev => prev.includes(asin) ? prev.filter(a => a !== asin) : [...prev, asin]);
  }

  function copyLink(asin, name) {
    navigator.clipboard.writeText(buildLink(asin));
    setCopied(asin);
    setTimeout(() => setCopied(''), 2000);
  }

  async function importSelected() {
    const API = (typeof window !== "undefined" && window.__CF_API__) || "https://contentforge-production-6e13.up.railway.app";
    let saved = 0;
    for (const asin of selected) {
      const product = CATALOG.flatMap(c => c.products).find(p => p.asin === asin);
      if (!product) continue;
      try {
        const r = await fetch(API + "/api/affiliate/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name,
            url: buildLink(asin),
            platform: "amazon",
            category: CATALOG.find(c => c.products.some(p => p.asin === asin))?.category.toLowerCase().replace(/[^a-z]/g,"-") || "general",
            keywords: product.keywords.split(", "),
            description: "Amazon affiliate product — " + product.price,
          }),
        });
        if (r.ok) saved++;
      } catch(e) { console.error(e); }
    }
    setImported(true);
    setTimeout(() => setImported(false), 3000);
    setSelected([]);
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TXT, fontFamily:"system-ui,sans-serif", padding:"24px 20px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>📦 Amazon Product Picker</div>
          <div style={{ fontSize:13, color:TXT3 }}>Select products to add to your Affiliate Library — pre-built with your nichroute-20 tag</div>
        </div>

        {/* Category tabs */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${activecat===cat?ACC:BORD}`, background:activecat===cat?"rgba(29,158,117,.15)":"transparent", color:activecat===cat?ACC:TXT3, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Import bar */}
        {selected.length > 0 && (
          <div style={{ position:"sticky", top:0, zIndex:10, padding:"10px 16px", background:"rgba(29,158,117,.1)", border:`1px solid rgba(29,158,117,.3)`, borderRadius:10, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:ACC, fontWeight:700 }}>{selected.length} product{selected.length>1?"s":""} selected</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setSelected([])}
                style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${BORD}`, background:"transparent", color:TXT3, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                Clear
              </button>
              <button onClick={importSelected}
                style={{ padding:"6px 16px", borderRadius:7, border:"none", background:ACC, color:"white", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {imported ? "✅ Imported!" : "⬇ Import to Affiliate Library"}
              </button>
            </div>
          </div>
        )}

        {/* Product grid */}
        {filtered.map(cat => (
          <div key={cat.category} style={{ marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:700, color:TXT, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
              <span>{cat.icon}</span> {cat.category}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
              {cat.products.map(product => {
                const isSelected = selected.includes(product.asin);
                return (
                  <div key={product.asin}
                    style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${isSelected?"rgba(29,158,117,.5)":BORD}`, background:isSelected?"rgba(29,158,117,.06)":BG2, cursor:"pointer", transition:"all .15s" }}
                    onClick={() => toggleSelect(product.asin)}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                      <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isSelected?ACC:BORD}`, background:isSelected?ACC:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                        {isSelected && <span style={{ color:"white", fontSize:10, fontWeight:900 }}>✓</span>}
                      </div>
                      <div style={{ fontSize:12, fontWeight:600, color:TXT, lineHeight:1.4 }}>{product.name}</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:12, color:ACC, fontWeight:700 }}>{product.price}</span>
                      <span style={{ fontSize:10, color:TXT3 }}>Commission: {product.commission}</span>
                    </div>
                    <div style={{ fontSize:10, color:TXT3, marginBottom:8, lineHeight:1.4 }}>Keywords: {product.keywords}</div>
                    <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => copyLink(product.asin, product.name)}
                        style={{ flex:1, padding:"5px 0", borderRadius:6, border:`1px solid ${BORD}`, background:"transparent", color:TXT3, fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>
                        {copied===product.asin ? "✓ Copied!" : "📋 Copy Link"}
                      </button>
                      <a href={buildSearchLink(product.name)} target="_blank" rel="noreferrer"
                        style={{ flex:1, padding:"5px 0", borderRadius:6, border:"none", background:"rgba(255,153,0,.15)", color:"#FFA500", fontSize:10, fontWeight:600, textDecoration:"none", textAlign:"center" }}>
                        Find on Amazon ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ fontSize:10, color:TXT3, textAlign:"center", marginTop:20, lineHeight:1.6 }}>
          All links use your Amazon Associates tag: nichroute-20<br/>
          Commission rates are estimates based on Amazon's standard 4% rate for most categories.
        </div>
      </div>
    </div>
  );
}
