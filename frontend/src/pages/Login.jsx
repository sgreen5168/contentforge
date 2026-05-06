import React, { useState } from 'react';

// Single password gate — change this to whatever you want
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'contentforge2026';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        localStorage.setItem('cf_auth', btoa(CORRECT_PASSWORD));
        onLogin();
      } else {
        setError('Incorrect password. Try again.');
        setPassword('');
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.iconRow}>
          <div style={S.icon}>⚡</div>
        </div>
        <div style={S.title}>ContentForge</div>
        <div style={S.sub}>Social AI Engine — Private Access</div>

        <form onSubmit={handleSubmit} style={S.form}>
          <label style={S.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password"
            style={S.inp}
            autoFocus
          />
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" style={S.btn} disabled={loading || !password}>
            {loading ? '⏳ Checking…' : 'Sign in →'}
          </button>
        </form>

        <div style={S.footer}>Private — not publicly accessible</div>
      </div>
    </div>
  );
}

const S = {
  page:   { minHeight:'100vh', background:'#0D2137', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card:   { background:'#102D4F', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:16, padding:'40px 36px', width:'100%', maxWidth:380, textAlign:'center' },
  iconRow:{ display:'flex', justifyContent:'center', marginBottom:16 },
  icon:   { width:48, height:48, borderRadius:12, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 },
  title:  { fontSize:22, fontWeight:500, color:'#E8F4F0', marginBottom:6 },
  sub:    { fontSize:13, color:'#7BAAA0', marginBottom:28 },
  form:   { display:'flex', flexDirection:'column', gap:10, textAlign:'left' },
  label:  { fontSize:11, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5 },
  inp:    { width:'100%', border:'0.5px solid rgba(29,158,117,.2)', borderRadius:8, padding:'10px 13px', fontSize:14, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', boxSizing:'border-box' },
  error:  { fontSize:12, color:'#F09595', background:'rgba(226,75,74,.1)', border:'0.5px solid rgba(226,75,74,.25)', borderRadius:6, padding:'7px 10px' },
  btn:    { background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'11px', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginTop:4, opacity:1, transition:'opacity .15s' },
  footer: { fontSize:11, color:'#4A7A72', marginTop:24 },
};
