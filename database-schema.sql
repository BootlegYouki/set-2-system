-- Database schema for the school management system
-- Subjects table for storing curriculum subjects
-- Updated: Removed status column as subjects are now managed with hard delete

-- MIGRATION NOTES:
-- If updating an existing database, run the following commands:
-- ALTER TABLE subjects DROP COLUMN IF EXISTS status;
-- DROP INDEX IF EXISTS idx_subjects_status;

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 7 AND grade_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_grade_level ON subjects(grade_level);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

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

-- Trigger to automatically update updated_at
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();