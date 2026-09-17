import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Reusable option tile component
const OptionTile = ({ selected, onClick, emoji, label, sublabel, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 text-xs font-semibold transition-all duration-200
      ${selected
        ? 'border-indigo-500 bg-gradient-to-b from-indigo-50 to-white text-indigo-700 shadow-lg shadow-indigo-100 scale-[1.04]'
        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40 hover:scale-[1.02]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {selected && (
      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
    )}
    <span className="text-2xl leading-none">{emoji}</span>
    <span className="text-center leading-tight font-bold">{label}</span>
    {sublabel && <span className="text-center leading-tight text-gray-400 font-normal text-[10px] hidden sm:block">{sublabel}</span>}
  </button>
);

const KioskScreen = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [strand, setStrand] = useState('');
  const [customStrand, setCustomStrand] = useState('');
  const [program, setProgram] = useState('');
  const [customProgram, setCustomProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ name: '', type: '', time: '' });
  const [error, setError] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(4);
  const [formVisible, setFormVisible] = useState(false);
  // Track the last confirmed student number so we know when it's been modified
  const lastConfirmedNumber = useRef('');

  const studentLookupTimer = useRef(null);
  const sessionCheckTimer = useRef(null);

  const seniorHighStrands = [
    { code: 'STEM', emoji: '🔬', name: 'STEM', full: 'Science, Technology, Engineering & Math' },
    { code: 'HUMMS', emoji: '📜', name: 'HUMMS', full: 'Humanities & Social Sciences' },
    { code: 'ABM', emoji: '💼', name: 'ABM', full: 'Accountancy, Business & Management' },
    { code: 'GAS', emoji: '🎓', name: 'GAS', full: 'General Academic Strand' },
    { code: 'OTHER', emoji: '✏️', name: 'Other', full: 'Type your strand below' },
  ];

  const collegePrograms = [
    { code: 'BSA', emoji: '📊', name: 'BSA', full: 'BS Accountancy' },
    { code: 'BSBA-MM', emoji: '📣', name: 'BSBA-MM', full: 'BSBA Marketing Management' },
    { code: 'BSBA-HRM', emoji: '🤝', name: 'BSBA-HRM', full: 'BSBA Human Resource Management' },
    { code: 'BSIT', emoji: '💻', name: 'BSIT', full: 'BS Information Technology' },
    { code: 'BSCpE', emoji: '🖥️', name: 'BSCpE', full: 'BS Computer Engineering' },
    { code: 'BSIE', emoji: '⚙️', name: 'BSIE', full: 'BS Industrial Engineering' },
    { code: 'BSCS', emoji: '🧠', name: 'BSCS', full: 'BS Computer Science' },
    { code: 'BSPSY', emoji: '🧬', name: 'BSPSY', full: 'BS Psychology' },
    { code: 'BSHM', emoji: '🏨', name: 'BSHM', full: 'BS Hospitality Management' },
    { code: 'BSTM', emoji: '✈️', name: 'BSTM', full: 'BS Tourism Management' },
    { code: 'BEEd', emoji: '🍎', name: 'BEEd', full: 'Bachelor of Elementary Education' },
    { code: 'BSEd', emoji: '📐', name: 'BSEd', full: 'Bachelor of Secondary Education' },
    { code: 'OTHER', emoji: '✏️', name: 'Other', full: 'Type your program below' },
  ];

  const collegeYears = [
    { value: '1st Year', emoji: '1️⃣', label: '1st Year' },
    { value: '2nd Year', emoji: '2️⃣', label: '2nd Year' },
    { value: '3rd Year', emoji: '3️⃣', label: '3rd Year' },
    { value: '4th Year', emoji: '4️⃣', label: '4th Year' },
  ];

  const shsYears = [
    { value: 'Grade 11', emoji: '🟡', label: 'Grade 11' },
    { value: 'Grade 12', emoji: '🟢', label: 'Grade 12' },
  ];

  const purposes = [
    { value: 'Research', emoji: '🔬' },
    { value: 'Study', emoji: '📖' },
    { value: 'Print/Photocopy', emoji: '🖨️' },
    { value: 'Borrow Book', emoji: '📕' },
    { value: 'Computer Use', emoji: '💻' },
    { value: 'Other', emoji: '📌' },
  ];

  useEffect(() => {
    setTimeout(() => setFormVisible(true), 100);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (showSuccess) {
      let count = 4;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) { clearInterval(interval); resetForm(); }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showSuccess]);

  // Clear all dependent fields
  const clearDependentFields = () => {
    setFullName('');
    setEducationLevel('');
    setStrand('');
    setCustomStrand('');
    setProgram('');
    setCustomProgram('');
    setYearLevel('');
    setPurpose('');
    setCurrentSession(null);
    setError('');
    lastConfirmedNumber.current = '';
  };

  const checkSession = async (number) => {
    if (!number || number.length < 6) return;
    if (sessionCheckTimer.current) clearTimeout(sessionCheckTimer.current);
    sessionCheckTimer.current = setTimeout(async () => {
      try {
        const response = await axios.get(`/api/attendance/status/${number}`);
        setCurrentSession(response.data.isClockedIn ? response.data.session : null);
        setError('');
      } catch { /* silent */ }
    }, 600);
  };

  const handleStudentNumberChange = async (e) => {
    const value = e.target.value;
    setStudentNumber(value);
    setError('');

    // If the student number was modified after being auto-filled → clear all fields
    if (lastConfirmedNumber.current && value !== lastConfirmedNumber.current) {
      clearDependentFields();
    }

    if (studentLookupTimer.current) clearTimeout(studentLookupTimer.current);

    if (value.length >= 6) {
      studentLookupTimer.current = setTimeout(async () => {
        checkSession(value);
        try {
          const response = await axios.get(`/api/students/${value}`);
          if (response.data.student) {
            const s = response.data.student;
            setFullName(s.full_name || '');
            setEducationLevel(s.education_level || '');
            setStrand(s.strand || '');
            setProgram(s.program || '');
            setYearLevel(s.year_level || '');
            lastConfirmedNumber.current = value; // mark as confirmed
          }
        } catch { /* not found */ }
      }, 600);
    } else {
      // Number too short — clear all
      if (lastConfirmedNumber.current) clearDependentFields();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!studentNumber.trim()) { setError('Please enter your student number'); return; }
    if (!fullName.trim()) { setError('Please enter your full name'); return; }
    if (!educationLevel) { setError('Please select your education level'); return; }
    if (educationLevel === 'senior-high' && !strand) { setError('Please select your strand'); return; }
    if (educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim()) { setError('Please enter your strand'); return; }
    if (educationLevel === 'college' && !program) { setError('Please select your program'); return; }
    if (educationLevel === 'college' && program === 'OTHER' && !customProgram.trim()) { setError('Please enter your program'); return; }

    setIsLoading(true);
    try {
      const submittedProgram = educationLevel === 'college' ? (program === 'OTHER' ? customProgram : program) : '';
      const submittedStrand = educationLevel === 'senior-high' ? (strand === 'OTHER' ? customStrand : strand) : '';

      try {
        await axios.get(`/api/students/${studentNumber}`);
      } catch (err) {
        if (err.response?.status === 404) {
          await axios.post('/api/students', {
            studentNumber, fullName, educationLevel,
            strand: submittedStrand, customStrand,
            program: submittedProgram, customProgram, yearLevel
          });
        }
      }

      if (currentSession) {
        await axios.post('/api/attendance/clock-out', { studentNumber });
        const dur = Math.round((new Date() - new Date(currentSession.timeIn)) / 60000);
        setSuccessData({ name: fullName, type: 'out', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), duration: dur });
      } else {
        await axios.post('/api/attendance/clock-in', {
          studentNumber, fullName, educationLevel,
          strand: submittedStrand, customStrand,
          program: submittedProgram, customProgram, yearLevel, purpose
        });
        setSuccessData({ name: fullName, type: 'in', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      }
      setShowSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStudentNumber(''); clearDependentFields();
    setShowSuccess(false);
  };

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };

  const greeting = getGreeting();
  const isSubmitDisabled = isLoading || !studentNumber.trim() || !fullName.trim() || !educationLevel
    || (educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim())
    || (educationLevel === 'college' && program === 'OTHER' && !customProgram.trim());

  return (
    <div className="min-h-screen animated-bg relative overflow-hidden flex flex-col">
      {/* Floating orbs */}
      <div className="orb orb-1 w-96 h-96 bg-purple-500 top-[-100px] left-[-100px]" />
      <div className="orb orb-2 w-80 h-80 bg-blue-400 bottom-[-80px] right-[-80px]" />
      <div className="orb orb-3 w-64 h-64 bg-indigo-300 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* Header */}
      <div className="slide-in-down glass border-b border-white/10 py-4 px-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">📚</div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Library Kiosk</h1>
            <p className="text-xs text-white/60">{greeting.emoji} {greeting.text}!</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-white/60">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 overflow-y-auto">

        {/* Success */}
        {showSuccess ? (
          <div className="scale-in glass-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center text-6xl bounce-check
                ${successData.type === 'in' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                {successData.type === 'in' ? '✓' : '👋'}
              </div>
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20
                ${successData.type === 'in' ? 'bg-green-400' : 'bg-blue-400'}`} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">
              {successData.type === 'in' ? 'Welcome!' : 'Goodbye!'}
            </h2>
            <p className="text-xl font-semibold text-gray-700 mb-1">{successData.name}</p>
            <p className="text-gray-500 mb-2">
              {successData.type === 'in' ? '🕐 Time In:' : '🕐 Time Out:'}{' '}
              <span className="font-bold text-indigo-600">{successData.time}</span>
            </p>
            {successData.type === 'out' && successData.duration !== undefined && (
              <p className="text-sm text-gray-400 mb-4">Duration: {successData.duration} minutes</p>
            )}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
              <span className="text-gray-400 text-sm">New form in {countdown}s...</span>
            </div>
          </div>

        ) : (
          <div className={`glass-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-700
            ${formVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transform: formVisible ? 'translateY(0)' : 'translateY(40px)' }}>

            {/* Card Header */}
            <div className={`p-6 text-white relative overflow-hidden
              ${currentSession ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600'}`}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative flex items-center gap-3">
                <span className="text-3xl">{currentSession ? '🔓' : '🔐'}</span>
                <div>
                  <h2 className="text-2xl font-black">{currentSession ? 'Clock Out' : 'Clock In'}</h2>
                  <p className="text-white/70 text-sm">
                    {currentSession
                      ? `Session started at ${new Date(currentSession.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Fill in your details to enter the library'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {error && (
                <div className="fade-in flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {currentSession && (
                <div className="fade-in flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-3 rounded-xl">
                  <span className="text-xl flex-shrink-0">⏱️</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Active session detected</p>
                    <p className="text-xs text-orange-600">Click Clock Out to end your session</p>
                  </div>
                </div>
              )}

              {/* Student Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  🎓 Student Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={studentNumber}
                  onChange={handleStudentNumberChange}
                  placeholder="e.g. 21100887"
                  className="input-glow w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 font-medium bg-gray-50 focus:bg-white"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  👤 Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input-glow w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 font-medium bg-gray-50 focus:bg-white"
                  disabled={isLoading}
                  maxLength={100}
                />
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  🏫 Education Level <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <OptionTile
                    selected={educationLevel === 'college'}
                    onClick={() => { setEducationLevel('college'); setStrand(''); setProgram(''); setYearLevel(''); }}
                    emoji="🎓" label="College" sublabel="1st to 4th Year"
                    disabled={isLoading}
                  />
                  <OptionTile
                    selected={educationLevel === 'senior-high'}
                    onClick={() => { setEducationLevel('senior-high'); setStrand(''); setProgram(''); setYearLevel(''); }}
                    emoji="📖" label="Senior High" sublabel="Grade 11 or 12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Strand (Senior High) */}
              {educationLevel === 'senior-high' && (
                <div className="scale-in space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    📋 Strand <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {seniorHighStrands.map((s) => (
                      <OptionTile
                        key={s.code}
                        selected={strand === s.code}
                        onClick={() => { setStrand(s.code); setCustomStrand(''); }}
                        emoji={s.emoji} label={s.name} sublabel={s.full}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  {strand === 'OTHER' && (
                    <input
                      type="text"
                      value={customStrand}
                      onChange={(e) => setCustomStrand(e.target.value)}
                      placeholder="Type your strand name..."
                      className="input-glow w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 outline-none transition-all duration-200 bg-indigo-50/50 text-gray-800"
                      disabled={isLoading}
                      maxLength={100}
                      autoFocus
                    />
                  )}
                </div>
              )}

              {/* Program (College) */}
              {educationLevel === 'college' && (
                <div className="scale-in space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    📚 Program/Course <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {collegePrograms.map((p) => (
                      <OptionTile
                        key={p.code}
                        selected={program === p.code}
                        onClick={() => { setProgram(p.code); setCustomProgram(''); }}
                        emoji={p.emoji} label={p.name} sublabel={p.full}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  {program === 'OTHER' && (
                    <input
                      type="text"
                      value={customProgram}
                      onChange={(e) => setCustomProgram(e.target.value)}
                      placeholder="Type your program name..."
                      className="input-glow w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 outline-none transition-all duration-200 bg-indigo-50/50 text-gray-800"
                      disabled={isLoading}
                      maxLength={100}
                      autoFocus
                    />
                  )}
                </div>
              )}

              {/* Year Level */}
              {educationLevel && (
                <div className="scale-in space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    📅 Year Level
                  </label>
                  <div className={`grid gap-2 ${educationLevel === 'college' ? 'grid-cols-4' : 'grid-cols-2'}`}>
                    {(educationLevel === 'college' ? collegeYears : shsYears).map((y) => (
                      <OptionTile
                        key={y.value}
                        selected={yearLevel === y.value}
                        onClick={() => setYearLevel(yearLevel === y.value ? '' : y.value)}
                        emoji={y.emoji} label={y.label}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  🎯 Purpose of Visit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {purposes.map((p) => (
                    <OptionTile
                      key={p.value}
                      selected={purpose === p.value}
                      onClick={() => setPurpose(purpose === p.value ? '' : p.value)}
                      emoji={p.emoji} label={p.value}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                  ${isSubmitDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : currentSession
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                      : 'btn-shimmer text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : currentSession ? '🔓 Clock Out' : '🔐 Clock In'}
              </button>

            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="glass border-t border-white/10 py-3 text-center z-10">
        <p className="text-white/40 text-xs">Library Attendance System © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default KioskScreen;
