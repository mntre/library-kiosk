const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

// Get student by number
router.get('/:studentNumber', async (req, res) => {
  const { studentNumber } = req.params;

  try {
    const { data: student, error } = await supabase
      .from('Students Table')
      .select('*')
      .eq('student_number', studentNumber)
      .single();

    if (error) {
      console.error('Error finding student:', error);
      return res.status(500).json({ error: 'Failed to find student' });
    }

    if (student) {
      res.json({ student });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    console.error('Error in get student:', err);
    res.status(500).json({ error: 'Failed to find student' });
  }
});

// Search students by number or name
router.get('/search/:query', async (req, res) => {
  const { query } = req.params;

  try {
    const { data: students, error } = await supabase
      .from('Students Table')
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
    const { data, error } = await supabase
      .from('Students Table')
      .insert([{
        student_number: studentNumber,
        full_name: fullName,
        education_level: educationLevel,
        strand,
        custom_strand: customStrand,
        program,
        custom_program: customProgram,
        year_level: yearLevel
      }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Student number already exists' });
      }
      console.error('Error creating student:', error);
      return res.status(500).json({ error: 'Failed to create student' });
    }

    res.json({
      success: true,
      studentId: data[0].id,
      message: 'Student created successfully'
    });
  } catch (err) {
    console.error('Error in create student:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

module.exports = router;
