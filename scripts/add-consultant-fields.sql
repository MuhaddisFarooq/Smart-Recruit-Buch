-- Add background_image and consultant_type columns to consultant table
-- Run this script to update the database schema

-- Add background_image column (stores the filename/path of the background image for doctor detail page)
ALTER TABLE consultant 
ADD COLUMN background_image VARCHAR(500) NULL AFTER profile_pic;

-- Modify consultant_type column to support multiple types (Physical, Telephonic, or both)
-- Change from ENUM to VARCHAR to store comma-separated values like "Physical, Telephonic"
ALTER TABLE consultant 
ADD COLUMN consultant_type VARCHAR(100) NOT NULL DEFAULT 'Physical' AFTER doctor_type;

-- Optional: Add index for better performance when filtering by consultant_type
CREATE INDEX idx_consultant_type ON consultant(consultant_type);

-- Verify the changes
SHOW COLUMNS FROM consultant;
