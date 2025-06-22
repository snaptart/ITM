-- Migration: Add days_of_week column only
-- Simple migration that just adds the new JSON column for multi-day support

-- Add days_of_week column
ALTER TABLE ice_time_slots 
ADD COLUMN days_of_week JSON NOT NULL DEFAULT (JSON_ARRAY(1)) 
COMMENT 'Array of day numbers (0=Sunday, 1=Monday, etc.)';