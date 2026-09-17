import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ── Helpers ─────────────────────────────────────── */
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-PH', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDur  = (s) => { if (!s) return '—'; const m = Math.round(s/60); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`; };
const fullName = (r) => [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || r.full_name || '—';

/* ── Stat card ───────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color }} />
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={{ fontSize:11, fontWeight:600, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{label}</div>
        <div style={{ fontSize:34, fontWeight:900, color:'#f0f0ff', lineHeight:1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize:12, color:'#4a4a6a', marginTop:6 }}>{sub}</div>}
      </div>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{icon}</div>
    </div>
  </div>
);

/* ── Simple bar chart ────────────────────────────── */
const BarChart = ({ data, label, color = '#6366f1' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:'100%', background:`${color}22`, borderRadius:4, height:80, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
            <div style={{ width:'100%', background:color, borderRadius:4, height:`${(d.value/max)*100}%`, minHeight: d.value ? 4 : 0, transition:'height 0.6s ease' }} />
          </div>
          <div style={{ fontSize:9, color:'#4a4a6a', textAlign:'center', whiteSpace:'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

/* ── Main component ──────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [adminUser, setAdminUser]       = useState(null);
  const [showLogout, setShowLogout]     = useState(false);
  const [currentTime, setCurrentTime]   = useState(new Date());

  /* Stats */
  const [stats, setStats] = useState({ totalVisitsToday:0, activeSessions:0, avgDurationMinutes:0 });
  const [hourlyData, setHourlyData]     = useState([]);
  const [purposeData, setPurposeData]   = useState([]);
  const [programData, setProgramData]   = useState([]);
  const [weeklyData, setWeeklyData]     = useState([]);

  /* Live */
  const [liveSessions, setLiveSessions] = useState([]);
  const liveTimer = useRef(null);

  /* Logs */
  const [logs, setLogs]                 = useState([]);
  const [logsTotal, setLogsTotal]       = useState(0);
  const [logsPage, setLogsPage]         = useState(1);
  const [logsLimit]                     = useState(20);
  const [filterStart, setFilterStart]   = useState('');
  const [filterEnd, setFilterEnd]       = useState('');
  const [filterProgram, setFilterProg]  = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [exportLoading, setExportLoad]  = useState(false);

  /* Programs */
  const [programs, setPrograms]         = useState([]);
  const [progModal, setProgModal]       = useState(null); // null | { id?, code, name }
  const [progCode, setProgCode]         = useState('');
  const [progName, setProgName]         = useState('');
  const [progSaving, setProgSaving]     = useState(false);

  /* ── Auth check ─────────────────────────────── */
  useEffect(() => {
    const u = localStorage.getItem('adminUser');
    if (!u) { window.location.href = '/admin/login'; return; }
    setAdminUser(JSON.parse(u));
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Load on tab change ─────────────────────── */
  useEffect(() => {
    if (!adminUser) return;
    loadPrograms();
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'live')      startLivePoll();
    else                           stopLivePoll();
    if (activeTab === 'logs')      loadLogs();
  }, [activeTab, adminUser]);

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
  }, [logsPage]);

  /* ── Data loaders ───────────────────────────── */
  const loadDashboard = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/logs?limit=500')
      ]);
      setStats(statsRes.data);

      const allLogs = logsRes.data.logs || [];

      // Hourly visits today
      const today = new Date().toDateString();
      const todayLogs = allLogs.filter(l => new Date(l.time_in).toDateString() === today);
      const hourBuckets = Array.from({length:12}, (_,i) => ({ label:`${i+8}`, value:0 }));
      todayLogs.forEach(l => {
        const h = new Date(l.time_in).getHours();
        if (h >= 8 && h < 20) hourBuckets[h-8].value++;
      });
      setHourlyData(hourBuckets);

      // Purpose breakdown
      const purpMap = {};
      allLogs.forEach(l => { if (l.purpose) purpMap[l.purpose] = (purpMap[l.purpose]||0)+1; });
      setPurposeData(Object.entries(purpMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,value])=>({label,value})));

      // Program breakdown
      const progMap = {};
      allLogs.forEach(l => { if (l.program) progMap[l.program] = (progMap[l.program]||0)+1; });
      setProgramData(Object.entries(progMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value])=>({label,value})));

      // Weekly visits (last 7 days)
      const days = Array.from({length:7}, (_,i) => {
        const d = new Date(); d.setDate(d.getDate()-6+i);
        return { label: d.toLocaleDateString('en-PH',{weekday:'short'}), date: d.toDateString(), value:0 };
      });
      allLogs.forEach(l => {
        const ds = new Date(l.time_in).toDateString();
        const slot = days.find(d => d.date === ds);
        if (slot) slot.value++;
      });
      setWeeklyData(days);
    } catch (err) { console.error(err); }
  };

  const startLivePoll = () => {
    fetchLive();
    liveTimer.current = setInterval(fetchLive, 15000);
  };
  const stopLivePoll = () => { if (liveTimer.current) clearInterval(liveTimer.current); };
  const fetchLive = async () => {
    try {
      const r = await axios.get('/api/attendance/active-sessions');
      setLiveSessions(r.data.sessions || []);
    } catch {}
  };

  useEffect(() => () => stopLivePoll(), []);

  const loadLogs = async () => {
    try {
      const p = new URLSearchParams({ page: logsPage, limit: logsLimit });
      if (filterStart)   p.append('startDate', filterStart);
      if (filterEnd)     p.append('endDate', filterEnd);
      if (filterProgram) p.append('program', filterProgram);
      if (filterSearch)  { p.append('studentNumber', filterSearch); p.append('name', filterSearch); }
      if (filterStatus)  p.append('status', filterStatus);
      const r = await axios.get(`/api/admin/logs?${p}`);
      setLogs(r.data.logs || []);
      setLogsTotal(r.data.total || 0);
    } catch (err) { console.error(err); }
  };

  const loadPrograms = async () => {
    try {
      const r = await axios.get('/api/programs');
      setPrograms(r.data.programs || []);
    } catch {}
  };

  /* ── CSV Export ─────────────────────────────── */
  const exportCSV = async () => {
    setExportLoad(true);
    try {
      // Fetch ALL logs matching filters (no pagination)
      const p = new URLSearchParams({ page:1, limit:9999 });
      if (filterStart)   p.append('startDate', filterStart);
      if (filterEnd)     p.append('endDate', filterEnd);
      if (filterProgram) p.append('program', filterProgram);
      if (filterSearch)  { p.append('studentNumber', filterSearch); p.append('name', filterSearch); }
      if (filterStatus)  p.append('status', filterStatus);
      const r = await axios.get(`/api/admin/logs?${p}`);
      const allLogs = r.data.logs || [];

      const headers = [
        'ID','Student Number','Last Name','First Name','Middle Name',
        'Education Level','Program/Strand','Year Level','Purpose',
        'Time In','Time Out','Duration','Status'
      ];
      const rows = allLogs.map(l => [
        l.id,
        l.student_number,
        l.last_name  || l.full_name || '',
        l.first_name || '',
        l.middle_name || '',
        l.education_level || '',
        l.program || l.strand || '',
        l.year_level || '',
        l.purpose || '',
        l.time_in ? new Date(l.time_in).toLocaleString('en-PH') : '',
        l.time_out ? new Date(l.time_out).toLocaleString('en-PH') : '',
        l.duration ? `${Math.round(l.duration/60)} min` : '',
        l.status
      ]);

      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `library_attendance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExportLoad(false); }
  };

  /* ── Close session ──────────────────────────── */
  const closeSession = async (id) => {
    if (!confirm('Close this session?')) return;
    try { await axios.post('/api/admin/close-session', { logId: id }); fetchLive(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  /* ── Program CRUD ───────────────────────────── */
  const openProgModal = (prog = null) => {
    setProgCode(prog?.code || '');
    setProgName(prog?.name || '');
    setProgModal(prog || { isNew: true });
  };
  const saveProgram = async (e) => {
    e.preventDefault();
    setProgSaving(true);
    try {
      if (progModal.isNew) {
        await axios.post('/api/programs', { code: progCode, name: progName });
      } else {
        await axios.put(`/api/programs/${progModal.id}`, { code: progCode, name: progName });
      }
      setProgModal(null);
      loadPrograms();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
    finally { setProgSaving(false); }
  };
  const deleteProgram = async (id) => {
    if (!confirm('Delete this program?')) return;
    try { await axios.delete(`/api/programs/${id}`); loadPrograms(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  /* ── Styles ─────────────────────────────────── */
  const S = {
    page: { minHeight:'100vh', background:'var(--bg-base)', display:'flex', flexDirection:'column', fontFamily:'Inter,sans-serif', color:'#f0f0ff' },
    header: { background:'rgba(10,10,15,0.95)', borderBottom:'1px solid #2a2a3a', backdropFilter:'blur(20px)', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 },
    sidebar: { width:220, background:'var(--bg-surface)', borderRight:'1px solid #2a2a3a', padding:'20px 0', flexShrink:0, display:'flex', flexDirection:'column' },
    main: { flex:1, padding:'28px 28px', overflowY:'auto' },
    tab: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'11px 20px', margin:'2px 10px', borderRadius:10, cursor:'pointer', transition:'all 0.15s', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', color: active ? '#a5b4fc' : '#6b6b8a', borderLeft: active ? '2px solid #6366f1' : '2px solid transparent', fontWeight: active ? 600 : 400, fontSize:14 }),
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' },
    th: { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#4a4a6a', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'1px solid #2a2a3a', background:'rgba(0,0,0,0.2)', whiteSpace:'nowrap' },
    td: { padding:'10px 14px', fontSize:13, color:'#c4c4e0', borderBottom:'1px solid #1e1e2a', verticalAlign:'middle' },
    input: { background:'var(--bg-base)', border:'1.5px solid #2a2a3a', color:'#f0f0ff', borderRadius:8, padding:'8px 12px', fontSize:13, outline:'none', width:'100%', fontFamily:'Inter,sans-serif' },
    btnPrimary: { background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 },
    btnDanger:  { background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer' },
    btnGhost:   { background:'rgba(99,102,241,0.1)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.2)', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer' },
    badge: (s) => ({ display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:600, background: s==='active' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: s==='active' ? '#fcd34d' : '#34d399' }),
  };

  const tabs = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'live',      icon:'🟢', label:'Live View' },
    { id:'logs',      icon:'📋', label:'Attendance Logs' },
    { id:'programs',  icon:'🎓', label:'Programs' },
  ];

  const totalPages = Math.ceil(logsTotal / logsLimit);

  /* ── Render ─────────────────────────────────── */
  return (
    <div style={S.page}>

      {/* Header */}
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📚</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.02em' }}>Library <span style={{ color:'#6366f1' }}>Admin</span></div>
            <div style={{ fontSize:11, color:'#4a4a6a', fontFamily:'JetBrains Mono,monospace' }}>Management Dashboard</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, color:'#4a4a6a' }}>
            {currentTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </div>
          <div style={{ fontSize:13, color:'#8b8baa' }}>👤 {adminUser?.username}</div>
          <button onClick={() => setShowLogout(true)} style={S.btnDanger}>Sign Out</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Sidebar */}
        <nav style={S.sidebar}>
          <div style={{ padding:'0 20px 16px', fontSize:10, fontWeight:700, color:'#2a2a3a', textTransform:'uppercase', letterSpacing:'0.12em' }}>Navigation</div>
          {tabs.map(t => (
            <div key={t.id} style={S.tab(activeTab===t.id)} onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span><span>{t.label}</span>
            </div>
          ))}
          <div style={{ flex:1 }} />
          <div style={{ padding:'16px 20px', borderTop:'1px solid #2a2a3a' }}>
            <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'#4a4a6a', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
              ← Back to Kiosk
            </button>
          </div>
        </nav>

        {/* Main */}
        <main style={S.main}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

              {/* Page title */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>Dashboard</h1>
                  <p style={{ fontSize:13, color:'#4a4a6a', margin:'4px 0 0' }}>Overview of library activity</p>
                </div>
                <button onClick={loadDashboard} style={S.btnPrimary}>🔄 Refresh</button>
              </div>

              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                <StatCard icon="👥" label="Visits Today" value={stats.totalVisitsToday} sub="completed sessions" color="#6366f1" />
                <StatCard icon="🟢" label="Currently Inside" value={stats.activeSessions} sub="active sessions" color="#10b981" />
                <StatCard icon="⏱️" label="Avg Visit Duration" value={stats.avgDurationMinutes ? `${stats.avgDurationMinutes}m` : '—'} sub="per session today" color="#f59e0b" />
              </div>

              {/* Charts row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                {/* Hourly */}
                <div style={S.card}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a2a3a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>Visits by Hour (Today)</div>
                    <div style={{ fontSize:11, color:'#4a4a6a' }}>8AM – 8PM</div>
                  </div>
                  <div style={{ padding:'20px' }}>
                    {hourlyData.length > 0
                      ? <BarChart data={hourlyData} color="#6366f1" />
                      : <div style={{ color:'#4a4a6a', fontSize:13, textAlign:'center', padding:'20px 0' }}>No data for today</div>
                    }
                  </div>
                </div>

                {/* Weekly */}
                <div style={S.card}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a2a3a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>Visits This Week</div>
                    <div style={{ fontSize:11, color:'#4a4a6a' }}>Last 7 days</div>
                  </div>
                  <div style={{ padding:'20px' }}>
                    {weeklyData.length > 0
                      ? <BarChart data={weeklyData} color="#10b981" />
                      : <div style={{ color:'#4a4a6a', fontSize:13, textAlign:'center', padding:'20px 0' }}>No data</div>
                    }
                  </div>
                </div>
              </div>

              {/* Purpose + Program row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                {/* Purpose */}
                <div style={S.card}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a2a3a' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>Top Purposes</div>
                  </div>
                  <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                    {purposeData.length === 0
                      ? <div style={{ color:'#4a4a6a', fontSize:13 }}>No data</div>
                      : purposeData.map((d, i) => {
                          const max = purposeData[0].value;
                          return (
                            <div key={i}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12 }}>
                                <span style={{ color:'#c4c4e0' }}>{d.label}</span>
                                <span style={{ color:'#6366f1', fontWeight:700 }}>{d.value}</span>
                              </div>
                              <div style={{ height:6, background:'#2a2a3a', borderRadius:3 }}>
                                <div style={{ height:'100%', width:`${(d.value/max)*100}%`, background:'#6366f1', borderRadius:3, transition:'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                </div>

                {/* Program */}
                <div style={S.card}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a2a3a' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>Top Programs</div>
                  </div>
                  <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                    {programData.length === 0
                      ? <div style={{ color:'#4a4a6a', fontSize:13 }}>No data</div>
                      : programData.map((d, i) => {
                          const max = programData[0].value;
                          return (
                            <div key={i}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12 }}>
                                <span style={{ color:'#c4c4e0' }}>{d.label}</span>
                                <span style={{ color:'#10b981', fontWeight:700 }}>{d.value}</span>
                              </div>
                              <div style={{ height:6, background:'#2a2a3a', borderRadius:3 }}>
                                <div style={{ height:'100%', width:`${(d.value/max)*100}%`, background:'#10b981', borderRadius:3, transition:'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LIVE TAB ── */}
          {activeTab === 'live' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>Live View</h1>
                  <p style={{ fontSize:13, color:'#4a4a6a', margin:'4px 0 0' }}>Students currently inside the library</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#10b981' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', animation:'blink 1.4s ease-in-out infinite' }} />
                    Auto-refreshes every 15s
                  </div>
                  <button onClick={fetchLive} style={S.btnPrimary}>🔄 Refresh Now</button>
                </div>
              </div>

              <div style={S.card}>
                {liveSessions.length === 0 ? (
                  <div style={{ padding:'60px 20px', textAlign:'center', color:'#4a4a6a' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                    <div style={{ fontSize:14 }}>No one is currently in the library</div>
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          {['Time In','Student No.','Name','Program','Year','Purpose','Duration','Action'].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {liveSessions.map(s => (
                          <tr key={s.id} style={{ transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.04)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <td style={S.td}><span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{new Date(s.time_in).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></td>
                            <td style={S.td}><span style={{ fontFamily:'JetBrains Mono,monospace', color:'#a5b4fc' }}>{s.student_number}</span></td>
                            <td style={S.td}><span style={{ fontWeight:600, color:'#f0f0ff' }}>{fullName(s)}</span></td>
                            <td style={S.td}>{s.program || s.strand || '—'}</td>
                            <td style={S.td}>{s.year_level || '—'}</td>
                            <td style={S.td}>{s.purpose || '—'}</td>
                            <td style={S.td}>{fmtDur(Math.round((new Date()-new Date(s.time_in))/1000))}</td>
                            <td style={S.td}><button style={S.btnDanger} onClick={() => closeSession(s.id)}>Close</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── LOGS TAB ── */}
          {activeTab === 'logs' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>Attendance Logs</h1>
                  <p style={{ fontSize:13, color:'#4a4a6a', margin:'4px 0 0' }}>{logsTotal} total records</p>
                </div>
                <button onClick={exportCSV} disabled={exportLoading} style={{ ...S.btnPrimary, background:'linear-gradient(135deg,#059669,#10b981)', opacity: exportLoading ? 0.7 : 1 }}>
                  {exportLoading ? '⏳ Exporting…' : '⬇️ Export CSV'}
                </button>
              </div>

              {/* Filters */}
              <div style={{ ...S.card, padding:'18px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>From</div>
                    <input type="date" style={S.input} value={filterStart} onChange={e=>setFilterStart(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>To</div>
                    <input type="date" style={S.input} value={filterEnd} onChange={e=>setFilterEnd(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Program</div>
                    <select style={S.input} value={filterProgram} onChange={e=>setFilterProg(e.target.value)}>
                      <option value="">All Programs</option>
                      {programs.map(p => <option key={p.id} value={p.code}>{p.code}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Status</div>
                    <select style={S.input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Search</div>
                    <input style={S.input} placeholder="ID or name…" value={filterSearch} onChange={e=>setFilterSearch(e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button style={S.btnPrimary} onClick={()=>{ setLogsPage(1); loadLogs(); }}>🔍 Apply Filters</button>
                  <button style={{ ...S.btnGhost }} onClick={()=>{ setFilterStart(''); setFilterEnd(''); setFilterProg(''); setFilterSearch(''); setFilterStatus(''); setLogsPage(1); setTimeout(loadLogs,0); }}>✕ Clear</button>
                </div>
              </div>

              {/* Table */}
              <div style={S.card}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['Student No.','Last Name','First Name','Middle Name','Education','Program/Strand','Year','Purpose','Time In','Time Out','Duration','Status'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={12} style={{ ...S.td, textAlign:'center', padding:'48px', color:'#4a4a6a' }}>No records found</td></tr>
                      ) : logs.map(l => (
                        <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.04)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={S.td}><span style={{ fontFamily:'JetBrains Mono,monospace', color:'#a5b4fc', fontSize:12 }}>{l.student_number}</span></td>
                          <td style={S.td}><span style={{ fontWeight:600, color:'#f0f0ff' }}>{l.last_name || '—'}</span></td>
                          <td style={S.td}>{l.first_name || '—'}</td>
                          <td style={S.td}>{l.middle_name || '—'}</td>
                          <td style={S.td}>{l.education_level || '—'}</td>
                          <td style={S.td}>{l.program || l.strand || '—'}</td>
                          <td style={S.td}>{l.year_level || '—'}</td>
                          <td style={S.td}>{l.purpose || '—'}</td>
                          <td style={S.td}><span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>{fmtTime(l.time_in)}</span></td>
                          <td style={S.td}><span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>{fmtTime(l.time_out)}</span></td>
                          <td style={S.td}>{fmtDur(l.duration)}</td>
                          <td style={S.td}><span style={S.badge(l.status)}>{l.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logsTotal > 0 && (
                  <div style={{ padding:'14px 20px', borderTop:'1px solid #2a2a3a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:12, color:'#4a4a6a' }}>
                      Showing {(logsPage-1)*logsLimit+1}–{Math.min(logsPage*logsLimit,logsTotal)} of {logsTotal}
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>setLogsPage(p=>Math.max(1,p-1))} disabled={logsPage===1} style={{ ...S.btnGhost, opacity: logsPage===1 ? 0.4 : 1 }}>← Prev</button>
                      <span style={{ fontSize:13, color:'#8b8baa', padding:'4px 8px' }}>Page {logsPage} / {totalPages}</span>
                      <button onClick={()=>setLogsPage(p=>Math.min(totalPages,p+1))} disabled={logsPage>=totalPages} style={{ ...S.btnGhost, opacity: logsPage>=totalPages ? 0.4 : 1 }}>Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PROGRAMS TAB ── */}
          {activeTab === 'programs' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>Programs</h1>
                  <p style={{ fontSize:13, color:'#4a4a6a', margin:'4px 0 0' }}>Manage available programs/courses</p>
                </div>
                <button style={S.btnPrimary} onClick={() => openProgModal()}>+ Add Program</button>
              </div>

              <div style={S.card}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['Code','Name','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {programs.length === 0 ? (
                        <tr><td colSpan={3} style={{ ...S.td, textAlign:'center', padding:'48px', color:'#4a4a6a' }}>No programs found</td></tr>
                      ) : programs.map(p => (
                        <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.04)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={S.td}><span style={{ fontFamily:'JetBrains Mono,monospace', color:'#a5b4fc', fontWeight:700 }}>{p.code}</span></td>
                          <td style={{ ...S.td, color:'#f0f0ff' }}>{p.name}</td>
                          <td style={S.td}>
                            <div style={{ display:'flex', gap:8 }}>
                              <button style={S.btnGhost} onClick={() => openProgModal(p)}>Edit</button>
                              <button style={S.btnDanger} onClick={() => deleteProgram(p.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Logout modal ── */}
      {showLogout && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid #2a2a3a', borderRadius:16, padding:'32px', maxWidth:380, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Sign Out?</div>
            <div style={{ fontSize:13, color:'#8b8baa', marginBottom:24 }}>You'll be redirected to the login page.</div>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => setShowLogout(false)} style={{ ...S.btnGhost, flex:1, padding:'10px', justifyContent:'center', display:'flex' }}>Cancel</button>
              <button onClick={() => { localStorage.removeItem('adminUser'); window.location.href='/admin/login'; }} style={{ ...S.btnDanger, flex:1, padding:'10px', justifyContent:'center', display:'flex' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Program modal ── */}
      {progModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid #2a2a3a', borderRadius:16, padding:'32px', maxWidth:420, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>{progModal.isNew ? '+ Add Program' : 'Edit Program'}</div>
            <form onSubmit={saveProgram} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Code</div>
                <input style={S.input} value={progCode} onChange={e=>setProgCode(e.target.value)} placeholder="e.g. BSIT" required maxLength={20} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Name</div>
                <input style={S.input} value={progName} onChange={e=>setProgName(e.target.value)} placeholder="e.g. BS Information Technology" required maxLength={150} />
              </div>
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" onClick={() => setProgModal(null)} style={{ ...S.btnGhost, flex:1, padding:'10px', justifyContent:'center', display:'flex' }}>Cancel</button>
                <button type="submit" disabled={progSaving} style={{ ...S.btnPrimary, flex:1, padding:'10px', justifyContent:'center', display:'flex' }}>{progSaving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
