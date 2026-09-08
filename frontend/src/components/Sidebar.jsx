import React from 'react';
import styles from './Sidebar.module.css';

const ZONES = [
  {
    id: 'create',
    label: 'Create',
    icon: '⚡',
    color: 'var(--accent)',
    sub: 'Command Center',
    pages: ['dashboard'],
    desc: 'Generate content, scripts, videos',
  },
  {
    id: 'publish',
    label: 'Publish',
    icon: '📤',
    color: '#EF4444',
    sub: 'All platforms',
    pages: ['video', 'fbstudio', 'socialhub', 'submitter'],
    desc: 'Post to YouTube, TikTok, Instagram, Facebook',
  },
  {
    id: 'grow',
    label: 'Grow',
    icon: '🚀',
    color: '#1D9E75',
    sub: 'Traffic Engine',
    pages: ['traffic', 'strategy', 'analytics', 'calendar'],
    desc: 'Daily plan, Reddit, Pinterest, traffic dashboard',
  },
  {
    id: 'earn',
    label: 'Earn',
    icon: '💰',
    color: '#8B5CF6',
    sub: 'Affiliate library',
    pages: ['affiliate', 'amazon', 'media', 'nichroute'],
    desc: 'Products, commissions, media library',
  },
];

const ZONE_PAGE_MAP = {
  dashboard: 'create',
  video: 'publish',
  fbstudio: 'publish',
  socialhub: 'publish',
  submitter: 'publish',
  traffic: 'grow',
  strategy: 'grow',
  analytics: 'grow',
  calendar: 'grow',
  affiliate: 'earn',
  amazon: 'earn',
  media: 'earn',
  nichroute: 'earn',
  images: 'publish',
};

function getActiveZone(page) {
  return ZONE_PAGE_MAP[page] || 'create';
}

export default function Sidebar({ page, setPage, platforms, onLogout, isOpen, onClose }) {
  const activeZone = getActiveZone(page);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">✕</button>

      <div className={styles.logo}>
        <div className={styles.logoIcon}>⚡</div>
        <div>
          <div className={styles.logoText}>ContentForge</div>
          <div className={styles.logoSub}>Affiliate OS</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>Workspace</div>

        {ZONES.map(zone => {
          const isActive = activeZone === zone.id;
          return (
            <button
              key={zone.id}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => {
                if (zone.id === 'create') setPage('dashboard');
                else if (zone.id === 'publish') setPage('publish');
                else if (zone.id === 'grow') setPage('traffic');
                else if (zone.id === 'earn') setPage('affiliate');
                onClose && onClose();
              }}
              style={{ marginBottom: 4 }}
            >
              <span className={styles.navIcon}>{zone.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <span className={styles.navLabel} style={{ display: 'block' }}>{zone.label}</span>
                <span style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,.5)' : 'var(--text3)', display: 'block', marginTop: 1 }}>{zone.sub}</span>
              </span>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: zone.color, flexShrink: 0 }} />}
            </button>
          );
        })}

        <div className={styles.navSection} style={{ marginTop: 16 }}>Platform status</div>
        {[
          { id: 'youtube',   label: 'YouTube',   color: '#EF4444' },
          { id: 'facebook',  label: 'Facebook',  color: '#1877F2' },
          { id: 'instagram', label: 'Instagram', color: '#E1306C' },
          { id: 'pinterest', label: 'Pinterest', color: '#E60023' },
          { id: 'tiktok',    label: 'TikTok',    color: '#010101' },
        ].map(p => (
          <div key={p.id} className={styles.navItem} style={{ cursor: 'default', opacity: 0.8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
            <span className={styles.navLabel}>{p.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: platforms?.[p.id] ? 'var(--ok)' : 'var(--text3)' }}>
              {platforms?.[p.id] ? '● Live' : '○ Manual'}
            </span>
          </div>
        ))}

        <div className={styles.navSection} style={{ marginTop: 16 }}>Quick links</div>
        {[
          { id: 'analytics', label: 'Analytics', icon: '◎' },
          { id: 'calendar',  label: 'Content Calendar', icon: '📅' },
          { id: 'brand',     label: 'Brand Voice', icon: '◈' },
          { id: 'tutorial',  label: 'Tutorial', icon: '📖' },
        ].map(n => (
          <button
            key={n.id}
            className={`${styles.navItem} ${page === n.id ? styles.active : ''}`}
            onClick={() => { setPage(n.id); onClose && onClose(); }}
          >
            <span className={styles.navIcon}>{n.icon}</span>
            <span className={styles.navLabel}>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '9px 11px', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 'var(--rs)',
            display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #C47AFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'white', flexShrink: 0,
          }}>CF</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>ContentForge</div>
            <div style={{ fontSize: 10, color: 'var(--ok)' }}>● Active</div>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
