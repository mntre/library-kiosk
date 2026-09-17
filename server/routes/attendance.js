const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

// Clock In
router.post('/clock-in', async (req, res) => {
  const {
    studentNumber, lastName, firstName, middleName,
    educationLevel, strand, customStrand,
    program, customProgram, yearLevel, purpose
  } = req.body;

  try {
    const currentTime = new Date();
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([{
        student_number:  studentNumber,
        last_name:       lastName       || null,
        first_name:      firstName      || null,
        middle_name:     middleName     || null,
        full_name:       [firstName, middleName, lastName].filter(Boolean).join(' ') || null,
        education_level: educationLevel || null,
        strand:          strand         || null,
        custom_strand:   customStrand   || null,
        program:         program        || null,
        custom_program:  customProgram  || null,
        year_level:      yearLevel      || null,
        purpose:         purpose        || null,
        time_in:         currentTime.toISOString(),
        status:          'active'
      }])
      .select();

    if (error) {
      console.error('Error inserting attendance log:', JSON.stringify(error));
      return res.status(500).json({
        error: error.message,
        detail: error.details,
        hint: error.hint,
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
    res.status(500).json({ error: err.message });
  }
});

// Clock Out
router.post('/clock-out', async (req, res) => {
  const { studentNumber } = req.body;

  try {
    const currentTime = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: activeSession, error: sessionError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('student_number', studentNumber)
      .eq('status', 'active')
      .gte('time_in', todayStart.toISOString())
      .order('time_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Error finding active session:', sessionError);
      return res.status(500).json({ error: sessionError.message });
    }

    if (!activeSession) {
      return res.status(400).json({ error: 'No active session found. Please clock in first.' });
    }

    const duration = Math.round((currentTime - new Date(activeSession.time_in)) / 1000);

    const { error: updateError } = await supabase
      .from('attendance_logs')
      .update({ time_out: currentTime.toISOString(), duration, status: 'closed' })
      .eq('id', activeSession.id);

    if (updateError) {
      console.error('Error updating attendance log:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({
      success: true,
      message: 'Time Out recorded successfully',
      duration: Math.round(duration / 60)
    });
  } catch (err) {
    console.error('Error in clock-out:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check if student is currently clocked in
router.get('/status/:studentNumber', async (req, res) => {
  const { studentNumber } = req.params;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: session, error } = await supabase
      .from('attendance_logs')
      .select('id, student_number, last_name, first_name, middle_name, program, year_level, purpose, time_in, duration, status')
      .eq('student_number', studentNumber)
      .eq('status', 'active')
      .gte('time_in', todayStart.toISOString())
      .order('time_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking session status:', error);
      return res.status(500).json({ error: error.message, code: error.code });
    }

    if (session) {
      res.json({
        isClockedIn: true,
        session: {
          id:            session.id,
          studentNumber: session.student_number,
          lastName:      session.last_name,
          firstName:     session.first_name,
          middleName:    session.middle_name,
          program:       session.program,
          yearLevel:     session.year_level,
          purpose:       session.purpose,
          timeIn:        session.time_in,
          duration:      session.duration
        }
      });
    } else {
      res.json({ isClockedIn: false });
    }
  } catch (err) {
    console.error('Error in status check:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get currently active sessions (for admin dashboard)
router.get('/active-sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('status', 'active')
      .order('time_in', { ascending: false });

    if (error) {
      console.error('Error getting active sessions:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ sessions });
  } catch (err) {
    console.error('Error in active-sessions:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
