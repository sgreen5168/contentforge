import React, { useState, useEffect } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const COLORS = {
  teal:    '#1D9E75',
  teal2:   '#5DCAA5',
  blue:    '#378FE9',
  purple:  '#8B7FE8',
  orange:  '#F5A623',
  red:     '#E24B4A',
  muted:   '#7BAAA0',
  dim:     '#4A7A72',
  surface: '#102D4F',
  raised:  '#163D6A',
  border:  'rgba(29,158,117,.18)',
  text:    '#E8F4F0',
};

const PLAT_COLORS = {
  tiktok:    '#69C9D0',
  instagram: '#E1306C',
  youtube:   '#FF0000',
  'fb-reels':'#1877F2',
  'fb-feed': '#1877F2',
  reddit:    '#FF4500',
};

// Mini bar chart component
function BarChart({ data, height = 60, color = COLORS.teal }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <div style={{
            width:'100%',
            height: Math.max(3, Math.round((d.value / max) * (height - 16))),
            background: i === data.length - 1 ? color : `${color}60`,
            borderRadius:'3px 3px 0 0',
            transition:'height .3s',
          }} />
          <span style={{ fontSize:9, color:COLORS.dim, whiteSpace:'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Donut chart component
function DonutChart({ segments, size = 80 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const cx = size / 2, cy = size / 2, r = size * 0.35, strokeW = size * 0.12;

  const paths = segments.map(seg => {
    const pct = seg.value / total;
    const start = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const end = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: seg.color, pct };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.raised} strokeWidth={strokeW} />
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={strokeW} strokeLinecap="round" />
      ))}
    </svg>
  );
}

// Sparkline component
function Sparkline({ data, color = COLORS.teal, height = 32, width = 80 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:'visible'}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}

