-- Test script to verify consultant_type column can store multiple values
-- Run this to check the column definition and test storing different values

-- 1. Check the column definition
SHOW COLUMNS FROM consultant LIKE 'consultant_type';

-- 2. Check current values
SELECT id, name, consultant_type FROM consultant LIMIT 10;

-- 3. Test updating a record with multiple types (replace ID with an actual ID)
-- UPDATE consultant SET consultant_type = 'Physical, Telephonic' WHERE id = 1;

-- 4. Verify the update worked
-- SELECT id, name, consultant_type FROM consultant WHERE id = 1;

-- 5. Test with just one type
-- UPDATE consultant SET consultant_type = 'Telephonic' WHERE id = 2;

-- 6. Verify
-- SELECT id, name, consultant_type FROM consultant WHERE id = 2;
