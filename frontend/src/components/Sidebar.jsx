import React from 'react';
import styles from './Sidebar.module.css';

const NAV = [
  { id:'composer',  label:'AI Composer',        icon:'✦',  section:'Content' },
  { id:'video',     label:'AI Video Engine',     icon:'▶',  section:'Content', badge:'New' },
  { id:'bulk',      label:'Bulk Generator',      icon:'⚡',  section:'Content', badge:'New' },
  { id:'scheduler', label:'Video Scheduler',     icon:'📅', section:'Content' },
  { id:'brand',     label:'Brand Voice',         icon:'◈',  section:'Content' },
  { id:'analytics', label:'Analytics',           icon:'◎',  section:'Insights' },
  { id:'compliance',label:'Compliance',          icon:'◉',  section:'Insights' },
  { id:'email',     label:'Email Notifications', icon:'📧', section:'Settings' },
  { id:'tutorial',  label:'Tutorial',            icon:'📖', section:'Settings' },
];

const SECTIONS = ['Content', 'Insights', 'Settings'];

const PLATS = {
  facebook:  { label:'Facebook',  color:'var(--fb)' },
  instagram: { label:'Instagram', color:'var(--ig)' },
  reddit:    { label:'Reddit',    color:'var(--rd)' },
};

export default function Sidebar({ page, setPage, platforms, onLogout, isOpen, onClose }) {
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">✕</button>

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
                className={`${styles.navItem} ${page === n.id ? styles.active : ''} ${['video','bulk','scheduler'].includes(n.id) ? styles.videoItem : ''}`}
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
            <span style={{ width:7, height:7, borderRadius:'50%', background:v.color, display:'inline-block', flexShrink:0 }} />
            <span className={styles.navLabel}>{v.label}</span>
            <span style={{ marginLeft:'auto', fontSize:10, color: platforms?.[k] ? 'var(--ok)' : 'var(--text3)' }}>
              {platforms?.[k] ? 'On' : 'Off'}
            </span>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          onClick={onLogout}
          style={{
            width:'100%', padding:'9px 11px', background:'var(--bg3)',
            border:'1px solid var(--border)', borderRadius:'var(--rs)',
            display:'flex', alignItems:'center', gap:9, cursor:'pointer',
            fontFamily:'inherit', textAlign:'left',
          }}
        >
          <div style={{
            width:26, height:26, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--accent), #C47AFF)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:600, color:'white', flexShrink:0,
          }}>CF</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>ContentForge</div>
            <div style={{ fontSize:10, color:'var(--ok)' }}>● Active</div>
          </div>
          <span style={{ fontSize:10, color:'var(--text3)' }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