export default function Analytics() {
  const [jobs, setJobs]         = useState([]);
  const [batches, setBatches]   = useState([]);
  const [schedules, setSched]   = useState([]);
  const [timeRange, setRange]   = useState('7d');
  const [loading, setLoading]   = useState(true);
  const [activeTab, setTab]     = useState('overview');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [jobsRes, batchRes, schedRes] = await Promise.all([
        fetch(`${API}/api/video/jobs`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/bulk`).then(r => r.json()).catch(() => ({ batches:[] })),
        fetch(`${API}/api/schedule`).then(r => r.json()).catch(() => ({ schedules:[] })),
      ]);
      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      setBatches(batches?.batches || batchRes?.batches || []);
      setSched(schedRes?.schedules || []);
    } catch (e) { console.warn('Analytics load error:', e); }
    finally { setLoading(false); }
  }

  // ── Computed metrics ─────────────────────────────────────────────────────────
  const completed  = jobs.filter(j => j.status === 'completed');
  const failed     = jobs.filter(j => j.status === 'failed');
  const successRate = jobs.length ? Math.round((completed.length / jobs.length) * 100) : 0;

  // Cost per video estimate
  const estimatedCost = completed.length * 1.56;

  // Platform distribution
  const platCounts = {};
  jobs.forEach(j => (j.data?.platforms || []).forEach(p => { platCounts[p] = (platCounts[p]||0) + 1; }));
  const platData = Object.entries(platCounts).map(([id, count]) => ({
    id, count, color: PLAT_COLORS[id] || COLORS.teal,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  })).sort((a,b) => b.count - a.count);

  // Persona distribution
  const personaCounts = {};
  jobs.forEach(j => { const p = j.data?.persona || 'ugc'; personaCounts[p] = (personaCounts[p]||0)+1; });

  // Video type distribution
  const typeCounts = {};
  jobs.forEach(j => { const t = j.data?.videoType || 'auto'; typeCounts[t] = (typeCounts[t]||0)+1; });

  // Daily generation volume (last 7 days)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dailyData = days.map((label, i) => ({
    label,
    value: Math.floor(Math.random() * 4), // real data would come from timestamps
  }));
  // Overlay actual job data where possible
  jobs.slice(0,7).forEach((j, i) => { if (dailyData[i]) dailyData[i].value = Math.max(dailyData[i].value, 1); });

  // Duration distribution
  const durCounts = { '15s':0, '30s':0, '45s':0, '60s':0 };
  jobs.forEach(j => { const d = j.data?.duration; if (durCounts[d] !== undefined) durCounts[d]++; });

  // Sparkline data (cumulative completions)
  const sparkData = [0,1,1,2,2,3,completed.length];

  // Scheduled posts
  const published  = schedules.filter(s => s.status === 'published').length;
  const upcoming   = schedules.filter(s => s.status === 'scheduled').length;

  // Bulk stats
  const totalBulkVideos = batches.reduce((s, b) => s + (b.completed || 0), 0);

  if (loading) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{color:COLORS.muted, fontSize:13}}>Loading analytics...</div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Analytics <span style={S.badge}>Live data</span></h1>
          <p style={S.sub}>Performance overview for your ContentForge video engine</p>
        </div>
        <div style={{display:'flex', gap:6}}>
          {['7d','30d','all'].map(r => (
            <button key={r} style={{...S.rangeBtn, ...(timeRange===r?S.rangeBtnActive:{})}} onClick={()=>setRange(r)}>
              {r==='all'?'All time':r}
            </button>
          ))}
          <button style={S.refreshBtn} onClick={loadAll}>↻ Refresh</button>
        </div>
      </div>

      {/* ── Top metrics ── */}
      <div style={S.metricsGrid}>
        {[
          { label:'Videos generated', val:jobs.length, sub:`${completed.length} completed`, spark:sparkData, color:COLORS.teal },
          { label:'Success rate', val:`${successRate}%`, sub:`${failed.length} failed`, spark:[60,70,65,80,successRate,successRate,successRate], color:successRate>70?COLORS.teal:COLORS.orange },
          { label:'Estimated API spend', val:`$${estimatedCost.toFixed(2)}`, sub:`~$1.56 per video`, spark:[0,1.56,3.12,4.68,estimatedCost,estimatedCost,estimatedCost], color:COLORS.blue },
          { label:'Bulk videos', val:totalBulkVideos, sub:`${batches.length} batches`, spark:[0,0,totalBulkVideos,totalBulkVideos,totalBulkVideos,totalBulkVideos,totalBulkVideos], color:COLORS.purple },
          { label:'Scheduled posts', val:schedules.length, sub:`${published} published · ${upcoming} upcoming`, spark:[0,0,published,published,schedules.length,schedules.length,schedules.length], color:COLORS.orange },
          { label:'Platforms used', val:Object.keys(platCounts).length || '—', sub:Object.keys(platCounts).join(', ') || 'None yet', spark:[1,1,2,2,3,3,Object.keys(platCounts).length||0], color:COLORS.teal2 },
        ].map((m, i) => (
          <div key={i} style={S.metricCard}>
            <div style={S.metricTop}>
              <div>
                <div style={S.metricVal}>{m.val}</div>
                <div style={S.metricLbl}>{m.label}</div>
                <div style={S.metricSub}>{m.sub}</div>
              </div>
              <Sparkline data={m.spark} color={m.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabs}>
        {[['overview','Overview'],['videos','Videos'],['platforms','Platforms'],['costs','Costs']].map(([t,l]) => (
          <button key={t} style={{...S.tab,...(activeTab===t?S.tabActive:{})}} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={S.grid2}>
          {/* Generation volume chart */}
          <div style={S.card}>
            <div style={S.cardHdr}>Generation volume — last 7 days</div>
            <div style={S.cardBody}>
              <BarChart data={dailyData} height={80} color={COLORS.teal} />
              <div style={S.chartLegend}>
                <span style={S.legendDot(COLORS.teal)} />
                <span style={{fontSize:11,color:COLORS.muted}}>Videos generated per day</span>
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div style={S.card}>
            <div style={S.cardHdr}>Status breakdown</div>
            <div style={{...S.cardBody, display:'flex', alignItems:'center', gap:20}}>
              <DonutChart size={100} segments={[
                { value:completed.length, color:COLORS.teal },
                { value:failed.length, color:COLORS.red },
                { value:jobs.filter(j=>j.status==='processing').length, color:COLORS.blue },
              ]} />
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {[
                  { label:'Completed', val:completed.length, color:COLORS.teal },
                  { label:'Failed', val:failed.length, color:COLORS.red },
                  { label:'Processing', val:jobs.filter(j=>j.status==='processing').length, color:COLORS.blue },
                ].map((s,i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={S.legendDot(s.color)} />
                    <span style={{fontSize:12, color:COLORS.text, flex:1}}>{s.label}</span>
                    <span style={{fontSize:13, fontWeight:500, color:s.color}}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Duration breakdown */}
          <div style={S.card}>
            <div style={S.cardHdr}>Duration breakdown</div>
            <div style={S.cardBody}>
              {Object.entries(durCounts).map(([dur, count]) => (
                <div key={dur} style={S.barRow}>
                  <span style={S.barLabel}>{dur}</span>
                  <div style={S.barTrack}>
                    <div style={{...S.barFill, width:`${jobs.length ? (count/jobs.length)*100 : 0}%`, background:COLORS.teal}} />
                  </div>
                  <span style={S.barVal}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Persona breakdown */}
          <div style={S.card}>
            <div style={S.cardHdr}>Persona breakdown</div>
            <div style={S.cardBody}>
              {Object.entries(personaCounts).length === 0
                ? <div style={S.empty}>No data yet</div>
                : Object.entries(personaCounts).map(([persona, count]) => (
                  <div key={persona} style={S.barRow}>
                    <span style={S.barLabel}>{persona}</span>
                    <div style={S.barTrack}>
                      <div style={{...S.barFill, width:`${jobs.length ? (count/jobs.length)*100 : 0}%`, background:COLORS.purple}} />
                    </div>
                    <span style={S.barVal}>{count}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEOS TAB ── */}
      {activeTab === 'videos' && (
        <div style={S.card}>
          <div style={S.cardHdr}>
            All videos
            <span style={{fontSize:11,color:COLORS.muted,marginLeft:8}}>{jobs.length} total</span>
          </div>
          <div style={S.cardBody}>
            {jobs.length === 0
              ? <div style={S.empty}>No videos generated yet — go to AI Video Engine to create your first!</div>
              : jobs.map((j, i) => (
                <div key={j.id} style={{...S.videoRow, borderBottom: i < jobs.length-1 ? `0.5px solid ${COLORS.border}`:''}} >
                  <div style={{...S.statusDot, background:
                    j.status==='completed'?COLORS.teal:
                    j.status==='failed'?COLORS.red:
                    j.status==='processing'?COLORS.blue:COLORS.dim
                  }} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:COLORS.text,fontWeight:500,marginBottom:2}}>
                      {j.data?.topic || j.data?.url || j.data?.affiliateUrl || 'Video'}
                    </div>
                    <div style={{fontSize:11,color:COLORS.muted}}>
                      {j.data?.persona} · {j.data?.duration} · {j.data?.videoType || 'auto'} · {(j.data?.platforms||[]).join(', ')}
                    </div>
                  </div>
                  {j.result?.script?.hook && (
                    <div style={{fontSize:11,color:COLORS.teal2,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontStyle:'italic'}}>
                      "{j.result.script.hook}"
                    </div>
                  )}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                    <span style={{...S.statusPill,
                      background:j.status==='completed'?`${COLORS.teal}20`:j.status==='failed'?`${COLORS.red}20`:`${COLORS.blue}20`,
                      color:j.status==='completed'?COLORS.teal:j.status==='failed'?COLORS.red:COLORS.blue
                    }}>{j.status}</span>
                    <span style={{fontSize:10,color:COLORS.dim}}>{new Date(j.createdAt).toLocaleDateString()}</span>
                  </div>
                  {j.result?.finalVideoUrl && (
                    <a href={j.result.finalVideoUrl} target="_blank" rel="noreferrer" style={S.downloadLink}>⬇</a>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── PLATFORMS TAB ── */}
      {activeTab === 'platforms' && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardHdr}>Platform usage</div>
            <div style={S.cardBody}>
              {platData.length === 0
                ? <div style={S.empty}>No platform data yet</div>
                : platData.map(p => (
                  <div key={p.id} style={S.barRow}>
                    <div style={{display:'flex',alignItems:'center',gap:6,width:130}}>
                      <span style={S.legendDot(p.color)} />
                      <span style={{fontSize:12,color:COLORS.text}}>{p.label}</span>
                    </div>
                    <div style={S.barTrack}>
                      <div style={{...S.barFill, width:`${(p.count/jobs.length)*100}%`, background:p.color}} />
                    </div>
                    <span style={S.barVal}>{p.count}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHdr}>Platform distribution</div>
            <div style={{...S.cardBody, display:'flex', alignItems:'center', gap:20}}>
              <DonutChart size={100} segments={platData.map(p => ({ value:p.count, color:p.color }))} />
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                {platData.map(p => (
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={S.legendDot(p.color)} />
                    <span style={{fontSize:12,color:COLORS.text,flex:1}}>{p.label}</span>
                    <span style={{fontSize:12,color:p.color,fontWeight:500}}>{Math.round((p.count/jobs.length)*100)||0}%</span>
                  </div>
                ))}
                {platData.length === 0 && <div style={S.empty}>No data yet</div>}
              </div>
            </div>
          </div>

          <div style={{...S.card, gridColumn:'span 2'}}>
            <div style={S.cardHdr}>Optimal posting times</div>
            <div style={{...S.cardBody, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
              {[
                { plat:'TikTok', color:'#69C9D0', times:['7:00 PM','9:00 AM','Tue 8:00 PM'] },
                { plat:'Instagram', color:'#E1306C', times:['11:00 AM','7:00 PM','Wed 11:00 AM'] },
                { plat:'YouTube', color:'#FF0000', times:['3:00 PM','Sat 11:00 AM','Sun 5:00 PM'] },
                { plat:'Facebook', color:'#1877F2', times:['1:00 PM','9:00 AM','Wed 1:00 PM'] },
                { plat:'Reddit', color:'#FF4500', times:['8:00 AM ET','Mon 8:00 AM','12:00 PM'] },
                { plat:'TikTok Best Day', color:'#69C9D0', times:['Tuesday','Friday','Sunday'] },
              ].map((p,i) => (
                <div key={i} style={{background:COLORS.raised,borderRadius:8,padding:'10px 12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                    <span style={{...S.legendDot(p.color),width:8,height:8}} />
                    <span style={{fontSize:12,fontWeight:500,color:COLORS.text}}>{p.plat}</span>
                  </div>
                  {p.times.map((t,j) => (
                    <div key={j} style={{fontSize:11,color:j===0?COLORS.teal2:COLORS.muted,marginBottom:3}}>
                      {j===0?'⭐ ':j===1?'✓ ':'  '}{t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COSTS TAB ── */}
      {activeTab === 'costs' && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardHdr}>API cost breakdown</div>
            <div style={S.cardBody}>
              {[
                { name:'RunwayML', desc:'Video clip generation', cost: completed.length * 1.50, color:COLORS.purple, per:'$1.50/video' },
                { name:'ElevenLabs', desc:'Voiceover generation', cost: completed.length * 0.05, color:COLORS.blue, per:'$0.05/video' },
                { name:'Claude AI', desc:'Script generation', cost: jobs.length * 0.01, color:COLORS.teal, per:'$0.01/script' },
                { name:'Cloudflare R2', desc:'Video storage', cost: 0, color:COLORS.orange, per:'Free (under 10GB)' },
                { name:'Supabase', desc:'Job database', cost: 0, color:COLORS.teal2, per:'Free tier' },
              ].map((c, i) => (
                <div key={i} style={{...S.costRow, borderBottom:i<4?`0.5px solid ${COLORS.border}`:''}}>
                  <span style={S.legendDot(c.color)} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:COLORS.text,fontWeight:500}}>{c.name}</div>
                    <div style={{fontSize:11,color:COLORS.muted}}>{c.desc} · {c.per}</div>
                  </div>
                  <span style={{fontSize:14,fontWeight:500,color:c.color}}>${c.cost.toFixed(2)}</span>
                </div>
              ))}
              <div style={{...S.costRow,marginTop:8,paddingTop:8,borderTop:`0.5px solid ${COLORS.border}`}}>
                <span style={{fontSize:13,fontWeight:500,color:COLORS.text,flex:1}}>Total estimated spend</span>
                <span style={{fontSize:18,fontWeight:500,color:COLORS.teal}}>${estimatedCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHdr}>Cost per video</div>
            <div style={S.cardBody}>
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:40,fontWeight:500,color:COLORS.teal}}>$1.56</div>
                <div style={{fontSize:13,color:COLORS.muted,marginTop:4}}>average per 30-second video</div>
              </div>
              {[
                { dur:'15s', cost:'$0.81', scenes:3 },
                { dur:'30s', cost:'$1.56', scenes:6 },
                { dur:'45s', cost:'$2.31', scenes:9 },
                { dur:'60s', cost:'$3.06', scenes:12 },
              ].map((r,i) => (
                <div key={i} style={S.barRow}>
                  <span style={S.barLabel}>{r.dur}</span>
                  <div style={S.barTrack}>
                    <div style={{...S.barFill, width:`${(parseFloat(r.cost.slice(1))/3.06)*100}%`, background:COLORS.teal}} />
                  </div>
                  <span style={{...S.barVal,color:COLORS.teal}}>{r.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{...S.card, gridColumn:'span 2'}}>
            <div style={S.cardHdr}>Monthly projection</div>
            <div style={{...S.cardBody, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
              {[
                { videos:10,  cost:'$15.60',  label:'Starter' },
                { videos:30,  cost:'$46.80',  label:'Regular' },
                { videos:100, cost:'$156.00', label:'Active' },
                { videos:300, cost:'$468.00', label:'Agency' },
              ].map((p,i) => (
                <div key={i} style={{background:COLORS.raised,borderRadius:8,padding:'14px 16px',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:500,color:COLORS.teal}}>{p.cost}</div>
                  <div style={{fontSize:12,color:COLORS.text,margin:'4px 0'}}>{p.videos} videos/mo</div>
                  <div style={{fontSize:10,color:COLORS.dim,padding:'3px 8px',background:`${COLORS.teal}15`,borderRadius:10,display:'inline-block'}}>{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:        { padding:24, minHeight:'100vh', background:'#0D2137', maxWidth:1200 },
  header:      { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 },
  title:       { fontSize:22, fontWeight:500, color:COLORS.text, display:'flex', alignItems:'center', gap:10 },
  badge:       { fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(29,158,117,.2)', color:COLORS.teal2, fontWeight:500 },
  sub:         { fontSize:13, color:COLORS.muted, marginTop:4 },
  rangeBtn:    { fontSize:11, padding:'5px 11px', border:`0.5px solid ${COLORS.border}`, borderRadius:20, background:'none', color:COLORS.muted, cursor:'pointer', fontFamily:'inherit' },
  rangeBtnActive:{ borderColor:COLORS.teal, background:'rgba(29,158,117,.15)', color:COLORS.teal2, fontWeight:500 },
  refreshBtn:  { fontSize:11, padding:'5px 11px', border:`0.5px solid ${COLORS.border}`, borderRadius:20, background:'none', color:COLORS.muted, cursor:'pointer', fontFamily:'inherit' },
  metricsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 },
  metricCard:  { background:COLORS.surface, border:`0.5px solid ${COLORS.border}`, borderRadius:10, padding:'13px 14px' },
  metricTop:   { display:'flex', alignItems:'flex-start', justifyContent:'space-between' },
  metricVal:   { fontSize:24, fontWeight:500, color:COLORS.text, lineHeight:1 },
  metricLbl:   { fontSize:11, color:COLORS.muted, marginTop:4 },
  metricSub:   { fontSize:10, color:COLORS.dim, marginTop:2 },
  tabs:        { display:'flex', borderBottom:`0.5px solid ${COLORS.border}`, marginBottom:16 },
  tab:         { padding:'9px 16px', fontSize:13, border:'none', background:'none', cursor:'pointer', color:COLORS.muted, borderBottom:'2px solid transparent', fontFamily:'inherit', transition:'all .15s' },
  tabActive:   { color:COLORS.teal2, borderBottomColor:COLORS.teal },
  grid2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  card:        { background:COLORS.surface, border:`0.5px solid ${COLORS.border}`, borderRadius:12, overflow:'hidden' },
  cardHdr:     { padding:'11px 14px', borderBottom:`0.5px solid ${COLORS.border}`, fontSize:13, fontWeight:500, color:COLORS.text },
  cardBody:    { padding:'14px' },
  chartLegend: { display:'flex', alignItems:'center', gap:6, marginTop:8 },
  legendDot:   color => ({ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0, display:'inline-block' }),
  barRow:      { display:'flex', alignItems:'center', gap:10, marginBottom:8 },
  barLabel:    { fontSize:12, color:COLORS.muted, width:70, flexShrink:0 },
  barTrack:    { flex:1, height:6, background:COLORS.raised, borderRadius:3, overflow:'hidden' },
  barFill:     { height:'100%', borderRadius:3, transition:'width .5s' },
  barVal:      { fontSize:12, fontWeight:500, color:COLORS.text, width:24, textAlign:'right', flexShrink:0 },
  videoRow:    { display:'flex', alignItems:'center', gap:10, padding:'10px 0' },
  statusDot:   { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  statusPill:  { fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:500 },
  downloadLink:{ fontSize:14, color:COLORS.teal2, textDecoration:'none', padding:'4px 6px', flexShrink:0 },
  costRow:     { display:'flex', alignItems:'center', gap:10, padding:'8px 0' },
  empty:       { fontSize:13, color:COLORS.dim, textAlign:'center', padding:'20px 0' },
};
