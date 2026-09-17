const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

// Clock In
router.post('/clock-in', async (req, res) => {
  const { studentNumber, fullName, educationLevel, strand, customStrand, program, customProgram, yearLevel, purpose } = req.body;

  try {
    const currentTime = new Date();
    const { data, error } = await supabase
      .from('Attendance Logs Table')
      .insert([{
        student_number: studentNumber,
        full_name: fullName,
        education_level: educationLevel,
        strand,
        custom_strand: customStrand,
        program,
        custom_program: customProgram,
        year_level: yearLevel,
        purpose,
        time_in: currentTime.toISOString(),
        status: 'active'
      }])
      .select();

    if (error) {
      console.error('Error inserting attendance log:', error);
      return res.status(500).json({ 
        error: 'Failed to clock in', 
        detail: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Time In recorded successfully',
      logId: data[0].id,
      timestamp: currentTime
    });
  } catch (err) {
    console.error('Error in clock-in:', err);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock Out
router.post('/clock-out', async (req, res) => {
  const { studentNumber } = req.body;

  try {
    const currentTime = new Date();

    // Find active session for today
    const { data: activeSession, error: sessionError } = await supabase
      .from('Attendance Logs Table')
      .select('*')
      .eq('student_number', studentNumber)
      .eq('status', 'active')
      .gte('time_in', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
      .order('time_in', { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      console.error('Error finding active session:', sessionError);
      return res.status(500).json({ error: 'Failed to clock out' });
    }

    if (!activeSession) {
      return res.status(400).json({ 
        error: 'No active session found. Please clock in first.' 
      });
    }

    // Calculate duration in seconds
    const duration = Math.round((currentTime - new Date(activeSession.time_in)) / 1000);

    const { error: updateError } = await supabase
      .from('Attendance Logs Table')
      .update({
        time_out: currentTime.toISOString(),
        duration,
        status: 'closed'
      })
      .eq('id', activeSession.id);

    if (updateError) {
      console.error('Error updating attendance log:', updateError);
      return res.status(500).json({ error: 'Failed to clock out' });
    }

    // Calculate duration in minutes
    const durationMinutes = Math.round(duration / 60);

    res.json({
      success: true,
      message: 'Time Out recorded successfully',
      duration: durationMinutes
    });
  } catch (err) {
    console.error('Error in clock-out:', err);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Check if student is currently clocked in
router.get('/status/:studentNumber', async (req, res) => {
  const { studentNumber } = req.params;

  try {
    const { data: session, error } = await supabase
      .from('Attendance Logs Table')
      .select(`
        id,
        student_number,
        full_name,
        education_level,
        strand,
        program,
        year_level,
        purpose,
        time_in,
        duration,
        students (full_name, education_level, strand, program, year_level)
      `)
      .eq('student_number', studentNumber)
      .eq('status', 'active')
      .gte('time_in', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
      .order('time_in', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking session status:', error);
      return res.status(500).json({ error: 'Failed to check status' });
    }

    if (session) {
      res.json({
        isClockedIn: true,
        session: {
          id: session.id,
          studentNumber: session.student_number,
          fullName: session.students?.full_name || session.full_name,
          educationLevel: session.students?.education_level || session.education_level,
          strand: session.students?.strand || session.strand,
          program: session.students?.program || session.program,
          yearLevel: session.students?.year_level || session.year_level,
          purpose: session.purpose,
          timeIn: session.time_in,
          duration: session.duration
        }
      });
    } else {
      res.json({ isClockedIn: false });
    }
  } catch (err) {
    console.error('Error in status check:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Get currently active sessions (for admin dashboard)
router.get('/active-sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('Attendance Logs Table')
      .select(`
        id,
        student_number,
        full_name,
        education_level,
        strand,
        program,
        year_level,
        time_in,
        duration,
        status,
        students (full_name, education_level, strand, program, year_level)
      `)
      .eq('status', 'active')
      .order('time_in', { ascending: false });

    if (error) {
      console.error('Error getting active sessions:', error);
      return res.status(500).json({ error: 'Failed to get active sessions' });
    }

    res.json({ sessions });
  } catch (err) {
    console.error('Error in active-sessions:', err);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

module.exports = router;
