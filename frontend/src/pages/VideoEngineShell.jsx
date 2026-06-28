import React, { useState, useRef } from 'react';

/*
  AI Video Engine 4.0 — Layout Shell
  -----------------------------------
  This is STEP 1 of the rebuild: pure UI scaffolding.
  It does NOT replace any working logic — VideoEngine.jsx's existing
  Generate / Result / Scene Editor / History tabs render unchanged
  inside the "workspace" area below. This file only adds:
    - Top nav bar
    - Hero / quick-start row
    - Left sidebar (templates + style presets) — visual only for now
    - Right "Smart Creation Panel" shortcuts — visual only for now
    - Recent Projects footer grid (reads existing job history)

  Nothing here calls Pexels, FFmpeg, OpenAI, or Claude directly.
  Wiring happens in later steps once this shell is approved.
*/

const BG    = '#0D2137';
const BG2   = 'rgba(16,45,79,.9)';
const BORD  = 'rgba(29,158,117,.2)';
const ACC   = '#1D9E75';
const ACCH  = '#5DCAA5';
const TXT   = '#E8F4F0';
const TXT2  = '#7BAAA0';
const TXT3  = '#4A7A72';

const QUICK_START = [
  { id:'ugc',        label:'UGC Creator Video',      desc:'Authentic, phone-shot style review', duration:'15–30s' },
  { id:'vsl',        label:'Video Sales Letter',     desc:'Long-form persuasive pitch',          duration:'2–5m'   },
  { id:'reel',       label:'Reel / Short Ad',         desc:'Fast, punchy, scroll-stopping',        duration:'15–30s' },
  { id:'demo',       label:'Product Demo',            desc:'Step-by-step walkthrough',             duration:'30–60s' },
  { id:'educator',   label:'Educational Explainer',   desc:'Clear, teach-first format',             duration:'45–90s' },
  { id:'commercial', label:'Commercial',               desc:'Polished brand spot',                   duration:'15–30s' },
];

const TEMPLATE_CATEGORIES = ['UGC Ads','VSL Templates','Reels/Shorts','Product Demos','Educational','Commercial'];
const STYLE_PRESETS       = ['Cinematic','UGC Raw','Corporate Clean','Aesthetic Pastel','Bold High-Contrast'];

const SMART_SHORTCUTS = [
  { id:'script',  label:'AI Script Generator',   status:'live',    note:'Writes hook + scenes + CTA' },
  { id:'hook',    label:'AI Hook Generator',     status:'live',    note:'3 hook variants per topic' },
  { id:'scenes',  label:'AI Scene Builder',      status:'live',    note:'Keyword-matched scene editor' },
  { id:'broll',   label:'AI B-Roll Suggestions', status:'next',    note:'Coming in step 3' },
  { id:'voice',   label:'Voice & Tone Selector', status:'live',    note:'6 voices, HD quality' },
  { id:'caption', label:'Caption Style Picker',  status:'live',    note:'Top / middle / bottom burn-in' },
];

function StatusDot({ status }) {
  const color = status === 'live' ? ACC : status === 'next' ? '#F5A623' : TXT3;
  return <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block', flexShrink:0 }} />;
}

