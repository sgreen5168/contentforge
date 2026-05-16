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

// ── Affiliate link embedder ───────────────────────────────────────────────────
// Finds the best descriptive keyword and wraps it in an HTML anchor tag
function embedAffiliateLink(text, affiliateUrl) {
  if (!affiliateUrl || !text) return text;

  // Keywords to avoid — too vague
  const avoid = ['click','here','this','link','visit','check','read','more','now','get','see','go','try'];

  // Split into words and find best descriptive anchor candidate
  const words = text.split(/\s+/);
  let bestIdx = -1;
  let bestScore = 0;

  words.forEach((word, i) => {
    const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (clean.length < 4) return;
    if (avoid.includes(clean)) return;

    // Prefer words near middle of text — more natural
    const posScore = 1 - Math.abs((i / words.length) - 0.6);
    // Prefer longer descriptive words
    const lenScore = Math.min(clean.length / 12, 1);
    // Prefer nouns/descriptors — words ending in common noun suffixes
    const nounScore = /tion|ment|ness|ing|ity|ful|ive|ble|ous|ary|ery|ory/.test(clean) ? 0.3 : 0;
    const score = posScore * 0.4 + lenScore * 0.4 + nounScore * 0.2;

    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });

  if (bestIdx === -1) return text;

  // Wrap the chosen word with the link
  words[bestIdx] = `<a href="${affiliateUrl}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:3px">${words[bestIdx]}</a>`;
  return words.join(' ');
}

