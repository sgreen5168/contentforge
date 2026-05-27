import React, { useState } from 'react';

const CALENDAR = [
  // WEEK 1 - Work From Home Basics
  { day:1,  week:1, keyword:'work from home jobs',           product:'John Thornhill Ambassador Program', platform:'Facebook',  type:'Story',       hook:'I quit my 9-5 and never looked back — here\'s what I wish I knew first', niche:'Make Money Online' },
  { day:2,  week:1, keyword:'work from home jobs',           product:'John Thornhill Ambassador Program', platform:'Instagram', type:'List',        hook:'5 work from home jobs that pay $50+/hour (no degree needed)', niche:'Make Money Online' },
  { day:3,  week:1, keyword:'how to make money online',      product:'Perpetual Income 365',              platform:'Facebook',  type:'Educational', hook:'The honest truth about making money online nobody tells you', niche:'Make Money Online' },
  { day:4,  week:1, keyword:'how to make money online',      product:'Perpetual Income 365',              platform:'Instagram', type:'Inspirational',hook:'From $0 to $1,200/month working 2 hours a day — my exact system', niche:'Make Money Online' },
  { day:5,  week:1, keyword:'passive income ideas',          product:'Perpetual Income 365',              platform:'Facebook',  type:'List',        hook:'7 passive income streams you can start this weekend', niche:'Make Money Online' },
  { day:6,  week:1, keyword:'passive income ideas',          product:'12 Minute Affiliate',               platform:'Instagram', type:'Story',       hook:'I set this up once and it still pays me every month', niche:'Make Money Online' },
  { day:7,  week:1, keyword:'side hustle ideas',             product:'12 Minute Affiliate',               platform:'Facebook',  type:'Promotional', hook:'The side hustle taking over 2026 — and you can start today', niche:'Make Money Online' },

  // WEEK 2 - Affiliate Marketing Focus
  { day:8,  week:2, keyword:'affiliate marketing for beginners', product:'Affiliate Marketing Mastery',   platform:'Facebook',  type:'Educational', hook:'Affiliate marketing explained in 60 seconds — is it right for you?', niche:'Make Money Online' },
  { day:9,  week:2, keyword:'affiliate marketing for beginners', product:'Affiliate Marketing Mastery',   platform:'Instagram', type:'List',        hook:'I made my first $500 with affiliate marketing doing these 3 things', niche:'Make Money Online' },
  { day:10, week:2, keyword:'remote jobs hiring now',         product:'Freelancer Secrets',                platform:'Facebook',  type:'Urgent',      hook:'These companies are hiring remote workers RIGHT NOW — no experience', niche:'Make Money Online' },
  { day:11, week:2, keyword:'remote jobs hiring now',         product:'Freelancer Secrets',                platform:'Instagram', type:'Story',       hook:'Applied to 3 remote jobs last week, got 2 offers — here\'s how', niche:'Make Money Online' },
  { day:12, week:2, keyword:'work from home no experience',   product:'Paid Online Writing Jobs',          platform:'Facebook',  type:'Educational', hook:'Work from home jobs that require ZERO experience — full list', niche:'Make Money Online' },
  { day:13, week:2, keyword:'work from home no experience',   product:'Paid Online Writing Jobs',          platform:'Instagram', type:'Inspirational',hook:'No degree, no experience, no problem — how I started earning online', niche:'Make Money Online' },
  { day:14, week:2, keyword:'online business ideas',          product:'ClickBank University',              platform:'Facebook',  type:'List',        hook:'6 online business ideas that actually work in 2026', niche:'Make Money Online' },

  // WEEK 3 - Trending Topics
  { day:15, week:3, keyword:'make money from home 2026',      product:'AI Profit Secrets',                 platform:'Facebook',  type:'Trending',    hook:'The AI side hustle everyone is talking about in 2026', niche:'Make Money Online' },
  { day:16, week:3, keyword:'make money from home 2026',      product:'AI Profit Secrets',                 platform:'Instagram', type:'Educational', hook:'How AI is changing the way people earn from home — and how to use it', niche:'Make Money Online' },
  { day:17, week:3, keyword:'freelance jobs from home',       product:'Freelancer Secrets',                platform:'Facebook',  type:'Story',       hook:'I went from broke to $4K/month freelancing — my exact blueprint', niche:'Make Money Online' },
  { day:18, week:3, keyword:'freelance jobs from home',       product:'Freelancer Secrets',                platform:'Instagram', type:'List',        hook:'Top 5 freelance skills companies are paying top dollar for right now', niche:'Make Money Online' },
  { day:19, week:3, keyword:'passive income ideas',           product:'Perpetual Income 365',              platform:'Facebook',  type:'Promotional', hook:'This passive income system runs while you sleep — I\'ll show you how', niche:'Make Money Online' },
  { day:20, week:3, keyword:'side hustle ideas',              product:'12 Minute Affiliate',               platform:'Instagram', type:'Story',       hook:'Started this side hustle with $0 — made $847 my first month', niche:'Make Money Online' },
  { day:21, week:3, keyword:'work from home jobs',            product:'John Thornhill Ambassador Program', platform:'Facebook',  type:'Inspirational',hook:'What nobody tells you about working from home (the real truth)', niche:'Make Money Online' },

  // WEEK 4 - Conversion Focus
  { day:22, week:4, keyword:'how to make money online',       product:'John Thornhill Ambassador Program', platform:'Facebook',  type:'Promotional', hook:'Done-for-you online business — finally something that works', niche:'Make Money Online' },
  { day:23, week:4, keyword:'affiliate marketing for beginners',product:'Affiliate Marketing Mastery',    platform:'Instagram', type:'Educational', hook:'Step 1 of affiliate marketing — most beginners skip this completely', niche:'Make Money Online' },
  { day:24, week:4, keyword:'remote jobs hiring now',         product:'Paid Online Writing Jobs',          platform:'Facebook',  type:'List',        hook:'Companies paying $25-50/hr for remote writing jobs — no degree needed', niche:'Make Money Online' },
  { day:25, week:4, keyword:'online business ideas',          product:'AI Profit Secrets',                 platform:'Instagram', type:'Trending',    hook:'This AI business idea is making people $200/day working from home', niche:'Make Money Online' },
  { day:26, week:4, keyword:'make money from home 2026',      product:'Perpetual Income 365',              platform:'Facebook',  type:'Story',       hook:'My income report: $2,847 working from home last month — breakdown', niche:'Make Money Online' },
  { day:27, week:4, keyword:'passive income ideas',           product:'12 Minute Affiliate',               platform:'Instagram', type:'Promotional', hook:'Set up this passive income stream in 12 minutes — seriously', niche:'Make Money Online' },
  { day:28, week:4, keyword:'work from home no experience',   product:'Freelancer Secrets',                platform:'Facebook',  type:'Inspirational',hook:'You don\'t need experience, a degree, or savings to start earning online', niche:'Make Money Online' },
  { day:29, week:4, keyword:'side hustle ideas',              product:'Affiliate Marketing Mastery',       platform:'Instagram', type:'List',        hook:'3 side hustles that turned into full-time income for real people', niche:'Make Money Online' },
  { day:30, week:4, keyword:'freelance jobs from home',       product:'John Thornhill Ambassador Program', platform:'Facebook',  type:'Promotional', hook:'Last chance: The online income system that changed my life', niche:'Make Money Online' },
];

