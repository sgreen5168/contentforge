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
    id: 1, icon: '🔍', color: '#8B5CF6',
    label: 'Research',
    title: 'Step 1 — Research & Product Discovery',
    description: 'Start here every session. Find what products to promote and what topics are trending in your niche.',
    tasks: [
      { id: 'r1', text: 'Open NichRoute and browse trending products in your niche' },
      { id: 'r2', text: 'Pick 1-2 ClickBank or Amazon products to promote today' },
      { id: 'r3', text: 'Go to Affiliate Library → Import from NichRoute to sync links' },
    ],
    tool: { label: '→ Open NichRoute', page: 'nichroute', color: '#8B5CF6' },
    tip: 'NichRoute finds the products. ContentForge promotes them. Start here so the right links flow into everything else automatically.',
  },
  {
    id: 2, icon: '📅', color: '#1D9E75',
    label: 'Plan Topic',
    title: 'Step 2 — Pick Your Topic',
    description: 'Choose which topic from your 70-day content plan to work on today. One topic produces a post, a script, and a video.',
    tasks: [
      { id: 'p1', text: 'Open Content Calendar and pick a topic for today' },
      { id: 'p2', text: 'Expand that day — choose your affiliate mode (None / Link / + Disclosure)' },
      { id: 'p3', text: 'Generate the photo image prompt for the post' },
    ],
    tool: { label: '→ Open Content Calendar', page: 'calendar', color: '#1D9E75' },
    tip: 'One topic = one post + one video script + one image. Three pieces of content, one idea, under 20 minutes.',
  },
  {
    id: 3, icon: '✍️', color: '#3B82F6',
    label: 'Write Post',
    title: 'Step 3 — Generate the Facebook Post',
    description: 'Click Generate on your chosen topic. ContentForge writes the post, inserts the affiliate link, and adds the disclosure — all automatically.',
    tasks: [
      { id: 'c1', text: 'Click ✍️ Generate This Post on your chosen topic' },
      { id: 'c2', text: 'Press 🔊 Read Post Aloud to check it flows naturally' },
      { id: 'c3', text: 'Click 📅 Save to Schedule — post is now saved for Step 6' },
    ],
    tool: { label: '→ Open Content Calendar', page: 'calendar', color: '#3B82F6' },
    tip: 'The affiliate link auto-inserts based on your topic. It matches the product most relevant to what you are writing about.',
  },
  {
    id: 4, icon: '🎬', color: '#EF4444',
    label: 'Make Video',
    title: 'Step 4 — Produce the Video',
    description: 'ContentForge writes the script, records the voiceover, finds matching video clips, and delivers a finished MP4 with your affiliate link burned into the final 5 seconds.',
    tasks: [
      { id: 'v1', text: 'Go to AI Video Engine → 🎬 Video Builder tab' },
      { id: 'v2', text: 'Type the same topic from Step 2 → click ▶ Create Video' },
      { id: 'v3', text: 'Wait 3-4 minutes → preview the video and confirm CTA overlay shows' },
    ],
    tool: { label: '→ Open Video Builder', page: 'video', color: '#EF4444' },
    tip: 'Your affiliate link appears automatically in the last 5 seconds of every video as a capture scene — no manual steps needed.',
  },
  {
    id: 5, icon: '💰', color: '#F59E0B',
    label: 'Check Links',
    title: 'Step 5 — Verify Monetisation',
    description: 'Confirm your affiliate link is in the post and in the video description before publishing.',
    tasks: [
      { id: 'm1', text: 'Open saved post — confirm affiliate link appears at the end' },
      { id: 'm2', text: 'Open Affiliate Library — verify links are synced from NichRoute' },
      { id: 'm3', text: 'If no link appeared — go to Affiliate Library and add one manually' },
    ],
    tool: { label: '→ Open Affiliate Library', page: 'affiliate', color: '#F59E0B' },
    tip: 'Links only auto-insert when you have at least one link saved in the Affiliate Library. Add your ClickBank hoplinks there first.',
  },
  {
    id: 6, icon: '📤', color: '#06B6D4',
    label: 'Publish',
    title: 'Step 6 — Publish Everything',
    description: 'Your post and video are ready. Publish to Facebook and YouTube from here.',
    tasks: [
      { id: 'pub1', text: 'Copy your saved post → paste to Facebook or Post Submitter' },
      { id: 'pub2', text: 'Go to YouTube Studio → upload video → AI writes metadata → Publish' },
      { id: 'pub3', text: 'Share post link in NichRoute Facebook Groups for extra reach' },
    ],
    tool: { label: '→ Open Post Submitter', page: 'submitter', color: '#06B6D4' },
    tip: 'One session = one Facebook post + one YouTube video + one affiliate link. Repeat daily across your 70-day plan.',
    isPublish: true,
  },
];

