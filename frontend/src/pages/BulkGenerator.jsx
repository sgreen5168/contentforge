import React, { useState, useEffect, useRef } from 'react';

const API = 'https://api.contentstudiohub.com';

const PERSONAS  = ['ugc','testimonial','demo','influencer','educator'];
const DURATIONS = ['15s','30s','45s','60s'];
const PLATFORMS = [
  { id:'tiktok',    label:'TikTok',          color:'#69C9D0' },
  { id:'instagram', label:'Instagram Reels', color:'#E1306C' },
  { id:'youtube',   label:'YouTube Shorts',  color:'#FF0000' },
  { id:'fb-reels',  label:'Facebook Reels',  color:'#1877F2' },
  { id:'reddit',    label:'Reddit',          color:'#FF4500' },
];
const VIDEO_TYPES = ['auto','ugc-persona','ai-vsl','reel-ads','product-ads','commercial','competitor'];

function statusColor(s) {
  return { completed:'#1D9E75', processing:'#5DCAA5', failed:'#E24B4A', queued:'#4A7A72' }[s] || '#7BAAA0';
}

function statusBg(s) {
  return { completed:'rgba(29,158,117,.15)', processing:'rgba(93,202,165,.1)', failed:'rgba(226,75,74,.1)', queued:'rgba(74,122,114,.15)' }[s] || 'transparent';
}

