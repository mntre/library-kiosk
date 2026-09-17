-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    education_level TEXT CHECK (education_level IN ('college', 'senior-high')),
    strand TEXT,
    custom_strand TEXT,
    program TEXT,
    custom_program TEXT,
    year_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    student_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    education_level TEXT,
    strand TEXT,
    custom_strand TEXT,
    program TEXT,
    custom_program TEXT,
    year_level TEXT,
    purpose TEXT,
    time_in TIMESTAMP WITH TIME ZONE NOT NULL,
    time_out TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student_number ON attendance_logs(student_number);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_time_in ON attendance_logs(time_in);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_status ON attendance_logs(status);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);
