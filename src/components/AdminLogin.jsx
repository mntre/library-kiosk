import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [visible, setVisible]         = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!username.trim() || !password.trim()) { setError('Please fill in both fields'); return; }
    setIsLoading(true);
    try {
      const r = await axios.post('/api/admin/login', { username, password });
      if (r.data.success) {
        localStorage.setItem('adminUser', JSON.stringify(r.data.user));
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>

      {/* Dot grid */}
      <div className="dot-grid" style={{ position:'absolute', inset:0, opacity:0.5, pointerEvents:'none' }} />

      {/* Orbs */}
      <div className="orb orb-purple" style={{ width:450, height:450, top:-150, right:-100 }} />
      <div className="orb orb-blue"   style={{ width:350, height:350, bottom:-100, left:-80 }} />

      <div style={{
        maxWidth:420, width:'100%', position:'relative', zIndex:10,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition:'opacity 0.55s ease, transform 0.55s cubic-bezier(.16,1,.3,1)'
      }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }} className="slide-down">
          <div style={{ width:64, height:64, borderRadius:16, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 16px', boxShadow:'0 0 30px rgba(99,102,241,0.2)' }}>
            📚
          </div>
          <div style={{ fontSize:24, fontWeight:900, color:'#f0f0ff', letterSpacing:'-0.03em' }}>
            Library <span style={{ color:'#6366f1' }}>Admin</span>
          </div>
          <div style={{ fontSize:12, color:'#4a4a6a', marginTop:4, fontFamily:'JetBrains Mono' }}>
            Attendance Management System
          </div>
        </div>

        {/* Card */}
        <div className="dark-card" style={{ overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)' }}>

          {/* Top bar */}
          <div style={{ height:3, background:'linear-gradient(90deg,#4f46e5,#7c3aed,#06b6d4)' }} />

          <div style={{ padding:'28px 28px 24px' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#8b8baa' }}>Sign in to continue</div>
              <div className="badge-live"><div className="dot-live" />ONLINE</div>
            </div>

            {/* Error */}
            {error && (
              <div className="fade-in" style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:18 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <span style={{ fontSize:13, color:'#fca5a5' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Username */}
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#8b8baa', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  <span>👤</span> Username
                </div>
                <input
                  className="input-dark"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#8b8baa', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  <span>🔑</span> Password
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    className="input-dark"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={isLoading}
                    style={{ paddingRight:44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#4a4a6a', transition:'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color='#8b8baa'}
                    onMouseLeave={(e) => e.target.style.color='#4a4a6a'}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height:1, background:'#2a2a3a' }} />

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="btn-primary"
                style={{ width:'100%', opacity: isLoading || !username.trim() || !password.trim() ? 0.4 : 1 }}
              >
                {isLoading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <svg style={{ animation:'spin 1s linear infinite', width:20, height:20 }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : '🔐  Sign In'}
              </button>
            </form>

            {/* Back link */}
            <div style={{ textAlign:'center', marginTop:20 }}>
              <button
                onClick={() => navigate('/')}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#4a4a6a', transition:'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color='#6366f1'}
                onMouseLeave={(e) => e.target.style.color='#4a4a6a'}
              >
                ← Back to Kiosk
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'#2a2a3a', fontFamily:'JetBrains Mono' }}>
          LIB-KIOSK v2.0 • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
