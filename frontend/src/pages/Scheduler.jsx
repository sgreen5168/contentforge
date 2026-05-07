import React, { useState, useEffect } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',          color: '#69C9D0', maxSec: 600 },
  { id: 'instagram', label: 'Instagram Reels',  color: '#E1306C', maxSec: 90  },
  { id: 'youtube',   label: 'YouTube Shorts',   color: '#FF0000', maxSec: 60  },
  { id: 'fb-reels',  label: 'Facebook Reels',   color: '#1877F2', maxSec: 90  },
  { id: 'fb-feed',   label: 'Facebook Feed',    color: '#1877F2', maxSec: 14400 },
  { id: 'reddit',    label: 'Reddit',           color: '#FF4500', maxSec: 900 },
];

const OPTIMAL = {
  tiktok:    ['7:00 PM — Peak engagement', '9:00 AM — Morning scroll', 'Tue 8:00 PM — Best slot'],
  instagram: ['11:00 AM — Peak Reels', '7:00 PM — Evening', 'Wed 11:00 AM — Highest reach'],
  youtube:   ['3:00 PM — Shorts peak', 'Sat 11:00 AM — Weekend', 'Sun 5:00 PM — End of weekend'],
  'fb-reels':['1:00 PM — Lunch scroll', '9:00 AM — Morning', 'Wed 1:00 PM — Best day'],
  'fb-feed': ['9:00 AM — Morning feed', '1:00 PM — Lunch', 'Thu 1:00 PM — Top slot'],
  reddit:    ['8:00 AM ET — Morning peak', 'Mon 8:00 AM ET — Highest traffic', '12:00 PM — Midday'],
};

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
}

function statusColor(s) {
  return { scheduled:'#5DCAA5', published:'#1D9E75', failed:'#E24B4A', cancelled:'#4A7A72' }[s] || '#7BAAA0';
}

