import { useState, useEffect } from 'react';

const API = (typeof window !== 'undefined' && window.__CF_API__) || 'https://stellar-achievement-production-ea9d.up.railway.app';

const BG2  = '#112240';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const ACC  = '#1D9E75';
const ACCH = '#5DCAA5';

const STEPS = [
  {
    id: 1, icon: '🔍', color: '#8B5CF6', label: 'Research',
    title: 'Research & Product Discovery',
    platform: 'NichRoute',
    tasks: [
      { id: 'r1', text: 'Browse NichRoute for trending products in your niche' },
      { id: 'r2', text: 'Find 1-2 ClickBank products to promote today' },
      { id: 'r3', text: 'Sync affiliate links to ContentForge library' },
    ],
    action: { label: 'Open NichRoute', page: 'nichroute' },
  },
  {
    id: 2, icon: '📅', color: '#1D9E75', label: 'Plan',
    title: 'Content Planning',
    platform: 'ContentForge',
    tasks: [
      { id: 'p1', text: 'Pick a topic from the 70-day Content Calendar' },
      { id: 'p2', text: 'Choose affiliate mode: None / Link Only / + Disclosure' },
      { id: 'p3', text: 'Generate the photo image prompt for the post' },
    ],
    action: { label: 'Open Calendar', page: 'calendar' },
  },
  {
    id: 3, icon: '✍️', color: '#3B82F6', label: 'Create',
    title: 'Create Content',
    platform: 'ContentForge',
    tasks: [
      { id: 'c1', text: 'Generate the Facebook post from your topic' },
      { id: 'c2', text: 'Generate a 30-second video script from same topic' },
      { id: 'c3', text: 'Review and edit both — read aloud to check flow' },
    ],
    action: { label: 'Open Composer', page: 'composer' },
  },
  {
    id: 4, icon: '🎬', color: '#EF4444', label: 'Produce',
    title: 'Produce Video',
    platform: 'ContentForge',
    tasks: [
      { id: 'v1', text: 'Paste script into Video Builder — select voice and music' },
      { id: 'v2', text: 'Click Create Video — wait 3-4 minutes' },
      { id: 'v3', text: 'Preview, download, and confirm CTA overlay is visible' },
    ],
    action: { label: 'Open Video Builder', page: 'video' },
  },
  {
    id: 5, icon: '💰', color: '#F59E0B', label: 'Monetise',
    title: 'Auto-Monetise',
    platform: 'ContentForge',
    tasks: [
      { id: 'm1', text: 'Confirm affiliate link is inserted in post' },
      { id: 'm2', text: 'Check affiliate link appears in video description' },
      { id: 'm3', text: 'Verify FTC disclosure is present if required' },
    ],
    action: { label: 'Open Affiliate Library', page: 'affiliate' },
  },
  {
    id: 6, icon: '📤', color: '#06B6D4', label: 'Publish',
    title: 'Publish & Schedule',
    platform: 'Both',
    tasks: [
      { id: 'pub1', text: 'Copy post text → paste to Facebook or Post Submitter' },
      { id: 'pub2', text: 'Upload video → YouTube Studio → AI metadata → Publish' },
      { id: 'pub3', text: 'Share in NichRoute Facebook Groups for extra reach' },
    ],
    action: { label: 'Open Post Submitter', page: 'submitter' },
    isPublish: true,
  },
];

const TIPS = [
  'Start with one topic and let it produce a post, a script, and a video — three pieces of content from one idea.',
  'Your strongest performing posts usually come from curiosity hooks — lead with a question or a surprising statement.',
  'Generate the image prompt alongside every post — Facebook posts with images get 3x more reach.',
  'Batch your content: generate 5-7 posts in one sitting, schedule them across the week.',
  'The video CTA in the last 5 seconds is where affiliate conversions happen — make it clear and direct.',
  'Run your script through Read Aloud before recording — if it sounds awkward spoken, it will feel awkward on video.',
  'Sync NichRoute links at the start of every session so your affiliate library stays current.',
  'Posts about personal transformation and real results consistently outperform generic advice posts.',
];

