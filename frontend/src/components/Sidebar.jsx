import React from 'react';
import styles from './Sidebar.module.css';

const NAV = [
  { id: 'composer',  label: 'AI Composer',     icon: '✦', section: 'Content' },
  { id: 'video',     label: 'AI Video Engine',  icon: '▶', section: 'Content', badge: 'New' },
  { id: 'scheduler', label: 'Video Scheduler',  icon: '📅', section: 'Content', badge: 'New' },
  { id: 'brand',     label: 'Brand Voice',      icon: '◈', section: 'Content' },
  { id: 'analytics', label: 'Analytics',        icon: '◎', section: 'Insights' },
  { id: 'compliance',label: 'Compliance',       icon: '◉', section: 'Insights' },
];

const SECTIONS = ['Content', 'Insights'];

const PLATS = {
  facebook:  { label: 'Facebook',  color: 'var(--fb)' },
  instagram: { label: 'Instagram', color: 'var(--ig)' },
  reddit:    { label: 'Reddit',    color: 'var(--rd)' },
};

export default function Sidebar({ page, setPage, platforms }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>⚡</div>
        <div>
          <div className={styles.logoText}>ContentForge</div>
          <div className={styles.logoSub}>Social AI Engine</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {SECTIONS.map(section => (
          <div key={section}>
            <div className={styles.navSection}>{section}</div>
            {NAV.filter(n => n.section === section).map(n => (
              <button
                key={n.id}
                className={`${styles.navItem} ${page === n.id ? styles.active : ''} ${(n.id === 'video' || n.id === 'scheduler') ? styles.videoItem : ''}`}
                onClick={() => setPage(n.id)}
              >
                <span className={styles.navIcon}>{n.icon}</span>
                <span className={styles.navLabel}>{n.label}</span>
                {n.badge && <span className={styles.navBadge}>{n.badge}</span>}
              </button>
            ))}
          </div>
        ))}

        <div className={styles.navSection} style={{ marginTop: 16 }}>Platforms</div>
        {Object.entries(PLATS).map(([k, v]) => (
          <div key={k} className={styles.navItem} style={{ color: v.color, cursor: 'default' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.color, display: 'inline-block', flexShrink: 0 }} />
            <span className={styles.navLabel}>{v.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: platforms?.[k] ? 'var(--ok)' : 'var(--text3)' }}>
              {platforms?.[k] ? 'On' : 'Off'}
            </span>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>AJ</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Alex Johnson</div>
            <div style={{ fontSize: 10, color: 'var(--ok)' }}>Pro Plan ✦</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
