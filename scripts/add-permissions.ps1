# PowerShell script to add permissions column and data
$mysqlCommand = @"
mysql -u muhaddis -padmin123@ hospital_portal -e "
-- Add permissions column to user_groups table
ALTER TABLE user_groups 
ADD COLUMN permissions JSON NULL 
COMMENT 'JSON object containing module permissions for this group';

-- Update the existing group (id=3) with the permissions we discussed
UPDATE user_groups 
SET permissions = JSON_OBJECT(
    'consultants', JSON_OBJECT('view', true, 'new', true),
    'careers', JSON_OBJECT('edit', true)
)
WHERE id = 3;

-- Verify the update
SELECT id, name, permissions FROM user_groups WHERE id = 3;
"
"@

Write-Host "Adding permissions column to user_groups table..."
Invoke-Expression $mysqlCommand