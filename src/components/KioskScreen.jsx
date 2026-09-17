import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/* ── Tile option ──────────────────────────────────── */
const Tile = ({ selected, onClick, emoji, label, sublabel, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`tile ${selected ? 'selected' : ''}`}
  >
    {selected && (
      <span style={{
        position: 'absolute', top: 6, right: 6,
        width: 16, height: 16, borderRadius: '50%',
        background: '#6366f1', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700
      }}>✓</span>
    )}
    <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
    <span style={{ fontSize: 11, fontWeight: 700, color: selected ? '#a5b4fc' : '#c4c4e0', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    {sublabel && (
      <span style={{ fontSize: 9, color: '#4a4a6a', textAlign: 'center', lineHeight: 1.2, display: 'block' }}>{sublabel}</span>
    )}
  </button>
);

/* ── Field label ──────────────────────────────────── */
const FieldLabel = ({ icon, text, required }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
    <span style={{ fontSize: 13 }}>{icon}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: '#8b8baa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{text}</span>
    {required && <span style={{ color: '#ef4444', fontSize: 12 }}>*</span>}
  </div>
);

/* ── Main component ───────────────────────────────── */
const KioskScreen = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName]           = useState('');
  const [educationLevel, setEducLevel]    = useState('');
  const [strand, setStrand]               = useState('');
  const [customStrand, setCustomStrand]   = useState('');
  const [program, setProgram]             = useState('');
  const [customProgram, setCustomProgram] = useState('');
  const [yearLevel, setYearLevel]         = useState('');
  const [purpose, setPurpose]             = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [successData, setSuccessData]     = useState({});
  const [error, setError]                 = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTime, setCurrentTime]     = useState(new Date());
  const [countdown, setCountdown]         = useState(4);
  const [visible, setVisible]             = useState(false);

  const lastConfirmed  = useRef('');
  const lookupTimer    = useRef(null);
  const sessionTimer   = useRef(null);

  /* ── Data ─────────────────────────────────────── */
  const shs = [
    { code:'STEM',  emoji:'🔬', name:'STEM',  full:'Science, Tech, Engineering & Math' },
    { code:'HUMMS', emoji:'📜', name:'HUMMS', full:'Humanities & Social Sciences' },
    { code:'ABM',   emoji:'💼', name:'ABM',   full:'Accountancy, Business & Management' },
    { code:'GAS',   emoji:'🎓', name:'GAS',   full:'General Academic Strand' },
    { code:'OTHER', emoji:'✏️', name:'Other', full:'Type your strand below' },
  ];
  const programs = [
    { code:'BSA',      emoji:'📊', name:'BSA',      full:'BS Accountancy' },
    { code:'BSBA-MM',  emoji:'📣', name:'BSBA-MM',  full:'BSBA Marketing Mgmt' },
    { code:'BSBA-HRM', emoji:'🤝', name:'BSBA-HRM', full:'BSBA Human Resource' },
    { code:'BSIT',     emoji:'💻', name:'BSIT',     full:'BS Info Technology' },
    { code:'BSCpE',    emoji:'🖥️', name:'BSCpE',    full:'BS Computer Engineering' },
    { code:'BSIE',     emoji:'⚙️', name:'BSIE',     full:'BS Industrial Engineering' },
    { code:'BSCS',     emoji:'🧠', name:'BSCS',     full:'BS Computer Science' },
    { code:'BSPSY',    emoji:'🧬', name:'BSPSY',    full:'BS Psychology' },
    { code:'BSHM',     emoji:'🏨', name:'BSHM',     full:'BS Hospitality Mgmt' },
    { code:'BSTM',     emoji:'✈️', name:'BSTM',     full:'BS Tourism Management' },
    { code:'BEEd',     emoji:'🍎', name:'BEEd',     full:'Bachelor of Elem Ed' },
    { code:'BSEd',     emoji:'📐', name:'BSEd',     full:'Bachelor of Sec Ed' },
    { code:'OTHER',    emoji:'✏️', name:'Other',    full:'Type your program below' },
  ];
  const collegeYears = [
    { value:'1st Year', emoji:'1️⃣', label:'1st Year' },
    { value:'2nd Year', emoji:'2️⃣', label:'2nd Year' },
    { value:'3rd Year', emoji:'3️⃣', label:'3rd Year' },
    { value:'4th Year', emoji:'4️⃣', label:'4th Year' },
  ];
  const shsYears = [
    { value:'Grade 11', emoji:'🟡', label:'Grade 11' },
    { value:'Grade 12', emoji:'🟢', label:'Grade 12' },
  ];
  const purposes = [
    { value:'Research',       emoji:'🔬' },
    { value:'Study',          emoji:'📖' },
    { value:'Print/Photocopy',emoji:'🖨️' },
    { value:'Borrow Book',    emoji:'📕' },
    { value:'Computer Use',   emoji:'💻' },
    { value:'Other',          emoji:'📌' },
  ];

  /* ── Effects ──────────────────────────────────── */
  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    let c = 4; setCountdown(c);
    const t = setInterval(() => {
      c -= 1; setCountdown(c);
      if (c <= 0) { clearInterval(t); resetForm(); }
    }, 1000);
    return () => clearInterval(t);
  }, [showSuccess]);

  /* ── Helpers ──────────────────────────────────── */
  const clearDependent = () => {
    setFullName(''); setEducLevel(''); setStrand(''); setCustomStrand('');
    setProgram(''); setCustomProgram(''); setYearLevel(''); setPurpose('');
    setCurrentSession(null); setError(''); lastConfirmed.current = '';
  };

  const checkSession = (num) => {
    if (!num || num.length < 6) return;
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
    sessionTimer.current = setTimeout(async () => {
      try {
        const r = await axios.get(`/api/attendance/status/${num}`);
        setCurrentSession(r.data.isClockedIn ? r.data.session : null);
      } catch { /* silent */ }
    }, 600);
  };

  const handleStudentNumberChange = (e) => {
    const v = e.target.value;
    setStudentNumber(v);
    setError('');
    if (lastConfirmed.current && v !== lastConfirmed.current) clearDependent();
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (v.length >= 6) {
      lookupTimer.current = setTimeout(async () => {
        checkSession(v);
        try {
          const r = await axios.get(`/api/students/${v}`);
          if (r.data.student) {
            const s = r.data.student;
            setFullName(s.full_name || '');
            setEducLevel(s.education_level || '');
            setStrand(s.strand || '');
            setProgram(s.program || '');
            setYearLevel(s.year_level || '');
            lastConfirmed.current = v;
          }
        } catch { /* not found */ }
      }, 600);
    } else if (lastConfirmed.current) {
      clearDependent();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!studentNumber.trim()) return setError('Student number is required');
    if (!fullName.trim())       return setError('Full name is required');
    if (!educationLevel)        return setError('Please select education level');
    if (educationLevel === 'senior-high' && !strand) return setError('Please select your strand');
    if (educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim()) return setError('Please type your strand name');
    if (educationLevel === 'college' && !program) return setError('Please select your program');
    if (educationLevel === 'college' && program === 'OTHER' && !customProgram.trim()) return setError('Please type your program name');

    setIsLoading(true);
    try {
      const finalProgram = educationLevel === 'college' ? (program === 'OTHER' ? customProgram : program) : '';
      const finalStrand  = educationLevel === 'senior-high' ? (strand === 'OTHER' ? customStrand : strand) : '';

      try { await axios.get(`/api/students/${studentNumber}`); }
      catch (err) {
        if (err.response?.status === 404) {
          await axios.post('/api/students', { studentNumber, fullName, educationLevel, strand: finalStrand, customStrand, program: finalProgram, customProgram, yearLevel });
        }
      }

      if (currentSession) {
        await axios.post('/api/attendance/clock-out', { studentNumber });
        const dur = Math.round((new Date() - new Date(currentSession.timeIn)) / 60000);
        setSuccessData({ name: fullName, type: 'out', time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), duration: dur });
      } else {
        await axios.post('/api/attendance/clock-in', { studentNumber, fullName, educationLevel, strand: finalStrand, customStrand, program: finalProgram, customProgram, yearLevel, purpose });
        setSuccessData({ name: fullName, type: 'in', time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) });
      }
      setShowSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => { setStudentNumber(''); clearDependent(); setShowSuccess(false); };

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return { text: 'Good Morning',   emoji: '☀️' };
    if (h < 17) return { text: 'Good Afternoon',  emoji: '🌤️' };
    return           { text: 'Good Evening',     emoji: '🌙' };
  };
  const g = getGreeting();

  const canSubmit = !isLoading && studentNumber.trim() && fullName.trim() && educationLevel
    && !(educationLevel === 'senior-high' && !strand)
    && !(educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim())
    && !(educationLevel === 'college' && !program)
    && !(educationLevel === 'college' && program === 'OTHER' && !customProgram.trim());

  /* ── Render ───────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>

      {/* Dot grid */}
      <div className="dot-grid" style={{ position:'absolute', inset:0, opacity:0.5, pointerEvents:'none' }} />

      {/* Orbs */}
      <div className="orb orb-purple" style={{ width:500, height:500, top:-150, left:-150 }} />
      <div className="orb orb-blue"   style={{ width:400, height:400, bottom:-120, right:-120 }} />
      <div className="orb orb-cyan"   style={{ width:300, height:300, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />

      {/* ── Header ─────────────────────────────── */}
      <header className="slide-down" style={{
        background: 'rgba(10,10,15,0.85)',
        borderBottom: '1px solid #2a2a3a',
        backdropFilter: 'blur(20px)',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
            📚
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#f0f0ff', letterSpacing:'-0.02em' }}>
              Library Kiosk <span style={{ color:'#6366f1' }}>System</span>
            </div>
            <div style={{ fontSize:11, color:'#4a4a6a' }}>{g.emoji} {g.text}</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div className="badge-live"><div className="dot-live" />LIVE</div>
          <div style={{ textAlign:'right' }}>
            <div className="mono" style={{ fontSize:26, fontWeight:700, color:'#f0f0ff', letterSpacing:'-0.03em' }}>
              {currentTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
            </div>
            <div style={{ fontSize:11, color:'#4a4a6a' }}>
              {currentTime.toLocaleDateString([], { weekday:'long', month:'short', day:'numeric', year:'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────── */}
      <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px', position:'relative', zIndex:10, overflowY:'auto' }}>

        {/* ── Success ── */}
        {showSuccess ? (
          <div className="scale-in dark-card" style={{ maxWidth:420, width:'100%', textAlign:'center', padding:'48px 40px', border:'1px solid rgba(99,102,241,0.3)', boxShadow:'0 0 60px rgba(99,102,241,0.15)' }}>
            <div style={{ position:'relative', width:96, height:96, margin:'0 auto 24px' }}>
              <div className="bounce-in" style={{
                width:96, height:96, borderRadius:'50%',
                background: successData.type === 'in'
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:42, boxShadow: successData.type === 'in'
                  ? '0 0 40px rgba(16,185,129,0.4)'
                  : '0 0 40px rgba(99,102,241,0.4)'
              }}>
                {successData.type === 'in' ? '✓' : '👋'}
              </div>
              <div style={{
                position:'absolute', inset:0, borderRadius:'50%',
                background: successData.type === 'in' ? '#10b981' : '#6366f1',
                animation:'pulse-glow 2s ease-in-out infinite', opacity:0.2
              }} />
            </div>

            <div style={{ fontSize:13, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color: successData.type === 'in' ? '#10b981' : '#6366f1', marginBottom:6 }}>
              {successData.type === 'in' ? '— Session Started —' : '— Session Ended —'}
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:'#f0f0ff', marginBottom:4 }}>{successData.name}</div>
            <div className="mono" style={{ fontSize:16, color:'#8b8baa', marginBottom: successData.duration ? 4 : 20 }}>
              {successData.type === 'in' ? 'TIME IN' : 'TIME OUT'}: <span style={{ color:'#f0f0ff', fontWeight:700 }}>{successData.time}</span>
            </div>
            {successData.type === 'out' && successData.duration !== undefined && (
              <div style={{ fontSize:13, color:'#4a4a6a', marginBottom:20 }}>Duration: {successData.duration} min</div>
            )}

            <div style={{ height:1, background:'#2a2a3a', margin:'0 0 20px' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#4a4a6a', fontSize:13 }}>
              <div className="mono" style={{
                width:32, height:32, borderRadius:'50%', border:'2px solid #2a2a3a',
                borderTopColor:'#6366f1', animation:'spin 1s linear infinite', display:'inline-block'
              }} />
              Resetting in {countdown}s…
            </div>
          </div>

        ) : (
          /* ── Form card ── */
          <div style={{
            maxWidth: 540, width:'100%',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(.16,1,.3,1)'
          }}>
            {/* Card */}
            <div className="dark-card" style={{ overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>

              {/* Card top bar */}
              <div style={{
                padding:'18px 24px',
                background: currentSession
                  ? 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.08))'
                  : 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.08))',
                borderBottom: `1px solid ${currentSession ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
                display:'flex', alignItems:'center', gap:12
              }}>
                <div style={{
                  width:40, height:40, borderRadius:10,
                  background: currentSession ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                  border: `1px solid ${currentSession ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20
                }}>
                  {currentSession ? '🔓' : '🔐'}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#f0f0ff' }}>
                    {currentSession ? 'Clock Out' : 'Clock In'}
                  </div>
                  <div style={{ fontSize:12, color:'#4a4a6a' }}>
                    {currentSession
                      ? `Active since ${new Date(currentSession.timeIn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`
                      : 'Enter your details below'}
                  </div>
                </div>
                {/* Corner decoration */}
                <div style={{ marginLeft:'auto', opacity:0.3, fontSize:10, color:'#6366f1', fontFamily:'JetBrains Mono', letterSpacing:'0.1em' }}>
                  LIB-KIOSK v2
                </div>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} style={{ padding:'22px 24px', display:'flex', flexDirection:'column', gap:18 }}>

                {/* Error */}
                {error && (
                  <div className="fade-in" style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px' }}>
                    <span style={{ fontSize:16 }}>⚠️</span>
                    <span style={{ fontSize:13, color:'#fca5a5' }}>{error}</span>
                  </div>
                )}

                {/* Active session banner */}
                {currentSession && (
                  <div className="fade-in" style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, padding:'10px 14px' }}>
                    <span style={{ fontSize:16 }}>⏱️</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fcd34d' }}>Session in progress</div>
                      <div style={{ fontSize:11, color:'#78716c' }}>Submit to clock out and end your session</div>
                    </div>
                  </div>
                )}

                {/* Row 1: Student # + Full Name */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <FieldLabel icon="🎓" text="Student Number" required />
                    <input
                      className="input-dark"
                      type="text"
                      value={studentNumber}
                      onChange={handleStudentNumberChange}
                      placeholder="e.g. 21100887"
                      disabled={isLoading}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <FieldLabel icon="👤" text="Full Name" required />
                    <input
                      className="input-dark"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Education Level */}
                <div>
                  <FieldLabel icon="🏫" text="Education Level" required />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { val:'college',     emoji:'🎓', label:'College',     sub:'1st – 4th Year' },
                      { val:'senior-high', emoji:'📖', label:'Senior High', sub:'Grade 11 or 12' },
                    ].map(o => (
                      <Tile key={o.val} selected={educationLevel === o.val}
                        onClick={() => { setEducLevel(o.val); setStrand(''); setProgram(''); setYearLevel(''); }}
                        emoji={o.emoji} label={o.label} sublabel={o.sub} disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>

                {/* Strand */}
                {educationLevel === 'senior-high' && (
                  <div className="scale-in">
                    <FieldLabel icon="📋" text="Strand" required />
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                      {shs.map(s => (
                        <Tile key={s.code} selected={strand === s.code}
                          onClick={() => { setStrand(s.code); setCustomStrand(''); }}
                          emoji={s.emoji} label={s.name} sublabel={s.full} disabled={isLoading}
                        />
                      ))}
                    </div>
                    {strand === 'OTHER' && (
                      <input autoFocus className="input-dark" style={{ marginTop:10 }}
                        value={customStrand} onChange={(e) => setCustomStrand(e.target.value)}
                        placeholder="Type strand name…" disabled={isLoading} maxLength={100}
                      />
                    )}
                  </div>
                )}

                {/* Program */}
                {educationLevel === 'college' && (
                  <div className="scale-in">
                    <FieldLabel icon="📚" text="Program / Course" required />
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                      {programs.map(p => (
                        <Tile key={p.code} selected={program === p.code}
                          onClick={() => { setProgram(p.code); setCustomProgram(''); }}
                          emoji={p.emoji} label={p.name} sublabel={p.full} disabled={isLoading}
                        />
                      ))}
                    </div>
                    {program === 'OTHER' && (
                      <input autoFocus className="input-dark" style={{ marginTop:10 }}
                        value={customProgram} onChange={(e) => setCustomProgram(e.target.value)}
                        placeholder="Type program name…" disabled={isLoading} maxLength={100}
                      />
                    )}
                  </div>
                )}

                {/* Year Level */}
                {educationLevel && (
                  <div className="scale-in">
                    <FieldLabel icon="📅" text="Year Level" />
                    <div style={{ display:'grid', gridTemplateColumns: educationLevel === 'college' ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap:8 }}>
                      {(educationLevel === 'college' ? collegeYears : shsYears).map(y => (
                        <Tile key={y.value} selected={yearLevel === y.value}
                          onClick={() => setYearLevel(yearLevel === y.value ? '' : y.value)}
                          emoji={y.emoji} label={y.label} disabled={isLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Purpose */}
                <div>
                  <FieldLabel icon="🎯" text="Purpose of Visit" />
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {purposes.map(p => (
                      <Tile key={p.value} selected={purpose === p.value}
                        onClick={() => setPurpose(purpose === p.value ? '' : p.value)}
                        emoji={p.emoji} label={p.value} disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height:1, background:'#2a2a3a' }} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={currentSession ? 'btn-danger' : 'btn-primary'}
                  style={{ width:'100%', opacity: canSubmit ? 1 : 0.4 }}
                >
                  {isLoading ? (
                    <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <svg style={{ animation:'spin 1s linear infinite', width:20, height:20 }} viewBox="0 0 24 24" fill="none">
                        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing…
                    </span>
                  ) : currentSession ? '🔓  Clock Out' : '🔐  Clock In'}
                </button>

              </form>
            </div>

            {/* Bottom hint */}
            <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'#2a2a3a' }}>
              Library Attendance System • <span className="mono">v2.0</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KioskScreen;
