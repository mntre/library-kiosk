import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const KioskScreen = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [educationLevel, setEducationLevel] = useState(''); // 'college' or 'senior-high'
  const [strand, setStrand] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [programs, setPrograms] = useState([]);
  const [seniorHighStrands, setSeniorHighStrands] = useState([
    { code: 'STEM', name: 'Science, Technology, Engineering and Mathematics' },
    { code: 'HUMMS', name: 'Humanities and Social Sciences' },
    { code: 'ABM', name: 'Accountancy, Business and Management' },
    { code: 'GAS', name: 'General Academic Strand' },
    { code: 'OTHER', name: 'Other' }
  ]);
  const [customStrand, setCustomStrand] = useState('');
  const [collegePrograms, setCollegePrograms] = useState([
    { code: 'BSA', name: 'Bachelor of Science in Accountancy' },
    { code: 'BSBA-MM', name: 'Bachelor of Science in Business Administration Major in Marketing Management' },
    { code: 'BSBA-HRM', name: 'Bachelor of Science in Business Administration Major in Human Resource Development Management' },
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
  ]);
  const [customProgram, setCustomProgram] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load programs on mount
  useEffect(() => {
    loadPrograms();
    
    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check for existing session
    if (studentNumber) {
      checkSession();
    }

    return () => {
      clearInterval(clockInterval);
    };
  }, [studentNumber]);

  // Auto-reset after successful submission
  useEffect(() => {
    if (showSuccess) {
      const resetTimeout = setTimeout(() => {
        resetForm();
      }, 4000);

      return () => clearTimeout(resetTimeout);
    }
  }, [showSuccess]);

  const loadPrograms = async () => {
    try {
      const response = await axios.get('/api/programs');
      setPrograms(response.data.programs || []);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const checkSession = async () => {
    if (!studentNumber) return;

    try {
      const response = await axios.get(`/api/attendance/status/${studentNumber}`);
      setCurrentSession(response.data.isClockedIn ? response.data.session : null);
      setError('');
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handleStudentNumberChange = async (e) => {
    const value = e.target.value;
    setStudentNumber(value);
    setError('');

    // Auto-fill if student exists
    if (value.length >= 4) {
      try {
        const response = await axios.get(`/api/students/${value}`);
        if (response.data.student) {
          setFullName(response.data.student.full_name);
          setEducationLevel(response.data.student.education_level || '');
          setStrand(response.data.student.strand || '');
          setProgram(response.data.student.program || '');
          setYearLevel(response.data.student.year_level || '');
        }
      } catch (error) {
        // Student not found, that's okay
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!studentNumber.trim()) {
      setError('Please enter a student number');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!educationLevel) {
      setError('Please select your education level');
      return;
    }

    if (educationLevel === 'senior-high' && !strand) {
      setError('Please select your strand');
      return;
    }

    if (educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim()) {
      setError('Please enter your strand name');
      return;
    }

    if (educationLevel === 'college' && !program) {
      setError('Please select your program');
      return;
    }

    if (educationLevel === 'college' && program === 'OTHER' && !customProgram.trim()) {
      setError('Please enter your program name');
      return;
    }

    setIsLoading(true);

    try {
      // Check if student exists in database
      let studentId = null;
      try {
        const studentResponse = await axios.get(`/api/students/${studentNumber}`);
        studentId = studentResponse.data.student.id;
      } catch (error) {
        // Student doesn't exist, create one
        if (error.response?.status === 404) {
          const submittedProgram = educationLevel === 'college' 
            ? (program === 'OTHER' ? customProgram : program)
            : (program || '');
          const submittedStrand = educationLevel === 'senior-high'
            ? (strand === 'OTHER' ? customStrand : strand)
            : (strand || '');
            
          const createResponse = await axios.post('/api/students', {
            studentNumber,
            fullName,
            educationLevel,
            strand: submittedStrand,
            program: submittedProgram,
            yearLevel
          });
          studentId = createResponse.data.studentId;
        }
      }

      if (currentSession) {
        // Clock Out
        await axios.post('/api/attendance/clock-out', { studentNumber });
        setSuccessMessage(`Time Out recorded! Duration: ${currentSession.duration || 0} minutes`);
      } else {
        // Clock In
        const submittedProgram = educationLevel === 'college' 
          ? (program === 'OTHER' ? customProgram : program)
          : (program || '');
        const submittedStrand = educationLevel === 'senior-high'
          ? (strand === 'OTHER' ? customStrand : strand)
          : (strand || '');
          
        await axios.post('/api/attendance/clock-in', {
          studentNumber,
          fullName,
          educationLevel,
          strand: submittedStrand,
          program: submittedProgram,
          yearLevel,
          purpose
        });
        setSuccessMessage(`Welcome, ${fullName}! Time In: ${new Date().toLocaleTimeString()}`);
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting:', error);
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStudentNumber('');
    setFullName('');
    setEducationLevel('');
    setStrand('');
    setCustomStrand('');
    setProgram('');
    setCustomProgram('');
    setYearLevel('');
    setPurpose('');
    setCurrentSession(null);
    setShowSuccess(false);
    setError('');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Library Kiosk</h1>
          <p className="text-sm text-gray-600">{getGreeting()}, student!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-indigo-900">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-gray-600">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Success Screen */}
          {showSuccess ? (
            <div className="bg-green-50 p-12 text-center">
              <div className="text-8xl mb-4">✓</div>
              <h2 className="text-3xl font-bold text-green-700 mb-2">Success!</h2>
              <p className="text-xl text-gray-800 mb-6">{successMessage}</p>
              <div className="animate-pulse text-gray-500">
                New form loading...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {currentSession ? 'Clock Out' : 'Clock In'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {currentSession 
                    ? 'You have an active session. Click below to clock out.'
                    : 'Please fill in your details to clock in.'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* Student Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Number *
                  </label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={handleStudentNumberChange}
                    placeholder="Enter your student number"
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    disabled={isLoading}
                    maxLength={100}
                  />
                </div>

                {/* Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Level *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEducationLevel('college');
                        setStrand('');
                      }}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition-all
                        ${educationLevel === 'college'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      College
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEducationLevel('senior-high');
                        setProgram('');
                      }}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition-all
                        ${educationLevel === 'senior-high'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      Senior High
                    </button>
                  </div>
                </div>

                {/* Strand (Senior High) */}
                {educationLevel === 'senior-high' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strand *
                    </label>
                    <select
                      value={strand}
                      onChange={(e) => setStrand(e.target.value)}
                      className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      disabled={isLoading}
                    >
                      <option value="">Select your strand</option>
                      {seniorHighStrands.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                    {strand === 'OTHER' && (
                      <div>
                        <input
                          type="text"
                          value={customStrand}
                          onChange={(e) => setCustomStrand(e.target.value)}
                          placeholder="Enter your strand"
                          className="w-full mt-3 px-4 py-3 text-lg rounded-lg border-2 border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          disabled={isLoading}
                          maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Please enter the specific strand name
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Program (College) */}
                {educationLevel === 'college' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program/Course *
                    </label>
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none bg-white"
                      disabled={isLoading}
                    >
                      <option value="">Select your program</option>
                      {collegePrograms.map((prog) => (
                        <option key={prog.code} value={prog.code}>
                          {prog.code} - {prog.name}
                        </option>
                      ))}
                    </select>
                    {program === 'OTHER' && (
                      <div>
                        <input
                          type="text"
                          value={customProgram}
                          onChange={(e) => setCustomProgram(e.target.value)}
                          placeholder="Enter your program"
                          className="w-full mt-3 px-4 py-3 text-lg rounded-lg border-2 border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          disabled={isLoading}
                          maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Please enter the specific program name
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Year Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Level
                  </label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    disabled={isLoading}
                  >
                    <option value="">Select year level</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                    <option value="5th">5th Year</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose of Visit
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    disabled={isLoading}
                  >
                    <option value="">Select purpose</option>
                    <option value="Research">Research</option>
                    <option value="Study">Study</option>
                    <option value="Print/Photocopy">Print/Photocopy</option>
                    <option value="Borrow Book">Borrow Book</option>
                    <option value="Computer Use">Computer Use</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !studentNumber.trim() || !fullName.trim() || !educationLevel || (educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim()) || (educationLevel === 'college' && program === 'OTHER' && !customProgram.trim())}
                className={`w-full mt-8 py-4 px-6 text-xl font-bold rounded-lg transition-all duration-200
                  ${isLoading || !studentNumber.trim() || !fullName.trim() || !educationLevel || (educationLevel === 'senior-high' && strand === 'OTHER' && !customStrand.trim()) || (educationLevel === 'college' && program === 'OTHER' && !customProgram.trim())
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : currentSession ? (
                  'Clock Out'
                ) : (
                  'Clock In'
                )}
              </button>

              {/* Active Session Info */}
              {currentSession && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <p className="text-amber-800 font-medium">
                    You have an active session from {new Date(currentSession.timeIn).toLocaleTimeString()}
                  </p>
                  <p className="text-amber-600 text-sm mt-1">
                    Click "Clock Out" to end your session.
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-indigo-900 text-white py-4 text-center">
        <p className="text-sm opacity-75">
          Library Clock In/Out System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default KioskScreen;
