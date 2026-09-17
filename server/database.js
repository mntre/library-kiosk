const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function initDB() {
  console.log('Connected to Supabase');
  console.log(`Project: ${supabaseUrl}`);
  console.log('Database initialized successfully');
}

async function seedDatabase() {
  try {
    // Seed programs if empty
    const { count: programsCount, error: programsError } = await supabase
      .from('Programs Table')
      .select('*', { count: 'exact', head: true });

    if (!programsError && (!programsCount || programsCount === 0)) {
      const programs = [
        { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
        { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
        { code: 'BSBA', name: 'Bachelor of Science in Business Administration' },
        { code: 'BSED', name: 'Bachelor of Secondary Education' },
        { code: 'BSN', name: 'Bachelor of Science in Nursing' },
        { code: 'BSECE', name: 'Bachelor of Science in Electronics Engineering' },
        { code: 'BSME', name: 'Bachelor of Science in Mechanical Engineering' },
        { code: 'BSArch', name: 'Bachelor of Science in Architecture' },
      ];

      const { error: programsInsertError } = await supabase
        .from('Programs Table')
        .upsert(programs, { onConflict: 'code' });

      if (!programsInsertError) {
        console.log('Seeded programs');
      }
    }

    // Seed sample students if empty
    const { count: studentsCount, error: studentsError } = await supabase
      .from('Students Table')
      .select('*', { count: 'exact', head: true });

    if (!studentsError && (!studentsCount || studentsCount === 0)) {
      const students = [
        { student_number: '2024-001', full_name: 'Juan Dela Cruz', education_level: 'college', program: 'BSIT', year_level: '2nd' },
        { student_number: '2024-002', full_name: 'Maria Santos', education_level: 'senior-high', strand: 'STEM', year_level: '1st' },
        { student_number: '2024-003', full_name: 'Jose Reyes', education_level: 'senior-high', strand: 'ABM', year_level: '3rd' },
        { student_number: '2024-004', full_name: 'Ana Garcia', education_level: 'college', program: 'BSED', year_level: '4th' },
        { student_number: '2024-005', full_name: 'Luis Martinez', education_level: 'senior-high', strand: 'HUMMS', year_level: '2nd' },
      ];

      const { error: studentsInsertError } = await supabase
        .from('Students Table')
        .upsert(students, { onConflict: 'student_number' });

      if (!studentsInsertError) {
        console.log('Seeded sample students');
      }
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

module.exports = { supabase, initDB, seedDatabase };
