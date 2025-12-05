-- Update consultant_type column to support multiple types
-- Run this script if you already have the consultant_type column as ENUM
-- This will convert it to VARCHAR to support comma-separated values

-- First, check if the column exists and its type
-- SHOW COLUMNS FROM consultant LIKE 'consultant_type';

-- Drop the existing index if it exists
DROP INDEX IF EXISTS idx_consultant_type ON consultant;

-- Modify the consultant_type column from ENUM to VARCHAR
-- This will preserve existing data ('Physical' or 'Telephonic')
ALTER TABLE consultant 
MODIFY COLUMN consultant_type VARCHAR(100) NOT NULL DEFAULT 'Physical';

-- Recreate the index
CREATE INDEX idx_consultant_type ON consultant(consultant_type);

-- Verify the changes
SHOW COLUMNS FROM consultant LIKE 'consultant_type';

-- Example of how data will look:
-- 'Physical' - Only physical consultations
-- 'Telephonic' - Only telephonic consultations  
-- 'Physical, Telephonic' - Both types of consultations
