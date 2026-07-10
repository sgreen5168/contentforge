import React, { useState, useRef } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

const MODES    = [['topic','Topic'],['url','URL'],['affiliate','Affiliate link']];
const STYLES   = ['UGC Story','Educational','VSL','Reel Ad','Product Review','Inspirational','Comparison','Problem/Solution'];
const LENGTHS  = [['short','Short (15-30s)'],['medium','Medium (45-60s)'],['long','Long (2-5 min)']];
const PERSONAS = ['UGC Creator','Testimonial','Influencer','Educator','Product Demo'];
const PLATFORMS = ['TikTok','Instagram','YouTube','Facebook'];

export default function ScriptWriter() {
  const [mode, setMode]       = useState('topic');
  const [input, setInput]     = useState('');
  const [style, setStyle]     = useState('UGC Story');
  const [length, setLength]   = useState('medium');
  const [persona, setPersona] = useState('UGC Creator');
  const [platform, setPlatform] = useState('TikTok');
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState([]);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [variations, setVars] = useState(false);
  const countRef = useRef(0);

  async function generate(count) {
    if (!input.trim()) return;
    setLoading(true); setError('');
    if (!variations) setScripts([]);
    countRef.current = count || 1;
    try {
      const results = [];
      for (let i = 0; i < (count || 1); i++) {
        let lastErr = null;
        let script = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          const res = await fetch(`${API}/api/video/script`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputMode: mode,
              topic: mode === 'topic' ? input : undefined,
              url: mode === 'url' ? input : undefined,
              affiliateUrl: mode === 'affiliate' ? input : undefined,
              style,
              persona: persona.toLowerCase().replace(' ','-'),
              duration: length === 'short' ? '30s' : length === 'medium' ? '60s' : '5m',
              platforms: [platform.toLowerCase()],
              videoType: style === 'VSL' ? 'ai-vsl' : style === 'Reel Ad' ? 'reel-ads' : 'ugc-persona',
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            lastErr = data.error || 'Script generation failed';
            const isOverload = res.status === 503 || (lastErr && lastErr.includes('busy'));
            if (isOverload && attempt < 2) {
              await new Promise(r => setTimeout(r, 5000));
              continue;
            }
            throw new Error(lastErr);
          }
          script = data.script;
          break;
        }
        if (!script) throw new Error(lastErr || 'Script generation failed');
        results.push({ ...script, id: Date.now() + i, timestamp: new Date().toLocaleTimeString() });
      }
      setScripts(prev => variations ? [...prev, ...results] : results);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function copyScript(s) {
    navigator.clipboard.writeText(s.fullScript || '').catch(() => {});
    setCopied(s.id);
    setTimeout(() => setCopied(''), 2000);
  }

  function startEdit(idx, text) { setEditIdx(idx); setEditText(text); }
  function saveEdit(idx) {
    setScripts(prev => prev.map((s, i) => i === idx ? { ...s, fullScript: editText } : s));
    setEditIdx(null);
  }

  function exportAll() {
    const txt = scripts.map((s, i) =>
      `=== Script ${i+1} ===\nHook: ${s.hook}\n\n${s.fullScript}\n\nCTA: ${s.cta}\n\nHashtags: ${(s.hashtags||[]).join(' ')}\n`
    ).join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contentforge-scripts.txt'; a.click();
    URL.revokeObjectURL(url);
  }

  const BG2  = 'rgba(16,45,79,.9)';
  const BORD = 'rgba(29,158,117,.2)';
  const ACC  = '#1D9E75';
  const ACCH = '#5DCAA5';
  const TXT  = '#E8F4F0';
  const TXT2 = '#7BAAA0';
  const TXT3 = '#4A7A72';

  function chip(on, color) {
    return {
      padding: '5px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
      border: '1px solid ' + (on ? (color||ACC) : BORD),
      background: on ? (color ? color+'22' : 'rgba(29,158,117,.15)') : 'transparent',
      color: on ? (color||ACCH) : TXT2, margin: '0 4px 4px 0', display: 'inline-block',
    };
  }

  const inp = {
    width: '100%', border: '1px solid ' + BORD, borderRadius: 8, padding: '8px 11px',
    fontSize: 13, fontFamily: 'inherit', color: TXT, background: 'rgba(22,61,106,.6)',
    outline: 'none', marginBottom: 10, boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: TXT }}>
          ✦ Script <span style={{ color: ACCH }}>Writer</span>
        </div>
        <div style={{ fontSize: 12, color: TXT2, marginTop: 3 }}>
          Generate, monitor and edit scripts — no video processing required
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>

        {/* Left — controls */}
        <div>
          <div style={{ background: BG2, border: '1px solid ' + BORD, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(29,158,117,.12)', fontSize: 13, fontWeight: 500, color: TXT }}>Source</div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {MODES.map(([id,label]) => (
                  <button key={id} onClick={() => setMode(id)} style={chip(mode===id)}>{label}</button>
                ))}
              </div>
              <input style={inp}
                placeholder={mode==='topic' ? '"morning productivity tips"' : mode==='url' ? 'https://article-url.com' : 'https://yourlink.com/product'}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate(1)}
              />
            </div>
          </div>

          <div style={{ background: BG2, border: '1px solid ' + BORD, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(29,158,117,.12)', fontSize: 13, fontWeight: 500, color: TXT }}>Script settings</div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Style</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
                {STYLES.map(s => <button key={s} onClick={() => setStyle(s)} style={chip(style===s)}>{s}</button>)}
              </div>

              <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Length</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {LENGTHS.map(([id,label]) => (
                  <button key={id} onClick={() => setLength(id)}
                    style={{ flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, textAlign: 'center',
                      border: '1px solid ' + (length===id ? ACC : BORD),
                      background: length===id ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: length===id ? ACCH : TXT2 }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Persona</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
                {PERSONAS.map(p => <button key={p} onClick={() => setPersona(p)} style={chip(persona===p)}>{p}</button>)}
              </div>

              <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Platform</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {PLATFORMS.map(p => <button key={p} onClick={() => setPlatform(p)} style={chip(platform===p)}>{p}</button>)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div onClick={() => setVars(!variations)}
                  style={{ width: 36, height: 20, borderRadius: 10, background: variations ? ACC : 'rgba(255,255,255,.1)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: variations ? 18 : 2, transition: 'left .2s' }} />
                </div>
                <span style={{ fontSize: 12, color: TXT2 }}>Keep previous scripts (variations)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => generate(1)} disabled={loading || !input.trim()}
              style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: ACC, color: 'white', fontSize: 13, fontWeight: 700,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading || !input.trim() ? 0.5 : 1 }}>
              {loading ? 'Writing...' : '✦ Write Script'}
            </button>
            <button onClick={() => generate(3)} disabled={loading || !input.trim()}
              style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid ' + BORD, background: 'transparent', color: ACCH, fontSize: 13,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading || !input.trim() ? 0.5 : 1 }}>
              3 Variations
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(226,75,74,.1)', borderRadius: 8, fontSize: 12, color: '#F09595' }}>
              <div style={{ marginBottom: error.includes('busy') ? 8 : 0 }}>{error}</div>
              {error.includes('busy') && (
                <button onClick={() => generate(countRef.current)}
                  style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#E24B4A', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Try again
                </button>
              )}
            </div>
          )}

          {scripts.length > 0 && (
            <button onClick={exportAll}
              style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 8, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Export all scripts as .txt
            </button>
          )}
        </div>

        {/* Right — script output */}
        <div>
          {loading && (
            <div style={{ background: BG2, border: '1px solid ' + BORD, borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(29,158,117,.2)', borderTopColor: ACC, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: ACCH }}>Claude is writing your script...</div>
              <div style={{ fontSize: 11, color: TXT3, marginTop: 4 }}>Topic: {input}</div>
            </div>
          )}

          {!loading && scripts.length === 0 && (
            <div style={{ background: BG2, border: '1px solid ' + BORD, borderRadius: 12, padding: 50, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 14, color: TXT, marginBottom: 6 }}>Scripts appear here instantly</div>
              <div style={{ fontSize: 12, color: TXT3 }}>Enter a topic and click Write Script — or generate 3 variations at once</div>
            </div>
          )}

          {scripts.map((s, idx) => (
            <div key={s.id} style={{ background: BG2, border: '1px solid ' + BORD, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(29,158,117,.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ACCH }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: TXT }}>Script {idx + 1}</span>
                  <span style={{ fontSize: 10, color: TXT3 }}>{s.timestamp} · {style} · {platform}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {editIdx === idx ? (
                    <>
                      <button onClick={() => saveEdit(idx)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: 'none', background: ACC, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                      <button onClick={() => setEditIdx(null)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(idx, s.fullScript)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, cursor: 'pointer', fontFamily: 'inherit' }}>✎ Edit</button>
                      <button onClick={() => copyScript(s)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: 'none', background: copied===s.id ? 'rgba(29,158,117,.3)' : ACC, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {copied === s.id ? '✓ Copied' : 'Copy'}
                      </button>
                      <button onClick={() => setScripts(prev => prev.filter((_,i) => i !== idx))}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(226,75,74,.2)', background: 'transparent', color: '#F09595', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ padding: '12px 14px' }}>
                {/* Hook */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Hook</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TXT, padding: '8px 10px', background: 'rgba(29,158,117,.06)', borderRadius: 6, lineHeight: 1.5 }}>
                    {s.hook}
                  </div>
                </div>

                {/* Full script */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Full script</div>
                  {editIdx === idx ? (
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      style={{ width: '100%', minHeight: 180, resize: 'vertical', background: 'rgba(22,61,106,.5)', border: '1px solid ' + ACC, borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: TXT, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box' }}
                      autoFocus
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: TXT2, lineHeight: 1.8, padding: '10px 12px', background: 'rgba(22,61,106,.4)', borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                      {s.fullScript}
                    </div>
                  )}
                </div>

                {/* CTA */}
                {s.cta && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Call to action</div>
                    <div style={{ fontSize: 13, color: ACCH, padding: '6px 10px', background: 'rgba(29,158,117,.08)', borderRadius: 6 }}>{s.cta}</div>
                  </div>
                )}

                {/* Hashtags */}
                {s.hashtags?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Hashtags</div>
                    <div style={{ fontSize: 12, color: '#5B9BD5' }}>{s.hashtags.join(' ')}</div>
                  </div>
                )}

                {/* Scene descriptions */}
                {s.sceneDescriptions?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: TXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>
                      Scene descriptions ({s.sceneDescriptions.length} scenes)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {s.sceneDescriptions.map((scene, si) => (
                        <div key={si} style={{ display: 'flex', gap: 8, padding: '6px 10px', background: 'rgba(22,61,106,.3)', borderRadius: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: ACCH, flexShrink: 0, width: 50 }}>Scene {scene.scene}</span>
                          <span style={{ fontSize: 11, color: TXT2, lineHeight: 1.5 }}>{scene.visual}</span>
                          <span style={{ fontSize: 10, color: TXT3, flexShrink: 0 }}>{scene.duration}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Use in Video Engine button */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(29,158,117,.1)', display: 'flex', gap: 6 }}>
                  <button onClick={() => copyScript(s)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: ACC, color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Copy full script
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(s.hook).catch(()=>{}); setCopied(s.id+'hook'); setTimeout(()=>setCopied(''),2000); }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {copied === s.id+'hook' ? '✓' : 'Copy hook'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
    </div>
  );
}
