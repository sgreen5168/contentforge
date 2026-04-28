import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Composer from './pages/Composer.jsx';
import { Scheduler, Brand, Analytics, Compliance } from './pages/OtherPages.jsx';
import styles from './App.module.css';

const PAGE_LABELS = {
  composer:   'AI Composer',
  scheduler:  'Auto-Scheduler',
  brand:      'Brand Voice',
  analytics:  'Analytics',
  compliance: 'Compliance',
};

export default function App() {
  const [page, setPage] = useState('composer');
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: true, reddit: true });

  return (
    <div className={styles.app}>
      <Sidebar page={page} setPage={setPage} platforms={platforms} />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>{PAGE_LABELS[page]}</div>
          <div className={styles.topbarRight}>
            <div className={styles.statusPill}>
              <span className={styles.dot} />
              Claude Live
            </div>
            {page === 'composer' && <div className={styles.liveBadge}>⚡ Real AI</div>}
          </div>
        </header>

        <main>
          {page === 'composer'   && <Composer onPlatformsChange={setPlatforms} />}
          {page === 'scheduler'  && <Scheduler />}
          {page === 'brand'      && <Brand />}
          {page === 'analytics'  && <Analytics />}
          {page === 'compliance' && <Compliance />}
        </main>
      </div>
    </div>
  );
}