export default function VideoEngineShell({ children, recentJobs = [], onSelectQuickStart, onOpenJob, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('UGC Ads');
  const [activeStyle, setActiveStyle] = useState('Cinematic');
  const sidebarRef = useRef(null);

  function goToTemplates() {
    setSidebarOpen(true);
    if (sidebarRef.current) sidebarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goToWorkspace(tab) {
    if (onNavigate) onNavigate(tab);
    const ws = document.getElementById('cf-workspace');
    if (ws) ws.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function card(extra) {
    return Object.assign({ background:BG2, border:'1px solid '+BORD, borderRadius:12, overflow:'hidden' }, extra||{});
  }
  function hdr(extra) {
    return Object.assign({ padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:TXT, display:'flex', alignItems:'center', justifyContent:'space-between' }, extra||{});
  }

  return (
    <div id="cf-top" style={{ background:BG, minHeight:'100vh', borderRadius:12, fontFamily:'inherit', color:TXT }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid '+BORD }}>
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <div style={{ fontSize:15, fontWeight:600 }}>
            AI Video <span style={{ color:ACCH }}>Engine</span>
            <span style={{ fontSize:10, marginLeft:6, padding:'2px 7px', borderRadius:10, background:'rgba(29,158,117,.2)', color:ACCH }}>4.0</span>
          </div>
          <nav style={{ display:'flex', gap:4 }}>
            {[
              { label:'Home',         action: () => { const top = document.getElementById('cf-top'); if (top) top.scrollIntoView({ behavior:'smooth' }); }, enabled:true },
              { label:'Create Video', action: () => goToWorkspace('generate'), enabled:true },
              { label:'Templates',    action: goToTemplates, enabled:true },
              { label:'Brand Kits',   action: null, enabled:false },
              { label:'Analytics',    action: null, enabled:false },
            ].map(item => (
              <button key={item.label}
                onClick={item.enabled ? item.action : undefined}
                title={item.enabled ? undefined : 'Not built yet'}
                style={{
                  padding:'6px 12px', borderRadius:8, border:'1px solid transparent', background:'transparent',
                  color: item.enabled ? TXT2 : TXT3,
                  fontSize:12, cursor: item.enabled ? 'pointer' : 'not-allowed', fontFamily:'inherit',
                  opacity: item.enabled ? 1 : 0.45,
                }}>
                {item.label}{!item.enabled && <span style={{ marginLeft:5, fontSize:9 }}>soon</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div style={{ display:'flex' }}>

        {/* ── Left Sidebar — Templates & Styles ────────────────────────────── */}
        {sidebarOpen && (
          <div ref={sidebarRef} style={{ width:200, flexShrink:0, borderRight:'1px solid '+BORD, padding:'16px 12px' }}>
            <div style={{ fontSize:10, color:TXT3, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Template categories</div>
            <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:18 }}>
              {TEMPLATE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ textAlign:'left', padding:'7px 10px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12,
                    background: activeCategory===cat ? 'rgba(29,158,117,.12)' : 'transparent',
                    color: activeCategory===cat ? ACCH : TXT2 }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ fontSize:10, color:TXT3, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Style presets</div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {STYLE_PRESETS.map(s => (
                <button key={s} onClick={() => setActiveStyle(s)}
                  style={{ textAlign:'left', padding:'7px 10px', borderRadius:8, border:'1px solid '+(activeStyle===s?ACC:'transparent'), cursor:'pointer', fontFamily:'inherit', fontSize:12,
                    background: activeStyle===s ? 'rgba(29,158,117,.08)' : 'transparent',
                    color: activeStyle===s ? ACCH : TXT2 }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ marginTop:10, fontSize:10, color:TXT3, lineHeight:1.5 }}>
              Presets shape tone & visual direction in the script + caption style — not a separate render engine.
            </div>
          </div>
        )}

        {/* ── Center — Hero + Quick Start + Workspace ──────────────────────── */}
        <div style={{ flex:1, minWidth:0, padding:20 }}>

          {/* Hero */}
          <div style={{ ...card(), padding:'28px 24px', marginBottom:16, textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:600, color:TXT, marginBottom:6 }}>
              Create studio-quality videos in minutes
            </div>
            <div style={{ fontSize:13, color:TXT2, marginBottom:18 }}>
              Script → voiceover → matched clips → captions — free Pexels footage, no credits needed
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => goToWorkspace('generate')}
                style={{ padding:'10px 18px', borderRadius:10, border:'none', background:ACC, color:'white', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Start with an idea
              </button>
              <button onClick={() => goToWorkspace('generate')}
                style={{ padding:'10px 18px', borderRadius:10, border:'1px solid '+BORD, background:'transparent', color:TXT, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Start with a script
              </button>
              <button onClick={goToTemplates}
                style={{ padding:'10px 18px', borderRadius:10, border:'1px solid '+BORD, background:'transparent', color:TXT2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Browse templates
              </button>
            </div>
          </div>

          {/* Quick-start cards */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:500, color:TXT, marginBottom:10 }}>Quick start</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
              {QUICK_START.map(qs => (
                <button key={qs.id} onClick={() => onSelectQuickStart && onSelectQuickStart(qs.id)}
                  style={{ ...card(), padding:'14px 14px', textAlign:'left', cursor:'pointer', border:'1px solid '+BORD }}>
                  <div style={{ width:'100%', height:60, borderRadius:8, background:'rgba(22,61,106,.6)', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:TXT3 }}>
                    thumbnail
                  </div>
                  <div style={{ fontSize:13, fontWeight:500, color:TXT, marginBottom:3 }}>{qs.label}</div>
                  <div style={{ fontSize:11, color:TXT2, marginBottom:6, lineHeight:1.4 }}>{qs.desc}</div>
                  <div style={{ fontSize:10, color:ACCH }}>{qs.duration}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Existing working VideoEngine tabs render here, untouched ──── */}
          <div id="cf-workspace" style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:500, color:TXT, marginBottom:10 }}>Workspace</div>
            {children}
          </div>

          {/* Recent projects footer grid */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:500, color:TXT }}>Recent projects</div>
              <span style={{ fontSize:11, color:TXT3 }}>{recentJobs.length} total</span>
            </div>
            {recentJobs.length === 0 ? (
              <div style={{ ...card(), padding:30, textAlign:'center', fontSize:12, color:TXT3 }}>
                No projects yet — generate your first video above
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
                {recentJobs.slice(0,8).map((j, i) => {
                  const statusLabel = j.status === 'completed' ? 'Rendered' : j.status === 'failed' ? 'Failed' : 'Draft';
                  const statusColor = j.status === 'completed' ? ACC : j.status === 'failed' ? '#E24B4A' : '#F5A623';
                  return (
                    <div key={i} style={{ ...card(), padding:10 }}>
                      <div style={{ width:'100%', height:70, borderRadius:6, background:'rgba(22,61,106,.5)', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:TXT3 }}>
                        preview
                      </div>
                      <div style={{ fontSize:11, color:TXT, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {(j.data && j.data.topic) || (j.createdAt && ('Video — ' + new Date(j.createdAt).toLocaleDateString())) || 'Untitled video'}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
                        <StatusDot status={j.status==='completed'?'live':'next'} />
                        <span style={{ fontSize:10, color:statusColor }}>{statusLabel}</span>
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => onOpenJob && onOpenJob(j)}
                          style={{ flex:1, fontSize:10, padding:'4px', borderRadius:6, border:'1px solid '+BORD, background:'transparent', color:TXT2, cursor:'pointer', fontFamily:'inherit' }}>
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Right Panel — Smart Creation Shortcuts ───────────────────────── */}
        <div style={{ width:230, flexShrink:0, borderLeft:'1px solid '+BORD, padding:16 }}>
          <div style={{ fontSize:10, color:TXT3, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Smart creation panel</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
            {SMART_SHORTCUTS.map(s => (
              <div key={s.id} style={{ ...card(), padding:'9px 10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <StatusDot status={s.status} />
                  <span style={{ fontSize:12, color:TXT, fontWeight:500 }}>{s.label}</span>
                </div>
                <div style={{ fontSize:10, color:TXT3, marginLeft:12 }}>{s.note}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:10, color:TXT3, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Analytics snapshot</div>
          <div style={{ ...card(), padding:'14px 12px' }}>
            <div style={{ fontSize:11, color:TXT3, lineHeight:1.6, marginBottom:8 }}>
              Hook retention and drop-off data require connected platform analytics (TikTok / YouTube / Instagram).
            </div>
            <div style={{ fontSize:10, color:'#F5A623', padding:'4px 8px', background:'rgba(245,166,35,.1)', borderRadius:6, display:'inline-block' }}>
              Coming soon — not yet connected
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
