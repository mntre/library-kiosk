-- Seed programs
INSERT INTO programs (code, name) VALUES
    ('BSIT', 'Bachelor of Science in Information Technology'),
    ('BSCS', 'Bachelor of Science in Computer Science'),
    ('BSBA', 'Bachelor of Science in Business Administration'),
    ('BSED', 'Bachelor of Secondary Education'),
    ('BSN', 'Bachelor of Science in Nursing'),
    ('BSECE', 'Bachelor of Science in Electronics Engineering'),
    ('BSME', 'Bachelor of Science in Mechanical Engineering'),
    ('BSArch', 'Bachelor of Science in Architecture')
ON CONFLICT (code) DO NOTHING;

-- Seed sample students
INSERT INTO students (student_number, full_name, education_level, program, strand, year_level) VALUES
    ('2024-001', 'Juan Dela Cruz',  'college',     'BSIT', NULL,   '2nd'),
    ('2024-002', 'Maria Santos',    'senior-high',  NULL,  'STEM', '1st'),
    ('2024-003', 'Jose Reyes',      'senior-high',  NULL,  'ABM',  '3rd'),
    ('2024-004', 'Ana Garcia',      'college',     'BSED', NULL,   '4th'),
    ('2024-005', 'Luis Martinez',   'senior-high',  NULL,  'HUMMS','2nd')
ON CONFLICT (student_number) DO NOTHING;
