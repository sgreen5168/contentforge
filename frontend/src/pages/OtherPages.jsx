import React, { useState } from 'react';
import { learnBrandVoice } from '../lib/api.js';

// ─── Scheduler ───────────────────────────────────────────────────────────────
const QUEUE = [
  { t: 'Today 9:00 AM',    txt: 'Work from home productivity tools review',       ps: ['FB','IG'],       s: 'scheduled' },
  { t: 'Today 2:00 PM',    txt: 'Educational thread — content batching strategy', ps: ['RD'],            s: 'scheduled' },
  { t: 'Tomorrow 8:30 AM', txt: 'Ergonomic desk setup with affiliate links',       ps: ['FB','IG','RD'],  s: 'pending'   },
  { t: 'Wed 12:00 PM',     txt: 'Humorous take on algorithm changes',              ps: ['IG','RD'],       s: 'pending'   },
  { t: 'Thu 11:00 AM',     txt: 'Long-form SEO guide for beginners',               ps: ['FB'],            s: 'pending'   },
];
const CHIP_COLORS = { FB: 'rgba(24,119,242,.15)', IG: 'rgba(225,48,108,.15)', RD: 'rgba(255,69,0,.15)' };
const CHIP_TEXT   = { FB: 'var(--fb)', IG: 'var(--ig)', RD: 'var(--rd)' };

