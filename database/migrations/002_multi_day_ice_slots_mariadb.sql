-- Migration: Add support for multiple days of week in ice time slots (MariaDB Compatible)
-- This migration replaces the single day_of_week column with a JSON array to support multiple days

-- Add new column for multiple days support
ALTER TABLE ice_time_slots 
ADD COLUMN days_of_week JSON COMMENT 'Array of day numbers (0=Sunday, 1=Monday, etc.)' AFTER day_of_week;

-- Migrate existing single day_of_week values to the new JSON format
UPDATE ice_time_slots 
SET days_of_week = JSON_ARRAY(day_of_week) 
WHERE day_of_week IS NOT NULL;

-- For non-recurring slots, auto-calculate day_of_week from effective_date
UPDATE ice_time_slots 
SET days_of_week = JSON_ARRAY(DAYOFWEEK(effective_date) - 1)
WHERE recurring = 0 AND days_of_week IS NULL;

-- Set default empty array for any remaining NULL values
UPDATE ice_time_slots 
SET days_of_week = JSON_ARRAY() 
WHERE days_of_week IS NULL;

-- Make the new column NOT NULL now that we've populated it
ALTER TABLE ice_time_slots 
MODIFY COLUMN days_of_week JSON NOT NULL;

-- Add index for JSON queries (MariaDB compatible - using generated column)
ALTER TABLE ice_time_slots 
ADD COLUMN days_of_week_text VARCHAR(100) AS (JSON_UNQUOTE(days_of_week)) STORED;

ALTER TABLE ice_time_slots 
ADD INDEX idx_days_of_week (days_of_week_text);

-- Keep the old day_of_week column for backward compatibility (will be deprecated)
-- ALTER TABLE ice_time_slots DROP COLUMN day_of_week;  -- Uncomment when ready to remove