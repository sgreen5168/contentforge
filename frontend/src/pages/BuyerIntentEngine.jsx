import { useState, useEffect } from 'react';

const BG   = '#0B1829';
const BG2  = '#0F2035';
const BORD = 'rgba(255,255,255,.08)';
const TXT  = '#E8F4F0';
const TXT2 = 'rgba(232,244,240,.7)';
const TXT3 = 'rgba(232,244,240,.4)';
const GRN  = '#1D9E75';
const RED  = '#FF4500';
const BLU  = '#2563EB';
const AMB  = '#F59E0B';
const API  = 'https://contentforge-production-6e13.up.railway.app';

function card(extra) {
  return { background:BG2, border:`1px solid ${BORD}`, borderRadius:12, padding:16, marginBottom:14, ...extra };
}

function ScoreBadge({ score }) {
  const color = score >= 7 ? GRN : score >= 4 ? AMB : '#EF4444';
  const label = score >= 7 ? 'High intent' : score >= 4 ? 'Medium intent' : 'Low intent';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontSize:18, fontWeight:700, color }}>{score}</span>
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color }}>{label}</div>
        <div style={{ fontSize:10, color:TXT3 }}>Buyer intent score / 10</div>
      </div>
    </div>
  );
}

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
      style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${BORD}`, background:'transparent', color:copied?GRN:TXT3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
      {copied ? '✓ Copied' : `📋 ${label||'Copy'}`}
    </button>
  );
}

const SUBREDDIT_MAP = {
  'health':          ['xxfitness','fitness','loseit','bodyweightfitness','homegym','nutrition'],
  'meal-prep':       ['MealPrepSunday','EatCheapAndHealthy','Cooking','budgetfood'],
  'finance':         ['personalfinance','Frugal','povertyfinance','FinancialPlanning'],
  'side-hustle':     ['sidehustle','WorkOnline','beermoney','Entrepreneur','passive_income'],
  'mindset':         ['selfimprovement','getmotivated','productivity'],
  'remote-work':     ['remotework','digitalnomad','WorkOnline','freelance'],
  'cooking':         ['Cooking','recipes','AskCulinary','MealPrepSunday'],
  'coffee':          ['Coffee','espresso','cafe','barista','pourover'],
  'woodworking':     ['woodworking','DIY','BeginnerWoodWorking'],
  'outdoor-cooking': ['BBQ','smoking','grilling','camping'],
  'home-income':     ['sidehustle','Entrepreneur','WorkOnline','affiliatemarketing'],
  'default':         ['Frugal','buyitforlife','deals','productreviews'],
};

export default function BuyerIntentEngine() {
  const [session, setSession]           = useState(null);
  const [topic, setTopic]               = useState(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [analysis, setAnalysis]         = useState(null);
  const [redditPosts, setRedditPosts]   = useState([]);
  const [redditLoading, setRedditLoading] = useState(false);
  const [activeSub, setActiveSub]       = useState('');
  const [tab, setTab]                   = useState('intent');
  const [replyDraft, setReplyDraft]     = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [redditError, setRedditError]   = useState('');

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const t = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      setSession(s); setTopic(t);
    } catch(e) {}
  }, []);

  const niche      = topic?.cat || 'default';
  const subreddits = SUBREDDIT_MAP[niche] || SUBREDDIT_MAP.default;
  const landingUrl = session?.landingUrl || session?.landing || 'https://nichroute.com';
  const topicLabel = topic?.label || session?.youtubeTitle || 'home tips';
  const affName    = session?.link?.name || '';

  async function analyzeIntent() {
    setAnalyzing(true);
    try {
      const r = await fetch(API + '/api/campaign/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: `You are a conversion rate optimization expert. Analyze this affiliate topic for buyer intent.
