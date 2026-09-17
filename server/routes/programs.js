const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

// Get all programs
router.get('/', async (req, res) => {
  try {
    const { data: programs, error } = await supabase
      .from('Programs Table')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error getting programs:', error);
      return res.status(500).json({ error: 'Failed to get programs' });
    }

    res.json({ programs });
  } catch (err) {
    console.error('Error in get programs:', err);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

// Create new program
router.post('/', async (req, res) => {
  const { code, name } = req.body;

  try {
    const { data, error } = await supabase
      .from('Programs Table')
      .insert([{
        code,
        name
      }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Program code already exists' });
      }
      console.error('Error creating program:', error);
      return res.status(500).json({ error: 'Failed to create program' });
    }

    res.json({
      success: true,
      programId: data[0].id,
      message: 'Program created successfully'
    });
  } catch (err) {
    console.error('Error in create program:', err);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update program
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name } = req.body;

  try {
    const { data, error } = await supabase
      .from('Programs Table')
      .update({ code, name })
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Program code already exists' });
      }
      console.error('Error updating program:', error);
      return res.status(500).json({ error: 'Failed to update program' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ success: true, message: 'Program updated successfully' });
  } catch (err) {
    console.error('Error in update program:', err);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete program
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('Programs Table')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting program:', error);
      return res.status(500).json({ error: 'Failed to delete program' });
    }

    res.json({ success: true, message: 'Program deleted successfully' });
  } catch (err) {
    console.error('Error in delete program:', err);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

module.exports = router;
