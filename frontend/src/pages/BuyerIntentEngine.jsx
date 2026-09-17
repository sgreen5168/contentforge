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

// SUBREDDIT MAP by niche
const SUBREDDIT_MAP = {
  'health':          ['xxfitness','fitness','loseit','bodyweightfitness','homegym','1200isplenty','nutrition'],
  'meal-prep':       ['MealPrepSunday','EatCheapAndHealthy','Cooking','Frugal','budgetfood'],
  'finance':         ['personalfinance','Frugal','povertyfinance','FinancialPlanning','debtfree'],
  'side-hustle':     ['sidehustle','WorkOnline','beermoney','Entrepreneur','passive_income'],
  'mindset':         ['selfimprovement','getmotivated','productivity','DecidingToBeBetter'],
  'remote-work':     ['remotework','digitalnomad','WorkOnline','freelance'],
  'cooking':         ['Cooking','recipes','AskCulinary','food','MealPrepSunday'],
  'coffee':          ['Coffee','espresso','cafe','barista','pourover'],
  'woodworking':     ['woodworking','DIY','handtools','BeginnerWoodWorking','hobbycnc'],
  'outdoor-cooking': ['BBQ','smoking','grilling','camping','CampingandHiking'],
  'home-income':     ['sidehustle','Entrepreneur','WorkOnline','AmazonMerch','affiliatemarketing'],
  'default':         ['deals','Frugal','buyitforlife','productreviews','shutupandtakemymoney'],
};

const QUORA_TOPICS = {
  'health':          'fitness+workout+home+equipment',
  'finance':         'personal+finance+budgeting+money',
  'side-hustle':     'side+hustle+make+money+online',
  'coffee':          'coffee+grinder+espresso+home',
  'meal-prep':       'meal+prep+healthy+eating+cheap',
  'cooking':         'cooking+kitchen+tools+best',
  'woodworking':     'woodworking+beginner+tools',
  'outdoor-cooking': 'bbq+grilling+smoker+camping',
  'default':         'product+review+best+buy',
};

