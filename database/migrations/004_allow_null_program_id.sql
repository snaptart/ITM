-- Migration: Allow NULL program_id in allocations table
-- This allows for unassigned ice time slots

-- Modify program_id column to allow NULL values
ALTER TABLE allocations 
MODIFY COLUMN program_id INT NULL;

-- Update the foreign key constraint to handle NULL values properly
ALTER TABLE allocations 
DROP FOREIGN KEY allocations_ibfk_2;

ALTER TABLE allocations 
ADD CONSTRAINT allocations_ibfk_2 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;