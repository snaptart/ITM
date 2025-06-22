-- Migration: Add day_of_week and days_of_week columns if they don't exist
-- This handles cases where the original schema might be missing these columns

-- Add day_of_week column if it doesn't exist (for backward compatibility)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'ice_time_slots' 
AND column_name = 'day_of_week';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE ice_time_slots ADD COLUMN day_of_week TINYINT NOT NULL DEFAULT 1 COMMENT ''0=Sunday, 1=Monday, etc.'' AFTER ice_surface_id', 
    'SELECT ''day_of_week column already exists'' as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add days_of_week column if it doesn't exist (for multi-day support)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'ice_time_slots' 
AND column_name = 'days_of_week';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE ice_time_slots ADD COLUMN days_of_week JSON COMMENT ''Array of day numbers (0=Sunday, 1=Monday, etc.)'' AFTER day_of_week', 
    'SELECT ''days_of_week column already exists'' as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- If days_of_week was just created, populate it with default values
UPDATE ice_time_slots 
SET days_of_week = JSON_ARRAY(COALESCE(day_of_week, 1))
WHERE days_of_week IS NULL;

-- For any empty day_of_week values, set to Monday (1)
UPDATE ice_time_slots 
SET day_of_week = 1 
WHERE day_of_week IS NULL;

-- Add index on day_of_week if it doesn't exist
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'ice_time_slots' 
AND index_name = 'idx_day_time';

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE ice_time_slots ADD INDEX idx_day_time (day_of_week, start_time)', 
    'SELECT ''idx_day_time index already exists'' as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;