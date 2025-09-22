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

-- Activity logs table with JSONB and partitioning for system activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL,
    activity_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    user_account_number VARCHAR(20),
    activity_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create indexes for the partitioned table
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_data_gin ON activity_logs USING GIN(activity_data);

-- Function to create new monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Create initial partitions for current and next few months
-- This approach is more scalable and automatically handles year transitions
DO $$
DECLARE
    start_date date;
    i integer;
BEGIN
    -- Start from current month
    start_date := date_trunc('month', CURRENT_DATE);
    
    -- Create partitions for current month + next 11 months (1 year ahead)
    FOR i IN 0..11 LOOP
        PERFORM create_monthly_partition('activity_logs', (start_date + (i || ' months')::interval)::date);
    END LOOP;
END $$;

-- Function to automatically create future partitions (maintenance function)
-- This should be called periodically (e.g., monthly via cron job or scheduled task)
CREATE OR REPLACE FUNCTION maintain_activity_log_partitions()
RETURNS void AS $$
DECLARE
    current_month date;
    future_months integer := 3; -- Always keep 3 months ahead
    i integer;
BEGIN
    current_month := date_trunc('month', CURRENT_DATE);
    
    -- Create partitions for the next few months if they don't exist
    FOR i IN 0..future_months LOOP
        PERFORM create_monthly_partition('activity_logs', current_month + (i || ' months')::interval);
    END LOOP;
    
    -- Optional: Clean up old partitions (uncomment if you want to auto-drop old data)
    -- This example keeps 12 months of data
    /*
    DECLARE
        old_partition_date date;
        old_partition_name text;
    BEGIN
        old_partition_date := current_month - interval '12 months';
        old_partition_name := 'activity_logs_' || to_char(old_partition_date, 'YYYY_MM');
        
        EXECUTE format('DROP TABLE IF EXISTS %I', old_partition_name);
    END;
    */
END;
$$ LANGUAGE plpgsql;

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_activity_type VARCHAR(50),
    p_user_id INTEGER DEFAULT NULL,
    p_user_account_number VARCHAR(20) DEFAULT NULL,
    p_activity_data JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    log_id BIGINT;
BEGIN
    INSERT INTO activity_logs (
        activity_type,
        user_id,
        user_account_number,
        activity_data,
        ip_address,
        user_agent
    ) VALUES (
        p_activity_type,
        p_user_id,
        p_user_account_number,
        p_activity_data,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample activity logs
INSERT INTO activity_logs (activity_type, user_id, user_account_number, activity_data) VALUES
    ('account_created', NULL, 'STU-2024-001', '{"account_type": "student", "full_name": "John Doe", "grade_level": "7"}'),
    ('schedule_assigned', NULL, NULL, '{"section": "Grade 7-A", "room": "Room 101", "subject": "Mathematics"}'),
    ('room_created', NULL, NULL, '{"room_name": "Room 205", "building": "Building A", "floor": 2}'),
    ('section_created', NULL, NULL, '{"section_name": "Grade 8-C", "grade_level": 8}'),
    ('account_created', NULL, 'TCH-2024-002', '{"account_type": "teacher", "full_name": "Jane Smith", "subject": "English"}')
ON CONFLICT DO NOTHING;