export default function Dashboard({ onNavigate }) {
  const [checks, setChecks]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_daily_checks') || '{}'); } catch { return {}; }
  });
  const [activeStep, setActive] = useState(1);
  const [tip]                   = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [stats, setStats]       = useState({ posts: 0, videos: 0, links: 0 });
  const [pubPost, setPubPost]   = useState(null);   // latest scheduled post
  const [pubVideo, setPubVideo] = useState(null);   // latest completed video
  const [pubLink, setPubLink]   = useState(null);   // best affiliate link
  const [pubCopied, setPubCopied] = useState('');
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  useEffect(() => {
    // Check if it's a new day — reset checklist
    const lastDay = localStorage.getItem('cf_checklist_day');
    const todayStr = new Date().toDateString();
    if (lastDay !== todayStr) {
      setChecks({});
      localStorage.setItem('cf_daily_checks', '{}');
      localStorage.setItem('cf_checklist_day', todayStr);
    }
    // Load quick stats
    fetch(`${API}/api/affiliate/status`).then(r => r.json())
      .then(d => setStats(s => ({ ...s, links: d.library || 0 }))).catch(() => {});
    const vbHistory = JSON.parse(localStorage.getItem('cf_vb_history') || '[]');
    const scheduled = JSON.parse(localStorage.getItem('cf_fb_scheduled') || '[]');
    setStats(s => ({ ...s, videos: vbHistory.length, posts: scheduled.length }));
    // Load publish-ready content
    const completedVideos = vbHistory.filter(v => v.status === 'completed');
    if (completedVideos.length > 0) setPubVideo(completedVideos[0]);
    if (scheduled.length > 0) setPubPost(scheduled[0]);
    // Load best affiliate link
    fetch(API + '/api/affiliate/match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'home business', count: 1 }),
    }).then(r => r.json()).then(d => {
      if (d.links?.[0]) setPubLink(d.links[0]);
    }).catch(() => {});
  }, []);

  function toggleCheck(id, stepId) {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    localStorage.setItem('cf_daily_checks', JSON.stringify(next));
    // Auto-advance to next step when all tasks in current step are done
    const currentStep = STEPS.find(s => s.id === stepId);
    if (currentStep) {
      const allDone = currentStep.tasks.every(t => t.id === id ? !checks[id] : next[t.id]);
      if (allDone && stepId < 6) {
        setTimeout(() => setActive(stepId + 1), 600);
      }
    }
  }

  function stepProgress(step) {
    const done = step.tasks.filter(t => checks[t.id]).length;
    return { done, total: step.tasks.length, pct: Math.round(done / step.tasks.length * 100) };
  }

  const totalTasks  = STEPS.reduce((a, s) => a + s.tasks.length, 0);
  const totalDone   = STEPS.reduce((a, s) => a + s.tasks.filter(t => checks[t.id]).length, 0);
  const dayProgress = Math.round(totalDone / totalTasks * 100);

  const card = (extra = {}) => ({
    background: BG2, border: `1px solid ${BORD}`, borderRadius: 12, ...extra,
  });

  return (
    <div style={{ padding: 20, maxWidth: 1100, fontFamily: 'inherit', color: TXT }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TXT, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>🚀</span> ContentForge Command Center
          </div>
          <div style={{ fontSize: 12, color: TXT3, marginTop: 4 }}>{today}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Videos made', value: stats.videos, icon: '🎬', color: '#EF4444' },
            { label: 'Posts saved', value: stats.posts,  icon: '📝', color: '#3B82F6' },
            { label: 'Aff. links',  value: stats.links,  icon: '🔗', color: ACC },
          ].map(s => (
            <div key={s.label} style={{ ...card(), padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 18 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: TXT3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day progress bar */}
      <div style={{ ...card(), padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: TXT }}>Today's Progress</span>
          <span style={{ fontSize: 12, color: ACCH, fontWeight: 700 }}>{totalDone}/{totalTasks} tasks · {dayProgress}% complete</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: dayProgress + '%', background: `linear-gradient(90deg, ${ACC}, ${ACCH})`, borderRadius: 4, transition: 'width .4s ease' }} />
        </div>
        {dayProgress === 100 && (
          <div style={{ marginTop: 8, fontSize: 11, color: ACCH, textAlign: 'center' }}>
            ✅ All done for today — great work!
          </div>
        )}
      </div>

      {/* Daily tip */}
      <div style={{ ...card(), padding: '10px 14px', marginBottom: 16, background: 'rgba(29,158,117,.05)', border: '1px solid rgba(29,158,117,.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.6 }}><strong style={{ color: ACCH }}>Daily tip:</strong> {tip}</div>
      </div>

      {/* 6-step workflow */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12 }}>

        {/* Step selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STEPS.map(step => {
            const prog = stepProgress(step);
            const isActive = activeStep === step.id;
            const done = prog.done === prog.total;
            return (
              <button key={step.id} onClick={() => setActive(step.id)}
                style={{ padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: isActive ? `2px solid ${step.color}` : `1px solid ${BORD}`, background: isActive ? `${step.color}22` : 'rgba(255,255,255,.03)', transition: 'all .15s', boxShadow: isActive ? `0 0 0 3px ${step.color}22` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 16 }}>{done ? '✅' : step.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? step.color : TXT }}>{step.label}</span>
                  {isActive && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: step.color, color: 'white', marginLeft: 2 }}>NOW</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: done ? ACCH : TXT3 }}>{prog.done}/{prog.total}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: prog.pct + '%', background: done ? ACC : step.color, borderRadius: 2, transition: 'width .3s' }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active step detail */}
        {STEPS.filter(s => s.id === activeStep).map(step => {
          const prog = stepProgress(step);
          return (
            <div key={step.id} style={card({ padding: 20 })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${step.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TXT }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: TXT3 }}>
                    <span style={{ padding: '1px 7px', borderRadius: 8, background: `${step.color}22`, color: step.color, fontSize: 10 }}>{step.platform}</span>
                    <span style={{ marginLeft: 8 }}>{prog.done}/{prog.total} tasks complete</span>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {step.tasks.map(task => (
                  <div key={task.id} onClick={() => toggleCheck(task.id, step.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: checks[task.id] ? 'rgba(29,158,117,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${checks[task.id] ? 'rgba(29,158,117,.2)' : BORD}`, transition: 'all .15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checks[task.id] ? ACC : 'rgba(255,255,255,.2)'}`, background: checks[task.id] ? ACC : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all .15s' }}>
                      {checks[task.id] && <span style={{ color: 'white', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: checks[task.id] ? TXT3 : TXT2, lineHeight: 1.5, textDecoration: checks[task.id] ? 'line-through' : 'none' }}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Publish panel — shows for step 6 */}
              {step.isPublish && (
                <div style={{ marginBottom: 14 }}>
                  {/* Latest post */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>📝 Latest Saved Post</div>
                    {pubPost ? (
                      <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${BORD}`, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.6, maxHeight: 80, overflow: 'auto', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                          {pubPost.content?.slice(0, 200)}{pubPost.content?.length > 200 ? '…' : ''}
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(pubPost.content || '').catch(() => {}); setPubCopied('post'); setTimeout(() => setPubCopied(''), 2000); }}
                          style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#1877F2', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {pubCopied === 'post' ? '✓ Copied!' : '📋 Copy Post for Facebook'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '10px', background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 11, color: TXT3, textAlign: 'center' }}>
                        No posts saved yet — generate one in Step 3 first
                        <button onClick={() => onNavigate && onNavigate('calendar')}
                          style={{ display: 'block', margin: '6px auto 0', padding: '4px 12px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                          → Go to Content Calendar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Latest video */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>🎬 Latest Completed Video</div>
                    {pubVideo ? (
                      <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${BORD}`, borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TXT, marginBottom: 3 }}>{pubVideo.topic || 'Video'}</div>
                          <div style={{ fontSize: 10, color: TXT3 }}>{pubVideo.result?.aspectRatio || ''} · {pubVideo.result?.clipsCount || 0} clips</div>
                        </div>
                        <button onClick={() => onNavigate && onNavigate('video')}
                          style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          📺 Upload to YouTube
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '10px', background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 11, color: TXT3, textAlign: 'center' }}>
                        No videos yet — create one in Step 4 first
                        <button onClick={() => onNavigate && onNavigate('video')}
                          style={{ display: 'block', margin: '6px auto 0', padding: '4px 12px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                          → Go to Video Builder
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Affiliate link */}
                  {pubLink && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>🔗 Affiliate Link (included in post)</div>
                      <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${BORD}`, borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TXT, marginBottom: 2 }}>{pubLink.name}</div>
                          <div style={{ fontSize: 10, color: TXT3, wordBreak: 'break-all' }}>{pubLink.url?.slice(0, 50)}…</div>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(pubLink.url || '').catch(() => {}); setPubCopied('link'); setTimeout(() => setPubCopied(''), 2000); }}
                          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                          {pubCopied === 'link' ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                    const next = { ...checks };
                    step.tasks.forEach(t => { next[t.id] = true; });
                    setChecks(next);
                    localStorage.setItem('cf_daily_checks', JSON.stringify(next));
                    if (onNavigate) onNavigate(step.action.page);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: step.color, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 12px ${step.color}44` }}>
                  {step.action.label} →
                </button>
                {activeStep < 6 && (
                  <button onClick={() => setActive(activeStep + 1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Next step ›
                  </button>
                )}
                {activeStep > 1 && (
                  <button onClick={() => setActive(activeStep - 1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ‹ Back
                  </button>
                )}
              </div>

              {/* Reset today */}
              <button onClick={() => { setChecks({}); localStorage.setItem('cf_daily_checks', '{}'); }}
                style={{ marginTop: 10, width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                ↺ Reset today's checklist
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
