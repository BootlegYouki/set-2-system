-- Database schema for the school management system
-- Subjects table for storing curriculum subjects
-- Updated: Removed status column as subjects are now managed with hard delete

-- MIGRATION NOTES:
-- If updating an existing database, run the following commands:
-- ALTER TABLE subjects DROP COLUMN IF EXISTS status;
-- DROP INDEX IF EXISTS idx_subjects_status;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS year_level VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS guardian VARCHAR(255);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived'));
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 7 AND grade_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table for storing account information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('student', 'teacher', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_initial VARCHAR(1),
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    email VARCHAR(255),
    subject_id INTEGER REFERENCES subjects(id),
    year_level VARCHAR(20),
    birthdate DATE,
    address TEXT,
    age INTEGER,
    guardian VARCHAR(255),
    contact_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    archived_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_grade_level ON subjects(grade_level);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_users_account_number ON users(account_number);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_archived_at ON users(archived_at);

-- Insert sample data (updated to match new schema without status field)
INSERT INTO subjects (name, code, grade_level) VALUES
    ('Mathematics', 'MATH-7', 7),
    ('English', 'ENG-8', 8),
    ('Science', 'SCI-9', 9),
    ('Filipino', 'FIL-10', 10)
ON CONFLICT (code) DO NOTHING;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for subjects
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();