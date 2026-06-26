import React, { useState, useEffect } from 'react';
import VideoEngineShell from './VideoEngineShell.jsx';
import VideoEngineCore from './VideoEngineCore.jsx';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

/*
  VideoEngine.jsx — thin wrapper (Step 1 of rebuild)
  ----------------------------------------------------
  This file's only job is to:
    1. Fetch recent job history for the Shell's "Recent Projects" grid
    2. Render VideoEngineShell around VideoEngineCore

  All actual generation/result/scene-editor/history logic lives
  untouched inside VideoEngineCore.jsx (byte-for-byte the same
  working code as before, just renamed).
*/

export default function VideoEngine() {
  const [recentJobs, setRecentJobs] = useState([]);
  const [jumpToTab, setJumpToTab] = useState(null);
  const [quickStart, setQuickStart] = useState(null);
  const [loadJob, setLoadJob] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRecent() {
      try {
        const r = await fetch(API + '/api/video/jobs');
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled && Array.isArray(d)) setRecentJobs(d);
      } catch (e) {
        console.warn('Recent jobs fetch failed:', e.message);
      }
    }
    loadRecent();
    return () => { cancelled = true; };
  }, []);

  return (
    <VideoEngineShell
      recentJobs={recentJobs}
      onNavigate={(tab) => setJumpToTab({ tab, key: Date.now() })}
      onSelectQuickStart={(id) => setQuickStart({ id, key: Date.now() })}
      onOpenJob={(job) => setLoadJob({ job, key: Date.now() })}
    >
      <VideoEngineCore jumpToTab={jumpToTab} quickStart={quickStart} loadJob={loadJob} />
    </VideoEngineShell>
  );
}
