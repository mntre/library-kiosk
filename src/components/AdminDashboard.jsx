import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalVisitsToday: 0,
    activeSessions: 0,
    avgDurationMinutes: 0
  });

  // Active sessions
  const [activeSessions, setActiveSessions] = useState([]);

  // Attendance logs
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit, setLogsLimit] = useState(50);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStudentNumber, setFilterStudentNumber] = useState('');
  const [filterName, setFilterName] = useState('');
  const [programs, setPrograms] = useState([]);

  // Edit session modal
  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('adminUser');
    if (!storedUser) {
      navigateToLogin();
      return;
    }
    setAdminUser(JSON.parse(storedUser));
    loadData();
  }, [activeTab, logsPage, logsLimit]);

  const navigateToLogin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load programs for filters
      const programsResponse = await axios.get('/api/programs');
      setPrograms(programsResponse.data.programs || []);

      // Load stats if on overview tab
      if (activeTab === 'overview') {
        const statsResponse = await axios.get('/api/admin/stats');
        setStats(statsResponse.data);
      }

      // Load active sessions if on live view tab
      if (activeTab === 'live') {
        const sessionsResponse = await axios.get('/api/attendance/active-sessions');
        setActiveSessions(sessionsResponse.data.sessions || []);
      }

      // Load logs if on logs tab
      if (activeTab === 'logs') {
        loadLogs();
      }

    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        navigateToLogin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: logsPage,
        limit: logsLimit
      });

      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterProgram) params.append('program', filterProgram);
      if (filterStudentNumber) params.append('studentNumber', filterStudentNumber);
      if (filterName) params.append('name', filterName);

      const response = await axios.get(`/api/admin/logs?${params.toString()}`);
      setLogs(response.data.logs);
      setLogsTotal(response.data.total);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const closeSession = async (logId) => {
    if (!confirm('Are you sure you want to close this session?')) return;

    try {
      await axios.post('/api/admin/close-session', { logId });
      loadData();
    } catch (error) {
      console.error('Error closing session:', error);
      alert(error.response?.data?.error || 'Failed to close session');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Student Number', 'Full Name', 'Program', 'Year Level', 'Purpose', 'Time In', 'Time Out', 'Duration (min)', 'Status'];
    
    const rows = logs.map(log => [
      log.id,
      log.student_number,
      log.full_name,
      log.program || '',
      log.year_level || '',
      log.purpose || '',
      log.time_in,
      log.time_out || '',
      log.duration || '',
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `library_attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const totalPages = Math.ceil(logsTotal / logsLimit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Library Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-indigo-200">Logged in as: <strong>{adminUser?.username}</strong></span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 bg-white rounded-lg p-2 shadow-sm">
          {['overview', 'live', 'logs', 'programs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors
                ${activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
              <div className="text-4xl font-bold mb-2">{stats.totalVisitsToday}</div>
              <div className="text-blue-100">Total Visits Today</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-lg">
              <div className="text-4xl font-bold mb-2">{stats.activeSessions}</div>
              <div className="text-green-100">Currently in Library</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
              <div className="text-4xl font-bold mb-2">{stats.avgDurationMinutes}</div>
              <div className="text-purple-100">Avg. Visit Duration (min)</div>
            </div>
          </div>
        )}

        {/* Live Tab */}
        {activeTab === 'live' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Currently in the Library</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {activeSessions.length} active session{activeSessions.length !== 1 && 's'}
              </span>
            </div>
            {activeSessions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-6xl mb-4">_empty</div>
                <p>No one is currently in the library</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Time In</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Student Number</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Program</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Duration</th>
                      <th className="px-6 py-4 text-right font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeSessions.map(session => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(session.time_in).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {session.student_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {session.full_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {session.program || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDuration(
                            Math.round((new Date() - new Date(session.time_in)) / 1000)
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => closeSession(session.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500"
                  >
                    <option value="">All Programs</option>
                    {programs.map(prog => (
                      <option key={prog.id} value={prog.code}>{prog.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Student # or Name"
                    value={filterStudentNumber || filterName}
                    onChange={(e) => {
                      setFilterStudentNumber(e.target.value);
                      setFilterName(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={loadLogs}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Apply Filters
                </button>
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Export to CSV
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Time In</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Time Out</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Student</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Program</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Duration</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(log.time_in).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.time_out ? new Date(log.time_out).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{log.full_name}</div>
                          <div className="text-xs text-gray-500">{log.student_number}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.program || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDuration(log.duration)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${log.status === 'active'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsTotal > 0 && (
              <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {(logsPage - 1) * logsLimit + 1} - {Math.min(logsPage * logsLimit, logsTotal)} of {logsTotal} entries
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLogsPage(Math.max(1, logsPage - 1))}
                    disabled={logsPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {logsPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setLogsPage(Math.min(totalPages, logsPage + 1))}
                    disabled={logsPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Programs</h2>
              <button
                onClick={() => setEditingSession({ isNew: true })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                + Add Program
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Code</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {programs.map(prog => (
                    <tr key={prog.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{prog.code}</td>
                      <td className="px-6 py-4 text-gray-700">{prog.name}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingSession(prog)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this program?')) {
                              // TODO: Delete program
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Logout?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out of the admin dashboard?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={navigateToLogin}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Program Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingSession.isNew ? 'Add Program' : 'Edit Program'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: Save program
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  defaultValue={editingSession.code}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={editingSession.name}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