export default function BuyerIntentEngine() {
  const [session, setSession]         = useState(null);
  const [topic, setTopic]             = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analysis, setAnalysis]       = useState(null);
  const [redditPosts, setRedditPosts] = useState([]);
  const [redditLoading, setRedditLoading] = useState(false);
  const [activeSubreddit, setActiveSubreddit] = useState('');
  const [tab, setTab]                 = useState('intent');
  const [replyDraft, setReplyDraft]   = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('cf_cc_results') || 'null');
      const t = JSON.parse(localStorage.getItem('cf_cc_topic') || 'null');
      setSession(s);
      setTopic(t);
    } catch(e) {}
  }, []);

  const niche = topic?.cat || 'default';
  const subreddits = SUBREDDIT_MAP[niche] || SUBREDDIT_MAP.default;
  const landingUrl = session?.landingUrl || session?.landing || 'https://nichroute.com';
  const topicLabel = topic?.label || session?.youtubeTitle || 'home income tips';
  const affName = session?.link?.name || '';

  async function analyzeIntent() {
    setAnalyzing(true);
    try {
      const r = await fetch(API + '/api/campaign/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: `You are a conversion rate optimization expert. Analyze this affiliate content topic for buyer intent.

Topic: "${topicLabel}"
Niche: ${niche}
Affiliate product: ${affName}
Landing page URL: ${landingUrl}

Return ONLY a JSON object:
{
  "intentScore": 7,
  "intentReason": "why this score — 1-2 sentences",
  "buyerStage": "awareness|consideration|decision",
  "buyerProfile": "who is clicking — 1 sentence description",
  "conversionBarriers": ["barrier 1", "barrier 2", "barrier 3"],
  "optimizedHeadline": "rewritten headline that targets decision-stage buyers",
  "optimizedSubline": "rewritten subline that addresses the buyer's specific problem",
  "urgencyLine": "a short urgency or social proof line to add near the CTA — factual not hype",
  "ctaText": "better CTA button text than View on Amazon",
  "highIntentTopics": ["better topic 1 with higher buyer intent", "better topic 2", "better topic 3"],
  "redditAngles": ["reddit post angle 1 that would get clicks", "angle 2", "angle 3"],
  "quoraQuestions": ["quora question this page answers", "question 2", "question 3"]
}`,
          max_tokens: 1200,
        }),
      });
      const d = await r.json();
      const text = d.text || d.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g,'').trim();
      setAnalysis(JSON.parse(clean));
    } catch(e) {
      console.error(e);
      alert('Analysis failed — try again');
    }
    setAnalyzing(false);
  }

  async function loadRedditPosts(sub) {
    setRedditLoading(true);
    setActiveSubreddit(sub);
    setRedditPosts([]);
    setSelectedPost(null);
    setReplyDraft('');
    try {
      // Use Reddit's public JSON API directly from browser — no API key needed
      const query = encodeURIComponent(topicLabel.split(' ').slice(0,4).join(' '));
      const searchUrl = `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=1&sort=relevance&t=month&limit=15&raw_json=1`;
      const hotUrl = `https://www.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`;

      let posts = [];

      // Try search first
      try {
        const r1 = await fetch(searchUrl, { headers:{ 'Accept':'application/json' } });
        if (r1.ok) {
          const d1 = await r1.json();
          posts = (d1?.data?.children || []).map(c => c.data).filter(p => p && !p.stickied);
        }
      } catch(e) { console.warn('Reddit search failed:', e.message); }

      // Fall back to hot posts if search returned nothing
      if (posts.length === 0) {
        try {
          const r2 = await fetch(hotUrl, { headers:{ 'Accept':'application/json' } });
          if (r2.ok) {
            const d2 = await r2.json();
            posts = (d2?.data?.children || []).map(c => c.data).filter(p => p && !p.stickied);
          }
        } catch(e) { console.warn('Reddit hot failed:', e.message); }
      }

      const formatted = posts.slice(0,12).map(p => ({
        id: p.id,
        title: p.title,
        selftext: (p.selftext || '').slice(0,300),
        score: p.score,
        num_comments: p.num_comments,
        permalink: p.permalink,
        subreddit: p.subreddit,
        created_utc: p.created_utc,
      }));

      setRedditPosts(formatted);
    } catch(e) {
      console.error('Reddit error:', e);
      setRedditPosts([]);
    }
    setRedditLoading(false);
  }

  async function generateReply(post) {
    setSelectedPost(post);
    setDraftLoading(true);
    setReplyDraft('');
    try {
      const r = await fetch(API + '/api/campaign/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: `You are a helpful Reddit commenter who genuinely knows about this topic. Write a helpful, natural reply to this Reddit post that subtly mentions a relevant resource.

Reddit post title: "${post.title}"
Post content: "${(post.selftext||'').slice(0,300)}"
Subreddit: r/${post.subreddit}

Your resource: ${landingUrl}
Topic: ${topicLabel}
Product: ${affName}

Rules:
- Sound like a real Reddit user, not a marketer
- Be genuinely helpful first — answer the question directly
- Only mention the link naturally at the end if it's truly relevant
- No promotional language, no "check out my site"
- Keep it under 150 words
- Include the link as: "I put together a guide on this if useful: ${landingUrl}"
- If the post isn't relevant enough to include the link, just write a helpful reply without it

Write ONLY the reply text, nothing else.`,
          max_tokens: 400,
        }),
      });
      const d = await r.json();
      setReplyDraft(d.text || d.content?.[0]?.text || '');
    } catch(e) {
      setReplyDraft('Failed to generate — try again');
    }
    setDraftLoading(false);
  }

  const tabs = [
    { id:'intent',  label:'🎯 Intent Analysis' },
    { id:'reddit',  label:'🔴 Reddit Finder' },
    { id:'quora',   label:'❓ Quora Finder' },
  ];

  return (
    <div style={{ color:TXT, fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ ...card({ background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', marginBottom:16 }) }}>
        <div style={{ fontSize:14, fontWeight:700, color:GRN, marginBottom:4 }}>🎯 Buyer Intent Engine</div>
        <div style={{ fontSize:12, color:TXT3, lineHeight:1.6 }}>
          Analyzes why visitors click but don't buy · Finds Reddit and Quora threads where buyers are asking your topic's question · Generates ready-to-post replies with your landing page link naturally included
        </div>
      </div>

      {/* Session */}
      {session ? (
        <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)', padding:'10px 14px', marginBottom:14 }) }}>
          <div style={{ fontSize:12, color:GRN, fontWeight:600 }}>✓ {topicLabel}</div>
          <div style={{ fontSize:11, color:TXT3 }}>{niche} · {affName || 'No affiliate link'} · {landingUrl.replace('https://','')}</div>
        </div>
      ) : (
        <div style={{ ...card({ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', padding:'10px 14px', marginBottom:14 }) }}>
          <div style={{ fontSize:12, color:'#FC8F8F', fontWeight:600 }}>Generate a topic in Command Center first</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, background:BG2, borderRadius:10, padding:4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, padding:'8px', borderRadius:7, border:'none', background:tab===t.id?'rgba(29,158,117,.2)':'transparent', color:tab===t.id?GRN:TXT3, fontSize:12, fontWeight:tab===t.id?700:400, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Intent Analysis Tab ── */}
      {tab === 'intent' && (
        <div>
          <button onClick={analyzeIntent} disabled={analyzing || !session}
            style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:analyzing?'rgba(29,158,117,.3)':GRN, color:'#fff', fontSize:14, fontWeight:700, cursor:analyzing||!session?'default':'pointer', fontFamily:'inherit', marginBottom:14 }}>
            {analyzing ? '⏳ Analyzing buyer intent...' : '🎯 Analyze Buyer Intent'}
          </button>

          {analysis && (
            <div>
              {/* Score */}
              <div style={{ ...card() }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <ScoreBadge score={analysis.intentScore} />
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:TXT, marginBottom:4 }}>
                      {analysis.buyerStage?.charAt(0).toUpperCase() + analysis.buyerStage?.slice(1)} stage buyer
                    </div>
                    <div style={{ fontSize:12, color:TXT2, lineHeight:1.6 }}>{analysis.intentReason}</div>
                  </div>
                </div>
                <div style={{ marginTop:12, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:7 }}>
                  <div style={{ fontSize:11, color:TXT3, marginBottom:3 }}>Who is clicking</div>
                  <div style={{ fontSize:12, color:TXT }}>{analysis.buyerProfile}</div>
                </div>
              </div>

              {/* Conversion Barriers */}
              <div style={{ ...card() }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#FC8F8F', marginBottom:10 }}>⚠️ Why they're not buying</div>
                {(analysis.conversionBarriers||[]).map((b,i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${BORD}` }}>
                    <span style={{ color:'#FC8F8F', flexShrink:0 }}>{i+1}.</span>
                    <span style={{ fontSize:12, color:TXT2 }}>{b}</span>
                  </div>
                ))}
              </div>

              {/* Optimized Page Copy */}
              <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.15)' }) }}>
                <div style={{ fontSize:12, fontWeight:700, color:GRN, marginBottom:12 }}>✅ Optimized page copy — paste into your NichRoute page</div>
                {[
                  { label:'Headline', value:analysis.optimizedHeadline },
                  { label:'Subline', value:analysis.optimizedSubline },
                  { label:'Urgency / social proof line', value:analysis.urgencyLine },
                  { label:'CTA button text', value:analysis.ctaText },
                ].map((f,i) => (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:11, color:TXT3 }}>{f.label}</div>
                      <CopyBtn text={f.value} />
                    </div>
                    <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:7, fontSize:13, color:TXT, lineHeight:1.6 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Higher Intent Topics */}
              <div style={{ ...card() }}>
                <div style={{ fontSize:12, fontWeight:700, color:AMB, marginBottom:10 }}>💡 Higher-converting topic ideas</div>
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

      {/* ── Reddit Finder Tab ── */}
      {tab === 'reddit' && (
        <div>
          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:10 }}>
              🔴 Subreddits for <span style={{ color:RED }}>{niche}</span> niche
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
              {subreddits.map(sub => (
                <button key={sub} onClick={() => loadRedditPosts(sub)}
                  style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${activeSubreddit===sub?RED:BORD}`, background:activeSubreddit===sub?'rgba(255,69,0,.1)':'transparent', color:activeSubreddit===sub?RED:TXT3, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  r/{sub}
                </button>
              ))}
            </div>
            <div style={{ fontSize:11, color:TXT3, lineHeight:1.6 }}>
              Click a subreddit to find threads where people are asking questions your content answers. ContentForge then drafts a helpful reply with your landing page link naturally included.
            </div>
          </div>

          {redditLoading && (
            <div style={{ textAlign:'center', padding:'24px', color:TXT3, fontSize:13 }}>
              🔍 Searching r/{activeSubreddit} for buyer intent threads...
            </div>
          )}

          {redditPosts.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:TXT3, marginBottom:8 }}>
                {redditPosts.length} threads found in r/{activeSubreddit} — click any to draft a reply
              </div>
              {redditPosts.map((post, i) => (
                <div key={i} onClick={() => generateReply(post)}
                  style={{ ...card({ cursor:'pointer', border:`1px solid ${selectedPost?.id===post.id?GRN:BORD}`, background:selectedPost?.id===post.id?'rgba(29,158,117,.06)':BG2 }) }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:TXT, lineHeight:1.5, marginBottom:6 }}>{post.title}</div>
                      {post.selftext && (
                        <div style={{ fontSize:11, color:TXT3, lineHeight:1.5 }}>{post.selftext.slice(0,120)}{post.selftext.length>120?'...':''}</div>
                      )}
                      <div style={{ display:'flex', gap:12, marginTop:8 }}>
                        <span style={{ fontSize:11, color:AMB }}>▲ {post.score}</span>
                        <span style={{ fontSize:11, color:TXT3 }}>💬 {post.num_comments} comments</span>
                        <span style={{ fontSize:11, color:TXT3 }}>{Math.round((Date.now()/1000 - post.created_utc)/3600)}h ago</span>
                      </div>
                    </div>
                    <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer"
                      onClick={e=>e.stopPropagation()}
                      style={{ fontSize:11, color:RED, textDecoration:'none', flexShrink:0 }}>
                      Open →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {redditPosts.length === 0 && activeSubreddit && !redditLoading && (
            <div style={{ textAlign:'center', padding:'20px', color:TXT3, fontSize:12 }}>
              No matching threads found in r/{activeSubreddit} — try another subreddit
            </div>
          )}

          {/* Reply Draft */}
          {(draftLoading || replyDraft) && (
            <div style={{ ...card({ background:'rgba(29,158,117,.06)', border:'1px solid rgba(29,158,117,.2)', marginTop:14 }) }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:GRN }}>📝 Ready-to-post reply draft</div>
                {replyDraft && <CopyBtn text={replyDraft} label="Copy reply" />}
              </div>
              {draftLoading ? (
                <div style={{ fontSize:12, color:TXT3 }}>✍️ Drafting helpful reply...</div>
              ) : (
                <div>
                  <div style={{ fontSize:13, color:TXT, lineHeight:1.8, whiteSpace:'pre-wrap', marginBottom:12 }}>{replyDraft}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <a href={`https://reddit.com${selectedPost?.permalink}`} target="_blank" rel="noreferrer"
                      style={{ padding:'8px 16px', background:RED, color:'#fff', borderRadius:7, textDecoration:'none', fontSize:12, fontWeight:600 }}>
                      Open thread on Reddit →
                    </a>
                    <button onClick={()=>generateReply(selectedPost)}
                      style={{ padding:'8px 16px', background:'transparent', color:TXT3, border:`1px solid ${BORD}`, borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      Regenerate
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:TXT3, marginTop:8, lineHeight:1.6 }}>
                    Copy the reply above → open the thread → click Reply → paste. Check the subreddit rules before posting.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quora Finder Tab ── */}
      {tab === 'quora' && (
        <div>
          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:8 }}>❓ Quora — high-intent buyer questions</div>
            <div style={{ fontSize:12, color:TXT2, lineHeight:1.7, marginBottom:12 }}>
              Quora users ask specific product questions when they're ready to buy. These links open Quora searches where people are actively looking for exactly what your content covers.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(analysis?.quoraQuestions || [
                `Best ${affName || 'product'} for beginners`,
                `Is ${affName || 'this product'} worth buying`,
                `${topicLabel} — what actually works`,
              ]).map((q,i) => {
                const searchUrl = `https://www.quora.com/search?q=${encodeURIComponent(q)}`;
                const googleUrl = `https://www.google.com/search?q=site:quora.com+${encodeURIComponent(q)}`;
                return (
                  <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${BORD}` }}>
                    <div style={{ fontSize:12, color:TXT, marginBottom:8 }}>{q}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={searchUrl} target="_blank" rel="noreferrer"
                        style={{ padding:'5px 12px', background:BLU, color:'#fff', borderRadius:6, textDecoration:'none', fontSize:11, fontWeight:600 }}>
                        Search Quora →
                      </a>
                      <a href={googleUrl} target="_blank" rel="noreferrer"
                        style={{ padding:'5px 12px', background:'transparent', color:TXT3, border:`1px solid ${BORD}`, borderRadius:6, textDecoration:'none', fontSize:11 }}>
                        Google search →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...card({ background:'rgba(37,99,235,.06)', border:'1px solid rgba(37,99,235,.15)' }) }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#60A5FA', marginBottom:8 }}>📋 How to post on Quora</div>
            <ol style={{ paddingLeft:16, fontSize:12, color:TXT3, lineHeight:2 }}>
              <li>Click <strong style={{ color:TXT }}>Search Quora</strong> above to find the question</li>
              <li>Click the question that matches your topic</li>
              <li>Click <strong style={{ color:TXT }}>Answer</strong></li>
              <li>Write a genuine 150-250 word answer that actually helps</li>
              <li>At the end add: <em style={{ color:TXT }}>"If you want more detail on this, I put together a guide: [your link]"</em></li>
              <li>Post — Quora answers rank on Google within days</li>
            </ol>
          </div>

          <div style={{ ...card() }}>
            <div style={{ fontSize:12, fontWeight:700, color:TXT, marginBottom:8 }}>🔗 Your landing page to include</div>
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
