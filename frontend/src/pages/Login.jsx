import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');

    setTimeout(() => {
      // Get password from env or use default
      const correct = import.meta.env.VITE_APP_PASSWORD || 'ContentForge2026';

      if (password.trim() === correct.trim()) {
        // Store simple flag in localStorage
        localStorage.setItem('cf_auth_v2', 'true');
        localStorage.setItem('cf_pw_hash', password.length.toString());
        onLogin();
      } else {
        setError('Incorrect password — try ContentForge2026');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.iconWrap}>
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
            autoComplete="current-password"
          />
          {error && <div style={S.error}>{error}</div>}
          <button
            type="submit"
            style={{...S.btn, opacity: loading || !password.trim() ? 0.5 : 1}}
            disabled={loading || !password.trim()}
          >
            {loading ? '⏳ Checking…' : 'Sign in →'}
          </button>
        </form>

        <div style={S.hint}>Private — not publicly accessible</div>
      </div>
    </div>
  );
}

const S = {
  page:    { minHeight:'100vh', background:'#0D2137', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card:    { background:'#102D4F', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:380, textAlign:'center' },
  iconWrap:{ display:'flex', justifyContent:'center', marginBottom:16 },
  icon:    { width:48, height:48, borderRadius:12, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 },
  title:   { fontSize:22, fontWeight:500, color:'#E8F4F0', marginBottom:6 },
  sub:     { fontSize:13, color:'#7BAAA0', marginBottom:24 },
  form:    { display:'flex', flexDirection:'column', gap:10, textAlign:'left' },
  label:   { fontSize:11, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5 },
  inp:     { width:'100%', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:8, padding:'11px 13px', fontSize:15, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', boxSizing:'border-box' },
  error:   { fontSize:12, color:'#F09595', background:'rgba(226,75,74,.1)', border:'0.5px solid rgba(226,75,74,.3)', borderRadius:6, padding:'8px 10px' },
  btn:     { background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'12px', fontSize:15, fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginTop:4 },
  hint:    { fontSize:11, color:'#4A7A72', marginTop:20 },
  code:    { background:'#163D6A', color:'#5DCAA5', padding:'2px 6px', borderRadius:4, fontSize:11 },
};
