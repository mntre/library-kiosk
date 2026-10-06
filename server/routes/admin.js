const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../database');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // BUG-011: use maybeSingle() so missing user returns null (not a PGRST116 error)
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

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

    // BUG-004: issue a signed JWT so the frontend can authenticate subsequent requests
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
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

    // BUG-007: added education_level and strand to SELECT
    let query = supabase
      .from('attendance_logs')
      .select(`
        id,
        student_number,
        last_name,
        first_name,
        middle_name,
        education_level,
        strand,
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
      query = query.or(`last_name.ilike.%${name}%,first_name.ilike.%${name}%`);
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
    // BUG-009: use local midnight (consistent with attendance.js) instead of hardcoded UTC
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Total visits today
    const { data: todayTotal, error: todayError } = await supabase
      .from('attendance_logs')
      .select('count', { count: 'exact', head: true })
      .gte('time_in', todayStart.toISOString())
      .eq('status', 'closed');

    if (todayError) {
      console.error('Error getting today total:', todayError);
      return res.status(500).json({ error: 'Failed to get stats' });
    }

    // Active sessions
    const { data: activeTotal, error: activeError } = await supabase
      .from('attendance_logs')
      .select('count', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error('Error getting active count:', activeError);
      return res.status(500).json({ error: 'Failed to get stats' });
    }

    // Average duration today
    const { data: avgDuration, error: avgError } = await supabase
      .from('attendance_logs')
      .select('duration')
      .gte('time_in', todayStart.toISOString())
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
    // BUG-011 (same pattern): use maybeSingle() so missing session returns null cleanly
    const { data: session, error: sessionError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('id', logId)
      .maybeSingle();

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
      .from('attendance_logs')
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
