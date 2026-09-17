const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { supabase } = require('../database');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('Admin Users Table')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get attendance logs with filters
router.get('/logs', async (req, res) => {
  const { startDate, endDate, program, studentNumber, name, page = 1, limit = 50 } = req.query;

  try {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('Attendance Logs Table')
      .select(`
        id,
        student_number,
        full_name,
        program,
        year_level,
        purpose,
        time_in,
        time_out,
        duration,
        status,
        created_at
      `, { count: 'exact' });

    if (startDate) {
      query = query.gte('time_in', startDate + 'T00:00:00Z');
    }

    if (endDate) {
      query = query.lte('time_in', endDate + 'T23:59:59Z');
    }

    if (program) {
      query = query.eq('program', program);
    }

    if (studentNumber) {
      query = query.ilike('student_number', `%${studentNumber}%`);
    }

    if (name) {
      query = query.ilike('full_name', `%${name}%`);
    }

    const { data: logs, error, count } = await query
      .order('time_in', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Error getting logs:', error);
      return res.status(500).json({ error: 'Failed to get logs' });
    }

    res.json({
      logs,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err) {
    console.error('Error in get logs:', err);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Get attendance stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total visits today
    const { data: todayTotal, error: todayError } = await supabase
      .from('Attendance Logs Table')
      .select('count', { count: 'exact', head: true })
      .gte('time_in', today + 'T00:00:00Z')
      .eq('status', 'closed');

    if (todayError) {
      console.error('Error getting today total:', todayError);
      return res.status(500).json({ error: 'Failed to get stats' });
    }

    // Active sessions
    const { data: activeTotal, error: activeError } = await supabase
      .from('Attendance Logs Table')
      .select('count', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error('Error getting active count:', activeError);
      return res.status(500).json({ error: 'Failed to get stats' });
    }

    // Average duration today
    const { data: avgDuration, error: avgError } = await supabase
      .from('Attendance Logs Table')
      .select('duration')
      .gte('time_in', today + 'T00:00:00Z')
      .eq('status', 'closed')
      .not('duration', 'is', null);

    if (avgError) {
      console.error('Error getting avg duration:', avgError);
      return res.status(500).json({ error: 'Failed to get stats' });
    }

    const avgMinutes = avgDuration.length > 0
      ? Math.round(avgDuration.reduce((sum, d) => sum + d.duration, 0) / avgDuration.length / 60)
      : 0;

    res.json({
      totalVisitsToday: todayTotal?.count || 0,
      activeSessions: activeTotal?.count || 0,
      avgDurationMinutes: avgMinutes
    });
  } catch (err) {
    console.error('Error in get stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Close an active session manually
router.post('/close-session', async (req, res) => {
  const { logId } = req.body;

  try {
    const { data: session, error: sessionError } = await supabase
      .from('Attendance Logs Table')
      .select('*')
      .eq('id', logId)
      .single();

    if (sessionError) {
      console.error('Error finding session:', sessionError);
      return res.status(500).json({ error: 'Failed to find session' });
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is already closed' });
    }

    const currentTime = new Date();
    const duration = Math.round(
      (currentTime - new Date(session.time_in)) / 1000
    );

    const { error: updateError } = await supabase
      .from('Attendance Logs Table')
      .update({
        time_out: currentTime.toISOString(),
        duration,
        status: 'closed'
      })
      .eq('id', logId);

    if (updateError) {
      console.error('Error closing session:', updateError);
      return res.status(500).json({ error: 'Failed to close session' });
    }

    res.json({
      success: true,
      message: 'Session closed successfully',
      duration: Math.round(duration / 60)
    });
  } catch (err) {
    console.error('Error in close-session:', err);
    res.status(500).json({ error: 'Failed to close session' });
  }
});

module.exports = router;
