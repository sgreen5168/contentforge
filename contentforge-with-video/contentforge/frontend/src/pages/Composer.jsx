import React, { useState } from 'react';
import { generatePosts } from '../lib/api.js';
import styles from './Composer.module.css';

const STYLES_LIST = ['Short', 'Long', 'Humorous', 'Educational', 'Casual', 'Promotional'];
const PLATFORMS = {
  facebook:  { label: 'Facebook',  color: 'var(--fb)' },
  instagram: { label: 'Instagram', color: 'var(--ig)' },
  reddit:    { label: 'Reddit',    color: 'var(--rd)' },
};
const STEPS = [
  'Preparing your request…',
  'Building platform strategies…',
  'Claude is writing your posts…',
];

export default function Composer({ onPlatformsChange }) {
  const [mode, setMode]         = useState('topic');
  const [topic, setTopic]       = useState('');
  const [url, setUrl]           = useState('');
  const [style, setStyle]       = useState('Casual');
  const [plats, setPlats]       = useState({ facebook: true, instagram: true, reddit: true });
  const [affiliate, setAffiliate] = useState(false);
  const [status, setStatus]     = useState('idle'); // idle | loading | done | error
  const [step, setStep]         = useState(0);
  const [posts, setPosts]       = useState(null);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState('');

  const active = Object.keys(plats).filter(p => plats[p]);
  const hasInput = mode === 'topic' ? topic.trim() : url.trim();

  function togglePlat(p) {
    const next = { ...plats, [p]: !plats[p] };
    setPlats(next);
    onPlatformsChange?.(next);
  }

  async function generate() {
    if (!hasInput || !active.length) return;
    setStatus('loading'); setPosts(null); setError(''); setStep(0);
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1600);
    try {
      const result = await generatePosts({ inputMode: mode, topic, url, style, platforms: active, affiliate });
      clearTimeout(t1); clearTimeout(t2);
      setPosts(result);
      setStatus('done');
    } catch (e) {
      clearTimeout(t1); clearTimeout(t2);
      setError(e.message);
      setStatus('error');
    }
  }

  function copy(key, text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="page-content">
      <h1 className="page-title serif">AI Content <span>Composer</span></h1>
      <p className="page-sub">Enter a topic, URL, or affiliate link — Claude writes platform-ready posts instantly</p>

      {/* ── Input Card ── */}
      <div className={styles.composer}>
        <div className={styles.tabs}>
          {[['topic','Topic / Keyword'],['url','URL Extractor'],['affiliate','Affiliate Link']].map(([m,l]) => (
            <button key={m} className={`${styles.tab} ${mode===m ? styles.activeTab:''}`} onClick={() => setMode(m)}>{l}</button>
          ))}
        </div>

        <div className={styles.body}>
          {mode === 'topic' && (
            <div>
              <div className="field-label">Topic or keyword</div>
              <input className="field-input" style={{marginBottom:13}} placeholder='e.g. "remote work productivity hacks"' value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
          )}
          {mode === 'url' && (
            <div>
              <div className="field-label">Webpage URL</div>
              <input className="field-input" style={{marginBottom:13}} placeholder="https://example.com/article" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
          )}
          {mode === 'affiliate' && (
            <div>
              <div className="field-label">Affiliate product link</div>
              <input className="field-input" style={{marginBottom:13}} placeholder="https://affiliate.link/product" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
          )}

          <div className="field-label">Post style</div>
          <div className="chip-row">
            {STYLES_LIST.map(s => (
              <button key={s} className={`chip ${style===s?'active':''}`} onClick={() => setStyle(s)}>{s}</button>
            ))}
          </div>

          <div className="field-label">Publish to</div>
          <div className={styles.platRow}>
            {Object.entries(PLATFORMS).map(([k,v]) => (
              <button key={k} className={`${styles.platBtn} ${plats[k] ? styles['on_'+k] : ''}`} onClick={() => togglePlat(k)}>
                <span style={{width:7,height:7,borderRadius:'50%',background:plats[k]?v.color:'var(--text3)',display:'inline-block'}} />
                {v.label}
              </button>
            ))}
          </div>

          <div className={styles.generateBar}>
            <label className={styles.toggleRow}>
              <div className={styles.toggle}>
                <input type="checkbox" checked={affiliate} onChange={e => setAffiliate(e.target.checked)} />
                <span className={styles.slider} />
              </div>
              Inject affiliate link naturally
            </label>
            <button
              className="btn btn-primary"
              onClick={generate}
              disabled={status === 'loading' || !hasInput || !active.length}
            >
              {status === 'loading' && <span className="spin" />}
              {status === 'loading' ? 'Generating…' : 'Generate Posts ⚡'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {status === 'loading' && (
        <div className={styles.genBox}>
          <div style={{display:'flex',gap:8,alignItems:'center',color:'var(--accent)',fontSize:13}}>
            <span className="spin" /> Claude is writing your posts…
          </div>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={i} className={`${styles.step} ${i<step?styles.done:i===step?styles.stepActive:styles.wait}`}>
                {i < step ? '✓' : i === step ? <span className="spin" style={{width:10,height:10,borderWidth:1.5}} /> : '○'}
                &nbsp;{s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div className={styles.errorBox}>
          ⚠ Generation failed — {error}
        </div>
      )}

      {/* ── Output ── */}
      {status === 'done' && posts && (
        <div>
          <div className={styles.outHeader}>
            <div style={{fontSize:14,fontWeight:500}}>✦ Generated Posts</div>
            <button className="btn btn-ghost btn-sm" onClick={generate}>Regenerate ↻</button>
          </div>
          <div className={styles.postGrid}>
            {active.filter(p => posts[p]).map(p => {
              const post = posts[p];
              const meta = PLATFORMS[p];
              const ok = post.compliant !== false;
              return (
                <div key={p} className={styles.postCard}>
                  <div className={styles.cardHeader}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:meta.color,display:'inline-block'}} />
                    <span style={{fontSize:12,fontWeight:500,color:meta.color}}>{meta.label}</span>
                    <span style={{marginLeft:'auto',fontSize:10,color:'var(--text3)'}}>{style}</span>
                  </div>
                  <div className={styles.cardBody}>{post.text}</div>
                  <div className={styles.cardFooter}>
                    <span style={{fontSize:11,color:'var(--text3)',flex:1}}>{(post.text||'').length} chars</span>
                    <span style={{fontSize:11,color:ok?'var(--ok)':'var(--warn)'}}>{ok ? '✓ Compliant' : '⚠ '+post.note}</span>
                    <button className={styles.copyBtn} onClick={() => copy(p, post.text)}>
                      {copied === p ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