const TIPS = [
  'Start with one topic and produce a post, a script, and a video — three pieces of content from one idea.',
  'Your strongest posts come from curiosity hooks — lead with a question or a surprising statement.',
  'Generate the image prompt alongside every post — Facebook posts with images get 3x more reach.',
  'Batch your content: generate 5-7 posts in one sitting and schedule them across the week.',
  'The video CTA in the last 5 seconds is where affiliate conversions happen — make it clear and direct.',
  'Sync NichRoute links at the start of every session so your affiliate library stays current.',
];

export default function Dashboard({ onNavigate }) {
  const [checks, setChecks]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_daily_checks') || '{}'); } catch { return {}; }
  });
  const [activeStep, setActive]   = useState(1);
  const [tip]                     = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [stats, setStats]         = useState({ posts: 0, videos: 0, links: 0 });
  const [pubPost, setPubPost]     = useState(null);
  const [pubVideo, setPubVideo]   = useState(null);
  const [pubLink, setPubLink]     = useState(null);
  const [pubCopied, setPubCopied] = useState('');
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  useEffect(() => {
    const lastDay = localStorage.getItem('cf_checklist_day');
    const todayStr = new Date().toDateString();
    if (lastDay !== todayStr) {
      setChecks({});
      localStorage.setItem('cf_daily_checks', '{}');
      localStorage.setItem('cf_checklist_day', todayStr);
    }
    fetch(`${API}/api/affiliate/status`)
      .then(r => r.json())
      .then(d => setStats(s => ({ ...s, links: d.library || 0 })))
      .catch(() => {});
    const vbHistory = JSON.parse(localStorage.getItem('cf_vb_history') || '[]');
    const scheduled = JSON.parse(localStorage.getItem('cf_fb_scheduled') || '[]');
    setStats(s => ({ ...s, videos: vbHistory.filter(v => v.status === 'completed').length, posts: scheduled.length }));
    const completedVideos = vbHistory.filter(v => v.status === 'completed');
    if (completedVideos.length > 0) setPubVideo(completedVideos[0]);
    if (scheduled.length > 0) setPubPost(scheduled[0]);
    fetch(`${API}/api/affiliate/match`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'home business', count: 1 }),
    }).then(r => r.json()).then(d => { if (d.links?.[0]) setPubLink(d.links[0]); }).catch(() => {});
  }, []);

  function toggleCheck(id, stepId) {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    localStorage.setItem('cf_daily_checks', JSON.stringify(next));
    const step = STEPS.find(s => s.id === stepId);
    if (step) {
      const allDone = step.tasks.every(t => t.id === id ? !checks[id] : next[t.id]);
      if (allDone && stepId < 6) setTimeout(() => setActive(stepId + 1), 500);
    }
  }

  function goToStep(stepId) {
    setActive(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openTool(page) {
    const next = { ...checks };
    const step = STEPS.find(s => s.id === activeStep);
    if (step) step.tasks.forEach(t => { next[t.id] = true; });
    setChecks(next);
    localStorage.setItem('cf_daily_checks', JSON.stringify(next));
    if (onNavigate) onNavigate(page);
  }

  const totalTasks = STEPS.reduce((a, s) => a + s.tasks.length, 0);
  const totalDone  = STEPS.reduce((a, s) => a + s.tasks.filter(t => checks[t.id]).length, 0);
  const dayPct     = Math.round(totalDone / totalTasks * 100);
  const activeData = STEPS.find(s => s.id === activeStep);

  return (
    <div style={{ padding: 20, maxWidth: 1000, fontFamily: 'inherit', color: TXT }}>

      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TXT, display: 'flex', alignItems: 'center', gap: 10 }}>
            🚀 Command Center
          </div>
          <div style={{ fontSize: 12, color: TXT3, marginTop: 2 }}>{today}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Videos', value: stats.videos, icon: '🎬', color: '#EF4444' },
            { label: 'Posts',  value: stats.posts,  icon: '📝', color: '#3B82F6' },
            { label: 'Links',  value: stats.links,  icon: '🔗', color: ACC },
          ].map(s => (
            <div key={s.label} style={{ background: BG2, border: `1px solid ${BORD}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: TXT3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: BG2, border: `1px solid ${BORD}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: TXT }}>Daily Progress</span>
          <span style={{ fontSize: 11, color: ACCH, fontWeight: 700 }}>{totalDone}/{totalTasks} tasks · {dayPct}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: dayPct + '%', background: `linear-gradient(90deg,${ACC},${ACCH})`, borderRadius: 4, transition: 'width .4s' }} />
        </div>
      </div>

      {/* Daily tip */}
      <div style={{ background: 'rgba(29,158,117,.06)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: TXT2, lineHeight: 1.6 }}>
        💡 <strong style={{ color: ACCH }}>Tip:</strong> {tip}
      </div>

      {/* Step selector — horizontal row of 6 numbered buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginBottom: 16 }}>
        {STEPS.map(step => {
          const done  = step.tasks.filter(t => checks[t.id]).length;
          const total = step.tasks.length;
          const isActive = activeStep === step.id;
          const allDone  = done === total;
          return (
            <button key={step.id} onClick={() => goToStep(step.id)}
              style={{
                padding: '10px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'center', transition: 'all .2s',
                border: isActive ? `3px solid ${step.color}` : `2px solid ${allDone ? step.color + '60' : BORD}`,
                background: isActive ? `${step.color}25` : allDone ? `${step.color}10` : 'rgba(255,255,255,.03)',
                boxShadow: isActive ? `0 0 16px ${step.color}40` : 'none',
              }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{allDone ? '✅' : step.icon}</div>
              <div style={{ fontSize: 10, fontWeight: isActive ? 800 : 500, color: isActive ? step.color : allDone ? step.color : TXT3 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 9, color: isActive ? step.color : TXT3, marginTop: 2 }}>
                {done}/{total}
              </div>
              {isActive && (
                <div style={{ marginTop: 4, fontSize: 8, padding: '1px 4px', borderRadius: 3, background: step.color, color: 'white', display: 'inline-block' }}>
                  NOW
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active step detail */}
      {activeData && (
        <div style={{ background: BG2, border: `2px solid ${activeData.color}40`, borderRadius: 14, overflow: 'hidden' }}>

          {/* Step header */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORD}`, background: `${activeData.color}10` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: `${activeData.color}25`, border: `2px solid ${activeData.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {activeData.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: activeData.color, marginBottom: 4 }}>{activeData.title}</div>
                <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.5 }}>{activeData.description}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            {/* How it benefits you tip */}
            <div style={{ padding: '10px 12px', background: `${activeData.color}10`, border: `1px solid ${activeData.color}30`, borderRadius: 8, marginBottom: 16, fontSize: 11, color: TXT2, lineHeight: 1.6 }}>
              <strong style={{ color: activeData.color }}>Why this step matters:</strong> {activeData.tip}
            </div>

            {/* Tasks */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Checklist</div>
              {activeData.tasks.map((task, i) => (
                <div key={task.id} onClick={() => toggleCheck(task.id, activeData.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 9, cursor: 'pointer', marginBottom: 6, background: checks[task.id] ? `${activeData.color}12` : 'rgba(255,255,255,.03)', border: `1px solid ${checks[task.id] ? activeData.color + '40' : BORD}`, transition: 'all .15s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${checks[task.id] ? activeData.color : 'rgba(255,255,255,.2)'}`, background: checks[task.id] ? activeData.color : 'transparent', transition: 'all .15s' }}>
                    {checks[task.id] && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TXT3, marginRight: 6 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: checks[task.id] ? TXT3 : TXT2, textDecoration: checks[task.id] ? 'line-through' : 'none', lineHeight: 1.5 }}>{task.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Publish panel for Step 6 */}
            {activeData.isPublish && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TXT3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Ready to Publish</div>

                {/* Post */}
                <div style={{ marginBottom: 8, padding: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${BORD}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1877F2', marginBottom: 6 }}>📘 Facebook Post</div>
                  {pubPost ? (
                    <div>
                      <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.6, maxHeight: 80, overflow: 'auto', marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                        {pubPost.content?.slice(0, 220)}{pubPost.content?.length > 220 ? '…' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { navigator.clipboard.writeText(pubPost.content || '').catch(() => {}); setPubCopied('post'); setTimeout(() => setPubCopied(''), 2000); }}
                          style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#1877F2', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {pubCopied === 'post' ? '✓ Copied!' : '📋 Copy for Facebook'}
                        </button>
                        <button onClick={() => openTool('submitter')}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(24,119,242,.3)', background: 'transparent', color: '#4FA3FF', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                          📤 Post Submitter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, color: '#FAC775', padding: '8px 10px', background: 'rgba(245,158,11,.08)', borderRadius: 6, marginBottom: 6, lineHeight: 1.6 }}>
                        ⚠ No posts saved yet. Here is what to do:
                      </div>
                      <div style={{ fontSize: 11, color: TXT3, lineHeight: 1.8 }}>
                        1. Go to <strong style={{ color: TXT }}>Content Calendar</strong> (Step 2-3)<br/>
                        2. Expand any day → click <strong style={{ color: TXT }}>✍️ Generate This Post</strong><br/>
                        3. Click <strong style={{ color: TXT }}>📅 Save to Schedule</strong><br/>
                        4. Come back here — your post will appear above
                      </div>
                      <button onClick={() => openTool('calendar')}
                        style={{ marginTop: 8, padding: '6px 14px', borderRadius: 6, border: 'none', background: '#1D9E75', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        → Go Generate a Post Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Video */}
                <div style={{ marginBottom: 8, padding: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${BORD}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', marginBottom: 6 }}>🎬 Video</div>
                  {pubVideo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: TXT }}>{pubVideo.topic || 'Completed video'}</div>
                        <div style={{ fontSize: 10, color: TXT3 }}>{pubVideo.result?.aspectRatio || ''} · {pubVideo.result?.clipsCount || 0} clips · Ready to upload</div>
                      </div>
                      <button onClick={() => openTool('video')}
                        style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        📺 YouTube Studio
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, color: '#FAC775', padding: '8px 10px', background: 'rgba(245,158,11,.08)', borderRadius: 6, marginBottom: 6, lineHeight: 1.6 }}>
                        ⚠ No completed videos yet. Here is what to do:
                      </div>
                      <div style={{ fontSize: 11, color: TXT3, lineHeight: 1.8 }}>
                        1. Go to <strong style={{ color: TXT }}>AI Video Engine → 🎬 Video Builder</strong><br/>
                        2. Type your topic → click <strong style={{ color: TXT }}>▶ Create Video</strong><br/>
                        3. Wait 3-4 minutes for it to finish<br/>
                        4. Come back here — your video will appear above
                      </div>
                      <button onClick={() => openTool('video')}
                        style={{ marginTop: 8, padding: '6px 14px', borderRadius: 6, border: 'none', background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        → Go Create a Video Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Affiliate link */}
                <div style={{ padding: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${BORD}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACC, marginBottom: 6 }}>🔗 Affiliate Link</div>
                  {pubLink ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: TXT }}>{pubLink.name}</div>
                        <div style={{ fontSize: 10, color: ACCH }}>Already included in your post automatically</div>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(pubLink.url || '').catch(() => {}); setPubCopied('link'); setTimeout(() => setPubCopied(''), 2000); }}
                        style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {pubCopied === 'link' ? '✓' : '📋 Copy'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: TXT3 }}>
                      No links saved —
                      <button onClick={() => openTool('affiliate')} style={{ background: 'none', border: 'none', color: ACCH, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: '0 4px' }}>
                        add one in Affiliate Library
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openTool(activeData.tool.page)}
                style={{ flex: 1, padding: '13px', borderRadius: 10, border: 'none', background: activeData.color, color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 3px 14px ${activeData.color}50` }}>
                {activeData.tool.label}
              </button>
              {activeStep > 1 && (
                <button onClick={() => goToStep(activeStep - 1)}
                  style={{ padding: '13px 18px', borderRadius: 10, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ‹ Back
                </button>
              )}
              {activeStep < 6 && (
                <button onClick={() => goToStep(activeStep + 1)}
                  style={{ padding: '13px 18px', borderRadius: 10, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Next ›
                </button>
              )}
            </div>

            {/* Reset */}
            <button onClick={() => { setChecks({}); localStorage.setItem('cf_daily_checks', '{}'); }}
              style={{ marginTop: 10, width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${BORD}`, background: 'transparent', color: TXT3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
              ↺ Reset today's checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
