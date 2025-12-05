-- DIAGNOSTIC AND FIX SCRIPT FOR CONSULTANT_TYPE COLUMN
-- This script will help you identify and fix the consultant_type column issue

-- STEP 1: Check if the column exists and its current type
-- Run this first to see the column definition:
DESCRIBE consultant;

-- Look for the consultant_type row in the output
-- If Type shows: enum('Physical','Telephonic') - YOU NEED TO CONVERT IT
-- If Type shows: varchar(100) - IT'S ALREADY CORRECT

-- STEP 2: If it's an ENUM, convert it to VARCHAR
-- Run these commands one by one:

-- Drop the index first
DROP INDEX idx_consultant_type ON consultant;

-- Convert ENUM to VARCHAR (this preserves existing data)
ALTER TABLE consultant 
MODIFY COLUMN consultant_type VARCHAR(100) NOT NULL DEFAULT 'Physical';

-- Recreate the index
CREATE INDEX idx_consultant_type ON consultant(consultant_type);

-- STEP 3: Test that it works
-- Try updating a test record with both types:
-- UPDATE consultant SET consultant_type = 'Physical, Telephonic' WHERE id = (SELECT id FROM consultant LIMIT 1);

-- STEP 4: Verify the change worked
-- SELECT id, name, consultant_type FROM consultant LIMIT 5;

-- You should now see 'Physical, Telephonic' stored correctly!
