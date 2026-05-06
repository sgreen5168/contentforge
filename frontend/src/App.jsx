import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Composer from './pages/Composer.jsx';
import VideoEngine from './pages/VideoEngine.jsx';
import Scheduler from './pages/Scheduler.jsx';
import BulkGenerator from './pages/BulkGenerator.jsx';
import EmailSettings from './pages/EmailSettings.jsx';
import { Brand, Analytics, Compliance } from './pages/OtherPages.jsx';
import styles from './App.module.css';

const PAGE_LABELS = {
  composer:  'AI Composer',
  video:     'AI Video Engine',
  scheduler: 'Video Scheduler',
  bulk:      'Bulk Generator',
  email:     'Email Notifications',
  brand:     'Brand Voice',
  analytics: 'Analytics',
  compliance:'Compliance',
};

function checkAuth() {
  try {
    return localStorage.getItem('cf_auth_v2') === 'true';
  } catch { return false; }
}

export default function App() {
  const [authed, setAuthed]       = useState(checkAuth);
  const [page, setPage]           = useState('composer');
  const [platforms, setPlatforms] = useState({ facebook:true, instagram:true, reddit:true });
  const [sidebarOpen, setSidebar] = useState(false);

  function navigateTo(p) { setPage(p); setSidebar(false); }

  function handleLogout() {
    localStorage.removeItem('cf_auth_v2');
    localStorage.removeItem('cf_pw_hash');
    localStorage.removeItem('cf_auth'); // clear old key too
    setAuthed(false);
  }

  function handleLogin() {
    setAuthed(true);
  }

  if (!authed) return <Login onLogin={handleLogin} />;

  return (
    <div className={styles.app}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebar(false)} />
      )}
      <Sidebar
        page={page}
        setPage={navigateTo}
        platforms={platforms}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebar(false)}
      />
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebar(true)} aria-label="Open menu">☰</button>
          <div className={styles.topbarTitle}>{PAGE_LABELS[page]}</div>
          <div className={styles.topbarRight}>
            <div className={styles.statusPill}><span className={styles.dot} /> Claude Live</div>
            {['video','scheduler','bulk'].includes(page) && <div className={styles.videoBadge}>▶ Video Engine</div>}
            <button onClick={handleLogout} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'none',background:'transparent',color:'#888',cursor:'pointer',fontFamily:'inherit'}}>Sign out</button>
          </div>
        </header>
        <main>
          {page === 'composer'   && <Composer onPlatformsChange={setPlatforms} />}
          {page === 'video'      && <VideoEngine />}
          {page === 'scheduler'  && <Scheduler />}
          {page === 'bulk'       && <BulkGenerator />}
          {page === 'email'      && <EmailSettings />}
          {page === 'brand'      && <Brand />}
          {page === 'analytics'  && <Analytics />}
          {page === 'compliance' && <Compliance />}
        </main>
      </div>
    </div>
  );
}
