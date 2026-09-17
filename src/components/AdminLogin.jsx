import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/admin/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        navigate('/admin');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg relative overflow-hidden flex items-center justify-center p-4">
      {/* Floating orbs */}
      <div className="orb orb-1 w-80 h-80 bg-purple-500 top-[-80px] right-[-80px]" />
      <div className="orb orb-2 w-72 h-72 bg-blue-400 bottom-[-60px] left-[-60px]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className={`w-full max-w-md transition-all duration-700 z-10
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Logo area */}
        <div className="text-center mb-8 slide-in-down">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4 shadow-2xl">
            📚
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Library Admin</h1>
          <p className="text-white/50 text-sm mt-1">Attendance Management System</p>
        </div>

        {/* Card */}
        <div className="glass-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-0.5">
            <div className="bg-white rounded-3xl p-8">

              {error && (
                <div className="fade-in flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>👤</span> Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="input-glow w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 font-medium bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>🔑</span> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="input-glow w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 font-medium bg-gray-50 focus:bg-white"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                    ${isLoading || !username.trim() || !password.trim()
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'btn-shimmer text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : '🔐 Sign In to Admin'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors flex items-center gap-1 mx-auto"
                >
                  ← Back to Kiosk
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Library Attendance System © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