export default function Scheduler() {
  const [schedules, setSchedules]   = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [selJob, setSelJob]         = useState('');
  const [selPlats, setSelPlats]     = useState(['tiktok']);
  const [schedDate, setSchedDate]   = useState('');
  const [schedTime, setSchedTime]   = useState('19:00');
  const [useOptimal, setOptimal]    = useState(false);
  const [optPlat, setOptPlat]       = useState('tiktok');
  const [saving, setSaving]         = useState(false);
  const [view, setView]             = useState('upcoming');

  useEffect(() => {
    loadSchedules();
    loadJobs();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSchedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  async function loadSchedules() {
    try {
      const res = await fetch(`${API}/api/schedule`);
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (e) { console.warn('Failed to load schedules'); }
  }

  async function loadJobs() {
    try {
      const res = await fetch(`${API}/api/video/jobs`);
      const data = await res.json();
      setJobs((data || []).filter(j => j.status === 'completed'));
    } catch {}
  }

  function togglePlat(id) {
    setSelPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  function applyOptimalTime(platId, timeStr) {
    const [h, m] = timeStr.split(':')[0].split(' ')[0].split(':');
    const isPM = timeStr.includes('PM');
    let hour = parseInt(h);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    setSchedTime(`${String(hour).padStart(2,'0')}:${m || '00'}`);
  }

  async function createSchedule() {
    if (!selPlats.length || !schedDate || !schedTime) return;
    setSaving(true);
    try {
      const scheduledAt = new Date(`${schedDate}T${schedTime}:00`).toISOString();
      const job = jobs.find(j => j.id === selJob);
      const res = await fetch(`${API}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selJob || null,
          platforms: selPlats,
          scheduledAt,
          script: job?.result?.script || null,
          videoUrl: job?.result?.finalVideoUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to schedule');
      await loadSchedules();
      setSelJob('');
      setSelPlats(['tiktok']);
    } catch (e) { alert('Schedule failed: ' + e.message); }
    finally { setSaving(false); }
  }

  async function cancelSched(id) {
    await fetch(`${API}/api/schedule/${id}`, { method: 'DELETE' });
    await loadSchedules();
  }

  const upcoming  = schedules.filter(s => s.status === 'scheduled');
  const published = schedules.filter(s => s.status === 'published');
  const shown     = view === 'upcoming' ? upcoming : published;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Scheduled Posts <span style={S.badge}>Auto-publisher</span></h1>
          <p style={S.sub}>Schedule videos to post at peak times across all platforms</p>
        </div>
        <div style={S.headerRight}>
          <span style={S.pill}>{upcoming.length} upcoming</span>
          <span style={{...S.pill, background:'rgba(29,158,117,.15)', color:'#5DCAA5', borderColor:'rgba(29,158,117,.2)'}}>{published.length} published</span>
        </div>
      </div>

      <div style={S.grid}>
        {/* ── CREATE PANEL ── */}
        <div style={S.panel}>
          <div style={S.panelHdr}>Schedule a post</div>
          <div style={S.panelBody}>

            <div style={S.fieldLbl}>Video to post</div>
            <select style={S.sel} value={selJob} onChange={e=>setSelJob(e.target.value)}>
              <option value="">— Select a completed video —</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.data?.topic || j.data?.url || 'Video'} · {j.data?.duration}
                </option>
              ))}
            </select>
            {jobs.length === 0 && (
              <div style={{...S.hint, marginTop:0}}>⚠ No completed videos yet — go to <b>AI Video Engine</b> tab to generate your first video, then come back to schedule it.</div>
            )}

            <div style={S.fieldLbl}>Publish to</div>
            <div style={S.platGrid}>
              {PLATFORMS.map(p => (
                <button key={p.id} style={{...S.platChip, ...(selPlats.includes(p.id)?{border:`0.5px solid ${p.color}`,background:`${p.color}18`}:{})}}
                  onClick={()=>togglePlat(p.id)}>
                  <span style={{...S.platDot, background:p.color}} />
                  <span style={S.platName}>{p.label}</span>
                  {selPlats.includes(p.id) && <span style={{...S.checkMark, color:p.color}}>✓</span>}
                </button>
              ))}
            </div>

            {/* Optimal times */}
            <div style={S.optRow}>
              <span style={S.fieldLbl} >Optimal times</span>
              <select style={{...S.sel, marginBottom:0, flex:1}} value={optPlat} onChange={e=>setOptPlat(e.target.value)}>
                {PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div style={S.optSlots}>
              {(OPTIMAL[optPlat]||[]).map((t,i) => (
                <button key={i} style={S.optSlot} onClick={()=>applyOptimalTime(optPlat,t)}>
                  <span style={S.optTime}>{t.split('—')[0].trim()}</span>
                  <span style={S.optDesc}>{t.split('—')[1]?.trim()}</span>
                </button>
              ))}
            </div>

            <div style={S.dateRow}>
              <div style={{flex:1}}>
                <div style={S.fieldLbl}>Date</div>
                <input type="date" style={S.inp} value={schedDate} onChange={e=>setSchedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div style={{flex:1}}>
                <div style={S.fieldLbl}>Time (your timezone)</div>
                <input type="time" style={S.inp} value={schedTime} onChange={e=>setSchedTime(e.target.value)} />
              </div>
            </div>

            {schedDate && schedTime && (
              <div style={S.previewBox}>
                📅 Will post on <strong>{fmt(new Date(`${schedDate}T${schedTime}`).toISOString())}</strong>
                {' '}to {selPlats.length} platform{selPlats.length!==1?'s':''}
              </div>
            )}

            <button style={{...S.genBtn, opacity: saving||!selPlats.length||!schedDate?0.45:1}}
              onClick={createSchedule} disabled={saving||!selPlats.length||!schedDate}>
              {saving ? '⏳ Scheduling…' : 'Schedule Post 📅'}
            </button>
          </div>
        </div>

        {/* ── SCHEDULE LIST ── */}
        <div style={S.panel}>
          <div style={{...S.panelHdr, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span>Posts</span>
            <div style={{display:'flex',gap:4}}>
              {['upcoming','published'].map(v=>(
                <button key={v} onClick={()=>setView(v)}
                  style={{...S.viewBtn, ...(view===v?S.viewBtnActive:{})}}>
                  {v.charAt(0).toUpperCase()+v.slice(1)} ({v==='upcoming'?upcoming.length:published.length})
                </button>
              ))}
            </div>
          </div>
          <div style={S.panelBody}>
            {shown.length === 0 ? (
              <div style={S.empty}>
                <div style={{fontSize:28,marginBottom:10}}>📅</div>
                <div style={{fontSize:14,fontWeight:500,color:'#7BAAA0'}}>
                  {view==='upcoming' ? 'No upcoming posts' : 'No published posts yet'}
                </div>
                <div style={{fontSize:12,color:'#4A7A72',marginTop:4}}>
                  {view==='upcoming' ? 'Create a schedule on the left' : 'Published posts will appear here'}
                </div>
              </div>
            ) : shown.map(s => (
              <div key={s.id} style={S.schedRow}>
                <div style={S.schedTop}>
                  <span style={{...S.statusPill, background:`${statusColor(s.status)}20`, color:statusColor(s.status), border:`0.5px solid ${statusColor(s.status)}40`}}>
                    {s.status}
                  </span>
                  <span style={S.schedTime}>{fmt(s.scheduledAt)}</span>
                  {s.status==='scheduled' && (
                    <button style={S.cancelBtn} onClick={()=>cancelSched(s.id)}>Cancel</button>
                  )}
                </div>
                <div style={S.schedPlats}>
                  {(s.platforms||[]).map(p => {
                    const plt = PLATFORMS.find(pl=>pl.id===p);
                    return <span key={p} style={{...S.platTag, background:`${plt?.color||'#666'}18`, color:plt?.color||'#666', border:`0.5px solid ${plt?.color||'#666'}30`}}>{plt?.label||p}</span>;
                  })}
                </div>
                {s.script?.hook && <div style={S.schedHook}>"{s.script.hook}"</div>}
                {s.videoUrl && <div style={S.schedVideo}>🎬 Video ready for upload</div>}
                {s.results?.length > 0 && (
                  <div style={S.results}>
                    {s.results.map((r,i)=>(
                      <span key={i} style={{...S.resultPill, background: r.status==='failed'?'rgba(226,75,74,.1)':'rgba(29,158,117,.1)', color: r.status==='failed'?'#F09595':'#5DCAA5'}}>
                        {r.platform} — {r.status}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Best times reference ── */}
      <div style={S.panel}>
        <div style={S.panelHdr}>Peak posting times by platform</div>
        <div style={{...S.panelBody, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
          {PLATFORMS.map(p => (
            <div key={p.id} style={S.bestCard}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                <span style={{...S.platDot, width:9, height:9, background:p.color}} />
                <span style={{fontSize:13,fontWeight:500,color:'#E8F4F0'}}>{p.label}</span>
              </div>
              {(OPTIMAL[p.id]||[]).map((t,i)=>(
                <div key={i} style={S.bestSlot}>
                  <span style={{fontSize:11,color:'#5DCAA5',fontWeight:500}}>{t.split('—')[0].trim()}</span>
                  <span style={{fontSize:11,color:'#4A7A72',marginLeft:4}}>— {t.split('—')[1]?.trim()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:        { padding:24, minHeight:'100vh', background:'#0D2137', maxWidth:1200 },
  header:      { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 },
  title:       { fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 },
  badge:       { fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(29,158,117,.2)', color:'#5DCAA5', fontWeight:500 },
  sub:         { fontSize:13, color:'#7BAAA0', marginTop:4 },
  headerRight: { display:'flex', gap:8, alignItems:'center' },
  pill:        { fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(22,61,106,.6)', color:'#7BAAA0', border:'0.5px solid rgba(29,158,117,.15)' },
  grid:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 },
  panel:       { background:'#102D4F', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden', marginBottom:0 },
  panelHdr:    { padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
  panelBody:   { padding:'14px 16px' },
  fieldLbl:    { fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:5, display:'block' },
  sel:         { width:'100%', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', marginBottom:12 },
  inp:         { width:'100%', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', colorScheme:'dark' },
  hint:        { fontSize:12, color:'#4A7A72', marginBottom:12, padding:'8px 10px', background:'#163D6A', borderRadius:8 },
  platGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 },
  platChip:    { display:'flex', alignItems:'center', gap:7, padding:'7px 10px', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:8, cursor:'pointer', background:'#163D6A', fontFamily:'inherit', transition:'all .15s', textAlign:'left' },
  platDot:     { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  platName:    { fontSize:12, fontWeight:500, color:'#E8F4F0', flex:1 },
  checkMark:   { fontSize:12, fontWeight:500 },
  optRow:      { display:'flex', alignItems:'center', gap:10, marginBottom:8 },
  optSlots:    { display:'flex', flexDirection:'column', gap:5, marginBottom:12 },
  optSlot:     { display:'flex', alignItems:'center', gap:8, padding:'7px 10px', border:'0.5px solid rgba(29,158,117,.15)', borderRadius:8, cursor:'pointer', background:'#163D6A', fontFamily:'inherit', textAlign:'left', transition:'all .15s' },
  optTime:     { fontSize:12, fontWeight:500, color:'#5DCAA5', width:80, flexShrink:0 },
  optDesc:     { fontSize:12, color:'#7BAAA0' },
  dateRow:     { display:'flex', gap:10, marginBottom:12 },
  previewBox:  { background:'rgba(29,158,117,.1)', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:8, padding:'9px 12px', fontSize:12, color:'#5DCAA5', marginBottom:12, lineHeight:1.5 },
  genBtn:      { width:'100%', background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  viewBtn:     { fontSize:11, padding:'4px 10px', borderRadius:6, border:'0.5px solid rgba(29,158,117,.2)', background:'none', color:'#7BAAA0', cursor:'pointer', fontFamily:'inherit' },
  viewBtnActive:{ background:'rgba(29,158,117,.15)', color:'#5DCAA5', borderColor:'rgba(29,158,117,.3)' },
  empty:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', textAlign:'center' },
  schedRow:    { background:'#163D6A', border:'0.5px solid rgba(29,158,117,.15)', borderRadius:10, padding:'12px 14px', marginBottom:8 },
  schedTop:    { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  statusPill:  { fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:500 },
  schedTime:   { fontSize:12, color:'#E8F4F0', flex:1 },
  cancelBtn:   { fontSize:11, padding:'3px 8px', borderRadius:6, border:'0.5px solid rgba(226,75,74,.3)', background:'rgba(226,75,74,.1)', color:'#F09595', cursor:'pointer', fontFamily:'inherit' },
  schedPlats:  { display:'flex', gap:5, flexWrap:'wrap', marginBottom:6 },
  platTag:     { fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:500 },
  schedHook:   { fontSize:12, color:'#7BAAA0', fontStyle:'italic', marginTop:4, lineHeight:1.4 },
  schedVideo:  { fontSize:11, color:'#5DCAA5', marginTop:4 },
  results:     { display:'flex', gap:5, flexWrap:'wrap', marginTop:6 },
  resultPill:  { fontSize:11, padding:'2px 8px', borderRadius:10 },
  bestCard:    { background:'#163D6A', border:'0.5px solid rgba(29,158,117,.15)', borderRadius:10, padding:'12px 14px' },
  bestSlot:    { marginBottom:4, lineHeight:1.4 },
};