Topic: "${topicLabel}"
Niche: ${niche}
Affiliate product: ${affName}
Landing page: ${landingUrl}
Return ONLY a JSON object with these fields:
{"intentScore":7,"intentReason":"1-2 sentences","buyerStage":"awareness|consideration|decision","buyerProfile":"1 sentence","conversionBarriers":["barrier 1","barrier 2","barrier 3"],"optimizedHeadline":"rewritten headline targeting decision-stage buyers","optimizedSubline":"rewritten subline addressing buyer problem","urgencyLine":"short factual urgency or social proof line","ctaText":"better CTA button text","highIntentTopics":["better topic 1","better topic 2","better topic 3"],"quoraQuestions":["question 1","question 2","question 3"]}`,
          max_tokens: 1000,
        }),
      });
      const d = await r.json();
      const text = d.text || d.content?.[0]?.text || '';
      setAnalysis(JSON.parse(text.replace(/```json|```/g,'').trim()));
    } catch(e) { alert('Analysis failed — try again'); }
    setAnalyzing(false);
  }

  async function loadRedditPosts(sub) {
    setRedditLoading(true);
    setActiveSub(sub);
    setRedditPosts([]);
    setSelectedPost(null);
    setReplyDraft('');
    setRedditError('');

    const query = encodeURIComponent(topicLabel.split(' ').slice(0,4).join(' '));
    const searchUrl = `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=1&sort=relevance&t=month&limit=15&raw_json=1`;
    const hotUrl    = `https://www.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`;

    const tryFetch = async (url) => {
      const proxied = [
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
        'https://corsproxy.io/?' + encodeURIComponent(url),
        url,
      ];
      for (const p of proxied) {
        try {
          const res = await fetch(p, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;
          const text = await res.text();
          if (text.includes('"children"')) return JSON.parse(text);
        } catch(e) { /* try next proxy */ }
      }
      return null;
    };

    let posts = [];
    const d1 = await tryFetch(searchUrl);
    if (d1) posts = (d1?.data?.children || []).map(c => c.data).filter(p => p?.title && !p.stickied);

    if (posts.length === 0) {
      const d2 = await tryFetch(hotUrl);
      if (d2) posts = (d2?.data?.children || []).map(c => c.data).filter(p => p?.title && !p.stickied);
    }

    if (posts.length === 0) {
      setRedditError(`Reddit is blocking automated requests. Click the manual search link below to find threads yourself.`);
    }

    setRedditPosts(posts.slice(0,12).map(p => ({
      id: p.id,
      title: p.title,
      selftext: (p.selftext||'').slice(0,300),
      score: p.score,
      num_comments: p.num_comments,
      permalink: p.permalink,
      subreddit: p.subreddit,
      created_utc: p.created_utc,
    })));
    setRedditLoading(false);
  }

  async function generateReply(post) {
    setSelectedPost(post);
    setDraftLoading(true);
    setReplyDraft('');
    try {
      const r = await fetch(API + '/api/campaign/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: `Write a helpful Reddit reply to this post. Sound like a genuine user, not a marketer.
Post title: "${post.title}"
Post content: "${(post.selftext||'').slice(0,300)}"
Subreddit: r/${post.subreddit}
Your resource: ${landingUrl}
Topic: ${topicLabel}
Rules: Be helpful first. Only add the link naturally at the end if genuinely relevant. Under 150 words. End with: "I put together a guide on this if useful: ${landingUrl}"
Write ONLY the reply text.`,
          max_tokens: 300,
        }),
      });
      const d = await r.json();
      setReplyDraft(d.text || d.content?.[0]?.text || '');
    } catch(e) { setReplyDraft('Failed to generate — try again'); }
    setDraftLoading(false);
  }

  return (
    <div style={{ color:TXT, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ ...card({ background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)' }) }}>
        <div style={{ fontSize:14, fontWeight:700, color:GRN, marginBottom:4 }}>🎯 Buyer Intent Engine</div>
        <div style={{ fontSize:12, color:TXT3, lineHeight:1.6 }}>Analyzes why visitors click but don't buy · Finds Reddit threads where buyers ask your topic's question · Drafts ready-to-post replies with your landing page naturally included</div>
      </div>

      {session
        ? <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', padding:'10px 14px' }) }}><div style={{ fontSize:12, color:GRN, fontWeight:600 }}>✓ {topicLabel}</div><div style={{ fontSize:11, color:TXT3 }}>{niche} · {affName} · {landingUrl.replace('https://','')}</div></div>
        : <div style={{ ...card({ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', padding:'10px 14px' }) }}><div style={{ fontSize:12, color:'#FC8F8F', fontWeight:600 }}>Generate a topic in Command Center first</div></div>
      }

      <div style={{ display:'flex', gap:4, marginBottom:14, background:BG2, borderRadius:10, padding:4 }}>
        {[{id:'intent',label:'🎯 Intent Analysis'},{id:'reddit',label:'🔴 Reddit Finder'},{id:'quora',label:'❓ Quora Finder'}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, padding:'8px', borderRadius:7, border:'none', background:tab===t.id?'rgba(29,158,117,.2)':'transparent', color:tab===t.id?GRN:TXT3, fontSize:12, fontWeight:tab===t.id?700:400, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Intent Analysis */}
      {tab === 'intent' && (
        <div>
          <button onClick={analyzeIntent} disabled={analyzing||!session}
            style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:analyzing?'rgba(29,158,117,.3)':GRN, color:'#fff', fontSize:14, fontWeight:700, cursor:analyzing||!session?'default':'pointer', fontFamily:'inherit', marginBottom:14 }}>
            {analyzing ? '⏳ Analyzing...' : '🎯 Analyze Buyer Intent'}
          </button>
          {analysis && (
            <div>
              <div style={{ ...card() }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <ScoreBadge score={analysis.intentScore} />
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:TXT, marginBottom:4 }}>{(analysis.buyerStage||'').charAt(0).toUpperCase()+(analysis.buyerStage||'').slice(1)} stage buyer</div>
                    <div style={{ fontSize:12, color:TXT2, lineHeight:1.6 }}>{analysis.intentReason}</div>
                  </div>
                </div>
                <div style={{ marginTop:12, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:7 }}>
                  <div style={{ fontSize:11, color:TXT3, marginBottom:3 }}>Who is clicking</div>
                  <div style={{ fontSize:12, color:TXT }}>{analysis.buyerProfile}</div>
                </div>
              </div>
              <div style={{ ...card() }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#FC8F8F', marginBottom:10 }}>⚠️ Why they're not buying</div>
                {(analysis.conversionBarriers||[]).map((b,i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${BORD}` }}>
                    <span style={{ color:'#FC8F8F', flexShrink:0 }}>{i+1}.</span>
                    <span style={{ fontSize:12, color:TXT2 }}>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)' }) }}>
                <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:12 }}>✅ Optimized copy — paste into your NichRoute page</div>
                {[{label:'Headline',value:analysis.optimizedHeadline},{label:'Subline',value:analysis.optimizedSubline},{label:'Urgency / social proof',value:analysis.urgencyLine},{label:'CTA button text',value:analysis.ctaText}].map((f,i) => (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><div style={{ fontSize:11, color:TXT3 }}>{f.label}</div><CopyBtn text={f.value} /></div>
                    <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:13, color:TXT, lineHeight:1.6 }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card() }}>
                <div style={{ fontSize:12, fontWeight:700, color:AMB, marginBottom:10 }}>💡 Higher-converting topics</div>
                {(analysis.highIntentTopics||[]).map((t,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${BORD}` }}>
                    <span style={{ fontSize:12, color:TXT }}>{t}</span>
                    <CopyBtn text={t} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reddit Finder */}
      {tab === 'reddit' && (
        <div>
          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>🔴 Subreddits for <span style={{ color:RED }}>{niche}</span> niche</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
              {subreddits.map(sub => (
                <button key={sub} onClick={() => loadRedditPosts(sub)}
                  style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${activeSub===sub?RED:BORD}`, background:activeSub===sub?'rgba(255,69,0,.1)':'transparent', color:activeSub===sub?RED:TXT3, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  r/{sub}
                </button>
              ))}
            </div>
            <div style={{ fontSize:11, color:TXT3 }}>Click a subreddit to find threads. ContentForge drafts a reply with your landing page naturally included.</div>
          </div>

          {redditLoading && <div style={{ textAlign:'center', padding:'24px', color:TXT3, fontSize:13 }}>🔍 Searching r/{activeSub}...</div>}

          {redditError && activeSub && !redditLoading && (
            <div style={{ ...card({ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)' }) }}>
              <div style={{ fontSize:12, color:'#FC8F8F', marginBottom:10 }}>{redditError}</div>
              <a href={`https://www.reddit.com/r/${activeSub}/search/?q=${encodeURIComponent(topicLabel)}&restrict_sr=1&sort=relevance`}
                target="_blank" rel="noreferrer"
                style={{ display:'inline-block', padding:'8px 16px', background:RED, color:'#fff', borderRadius:7, textDecoration:'none', fontSize:12, fontWeight:600 }}>
                Search r/{activeSub} manually →
              </a>
              <div style={{ fontSize:11, color:TXT3, marginTop:8 }}>Find a relevant thread, copy the URL, and use the reply generator below.</div>
            </div>
          )}

          {redditPosts.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:TXT3, marginBottom:8 }}>{redditPosts.length} threads found in r/{activeSub} — click any to draft a reply</div>
              {redditPosts.map((post, i) => (
                <div key={i} onClick={() => generateReply(post)}
                  style={{ ...card({ cursor:'pointer', border:`1px solid ${selectedPost?.id===post.id?GRN:BORD}`, background:selectedPost?.id===post.id?'rgba(29,158,117,.06)':BG2 }) }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:TXT, lineHeight:1.5, marginBottom:6 }}>{post.title}</div>
                      {post.selftext && <div style={{ fontSize:11, color:TXT3, lineHeight:1.5 }}>{post.selftext.slice(0,120)}{post.selftext.length>120?'...':''}</div>}
                      <div style={{ display:'flex', gap:12, marginTop:8 }}>
                        <span style={{ fontSize:11, color:AMB }}>▲ {post.score}</span>
                        <span style={{ fontSize:11, color:TXT3 }}>💬 {post.num_comments}</span>
                        <span style={{ fontSize:11, color:TXT3 }}>{Math.round((Date.now()/1000-post.created_utc)/3600)}h ago</span>
                      </div>
                    </div>
                    <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ fontSize:11, color:RED, textDecoration:'none', flexShrink:0 }}>Open →</a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(draftLoading || replyDraft) && (
            <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.2)', marginTop:14 }) }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:GRN }}>📝 Ready-to-post reply</div>
                {replyDraft && <CopyBtn text={replyDraft} label="Copy reply" />}
              </div>
              {draftLoading
                ? <div style={{ fontSize:12, color:TXT3 }}>✍️ Drafting reply...</div>
                : <div>
                    <div style={{ fontSize:13, color:TXT, lineHeight:1.8, whiteSpace:'pre-wrap', marginBottom:12 }}>{replyDraft}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={`https://reddit.com${selectedPost?.permalink}`} target="_blank" rel="noreferrer"
                        style={{ padding:'8px 16px', background:RED, color:'#fff', borderRadius:7, textDecoration:'none', fontSize:12, fontWeight:600 }}>
                        Open on Reddit →
                      </a>
                      <button onClick={()=>generateReply(selectedPost)}
                        style={{ padding:'8px 16px', background:'transparent', color:TXT3, border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                        Regenerate
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:TXT3, marginTop:8 }}>Copy reply → open thread → click Reply → paste. Check subreddit rules before posting.</div>
                  </div>
              }
            </div>
          )}
        </div>
      )}

      {/* Quora Finder */}
      {tab === 'quora' && (
        <div>
          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:8 }}>❓ Quora — high-intent buyer questions</div>
            <div style={{ fontSize:12, color:TXT2, lineHeight:1.7, marginBottom:12 }}>Quora users ask specific questions when ready to buy. These links open searches where people are actively looking for what your content covers.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(analysis?.quoraQuestions || [`Best ${affName||'product'} for beginners`,`Is ${affName||'this'} worth buying`,topicLabel+' — what actually works']).map((q,i) => (
                <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${BORD}` }}>
                  <div style={{ fontSize:12, color:TXT, marginBottom:8 }}>{q}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <a href={`https://www.quora.com/search?q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer"
                      style={{ padding:'5px 12px', background:BLU, color:'#fff', borderRadius:6, textDecoration:'none', fontSize:11, fontWeight:600 }}>
                      Search Quora →
                    </a>
                    <a href={`https://www.google.com/search?q=site:quora.com+${encodeURIComponent(q)}`} target="_blank" rel="noreferrer"
                      style={{ padding:'5px 12px', background:'transparent', color:TXT3, border:`1px solid ${BORD}`, borderRadius:6, textDecoration:'none', fontSize:11 }}>
                      Google search →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...card({ background:'rgba(37,99,235,.06)', border:'1px solid rgba(37,99,235,.15)' }) }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#60A5FA', marginBottom:8 }}>📋 How to answer on Quora</div>
            <ol style={{ paddingLeft:16, fontSize:12, color:TXT3, lineHeight:2 }}>
              <li>Click <strong style={{ color:TXT }}>Search Quora</strong> → find the matching question</li>
              <li>Click <strong style={{ color:TXT }}>Answer</strong></li>
              <li>Write a genuine 150-250 word answer that helps</li>
              <li>End with: <em style={{ color:TXT }}>"Guide here if useful: {landingUrl}"</em></li>
              <li>Post — Quora answers rank on Google within days</li>
            </ol>
          </div>
          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:8 }}>🔗 Your landing page</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:7 }}>
              <span style={{ fontSize:12, color:GRN }}>{landingUrl}</span>
              <CopyBtn text={landingUrl} label="Copy link" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
