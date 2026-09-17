const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

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

// Search students
router.get('/search/:query', async (req, res) => {
  const { query } = req.params;

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .or(`student_number.ilike.%${query}%,last_name.ilike.%${query}%,first_name.ilike.%${query}%`)
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

// Create / update student
router.post('/', async (req, res) => {
  const {
    studentNumber, lastName, firstName, middleName,
    educationLevel, strand, customStrand,
    program, customProgram, yearLevel
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('students')
      .upsert([{
        student_number: studentNumber,
        last_name:      lastName      || null,
        first_name:     firstName     || null,
        middle_name:    middleName    || null,
        education_level: educationLevel || null,
        strand:         strand        || null,
        custom_strand:  customStrand  || null,
        program:        program       || null,
        custom_program: customProgram || null,
        year_level:     yearLevel     || null
      }], { onConflict: 'student_number' })
      .select();

    if (error) {
      console.error('Error creating student:', error);
      return res.status(500).json({
        error: 'Failed to create student',
        detail: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      studentId: data[0].id,
      message: 'Student saved successfully'
    });
  } catch (err) {
    console.error('Error in create student:', err);
    res.status(500).json({ error: 'Failed to create student', detail: err.message });
  }
});

module.exports = router;