const PRODUCTS = {
  'John Thornhill Ambassador Program': { color:'#1D9E75', short:'Ambassador' },
  'Perpetual Income 365':              { color:'#5B8BF5', short:'PI365' },
  '12 Minute Affiliate':               { color:'#F5A623', short:'12Min' },
  'Affiliate Marketing Mastery':       { color:'#E14C8A', short:'AffMastery' },
  'Freelancer Secrets':                { color:'#7C6BFF', short:'Freelancer' },
  'Paid Online Writing Jobs':          { color:'#22C98A', short:'WritingJobs' },
  'AI Profit Secrets':                 { color:'#FF6B35', short:'AIProfits' },
  'ClickBank University':              { color:'#C47AFF', short:'CBU' },
};

const TYPE_COLORS = {
  'Story':        'rgba(124,107,255,.2)',
  'List':         'rgba(29,158,117,.2)',
  'Educational':  'rgba(91,139,245,.2)',
  'Inspirational':'rgba(245,166,35,.2)',
  'Promotional':  'rgba(225,76,138,.2)',
  'Trending':     'rgba(255,107,53,.2)',
  'Urgent':       'rgba(226,75,74,.2)',
};

export default function ContentCalendar() {
  const [view, setView]         = useState('calendar');
  const [selectedDay, setSelDay] = useState(null);
  const [filterWeek, setFWeek]  = useState(0);
  const [filterPlat, setFPlat]  = useState('all');
  const [copied, setCopied]     = useState('');

  const filtered = CALENDAR.filter(d => {
    if (filterWeek > 0 && d.week !== filterWeek) return false;
    if (filterPlat !== 'all' && d.platform !== filterPlat) return false;
    return true;
  });

  function copy(text, key) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function generatePrompt(item) {
    return `Topic: ${item.keyword}
Product: ${item.product}
Platform: ${item.platform}
Post style: ${item.type}
Niche: Make Money Online
Hook: ${item.hook}
Tone: First person (I)`;
  }

  const BG   = '#0A0A0F';
  const BG2  = '#12121A';
  const BG3  = '#1A1A26';
  const BORD = '#2A2A40';
  const TXT  = '#F0EFF8';
  const TXT2 = '#9896B8';
  const TXT3 = '#6664A0';
  const ACC  = '#7C6BFF';

  return (
    <div style={{ padding: 20, maxWidth: 1200, fontFamily: 'DM Sans, sans-serif', color: TXT }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.4px', marginBottom: 4 }}>
          30-Day Content <span style={{ color: ACC }}>Calendar</span>
        </div>
        <div style={{ fontSize: 13, color: TXT2 }}>
          Work from home keywords + top ClickBank products — ready to paste into ContentForge
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['30', 'Total posts'],
          ['10', 'Keywords'],
          ['8', 'ClickBank products'],
          ['2', 'Platforms'],
        ].map(([val, label]) => (
          <div key={label} style={{ background: BG2, border: '1px solid ' + BORD, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: -1, color: ACC }}>{val}</div>
            <div style={{ fontSize: 11, color: TXT3, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['calendar','Calendar'],['list','List']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)}
              style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                border: '1px solid ' + (view === id ? ACC : BORD),
                background: view === id ? 'rgba(124,107,255,.15)' : 'transparent',
                color: view === id ? ACC : TXT2 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[[0,'All weeks'],[1,'Week 1'],[2,'Week 2'],[3,'Week 3'],[4,'Week 4']].map(([w, label]) => (
            <button key={w} onClick={() => setFWeek(w)}
              style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
                border: '1px solid ' + (filterWeek === w ? ACC : BORD),
                background: filterWeek === w ? 'rgba(124,107,255,.15)' : 'transparent',
                color: filterWeek === w ? ACC : TXT2 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all','All'],['Facebook','FB'],['Instagram','IG']].map(([p, label]) => (
            <button key={p} onClick={() => setFPlat(p)}
              style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
                border: '1px solid ' + (filterPlat === p ? '#1D9E75' : BORD),
                background: filterPlat === p ? 'rgba(29,158,117,.15)' : 'transparent',
                color: filterPlat === p ? '#5DCAA5' : TXT2 }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => {
          const csv = ['Day,Week,Platform,Type,Keyword,Product,Hook'].concat(
            CALENDAR.map(d => `${d.day},${d.week},${d.platform},${d.type},"${d.keyword}","${d.product}","${d.hook}"`)
          ).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'contentforge-30day-calendar.csv'; a.click();
          URL.revokeObjectURL(url);
        }}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          Export CSV
        </button>
      </div>

      {/* Calendar grid view */}
      {view === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: TXT3, padding: '6px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}
          {filtered.map(item => {
            const prod = PRODUCTS[item.product] || { color: ACC, short: '?' };
            const isSelected = selectedDay && selectedDay.day === item.day;
            return (
              <div key={item.day} onClick={() => setSelDay(isSelected ? null : item)}
                style={{
                  background: isSelected ? 'rgba(124,107,255,.15)' : BG2,
                  border: '1px solid ' + (isSelected ? ACC : BORD),
                  borderRadius: 10, padding: '8px 9px', cursor: 'pointer',
                  transition: 'all .15s', minHeight: 90,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? ACC : TXT2 }}>Day {item.day}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, background: item.platform === 'Facebook' ? 'rgba(24,119,242,.2)' : 'rgba(225,48,108,.2)', color: item.platform === 'Facebook' ? '#5B9BD5' : '#E1306C' }}>
                    {item.platform === 'Facebook' ? 'FB' : 'IG'}
                  </span>
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: TYPE_COLORS[item.type] || 'rgba(255,255,255,.05)', color: TXT2, marginBottom: 5, display: 'inline-block' }}>
                  {item.type}
                </div>
                <div style={{ fontSize: 9, color: TXT3, lineHeight: 1.3, marginBottom: 4 }}>
                  {item.keyword.length > 22 ? item.keyword.slice(0, 22) + '...' : item.keyword}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: prod.color }}>
                  {prod.short}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(item => {
            const prod = PRODUCTS[item.product] || { color: ACC, short: '?' };
            return (
              <div key={item.day} onClick={() => setSelDay(selectedDay && selectedDay.day === item.day ? null : item)}
                style={{
                  background: BG2, border: '1px solid ' + BORD, borderRadius: 10, padding: '12px 14px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,107,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: ACC, flexShrink: 0 }}>
                  {item.day}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: TXT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.hook}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: TXT3 }}>{item.keyword}</span>
                    <span style={{ fontSize: 10, color: prod.color }}>{prod.short}</span>
                    <span style={{ fontSize: 10, color: TXT3 }}>{item.platform}</span>
                    <span style={{ fontSize: 10, padding: '0px 5px', borderRadius: 4, background: TYPE_COLORS[item.type] || 'transparent', color: TXT2 }}>{item.type}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: TXT3, flexShrink: 0 }}>Wk {item.week}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selectedDay && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: BG2, borderTop: '1px solid ' + BORD, padding: '16px 24px', zIndex: 1000 }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: TXT }}>Day {selectedDay.day} — {selectedDay.type} post for {selectedDay.platform}</div>
                <div style={{ fontSize: 12, color: TXT2, marginTop: 2 }}>{selectedDay.keyword} · {selectedDay.product}</div>
              </div>
              <button onClick={() => setSelDay(null)} style={{ background: 'none', border: 'none', color: TXT3, fontSize: 18, cursor: 'pointer', padding: '0 8px' }}>×</button>
            </div>
            <div style={{ background: BG3, border: '1px solid ' + BORD, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: TXT3, marginBottom: 4 }}>Hook / post angle</div>
              <div style={{ fontSize: 13, color: TXT }}>{selectedDay.hook}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copy(generatePrompt(selectedDay), 'prompt')}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: ACC, color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {copied === 'prompt' ? 'Copied!' : 'Copy ContentForge prompt'}
              </button>
              <button onClick={() => copy(selectedDay.hook, 'hook')}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + BORD, background: 'transparent', color: TXT2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                {copied === 'hook' ? 'Copied!' : 'Copy hook only'}
              </button>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: TXT3, display: 'flex', alignItems: 'center' }}>
                Paste prompt into AI Composer → Generate Posts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product legend */}
      <div style={{ marginTop: 20, background: BG2, border: '1px solid ' + BORD, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: TXT3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>ClickBank products in this calendar</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(PRODUCTS).map(([name, meta]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: BG3, border: '1px solid ' + BORD }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: TXT2 }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