export default function BulkGenerator() {
  const [tab, setTab]           = useState('create');
  const [baseTopic, setBase]    = useState('');
  const [topics, setTopics]     = useState(Array(10).fill(''));
  const [count, setCount]       = useState(10);
  const [persona, setPersona]   = useState('ugc');
  const [duration, setDuration] = useState('30s');
  const [platforms, setPlats]   = useState(['tiktok']);
  const [videoType, setVType]   = useState('auto');
  const [concurrency, setConcur]= useState(2);
  const [mode, setMode]         = useState('variations'); // variations | manual
  const [generating, setGen]    = useState(false);
  const [loadingVars, setLV]    = useState(false);
  const [batchId, setBatchId]   = useState(null);
  const [batch, setBatch]       = useState(null);
  const [batches, setBatches]   = useState([]);
  const pollRef                 = useRef(null);

  useEffect(() => { loadBatches(); return () => clearInterval(pollRef.current); }, []);

  async function loadBatches() {
    try {
      const res = await fetch(`${API}/api/bulk`);
      const data = await res.json();
      setBatches(data.batches || []);
    } catch {}
  }

  async function generateVariations() {
    if (!baseTopic.trim()) return;
    setLV(true);
    try {
      const res = await fetch(`${API}/api/bulk/variations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseTopic, count, persona, videoType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const padded = [...data.topics];
      while (padded.length < 10) padded.push('');
      setTopics(padded.slice(0, 10));
    } catch (e) { alert('Failed: ' + e.message); }
    finally { setLV(false); }
  }

  function togglePlat(id) {
    setPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  function updateTopic(i, val) {
    const t = [...topics]; t[i] = val; setTopics(t);
  }

  const activeTopics = topics.filter(t => t.trim());

  async function startGeneration() {
    if (!activeTopics.length || !platforms.length) return;
    setGen(true); setBatch(null); setBatchId(null); setTab('progress');
    try {
      const res = await fetch(`${API}/api/bulk/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: activeTopics, persona, duration,
          style: 'ugc', platforms, videoType, concurrency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBatchId(data.batchId);
      pollBatch(data.batchId);
    } catch (e) { setGen(false); alert('Failed: ' + e.message); }
  }

  function pollBatch(id) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/bulk/${id}`);
        const data = await res.json();
        setBatch(data);
        if (data.status === 'completed') {
          clearInterval(pollRef.current);
          setGen(false);
          loadBatches();
        }
      } catch {}
    }, 3000);
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Bulk Generator <span style={S.badge}>Up to 10 videos</span></h1>
          <p style={S.sub}>Generate up to 10 unique videos at once — Claude writes each script independently</p>
        </div>
        {batch && (
          <div style={S.statRow}>
            <div style={S.stat}><span style={S.statVal}>{batch.completed}</span><span style={S.statLbl}>Done</span></div>
            <div style={S.stat}><span style={{...S.statVal,color:'#F09595'}}>{batch.failed}</span><span style={S.statLbl}>Failed</span></div>
            <div style={S.stat}><span style={S.statVal}>{batch.total - batch.completed - batch.failed}</span><span style={S.statLbl}>Remaining</span></div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabs}>
        {[['create','Create batch'],['progress','Progress'],['history','History']].map(([t,l])=>(
          <button key={t} style={{...S.tab,...(tab===t?S.tabActive:{})}} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── CREATE TAB ── */}
      {tab === 'create' && (
        <div style={S.grid}>
          <div style={S.panel}>
            <div style={S.panelHdr}>Topics</div>
            <div style={S.panelBody}>

              <div style={S.modeRow}>
                <button style={{...S.modeBtn,...(mode==='variations'?S.modeBtnActive:{})}} onClick={()=>setMode('variations')}>
                  ✦ Auto-generate variations
                </button>
                <button style={{...S.modeBtn,...(mode==='manual'?S.modeBtnActive:{})}} onClick={()=>setMode('manual')}>
                  ✎ Enter topics manually
                </button>
              </div>

              {mode === 'variations' && (
                <div style={S.varBox}>
                  <div style={S.fieldLbl}>Base topic</div>
                  <div style={{display:'flex',gap:8,marginBottom:12}}>
                    <input style={{...S.inp,flex:1,marginBottom:0}}
                      placeholder='"morning productivity habits"'
                      value={baseTopic} onChange={e=>setBase(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&generateVariations()}
                    />
                    <button style={{...S.genSmBtn,opacity:loadingVars||!baseTopic.trim()?0.45:1}}
                      onClick={generateVariations} disabled={loadingVars||!baseTopic.trim()}>
                      {loadingVars?'⏳':'✦ Generate'}
                    </button>
                  </div>
                  <div style={S.fieldLbl}>Number of videos</div>
                  <div style={S.countRow}>
                    {[3,5,7,10].map(n=>(
                      <button key={n} style={{...S.countBtn,...(count===n?S.countBtnActive:{})}} onClick={()=>setCount(n)}>{n}</button>
                    ))}
                  </div>
                  {topics.some(t=>t) && (
                    <div style={S.hint}>✅ {activeTopics.length} topics generated — review and edit below, or generate again</div>
                  )}
                </div>
              )}

              <div style={S.topicList}>
                {topics.map((topic, i) => (
                  <div key={i} style={S.topicRow}>
                    <div style={{...S.topicNum, background: topic.trim()?'rgba(29,158,117,.2)':'#163D6A', color: topic.trim()?'#5DCAA5':'#4A7A72'}}>
                      {i + 1}
                    </div>
                    <input
                      style={{...S.inp, flex:1, marginBottom:0, fontSize:12,
                        opacity: topic.trim()?1:0.5,
                        borderColor: topic.trim()?'rgba(29,158,117,.25)':'rgba(29,158,117,.1)'}}
                      placeholder={`Video ${i+1} topic (optional)`}
                      value={topic}
                      onChange={e=>updateTopic(i, e.target.value)}
                    />
                    {topic.trim() && (
                      <button style={S.clearBtn} onClick={()=>updateTopic(i,'')}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div style={S.topicFooter}>
                <span style={{fontSize:12,color:'#5DCAA5'}}>{activeTopics.length} active topics</span>
                <button style={S.clearAllBtn} onClick={()=>setTopics(Array(10).fill(''))}>Clear all</button>
              </div>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={S.panel}>
              <div style={S.panelHdr}>Settings</div>
              <div style={S.panelBody}>
                <div style={S.fieldLbl}>Persona</div>
                <div style={S.chipRow}>
                  {PERSONAS.map(p=>(
                    <button key={p} style={{...S.chip,...(persona===p?S.chipActive:{})}} onClick={()=>setPersona(p)}>{p}</button>
                  ))}
                </div>

                <div style={S.fieldLbl}>Duration</div>
                <div style={S.chipRow}>
                  {DURATIONS.map(d=>(
                    <button key={d} style={{...S.chip,...(duration===d?S.chipActive:{})}} onClick={()=>setDuration(d)}>{d}</button>
                  ))}
                </div>

                <div style={S.fieldLbl}>Video type</div>
                <select style={S.sel} value={videoType} onChange={e=>setVType(e.target.value)}>
                  {VIDEO_TYPES.map(v=><option key={v} value={v}>{v.replace('-',' ')}</option>)}
                </select>

                <div style={S.fieldLbl}>Platforms</div>
                <div style={S.platGrid}>
                  {PLATFORMS.map(p=>(
                    <button key={p.id} style={{...S.platChip,...(platforms.includes(p.id)?{borderColor:p.color,background:`${p.color}15`}:{})}}
                      onClick={()=>togglePlat(p.id)}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:p.color,flexShrink:0}} />
                      <span style={{fontSize:11,color:'#E8F4F0'}}>{p.label}</span>
                    </button>
                  ))}
                </div>

                <div style={S.fieldLbl}>Concurrency (videos at once)</div>
                <div style={S.chipRow}>
                  {[1,2,3].map(n=>(
                    <button key={n} style={{...S.chip,...(concurrency===n?S.chipActive:{})}} onClick={()=>setConcur(n)}>
                      {n} {n===1?'(slower, cheaper)':n===2?'(balanced)':'(fastest)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={S.panel}>
              <div style={S.panelBody}>
                <div style={S.costCard}>
                  <div style={S.costTitle}>Estimated batch cost</div>
                  <div style={S.costRow2}><span>Videos</span><span>{activeTopics.length}</span></div>
                  <div style={S.costRow2}><span>Script (Claude)</span><span>${(activeTopics.length * 0.01).toFixed(2)}</span></div>
                  <div style={S.costRow2}><span>Voiceover (ElevenLabs)</span><span>${(activeTopics.length * 0.05).toFixed(2)}</span></div>
                  <div style={S.costRow2}><span>Video clip (RunwayML)</span><span>${(activeTopics.length * 0.25).toFixed(2)}</span></div>
                  <div style={S.costTotal2}><span>Total estimate</span><span>${(activeTopics.length * 0.31).toFixed(2)}</span></div>
                </div>

                <button
                  style={{...S.genBtn, opacity: generating||!activeTopics.length||!platforms.length?0.4:1}}
                  onClick={startGeneration}
                  disabled={generating||!activeTopics.length||!platforms.length}
                >
                  {generating
                    ? '⏳ Generating...'
                    : `Generate ${activeTopics.length} Videos ⚡`}
                </button>

                {!activeTopics.length && (
                  <div style={{fontSize:12,color:'#4A7A72',textAlign:'center',marginTop:8}}>
                    Add topics above or use auto-generate
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div>
          {!batch && !generating && (
            <div style={S.empty}>
              <div style={{fontSize:32,marginBottom:12}}>⚡</div>
              <div style={{fontSize:14,fontWeight:500,color:'#7BAAA0'}}>No batch running</div>
              <div style={{fontSize:12,color:'#4A7A72',marginTop:4}}>Go to Create batch tab to start generating</div>
            </div>
          )}
          {batch && (
            <div>
              {/* Overall progress */}
              <div style={S.panel}>
                <div style={S.panelBody}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{fontSize:13,fontWeight:500,color:'#E8F4F0'}}>Batch progress</span>
                    <span style={{...S.statusPill, background:statusBg(batch.status), color:statusColor(batch.status)}}>
                      {batch.status}
                    </span>
                  </div>
                  <div style={S.bigProgBar}>
                    <div style={{...S.bigProgFill, width:batch.progress+'%'}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:12,color:'#7BAAA0'}}>
                    <span>{batch.completed} of {batch.total} complete</span>
                    <span>{batch.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Individual video cards */}
              <div style={S.videoGrid}>
                {batch.jobs.map((job, i) => (
                  <div key={i} style={{...S.videoCard, borderColor: `${statusColor(job.status)}30`}}>
                    <div style={S.videoCardTop}>
                      <div style={{...S.videoNum, background:statusBg(job.status), color:statusColor(job.status)}}>{job.index}</div>
                      <span style={{...S.statusPill, background:statusBg(job.status), color:statusColor(job.status), fontSize:10}}>{job.status}</span>
                    </div>
                    <div style={S.videoTopic}>{job.topic}</div>
                    <div style={S.miniProgBar}>
                      <div style={{...S.miniProgFill, width:job.progress+'%', background:statusColor(job.status)}} />
                    </div>
                    <div style={S.videoStep}>{job.step}</div>
                    {job.status==='completed' && job.result?.script && (
                      <div style={S.hookPreview}>"{job.result.script.hook}"</div>
                    )}
                    {job.status==='completed' && job.result?.clipUrl && (
                      <a href={job.result.clipUrl} target="_blank" rel="noreferrer" style={S.viewClipBtn}>View clip ↗</a>
                    )}
                    {job.status==='failed' && (
                      <div style={S.errorMsg}>⚠ {job.error}</div>
                    )}
                  </div>
                ))}
              </div>

              {batch.status==='completed' && (
                <div style={S.doneBox}>
                  🎉 Batch complete — {batch.completed} videos generated, {batch.failed} failed
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          {batches.length === 0 ? (
            <div style={S.empty}>
              <div style={{fontSize:32,marginBottom:12}}>📋</div>
              <div style={{fontSize:14,fontWeight:500,color:'#7BAAA0'}}>No batches yet</div>
            </div>
          ) : batches.map(b => (
            <div key={b.batchId} style={{...S.panel,marginBottom:10,cursor:'pointer'}}
              onClick={()=>{setBatch(b);setBatchId(b.batchId);setTab('progress')}}>
              <div style={S.panelBody}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{...S.statusPill,background:statusBg(b.status),color:statusColor(b.status)}}>{b.status}</span>
                  <span style={{fontSize:13,color:'#E8F4F0',flex:1}}>{b.total} videos · {b.settings?.persona} · {b.settings?.duration}</span>
                  <span style={{fontSize:11,color:'#4A7A72'}}>{new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{marginTop:8}}>
                  <div style={S.bigProgBar}>
                    <div style={{...S.bigProgFill,width:b.progress+'%'}} />
                  </div>
                </div>
                <div style={{display:'flex',gap:12,marginTop:6,fontSize:11,color:'#7BAAA0'}}>
                  <span>✅ {b.completed} completed</span>
                  <span>❌ {b.failed} failed</span>
                  <span>📹 {b.total} total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  page:      { padding:24, minHeight:'100vh', background:'#0D2137', maxWidth:1200 },
  header:    { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 },
  title:     { fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  badge:     { fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(29,158,117,.2)', color:'#5DCAA5', fontWeight:500 },
  sub:       { fontSize:13, color:'#7BAAA0', marginTop:4 },
  statRow:   { display:'flex', gap:16 },
  stat:      { display:'flex', flexDirection:'column', alignItems:'center', background:'#102D4F', border:'0.5px solid rgba(29,158,117,.15)', borderRadius:8, padding:'8px 16px' },
  statVal:   { fontSize:20, fontWeight:500, color:'#5DCAA5' },
  statLbl:   { fontSize:10, color:'#4A7A72', marginTop:2 },
  tabs:      { display:'flex', borderBottom:'0.5px solid rgba(29,158,117,.15)', marginBottom:16 },
  tab:       { padding:'9px 16px', fontSize:13, border:'none', background:'none', cursor:'pointer', color:'#7BAAA0', borderBottom:'2px solid transparent', fontFamily:'inherit', transition:'all .15s' },
  tabActive: { color:'#5DCAA5', borderBottomColor:'#1D9E75' },
  grid:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  panel:     { background:'#102D4F', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden' },
  panelHdr:  { padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
  panelBody: { padding:'14px 16px' },
  fieldLbl:  { fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:6, display:'block' },
  inp:       { width:'100%', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', marginBottom:11, boxSizing:'border-box' },
  sel:       { width:'100%', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', marginBottom:11 },
  modeRow:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 },
  modeBtn:   { padding:'8px', border:'0.5px solid rgba(29,158,117,.15)', borderRadius:8, background:'#163D6A', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit', fontSize:12, transition:'all .15s' },
  modeBtnActive:{ borderColor:'#1D9E75', background:'rgba(29,158,117,.12)', color:'#5DCAA5' },
  varBox:    { background:'#163D6A', borderRadius:8, padding:12, marginBottom:12 },
  genSmBtn:  { background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' },
  countRow:  { display:'flex', gap:6, marginBottom:8 },
  countBtn:  { padding:'5px 14px', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:20, background:'none', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit', fontSize:12 },
  countBtnActive:{ borderColor:'#1D9E75', background:'rgba(29,158,117,.15)', color:'#5DCAA5', fontWeight:500 },
  hint:      { fontSize:11, color:'#5DCAA5', background:'rgba(29,158,117,.1)', borderRadius:6, padding:'6px 10px', marginTop:6 },
  topicList: { display:'flex', flexDirection:'column', gap:6, marginBottom:10 },
  topicRow:  { display:'flex', alignItems:'center', gap:8 },
  topicNum:  { width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, flexShrink:0 },
  clearBtn:  { background:'none', border:'none', color:'#4A7A72', cursor:'pointer', fontSize:14, padding:'0 4px', fontFamily:'inherit' },
  topicFooter:{ display:'flex', alignItems:'center', justifyContent:'space-between' },
  clearAllBtn:{ fontSize:11, color:'#4A7A72', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' },
  chipRow:   { display:'flex', gap:5, flexWrap:'wrap', marginBottom:11 },
  chip:      { padding:'4px 11px', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:20, fontSize:11, cursor:'pointer', background:'none', color:'#7BAAA0', fontFamily:'inherit', transition:'all .15s' },
  chipActive:{ borderColor:'#1D9E75', background:'rgba(29,158,117,.15)', color:'#5DCAA5', fontWeight:500 },
  platGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginBottom:11 },
  platChip:  { display:'flex', alignItems:'center', gap:6, padding:'6px 10px', border:'0.5px solid rgba(29,158,117,.15)', borderRadius:8, cursor:'pointer', background:'#163D6A', fontFamily:'inherit' },
  costCard:  { background:'#163D6A', borderRadius:8, padding:12, marginBottom:12 },
  costTitle: { fontSize:12, fontWeight:500, color:'#E8F4F0', marginBottom:8 },
  costRow2:  { display:'flex', justifyContent:'space-between', fontSize:12, color:'#7BAAA0', padding:'2px 0' },
  costTotal2:{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:500, color:'#5DCAA5', borderTop:'0.5px solid rgba(29,158,117,.15)', marginTop:6, paddingTop:6 },
  genBtn:    { width:'100%', background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'11px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  empty:     { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center' },
  bigProgBar:{ height:8, background:'#163D6A', borderRadius:4, overflow:'hidden' },
  bigProgFill:{ height:'100%', background:'#1D9E75', borderRadius:4, transition:'width .5s' },
  videoGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginTop:12 },
  videoCard: { background:'#102D4F', border:'0.5px solid', borderRadius:10, padding:14 },
  videoCardTop:{ display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  videoNum:  { width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, flexShrink:0 },
  statusPill:{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:500 },
  videoTopic:{ fontSize:12, color:'#E8F4F0', marginBottom:8, lineHeight:1.4 },
  miniProgBar:{ height:3, background:'#163D6A', borderRadius:2, overflow:'hidden', marginBottom:5 },
  miniProgFill:{ height:'100%', borderRadius:2, transition:'width .5s' },
  videoStep: { fontSize:11, color:'#7BAAA0' },
  hookPreview:{ fontSize:11, color:'#5DCAA5', fontStyle:'italic', marginTop:6, lineHeight:1.4 },
  viewClipBtn:{ display:'inline-block', marginTop:6, fontSize:11, color:'#5DCAA5', textDecoration:'none' },
  errorMsg:  { fontSize:11, color:'#F09595', marginTop:5 },
  doneBox:   { background:'rgba(29,158,117,.12)', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:10, padding:'14px 16px', fontSize:13, color:'#5DCAA5', textAlign:'center', marginTop:14 },
};