export function Scheduler() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const grid = [
    [0,1,0,0,1,0,0],[0,0,1,0,0,1,0],[1,0,0,1,0,0,1],
    [0,1,0,0,0,1,0],[0,0,1,0,1,0,0],[1,0,0,0,0,1,0],
  ];
  return (
    <div className="page-content">
      <h1 className="page-title serif">Auto <span>Scheduler</span></h1>
      <p className="page-sub">AI picks peak engagement windows. Green = highest predicted reach.</p>

      <div className="metrics-grid">
        {[{l:'Scheduled',v:'12',c:'+3 this week'},{l:'Published',v:'47',c:'This month'},{l:'Avg Reach',v:'8.4K',c:'+12%'},{l:'Best Time',v:'9 AM',c:'Tue & Thu'}].map(m => (
          <div key={m.l} className="metric-card">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value">{m.v}</div>
            <div className="metric-change">{m.c}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          This Week
          <button className="btn btn-ghost btn-sm">+ Add Slot</button>
        </div>
        <div style={{padding:'14px 18px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:9}}>
            {days.map(d => <div key={d} style={{textAlign:'center',fontSize:10,color:'var(--text3)',padding:'5px 0',fontWeight:500}}>{d}</div>)}
            {grid.flatMap((row,ri) => row.map((v,ci) => {
              const s = v
                ? (ri%2===0
                  ? {bg:'var(--ag)',bc:'rgba(124,107,255,.3)',c:'var(--accent)',l:'●'}
                  : {bg:'rgba(34,201,138,.1)',bc:'rgba(34,201,138,.25)',c:'var(--ok)',l:'★'})
                : {bg:'var(--bg3)',bc:'var(--border)',c:'',l:''};
              return <div key={`${ri}-${ci}`} style={{height:34,borderRadius:5,background:s.bg,border:`1px solid ${s.bc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:s.c,cursor:'pointer'}}>{s.l}</div>;
            }))}
          </div>
          <div style={{display:'flex',gap:14,fontSize:11,color:'var(--text3)'}}>
            <span>● Scheduled</span><span style={{color:'var(--ok)'}}>★ Optimal time</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Upcoming Queue</div>
        <div style={{padding:'6px 18px'}}>
          {QUEUE.map((q,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<QUEUE.length-1?'1px solid var(--border)':'none'}}>
              <div style={{fontSize:10,color:'var(--text3)',width:95,flexShrink:0}}>{q.t}</div>
              <div style={{flex:1,fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.txt}</div>
              <div style={{display:'flex',gap:3}}>
                {q.ps.map(p => <span key={p} style={{fontSize:10,padding:'2px 6px',borderRadius:10,fontWeight:500,background:CHIP_COLORS[p],color:CHIP_TEXT[p]}}>{p}</span>)}
              </div>
              <div style={{fontSize:10,color:q.s==='scheduled'?'var(--ok)':'var(--text3)'}}>{q.s==='scheduled'?'● Sched':'Pending'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Brand Voice ──────────────────────────────────────────────────────────────
const DEFAULT_BRAND = {
  tone:  { conversational:82, professional:65, humorous:45, direct:78, empathetic:71 },
  style: { emojiUse:60, hashtags:75, ctaStrength:88, postLength:55, storytelling:70 },
  phrases:  ['Work smarter not harder', "Here's the thing", 'Honest take', 'Game-changer', 'Highly recommend'],
  hashtags: ['#productivity','#workfromhome','#contentcreator','#aitools','#entrepreneur'],
  topics:   ['Productivity','AI Tools','Work/Life Balance','Affiliate Marketing'],
};

function VBar({ label, value, color }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
      <div style={{fontSize:12,color:'var(--text2)',width:100,flexShrink:0}}>{label}</div>
      <div style={{flex:1,height:5,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',width:value+'%',background:color,borderRadius:3,transition:'width .5s'}} />
      </div>
      <div style={{fontSize:11,color:'var(--text3)',width:26,textAlign:'right'}}>{value}%</div>
    </div>
  );
}

export function Brand() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [learnText, setLearnText] = useState('');
  const [learning, setLearning] = useState(false);
  const [learnErr, setLearnErr] = useState('');

  async function learn() {
    if (!learnText.trim()) return;
    setLearning(true); setLearnErr('');
    try {
      const result = await learnBrandVoice(learnText);
      setBrand(prev => ({
        tone:  { ...prev.tone,  ...Object.fromEntries(Object.entries(result.tone||{}).map(([k,v])=>[k,v])) },
        style: { ...prev.style, ...Object.fromEntries(Object.entries(result.style||{}).map(([k,v])=>[k,v])) },
        phrases:  result.phrases?.length  ? result.phrases  : prev.phrases,
        hashtags: result.hashtags?.length ? result.hashtags : prev.hashtags,
        topics:   result.topics?.length   ? result.topics   : prev.topics,
      }));
      setLearnText('');
    } catch(e) {
      setLearnErr(e.message);
    } finally {
      setLearning(false);
    }
  }

  return (
    <div className="page-content">
      <h1 className="page-title serif">Brand <span>Voice Memory</span></h1>
      <p className="page-sub">Your writing DNA — paste posts to keep training your style profile</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
        <div className="panel">
          <div className="panel-header">Tone Profile</div>
          <div style={{padding:'14px 18px'}}>
            {Object.entries(brand.tone).map(([k,v]) => <VBar key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={v} color="var(--accent)" />)}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Style Signals</div>
          <div style={{padding:'14px 18px'}}>
            {Object.entries(brand.style).map(([k,v]) => {
              const label = k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
              return <VBar key={k} label={label} value={v} color="var(--ok)" />;
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Learned Patterns</div>
        <div style={{padding:'14px 18px'}}>
          {[['Signature phrases', brand.phrases],['Top hashtags', brand.hashtags],['Topics', brand.topics]].map(([label, items]) => (
            <div key={label} style={{marginBottom:13}}>
              <div className="field-label" style={{marginBottom:6}}>{label}</div>
              {items.map(t => <span key={t} style={{background:'var(--bg4)',border:'1px solid var(--border)',borderRadius:20,padding:'4px 10px',fontSize:11,color:'var(--text2)',display:'inline-block',margin:2}}>{t}</span>)}
            </div>
          ))}
          <div className="field-label" style={{marginTop:8,marginBottom:6}}>Train with a new post</div>
          <textarea className="field-input" style={{height:80,marginBottom:8,resize:'none'}} placeholder="Paste your best-performing post here…" value={learnText} onChange={e=>setLearnText(e.target.value)} />
          {learnErr && <div style={{fontSize:12,color:'var(--err)',marginBottom:8}}>⚠ {learnErr}</div>}
          <button className="btn btn-primary btn-sm" onClick={learn} disabled={learning||!learnText.trim()}>
            {learning ? <><span className="spin" /> Learning…</> : 'Learn from this post ◈'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
const BARS = [65,80,55,90,72,88,61,95,78,84,70,92];

function Analytics_Legacy() {
  return (
    <div className="page-content">
      <h1 className="page-title serif">Performance <span>Analytics</span></h1>
      <p className="page-sub">Engagement, reach, and conversion across all platforms</p>

      <div className="metrics-grid">
        {[{l:'Total Reach',v:'124K',c:'+18%'},{l:'Engagements',v:'9,231',c:'+24%'},{l:'Clicks',v:'1,847',c:'+31%'},{l:'Affiliate Rev.',v:'$2,140',c:'+9%'}].map(m => (
          <div key={m.l} className="metric-card">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value">{m.v}</div>
            <div className="metric-change">{m.c}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="panel">
          <div className="panel-header">Weekly Reach — 12 weeks</div>
          <div style={{padding:'14px 18px'}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,height:110}}>
              {BARS.map((b,i) => (
                <div key={i} style={{flex:1,height:b+'%',borderRadius:'3px 3px 0 0',background:`hsl(${248+i*4},65%,${54+i}%)`,animation:`bup .6s ease ${i*40}ms both`}} />
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Platform Split</div>
          <div style={{padding:'18px'}}>
            {[['Facebook','var(--fb)',48],['Instagram','var(--ig)',35],['Reddit','var(--rd)',17]].map(([p,c,pct]) => (
              <div key={p} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}>
                  <span style={{color:c}}>{p}</span><span style={{color:'var(--text2)'}}>{pct}%</span>
                </div>
                <div style={{height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:pct+'%',background:c,borderRadius:3}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{marginTop:14}}>
        <div className="panel-header">Top Performing Posts</div>
        <div style={{padding:'13px 18px'}}>
          {[['My honest 90-day review of this WFH tool — it changed everything','12.4K eng.'],['5 productivity hacks that actually work (tested for 6 months)','9.1K eng.'],['Why I stopped using todo apps and switched to this instead','7.8K eng.']].map(([text,eng],i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 12px',background:'var(--bg3)',borderRadius:'var(--rs)',marginBottom:7}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'var(--ag)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--accent)',fontWeight:600,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{text}</div>
              <div style={{fontSize:12,color:'var(--text3)',flexShrink:0}}>{eng}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Compliance ───────────────────────────────────────────────────────────────
const RULES = [
  {ok:true, t:'Facebook — Promotional content',   s:'No banned phrases, image-to-text ratio within guidelines'},
  {ok:true, t:'Facebook — Affiliate disclosure',  s:'FTC disclosure auto-included in generated templates'},
  {ok:true, t:'Instagram — Hashtag count',        s:'Using up to 20 hashtags — within platform guidelines'},
  {ok:false,t:'Instagram — Story links',          s:'Link stickers require 10K+ followers or verified badge'},
  {ok:false,t:'Reddit — Self-promotion ratio',    s:'Keep 90/10 helpful-to-promotional ratio in target subreddits'},
  {ok:true, t:'All Platforms — Community standards', s:'No flagged language, misleading claims, or prohibited products'},
];

export function Compliance() {
  return (
    <div className="page-content">
      <h1 className="page-title serif">Compliance <span>Engine</span></h1>
      <p className="page-sub">Real-time scanning against Facebook, Instagram & Reddit policies</p>

      <div className="metrics-grid">
        {[{l:'Rules Checked',v:'94',c:'Per scan'},{l:'Pass Rate',v:'91%',c:'This month'},{l:'Auto-fixed',v:'23',c:'Issues resolved'},{l:'Pending',v:'3',c:'Need review'}].map(m => (
          <div key={m.l} className="metric-card">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value">{m.v}</div>
            <div className="metric-change">{m.c}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">Last Scan Results <button className="btn btn-ghost btn-sm">Scan New Post</button></div>
        <div style={{padding:'14px 18px'}}>
          {RULES.map((r,i) => (
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:9,padding:'9px 11px',borderRadius:'var(--rs)',background:'var(--bg3)',border:'1px solid var(--border)',marginBottom:7}}>
              <div style={{width:17,height:17,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,flexShrink:0,marginTop:1,background:r.ok?'rgba(34,201,138,.15)':'rgba(245,158,11,.15)',color:r.ok?'var(--ok)':'var(--warn)'}}>
                {r.ok?'✓':'!'}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{r.t}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{r.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
