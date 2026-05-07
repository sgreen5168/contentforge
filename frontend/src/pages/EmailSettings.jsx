import React, { useState, useEffect } from 'react';

const API = 'https://stellar-achievement-production-ea9d.up.railway.app';

export default function EmailSettings() {
  const [settings, setSettings] = useState(null);
  const [testing, setTesting]   = useState(false);
  const [testMsg, setTestMsg]   = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const res = await fetch(`${API}/api/email/settings`);
      const data = await res.json();
      setSettings(data);
    } catch {}
    finally { setLoading(false); }
  }

  async function sendTest() {
    setTesting(true); setTestMsg('');
    try {
      const res = await fetch(`${API}/api/email/test`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTestMsg('✅ ' + data.message);
    } catch (e) {
      setTestMsg('❌ ' + e.message);
    } finally { setTesting(false); }
  }

  if (loading) return <div style={S.page}><div style={S.loading}>Loading email settings...</div></div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Email Notifications <span style={S.badge}>Resend</span></h1>
        <p style={S.sub}>Get emailed when videos finish, bulk batches complete, or scheduled posts publish</p>
      </div>

      {/* Status card */}
      <div style={S.panel}>
        <div style={S.panelHdr}>Connection status</div>
        <div style={S.panelBody}>
          <div style={S.statusRow}>
            <div style={{...S.statusDot, background: settings?.configured ? '#1D9E75' : '#E24B4A'}} />
            <div>
              <div style={S.statusTitle}>{settings?.configured ? 'Email notifications active' : 'Not configured'}</div>
              <div style={S.statusSub}>
                {settings?.configured
                  ? `Sending to ${settings.notifyEmail} via Resend`
                  : 'Add RESEND_API_KEY and NOTIFY_EMAIL to Railway'}
              </div>
            </div>
            {settings?.configured && (
              <button style={{...S.testBtn, opacity: testing ? 0.5 : 1}} onClick={sendTest} disabled={testing}>
                {testing ? '⏳ Sending...' : '📧 Send test email'}
              </button>
            )}
          </div>
          {testMsg && (
            <div style={{...S.testMsg, background: testMsg.startsWith('✅') ? 'rgba(29,158,117,.12)' : 'rgba(226,75,74,.1)', color: testMsg.startsWith('✅') ? '#5DCAA5' : '#F09595'}}>
              {testMsg}
            </div>
          )}
        </div>
      </div>

      {/* What triggers emails */}
      <div style={S.panel}>
        <div style={S.panelHdr}>When you get notified</div>
        <div style={S.panelBody}>
          {[
            { icon:'🎬', title:'Video generation complete', desc:'Sent when any single video finishes — includes the hook, script preview, and download link', active: true },
            { icon:'⚡', title:'Bulk batch complete', desc:'Sent when all videos in a bulk batch finish — shows success rate and topic list', active: true },
            { icon:'📅', title:'Scheduled post published', desc:'Sent when a scheduled video is automatically published to your platforms', active: true },
          ].map((n, i) => (
            <div key={i} style={S.notifRow}>
              <span style={S.notifIcon}>{n.icon}</span>
              <div style={{flex:1}}>
                <div style={S.notifTitle}>{n.title}</div>
                <div style={S.notifDesc}>{n.desc}</div>
              </div>
              <span style={{...S.activePill, background: n.active&&settings?.configured ? 'rgba(29,158,117,.15)' : 'rgba(74,122,114,.15)', color: n.active&&settings?.configured ? '#5DCAA5' : '#4A7A72'}}>
                {n.active && settings?.configured ? '● Active' : '○ Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup guide */}
      {!settings?.configured && (
        <div style={S.panel}>
          <div style={S.panelHdr}>Setup guide</div>
          <div style={S.panelBody}>
            <div style={S.step}>
              <div style={S.stepNum}>1</div>
              <div>
                <div style={S.stepTitle}>Sign up for Resend</div>
                <div style={S.stepDesc}>Go to <a href="https://resend.com" target="_blank" rel="noreferrer" style={S.link}>resend.com</a> → sign up free → verify your email</div>
                <div style={S.stepNote}>Free tier: 3,000 emails/month — more than enough</div>
              </div>
            </div>
            <div style={S.step}>
              <div style={S.stepNum}>2</div>
              <div>
                <div style={S.stepTitle}>Get your API key</div>
                <div style={S.stepDesc}>Dashboard → API Keys → Create API Key → copy it</div>
              </div>
            </div>
            <div style={S.step}>
              <div style={S.stepNum}>3</div>
              <div>
                <div style={S.stepTitle}>Add to Railway</div>
                <div style={S.stepDesc}>Go to railway.app → stellar-achievement → Variables → Raw Editor → add:</div>
                <div style={S.codeBox}>
                  RESEND_API_KEY=re_your_key_here{'\n'}
                  NOTIFY_EMAIL=your@email.com{'\n'}
                  EMAIL_FROM=ContentForge {'<'}notifications@contentstudiohub.com{'>'}
                </div>
              </div>
            </div>
            <div style={S.step}>
              <div style={S.stepNum}>4</div>
              <div>
                <div style={S.stepTitle}>Verify your domain (optional but recommended)</div>
                <div style={S.stepDesc}>In Resend → Domains → Add contentstudiohub.com → add the DNS records to Netlify → emails send from your own domain</div>
                <div style={S.stepNote}>Without domain verification emails send from resend.dev — still works but may hit spam</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email preview */}
      <div style={S.panel}>
        <div style={S.panelHdr}>Email preview</div>
        <div style={S.panelBody}>
          <div style={S.emailPreview}>
            <div style={S.emailHeader}>
              <div style={S.emailLogo}>⚡ ContentForge</div>
              <div style={S.emailTitle}>🎬 Your video is ready!</div>
              <div style={S.emailSub}>AI Video Engine has finished generating your content</div>
            </div>
            <div style={S.emailBody}>
              <div style={S.emailBadge}>✅ Generation complete</div>
              <div style={S.emailMetaGrid}>
                {[['Topic','Morning productivity habits'],['Persona','UGC Creator'],['Duration','30s'],['Platforms','TikTok']].map(([l,v])=>(
                  <div key={l} style={S.emailMeta}><div style={S.emailMetaLbl}>{l}</div><div style={S.emailMetaVal}>{v}</div></div>
                ))}
              </div>
              <div style={S.emailHookBox}>
                <div style={S.emailHookLbl}>Hook</div>
                <div style={S.emailHookText}>"I wasted years with bad mornings until I found this"</div>
              </div>
              <div style={S.emailAssets}>
                <span style={S.assetOk}>✅ Video clip</span>
                <span style={S.assetOk}>✅ Voiceover</span>
                <span style={S.assetOk}>✅ Script ready</span>
              </div>
              <div style={S.emailCta}>View in ContentForge →</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:         { padding:24, minHeight:'100vh', background:'#0D2137', maxWidth:900 },
  header:       { marginBottom:20 },
  title:        { fontSize:22, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:10 },
  badge:        { fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(29,158,117,.2)', color:'#5DCAA5', fontWeight:500 },
  sub:          { fontSize:13, color:'#7BAAA0', marginTop:4 },
  loading:      { color:'#7BAAA0', fontSize:13, padding:20 },
  panel:        { background:'#102D4F', border:'0.5px solid rgba(29,158,117,.18)', borderRadius:12, overflow:'hidden', marginBottom:14 },
  panelHdr:     { padding:'12px 16px', borderBottom:'0.5px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' },
  panelBody:    { padding:'14px 16px' },
  statusRow:    { display:'flex', alignItems:'center', gap:12 },
  statusDot:    { width:12, height:12, borderRadius:'50%', flexShrink:0 },
  statusTitle:  { fontSize:14, fontWeight:500, color:'#E8F4F0', marginBottom:2 },
  statusSub:    { fontSize:12, color:'#7BAAA0' },
  testBtn:      { background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto', whiteSpace:'nowrap' },
  testMsg:      { marginTop:12, padding:'9px 12px', borderRadius:8, fontSize:13 },
  notifRow:     { display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'0.5px solid rgba(29,158,117,.08)' },
  notifRow2:    { borderBottom:'none' },
  notifIcon:    { fontSize:18, flexShrink:0, marginTop:1 },
  notifTitle:   { fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:3 },
  notifDesc:    { fontSize:12, color:'#7BAAA0', lineHeight:1.5 },
  activePill:   { fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500, flexShrink:0, marginTop:2 },
  step:         { display:'flex', gap:12, paddingBottom:16, marginBottom:16, borderBottom:'0.5px solid rgba(29,158,117,.08)' },
  stepNum:      { width:24, height:24, borderRadius:'50%', background:'rgba(29,158,117,.2)', color:'#5DCAA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, flexShrink:0, marginTop:1 },
  stepTitle:    { fontSize:13, fontWeight:500, color:'#E8F4F0', marginBottom:4 },
  stepDesc:     { fontSize:12, color:'#7BAAA0', lineHeight:1.5, marginBottom:4 },
  stepNote:     { fontSize:11, color:'#4A7A72', fontStyle:'italic' },
  link:         { color:'#5DCAA5' },
  codeBox:      { background:'#163D6A', borderRadius:8, padding:'10px 12px', fontSize:11, fontFamily:'monospace', color:'#5DCAA5', marginTop:6, whiteSpace:'pre-line', lineHeight:1.8 },
  emailPreview: { border:'0.5px solid rgba(29,158,117,.15)', borderRadius:10, overflow:'hidden' },
  emailHeader:  { background:'#163D6A', padding:'20px 22px' },
  emailLogo:    { fontSize:13, fontWeight:600, color:'#E8F4F0', marginBottom:10 },
  emailTitle:   { fontSize:18, fontWeight:500, color:'#E8F4F0', marginBottom:4 },
  emailSub:     { fontSize:12, color:'#7BAAA0' },
  emailBody:    { padding:'18px 22px' },
  emailBadge:   { display:'inline-block', background:'rgba(29,158,117,.2)', color:'#5DCAA5', fontSize:11, padding:'3px 10px', borderRadius:20, marginBottom:14 },
  emailMetaGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 },
  emailMeta:    { background:'#163D6A', borderRadius:6, padding:'8px 10px' },
  emailMetaLbl: { fontSize:10, color:'#4A7A72', textTransform:'uppercase', letterSpacing:.4, marginBottom:2 },
  emailMetaVal: { fontSize:12, color:'#E8F4F0', fontWeight:500 },
  emailHookBox: { background:'#163D6A', borderRadius:8, padding:'12px 14px', marginBottom:14 },
  emailHookLbl: { fontSize:10, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:.4, marginBottom:4, fontWeight:600 },
  emailHookText:{ fontSize:13, color:'#E8F4F0', fontStyle:'italic', lineHeight:1.6 },
  emailAssets:  { display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' },
  assetOk:      { background:'rgba(29,158,117,.15)', color:'#5DCAA5', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:500 },
  emailCta:     { background:'#1D9E75', color:'white', padding:'11px', borderRadius:8, textAlign:'center', fontSize:13, fontWeight:500 },
};
