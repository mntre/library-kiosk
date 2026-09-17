const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

// Test Supabase connection
router.get('/test', async (req, res) => {
  try {
    // List all tables
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    res.json({ 
      success: !error, 
      error: error?.message,
      code: error?.code,
      hint: error?.hint,
      data 
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Get student by number
router.get('/:studentNumber', async (req, res) => {
  const { studentNumber } = req.params;

  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_number', studentNumber)
      .maybeSingle();

    if (error) {
      console.error('Error finding student:', error);
      return res.status(500).json({ 
        error: 'Failed to find student',
        detail: error.message,
        hint: error.hint,
        code: error.code
      });
    }

    if (student) {
      res.json({ student });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    console.error('Error in get student:', err);
    res.status(500).json({ error: 'Failed to find student', detail: err.message });
  }
});

// Search students by number or name
router.get('/search/:query', async (req, res) => {
  const { query } = req.params;

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .or(`student_number.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching students:', error);
      return res.status(500).json({ error: 'Failed to search students' });
    }

    res.json({ students });
  } catch (err) {
    console.error('Error in search students:', err);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

// Create new student
router.post('/', async (req, res) => {
  const { studentNumber, fullName, educationLevel, strand, customStrand, program, customProgram, yearLevel } = req.body;

  try {
    // Try upsert instead of insert to avoid duplicate errors
    const { data, error } = await supabase
      .from('students')
      .upsert([{
        student_number: studentNumber,
        full_name: fullName,
        education_level: educationLevel,
        strand,
        custom_strand: customStrand,
        program,
        custom_program: customProgram,
        year_level: yearLevel
      }], { onConflict: 'student_number' })
      .select();

    if (error) {
      console.error('Error creating student:', error);
      return res.status(500).json({ 
        error: 'Failed to create student',
        detail: error.message,
        hint: error.hint,
        code: error.code
      });
    }

    res.json({
      success: true,
      studentId: data[0].id,
      message: 'Student created successfully'
    });
  } catch (err) {
    console.error('Error in create student:', err);
    res.status(500).json({ error: 'Failed to create student', detail: err.message });
  }
});

module.exports = router;
