import React, { useState, useEffect } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

export default function RedditSettings() {
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);
  const [testTitle, setTitle]   = useState('');
  const [testText, setText]     = useState('');
  const [subreddit, setSub]     = useState('');
  const [testResult, setResult] = useState(null);

  useEffect(() => { checkStatus(); }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reddit/verify`);
      const data = await res.json();
      setStatus(data);
    } catch { setStatus({ connected: false, error: 'Could not reach backend' }); }
    finally { setLoading(false); }
  }

  async function sendTestPost() {
    if (!testTitle.trim()) return;
    setPosting(true); setResult(null);
    try {
      const res = await fetch(`${API}/api/reddit/post-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: testTitle, text: testText, subreddit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ success: true, url: data.url });
    } catch (e) { setResult({ success: false, error: e.message }); }
    finally { setPosting(false); }
  }

  return (
    <div style={{ padding:24, maxWidth:700, fontFamily:'inherit' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 }}>
          Reddit Integration
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(255,69,0,.15)', color:'#FF6B35', fontWeight:400 }}>Reddit</span>
        </div>
        <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Connect your Reddit account to auto-post videos and text posts</div>
      </div>

      {/* Status card */}
      <div style={S.card}>
        <div style={S.cardHdr}>Connection status</div>
        <div style={S.cardBody}>
          {loading ? (
            <div style={{ color:'#7BAAA0', fontSize:13 }}>Checking connection…</div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background: status?.connected ? '#1D9E75' : '#E24B4A', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'#E8F4F0' }}>
                  {status?.connected ? `Connected as u/${status.username}` : 'Not connected'}
                </div>
                <div style={{ fontSize:12, color:'#7BAAA0', marginTop:2 }}>
                  {status?.connected
                    ? `Karma: ${status.karma?.toLocaleString()} · Account age: ${status.accountAge}`
                    : status?.error || 'Add Reddit credentials to Railway to connect'}
                </div>
              </div>
              <button onClick={checkStatus}
                style={{ fontSize:11, padding:'5px 12px', borderRadius:6, border:'0.5px solid rgba(29,158,117,.3)', background:'none', color:'#5DCAA5', cursor:'pointer', fontFamily:'inherit' }}>
                ↻ Recheck
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Setup guide — show if not connected */}
      {!status?.connected && !loading && (
        <div style={S.card}>
          <div style={S.cardHdr}>Setup guide</div>
          <div style={S.cardBody}>
            {[
              { n:1, title:'Create a Reddit app', desc:'Go to reddit.com/prefs/apps → scroll to bottom → click "Create another app"' },
              { n:2, title:'Fill in the form', desc:'Name: ContentForge · Type: script · Redirect URI: http://localhost:8080 · Click Create app' },
              { n:3, title:'Copy your credentials', desc:'Client ID = short code under "personal use script" · Client Secret = code next to "secret"' },
              { n:4, title:'Add to Railway Variables', desc:'railway.app → stellar-achievement → Variables → Raw Editor' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', gap:12, paddingBottom:14, marginBottom:14, borderBottom: i<3?'0.5px solid rgba(29,158,117,.1)':'none' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(29,158,117,.15)', color:'#5DCAA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, flexShrink:0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:3 }}>{s.title}</div>
                  <div style={{ fontSize:12, color:'#7BAAA0', lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ background:'rgba(22,61,106,.6)', borderRadius:8, padding:'12px 14px', fontFamily:'monospace', fontSize:12, color:'#5DCAA5', lineHeight:2 }}>
              REDDIT_CLIENT_ID=your_client_id<br/>
              REDDIT_CLIENT_SECRET=your_client_secret<br/>
              REDDIT_USERNAME=your_reddit_username<br/>
              REDDIT_PASSWORD=your_reddit_password<br/>
              REDDIT_SUBREDDIT=your_default_subreddit
            </div>

            <div style={{ fontSize:11, color:'#4A7A72', marginTop:8 }}>
              ⚠ REDDIT_SUBREDDIT is optional — you can choose a subreddit each time you post. Use "test" for initial testing.
            </div>
          </div>
        </div>
      )}

      {/* Test post — show if connected */}
      {status?.connected && (
        <div style={S.card}>
          <div style={S.cardHdr}>Send a test post</div>
          <div style={S.cardBody}>
            <div style={S.label}>Subreddit (without r/)</div>
            <input style={S.inp} placeholder={process.env.REDDIT_SUBREDDIT || 'test'} value={subreddit} onChange={e => setSub(e.target.value)} />

            <div style={S.label}>Post title</div>
            <input style={S.inp} placeholder="My first ContentForge test post" value={testTitle} onChange={e => setTitle(e.target.value)} />

            <div style={S.label}>Post body (optional)</div>
            <textarea style={{ ...S.inp, minHeight:80, resize:'vertical' }} placeholder="Optional text body for the post…" value={testText} onChange={e => setText(e.target.value)} />

            {testResult && (
              <div style={{ padding:'10px 12px', borderRadius:8, marginBottom:12, fontSize:13,
                background: testResult.success ? 'rgba(29,158,117,.1)' : 'rgba(226,75,74,.1)',
                border: `0.5px solid ${testResult.success ? 'rgba(29,158,117,.25)' : 'rgba(226,75,74,.25)'}`,
                color: testResult.success ? '#5DCAA5' : '#F09595' }}>
                {testResult.success
                  ? <>✅ Posted successfully! <a href={testResult.url} target="_blank" rel="noreferrer" style={{ color:'#5DCAA5' }}>View on Reddit ↗</a></>
                  : `❌ Failed: ${testResult.error}`}
              </div>
            )}

            <button onClick={sendTestPost} disabled={posting || !testTitle.trim()}
              style={{ background:'#FF4500', color:'white', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity: posting||!testTitle.trim()?0.45:1 }}>
              {posting ? '⏳ Posting…' : '📤 Send test post'}
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div style={S.card}>
        <div style={S.cardHdr}>How Reddit auto-posting works</div>
        <div style={S.cardBody}>
          {[
            ['Video posts','When you generate a video and enable Auto-upload — ContentForge uploads the video file to Reddit and creates a video post automatically'],
            ['Text posts','The AI Composer generates Reddit-optimised posts. Use the Copy button to post manually or enable auto-posting with credentials connected'],
            ['Scheduled posts','In Video Scheduler select Reddit as a platform — your video posts automatically at the scheduled time'],
            ['Subreddit selection','Each post can target a different subreddit. Set REDDIT_SUBREDDIT in Railway as your default and override per-post in the scheduler'],
            ['Best subreddits','Choose subreddits relevant to your content niche. Always check subreddit rules before posting — some ban promotional content'],
          ].map(([title, desc], i, arr) => (
            <div key={i} style={{ paddingBottom:10, marginBottom:10, borderBottom: i<arr.length-1?'0.5px solid rgba(29,158,117,.08)':'none' }}>
              <div style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:3 }}>{title}</div>
              <div style={{ fontSize:12, color:'#7BAAA0', lineHeight:1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  card:    { background:'rgba(16,45,79,.9)', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden', marginBottom:14 },
  cardHdr: { padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
  cardBody:{ padding:'14px 16px' },
  label:   { fontSize:10, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5, marginBottom:5, display:'block' },
  inp:     { width:'100%', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'8px 11px', fontSize:13, fontFamily:'inherit', color:'#E8F4F0', background:'rgba(22,61,106,.6)', outline:'none', marginBottom:12, boxSizing:'border-box' },
};
