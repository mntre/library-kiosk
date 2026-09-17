import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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

  const studentLookupTimer = useRef(null);
  const sessionCheckTimer = useRef(null);

  const seniorHighStrands = [
    { code: 'STEM', name: 'Science, Technology, Engineering and Mathematics' },
    { code: 'HUMMS', name: 'Humanities and Social Sciences' },
    { code: 'ABM', name: 'Accountancy, Business and Management' },
    { code: 'GAS', name: 'General Academic Strand' },
    { code: 'OTHER', name: 'Other' }
  ];

  const collegePrograms = [
    { code: 'BSA', name: 'Bachelor of Science in Accountancy' },
    { code: 'BSBA-MM', name: 'BS Business Administration - Marketing Management' },
    { code: 'BSBA-HRM', name: 'BS Business Administration - Human Resource Management' },
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
    { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
    { code: 'BSIE', name: 'Bachelor of Science in Industrial Engineering' },
    { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
    { code: 'BSPSY', name: 'Bachelor of Science in Psychology' },
    { code: 'BSHM', name: 'Bachelor of Science in Hospitality Management' },
    { code: 'BSTM', name: 'Bachelor of Science in Tourism Management' },
    { code: 'BEEd', name: 'Bachelor of Elementary Education' },
    { code: 'BSEd', name: 'Bachelor of Secondary Education' },
    { code: 'OTHER', name: 'Other' }
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
        if (count <= 0) {
          clearInterval(interval);
          resetForm();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showSuccess]);

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
    if (studentLookupTimer.current) clearTimeout(studentLookupTimer.current);
    if (value.length >= 6) {
      studentLookupTimer.current = setTimeout(async () => {
        checkSession(value);
        try {
          const response = await axios.get(`/api/students/${value}`);
          if (response.data.student) {
            const s = response.data.student;
            setFullName(s.full_name);
            setEducationLevel(s.education_level || '');
            setStrand(s.strand || '');
            setProgram(s.program || '');
            setYearLevel(s.year_level || '');
          }
        } catch { /* not found, that's ok */ }
      }, 600);
    } else {
      setCurrentSession(null);
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
          program: submittedProgram, customProgram,
          yearLevel, purpose
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
    setStudentNumber(''); setFullName(''); setEducationLevel('');
    setStrand(''); setCustomStrand(''); setProgram('');
    setCustomProgram(''); setYearLevel(''); setPurpose('');
    setCurrentSession(null); setShowSuccess(false); setError('');
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

      {/* Floating background orbs */}
      <div className="orb orb-1 w-96 h-96 bg-purple-500 top-[-100px] left-[-100px]" />
      <div className="orb orb-2 w-80 h-80 bg-blue-400 bottom-[-80px] right-[-80px]" />
      <div className="orb orb-3 w-64 h-64 bg-indigo-300 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* Header */}
      <div className="slide-in-down glass border-b border-white/10 py-4 px-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          {/* Book icon */}
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
            📚
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Library Kiosk</h1>
            <p className="text-xs text-white/60">{greeting.emoji} {greeting.text}!</p>
          </div>
        </div>

        {/* Live clock */}
        <div className="text-right">
          <div className="text-3xl font-black text-white tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-white/60">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 z-10">

        {/* Success Screen */}
        {showSuccess ? (
          <div className="scale-in glass-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
            {/* Animated checkmark */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center text-6xl bounce-check
                ${successData.type === 'in' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                {successData.type === 'in' ? '✓' : '👋'}
              </div>
              {/* Pulse rings */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20
                ${successData.type === 'in' ? 'bg-green-400' : 'bg-blue-400'}`} />
            </div>

            <h2 className="text-3xl font-black text-gray-800 mb-2">
              {successData.type === 'in' ? 'Welcome!' : 'Goodbye!'}
            </h2>
            <p className="text-xl font-semibold text-gray-700 mb-1">{successData.name}</p>
            <p className="text-gray-500 mb-2">
              {successData.type === 'in' ? '🕐 Time In:' : '🕐 Time Out:'} <span className="font-bold text-indigo-600">{successData.time}</span>
            </p>
            {successData.type === 'out' && successData.duration !== undefined && (
              <p className="text-sm text-gray-400 mb-4">Duration: {successData.duration} minutes</p>
            )}

            {/* Countdown ring */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
              <span className="text-gray-400 text-sm">New form in {countdown}s...</span>
            </div>
          </div>

        ) : (
          <div className={`glass-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-700
            ${formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transform: formVisible ? 'translateY(0)' : 'translateY(40px)' }}>

            {/* Card Header */}
            <div className={`p-6 text-white relative overflow-hidden
              ${currentSession
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600'}`}>
              {/* Animated dots background */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{currentSession ? '🔓' : '🔐'}</span>
                  <h2 className="text-2xl font-black">
                    {currentSession ? 'Clock Out' : 'Clock In'}
                  </h2>
                </div>
                <p className="text-white/70 text-sm">
                  {currentSession
                    ? `You clocked in at ${new Date(currentSession.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Fill in your details to enter the library'}
                </p>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Error */}
              {error && (
                <div className="fade-in flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <span className="text-lg">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Active session banner */}
              {currentSession && (
                <div className="fade-in flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-3 rounded-xl">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Active session detected</p>
                    <p className="text-xs text-orange-600">Click Clock Out to end your session</p>
                  </div>
                </div>
              )}

              {/* Student Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <span>🎓</span> Student Number <span className="text-red-400">*</span>
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
                  <span>👤</span> Full Name <span className="text-red-400">*</span>
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
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <span>🏫</span> Education Level <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['college', 'senior-high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => { setEducationLevel(level); setStrand(''); setProgram(''); setYearLevel(''); }}
                      className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200
                        ${educationLevel === level
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100 scale-[1.02]'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                    >
                      {level === 'college' ? '🎓 College' : '📖 Senior High'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strand (Senior High) */}
              {educationLevel === 'senior-high' && (
                <div className="scale-in space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>📋</span> Strand <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={strand}
                    onChange={(e) => setStrand(e.target.value)}
                    className="input-glow w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  >
                    <option value="">Select your strand</option>
                    {seniorHighStrands.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                  {strand === 'OTHER' && (
                    <input
                      type="text"
                      value={customStrand}
                      onChange={(e) => setCustomStrand(e.target.value)}
                      placeholder="Enter your strand name"
                      className="input-glow w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 outline-none transition-all duration-200 bg-indigo-50/50 text-gray-800 mt-2"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  )}
                </div>
              )}

              {/* Program (College) */}
              {educationLevel === 'college' && (
                <div className="scale-in space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>📚</span> Program/Course <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="input-glow w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  >
                    <option value="">Select your program</option>
                    {collegePrograms.map((p) => (
                      <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                  {program === 'OTHER' && (
                    <input
                      type="text"
                      value={customProgram}
                      onChange={(e) => setCustomProgram(e.target.value)}
                      placeholder="Enter your program name"
                      className="input-glow w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 outline-none transition-all duration-200 bg-indigo-50/50 text-gray-800 mt-2"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  )}
                </div>
              )}

              {/* Year Level */}
              {educationLevel && (
                <div className="scale-in space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>📅</span> Year Level
                  </label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="input-glow w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  >
                    <option value="">Select year level</option>
                    {educationLevel === 'college' ? (
                      <>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </>
                    ) : (
                      <>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <span>🎯</span> Purpose of Visit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Research', emoji: '🔬' },
                    { value: 'Study', emoji: '📖' },
                    { value: 'Print/Photocopy', emoji: '🖨️' },
                    { value: 'Borrow Book', emoji: '📕' },
                    { value: 'Computer Use', emoji: '💻' },
                    { value: 'Other', emoji: '📌' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPurpose(purpose === p.value ? '' : p.value)}
                      className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1
                        ${purpose === p.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-[1.05] shadow-md shadow-indigo-100'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      disabled={isLoading}
                    >
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-center leading-tight">{p.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden
                  ${isSubmitDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : currentSession
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-200 hover:-translate-y-0.5 active:translate-y-0'
                      : 'btn-shimmer text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0'
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
                ) : currentSession ? (
                  <span className="flex items-center justify-center gap-2">🔓 Clock Out</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">🔐 Clock In</span>
                )}
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