export default function Composer({ onPlatformsChange }) {
  const [mode, setMode]           = useState('topic');
  const [topic, setTopic]         = useState('');
  const [url, setUrl]             = useState('');
  const [style, setStyle]         = useState('Casual');
  const [plats, setPlats]         = useState({ facebook: true, instagram: true, reddit: true });
  const [affiliate, setAffiliate] = useState(false);
  const [affiliateUrl, setAffUrl] = useState('');
  const [keyword, setKeyword]     = useState('');
  const [status, setStatus]       = useState('idle');
  const [step, setStep]           = useState(0);
  const [posts, setPosts]         = useState(null);
  const [edited, setEdited]       = useState({});
  const [editing, setEditing]     = useState({});
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState('');
  const [linkMode, setLinkMode]   = useState('auto');
  const [autoImage, setAutoImage] = useState(true);
  const [postImage, setPostImage] = useState(null);
  const [imgLoading, setImgLoad]  = useState(false);
  const [imgError, setImgError]   = useState('');
  const [selImage, setSelImage]   = useState(null); // auto | keyword | manual

  const active   = Object.keys(plats).filter(p => plats[p]);
  const hasInput = mode === 'topic' ? topic.trim() : url.trim();
  // Auto-enable affiliate embed when in affiliate tab
  const effectiveAffiliate = affiliate || mode === 'affiliate';
  const effectiveAffUrl = affiliateUrl || (mode === 'affiliate' ? url : '');

  function togglePlat(p) {
    const next = { ...plats, [p]: !plats[p] };
    setPlats(next);
    onPlatformsChange?.(next);
  }

  async function generate() {
    if (!hasInput || !active.length) return;
    // Auto-fill affiliateUrl from the url field when in affiliate tab
    const effectiveAffUrl = affiliateUrl || (mode === 'affiliate' ? url : '');
    if (mode === 'affiliate' && url && !affiliateUrl) setAffUrl(url);
    setStatus('loading'); setPosts(null); setEdited({}); setEditing({}); setError(''); setStep(0);
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1600);
    try {
      const result = await generatePosts({
        inputMode: mode, topic, url, style,
        platforms: active, affiliate,
        affiliateUrl: affiliate ? effectiveAffUrl : '',
        keyword: affiliate && linkMode === 'keyword' ? keyword : '',
        linkMode: affiliate ? linkMode : 'none',
      });
      clearTimeout(t1); clearTimeout(t2);
      setPosts(result);
      setStatus('done');
      // Auto-generate image from post content
      if (autoImage) {
        const firstPost = result[active[0]];
        const postText = firstPost?.text || topic || url;
        generatePostImage(postText);
      }
    } catch (e) {
      clearTimeout(t1); clearTimeout(t2);
      setError(e.message);
      setStatus('error');
    }
  }

  // Get final text with embedded link
  function getFinalText(key, raw = false) {
    const base = edited[key] ?? posts[key]?.text ?? '';
    if (raw || !effectiveAffiliate || !effectiveAffUrl) return base;

    if (linkMode === 'manual') return base;
    if (linkMode === 'keyword' && keyword.trim()) {
      const kw = keyword.trim();
      const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
      return base.replace(re, `<a href="${effectiveAffUrl}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:3px">$1</a>`);
    }
    return embedAffiliateLink(base, effectiveAffUrl);
  }

  function copy(key) {
    // Copy plain text version (no HTML) for pasting into apps
    const text = edited[key] ?? posts[key]?.text ?? '';
    const linked = affiliate && affiliateUrl
      ? text + (linkMode === 'manual' ? `\n\n${affiliateUrl}` : '')
      : text;
    navigator.clipboard.writeText(linked).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function copyWithLink(key) {
    // Copy HTML version with embedded hyperlink
    const html = getFinalText(key);
    const blob = new Blob([html], { type: 'text/html' });
    const plain = new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
    const item = new ClipboardItem({ 'text/html': blob, 'text/plain': plain });
    navigator.clipboard.write([item]).catch(() => {
      navigator.clipboard.writeText(html.replace(/<[^>]+>/g, '') + '\n' + effectiveAffUrl);
    });
    setCopied(key + '_html');
    setTimeout(() => setCopied(''), 2000);
  }

  function startEdit(key) {
    setEdited(prev => ({ ...prev, [key]: posts[key]?.text ?? '' }));
    setEditing(prev => ({ ...prev, [key]: true }));
  }
  function saveEdit(key)   { setEditing(prev => ({ ...prev, [key]: false })); }
  function cancelEdit(key) {
    setEdited(prev => { const n = { ...prev }; delete n[key]; return n; });
    setEditing(prev => ({ ...prev, [key]: false }));
  }
  function resetEdit(key) {
    setEdited(prev => { const n = { ...prev }; delete n[key]; return n; });
    setEditing(prev => ({ ...prev, [key]: false }));
  }

  async function generatePostImage(postText) {
    setImgLoad(true); setImgError(''); setPostImage(null);
    try {
      // Build a clean visual prompt from the post text
      const words = postText.replace(/[#@]/g, '').replace(/https?:\/\/\S+/g, '').trim();
      const prompt = `${words.slice(0, 200)}, lifestyle photography, social media, professional, no text`;
      const seed = Math.floor(Math.random() * 999999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
      setPostImage({ url, prompt });
      setSelImage({ url, prompt });
    } catch (e) {
      setImgError(e.message);
    } finally {
      setImgLoad(false);
    }
  }

  async function regenerateImage(customPrompt) {
    setImgLoad(true); setImgError('');
    try {
      const seed = Math.floor(Math.random() * 999999);
      const finalPrompt = customPrompt || (postImage?.prompt || topic);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
      setPostImage({ url, prompt: finalPrompt });
      setSelImage({ url, prompt: finalPrompt });
    } catch (e) {
      setImgError(e.message);
    } finally {
      setImgLoad(false);
    }
  }

  return (
    <div className="page-content">
      <h1 className="page-title serif">AI Content <span>Composer</span></h1>
      <p className="page-sub">Enter a topic, URL, or affiliate link — Claude writes platform-ready posts instantly</p>

      <div className={styles.composer}>
        <div className={styles.tabs}>
          {[['topic','Topic / Keyword'],['url','URL Extractor'],['affiliate','Affiliate Link']].map(([m,l]) => (
            <button key={m} className={`${styles.tab} ${mode===m?styles.activeTab:''}`} onClick={() => setMode(m)}>{l}</button>
          ))}
        </div>

        <div className={styles.body}>
          {mode === 'topic' && (
            <div>
              <div className="field-label">Topic or keyword</div>
              <input className="field-input" style={{marginBottom:13}} placeholder='"remote work productivity hacks"' value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
          )}
          {(mode === 'url' || mode === 'affiliate') && (
            <div>
              <div className="field-label">{mode === 'affiliate' ? 'Affiliate product link' : 'Webpage URL'}</div>
              <input className="field-input" style={{marginBottom:13}} placeholder={mode === 'affiliate' ? 'https://affiliate.link/product' : 'https://example.com/article'} value={url} onChange={e => setUrl(e.target.value)} />
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
              <button key={k} className={`${styles.platBtn} ${plats[k]?styles['on_'+k]:''}`} onClick={() => togglePlat(k)}>
                <span style={{width:7,height:7,borderRadius:'50%',background:plats[k]?v.color:'var(--text3)',display:'inline-block'}} />
                {v.label}
              </button>
            ))}
          </div>

          {/* ── Affiliate link embed section ── */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: affiliate ? 12 : 0}}>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>🔗 Embed affiliate link</div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Hyperlink a descriptive keyword naturally in the post</div>
              </div>
              <label className={styles.toggle} style={{flexShrink:0}}>
                <input type="checkbox" checked={affiliate} onChange={e => setAffiliate(e.target.checked)} />
                <span className={styles.slider} />
              </label>
            </div>

            {affiliate && (
              <div>
                {/* Affiliate URL */}
                <div className="field-label">Your affiliate URL</div>
                <input className="field-input" style={{marginBottom:10}}
                  placeholder="https://yourlink.com/product?ref=yourcode"
                  value={affiliateUrl}
                  onChange={e => setAffUrl(e.target.value)}
                />

                {/* Link placement mode */}
                <div className="field-label">How to embed the link</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
                  {[
                    ['auto',    '✦ Auto',    'Claude picks the best descriptive word automatically'],
                    ['keyword', '🔑 Keyword', 'You choose the exact word to hyperlink'],
                    ['manual',  '✎ Manual',  'Link added at the end — you place it yourself'],
                  ].map(([val, label, desc]) => (
                    <button key={val} onClick={() => setLinkMode(val)}
                      style={{padding:'8px 10px',borderRadius:8,border:`1px solid ${linkMode===val?'var(--accent)':'var(--border)'}`,
                        background:linkMode===val?'var(--ag)':'var(--bg2)',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                      <div style={{fontSize:12,fontWeight:500,color:linkMode===val?'var(--accent)':'var(--text)'}}>{label}</div>
                      <div style={{fontSize:10,color:'var(--text3)',marginTop:2,lineHeight:1.4}}>{desc}</div>
                    </button>
                  ))}
                </div>

                {/* Keyword input — only shown in keyword mode */}
                {linkMode === 'keyword' && (
                  <div>
                    <div className="field-label">Anchor keyword</div>
                    <input className="field-input" style={{marginBottom:6}}
                      placeholder='e.g. "simple resource" or "working from home"'
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                    />
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:10}}>
                      💡 Use descriptive phrases — avoid vague words like "click here" or "this link"
                    </div>
                  </div>
                )}

                {/* Example */}
                <div style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px',borderLeft:'3px solid var(--accent)'}}>
                  <div style={{fontSize:10,color:'var(--accent)',fontWeight:500,marginBottom:5,textTransform:'uppercase',letterSpacing:.4}}>Example of natural embedding</div>
                  <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>
                    Working from home can transform your daily routine in ways you might not expect.
                    If you're curious, you can explore this{' '}
                    <span style={{textDecoration:'underline',textUnderlineOffset:3,color:'var(--accent)'}}>
                      {linkMode==='keyword'&&keyword ? keyword : 'simple resource'}
                    </span>{' '}
                    to learn more.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto image toggle */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,marginBottom:10}}>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>🖼 Auto-generate image</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>Creates a relevant image from your post content automatically</div>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" checked={autoImage} onChange={e => setAutoImage(e.target.checked)} />
              <span className={styles.slider} />
            </label>
          </div>
          <div className={styles.generateBar}>
            <div style={{fontSize:12,color:'var(--text3)'}}>
              {affiliate && affiliateUrl ? '🔗 Affiliate link will be embedded' : ''}
            </div>
            <button className="btn btn-primary" onClick={generate} disabled={status==='loading'||!hasInput||!active.length}>
              {status === 'loading' && <span className="spin" />}
              {status === 'loading' ? 'Generating…' : 'Generate Posts ⚡'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
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

      {/* Error */}
      {status === 'error' && (
        <div className={styles.errorBox}>⚠ Generation failed — {error}</div>
      )}

      {/* Posts output */}
      {status === 'done' && posts && (
        <div>
          <div className={styles.outHeader}>
            <div style={{fontSize:14,fontWeight:500}}>✦ Generated Posts</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {effectiveAffiliate && effectiveAffUrl && (
                <span style={{fontSize:11,color:'var(--accent)',background:'var(--ag)',padding:'2px 8px',borderRadius:10}}>
                  🔗 Link embedded
                </span>
              )}
              <button className="btn btn-ghost btn-sm" onClick={generate}>Regenerate ↻</button>
            </div>
          </div>

          {/* Generated image panel */}
          {(imgLoading || postImage) && (
            <div style={{background:'rgba(16,45,79,.9)',border:'1px solid rgba(29,158,117,.2)',borderRadius:12,overflow:'hidden',marginBottom:14}}>
              <div style={{padding:'11px 15px',borderBottom:'1px solid rgba(29,158,117,.15)',fontSize:13,fontWeight:500,color:'#E8F4F0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span>🖼 Post image</span>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={() => regenerateImage()}
                    style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'1px solid rgba(29,158,117,.3)',background:'transparent',color:'#5DCAA5',cursor:'pointer',fontFamily:'inherit'}}>
                    ↻ Regenerate
                  </button>
                  {postImage && (
                    <button onClick={() => { const a=document.createElement('a');a.href=postImage.url;a.download='post-image.png';a.target='_blank';a.click(); }}
                      style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'none',background:'#1D9E75',color:'white',cursor:'pointer',fontFamily:'inherit'}}>
                      ⬇ Download
                    </button>
                  )}
                </div>
              </div>
              <div style={{padding:'12px 15px'}}>
                {imgLoading && (
                  <div style={{display:'flex',alignItems:'center',gap:10,color:'#5DCAA5',fontSize:13}}>
                    <div style={{width:18,height:18,border:'2px solid rgba(29,158,117,.3)',borderTopColor:'#1D9E75',borderRadius:'50%',animation:'spin 1s linear infinite',flexShrink:0}} />
                    Generating image from your post content...
                  </div>
                )}
                {postImage && !imgLoading && (
                  <div>
                    <img src={postImage.url} alt="Post visual"
                      style={{width:'100%',maxHeight:300,objectFit:'cover',borderRadius:8,marginBottom:10,display:'block'}}
                      onError={() => setImgError('Image failed to load — click Regenerate')}
                    />
                    {/* Custom prompt */}
                    <div style={{display:'flex',gap:6}}>
                      <input
                        placeholder="Describe a different image..."
                        style={{flex:1,border:'1px solid rgba(29,158,117,.2)',borderRadius:6,padding:'6px 10px',fontSize:12,fontFamily:'inherit',color:'#E8F4F0',background:'rgba(22,61,106,.6)',outline:'none'}}
                        onKeyDown={e => { if(e.key==='Enter') regenerateImage(e.target.value); }}
                        id="imgPromptInput"
                      />
                      <button onClick={() => { const v=document.getElementById('imgPromptInput').value; if(v) regenerateImage(v); }}
                        style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#1D9E75',color:'white',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                        ⚡
                      </button>
                    </div>
                    {imgError && <div style={{fontSize:11,color:'#F09595',marginTop:6}}>⚠ {imgError}</div>}
                    <div style={{fontSize:10,color:'#4A7A72',marginTop:6}}>
                      💡 Download and attach when posting to Facebook, Instagram or Pinterest
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.postGrid}>
            {active.filter(p => posts[p]).map(p => {
              const post     = posts[p];
              const meta     = PLATFORMS[p];
              const ok       = post.compliant !== false;
              const isEdit   = editing[p];
              const rawText  = edited[p] ?? post.text ?? '';
              const finalHtml = getFinalText(p);
              const wasEdited = edited[p] !== undefined;

              return (
                <div key={p} className={styles.postCard}>
                  <div className={styles.cardHeader}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:meta.color,display:'inline-block'}} />
                    <span style={{fontSize:12,fontWeight:500,color:meta.color}}>{meta.label}</span>
                    {wasEdited && !isEdit && (
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'rgba(124,107,255,.15)',color:'var(--accent)',marginLeft:6}}>Edited</span>
                    )}
                    {effectiveAffiliate && effectiveAffUrl && !isEdit && (
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'rgba(34,201,138,.1)',color:'var(--ok)',marginLeft:4}}>🔗 Linked</span>
                    )}
                    <span style={{marginLeft:'auto',fontSize:10,color:'var(--text3)'}}>{style}</span>
                  </div>

                  {/* Post body */}
                  {isEdit ? (
                    <textarea
                      className={styles.cardBody}
                      value={rawText}
                      onChange={e => setEdited(prev => ({ ...prev, [p]: e.target.value }))}
                      style={{
                        width:'100%', minHeight:120, resize:'vertical',
                        background:'var(--bg3)', border:'1px solid var(--accent)',
                        borderRadius:6, padding:'10px 12px', fontSize:13,
                        fontFamily:'inherit', color:'var(--text)', lineHeight:1.6,
                        outline:'none', boxSizing:'border-box',
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className={styles.cardBody}
                      style={{whiteSpace:'pre-wrap',lineHeight:1.7}}
                      dangerouslySetInnerHTML={{ __html: finalHtml }}
                    />
                  )}

                  <div className={styles.cardFooter}>
                    <span style={{fontSize:11,color:'var(--text3)',flex:1}}>{rawText.length} chars</span>
                    <span style={{fontSize:11,color:ok?'var(--ok)':'var(--warn)'}}>{ok?'✓ Compliant':'⚠ '+post.note}</span>

                    {isEdit ? (
                      <>
                        <button onClick={() => saveEdit(p)} style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'1px solid var(--ok)',background:'rgba(34,201,138,.1)',color:'var(--ok)',cursor:'pointer',fontFamily:'inherit'}}>✓ Save</button>
                        <button onClick={() => cancelEdit(p)} style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'1px solid var(--border)',background:'none',color:'var(--text3)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(p)} style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'1px solid var(--border)',background:'none',color:'var(--text2)',cursor:'pointer',fontFamily:'inherit'}}>✎ Edit</button>
                        {wasEdited && <button onClick={() => resetEdit(p)} style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'none',background:'none',color:'var(--text3)',cursor:'pointer',fontFamily:'inherit'}}>Reset</button>}
                        {effectiveAffiliate && effectiveAffUrl && (
                          <button onClick={() => copyWithLink(p)} style={{fontSize:11,padding:'3px 9px',borderRadius:6,border:'1px solid rgba(34,201,138,.3)',background:'rgba(34,201,138,.08)',color:'var(--ok)',cursor:'pointer',fontFamily:'inherit'}}>
                            {copied===p+'_html' ? '🔗 Copied!' : '🔗 Copy with link'}
                          </button>
                        )}
                        <button className={styles.copyBtn} onClick={() => copy(p)}>
                          {copied === p ? 'Copied ✓' : 'Copy text'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Affiliate link guide */}
          {effectiveAffiliate && effectiveAffUrl && (
            <div style={{marginTop:16,padding:'14px 16px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:8}}>🔗 How to publish with your embedded link</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[
                  ['Facebook','Click 🔗 Copy with link → paste into Facebook composer — the hyperlink is preserved','✅ Supports hyperlinks'],
                  ['Instagram','Instagram captions don\'t support hyperlinks. Use Copy text and add your link to your bio or a link-in-bio tool like Linktree','⚠ Bio link only'],
                  ['Reddit','Click 🔗 Copy with link → paste into Reddit text post editor — hyperlinks work in rich text posts','✅ Supports hyperlinks'],
                ].map(([plat, tip, status]) => (
                  <div key={plat} style={{background:'var(--bg3)',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--text)',marginBottom:4}}>{plat}</div>
                    <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginBottom:6}}>{tip}</div>
                    <div style={{fontSize:10,color: status.includes('✅')?'var(--ok)':'var(--warn)'}}>{status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  ;<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
}
