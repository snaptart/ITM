-- Migration: Add new status values to allocations table
-- This migration adds 'available', 'proposed', and 'declined' statuses to support the new allocation workflow

-- Update the status enum to include new values
ALTER TABLE allocations 
MODIFY COLUMN status ENUM(
    'available',    -- New: Ice time slot available for assignment
    'proposed',     -- New: Allocated to program, awaiting confirmation
    'declined',     -- New: Program declined the allocation
    'pending',      -- Existing: General pending status
    'confirmed',    -- Existing: Program confirmed the allocation
    'cancelled',    -- Existing: Allocation was cancelled
    'completed'     -- Existing: Ice time has been used
) DEFAULT 'pending';

-- Update any existing pending allocations that represent unassigned slots to available
-- (Only if program_id = 0, indicating unassigned)
UPDATE allocations 
SET status = 'available' 
WHERE status = 'pending' AND program_id = 0;

-- Set default for new allocations to 'available' when program_id = 0
-- This will be handled in the application logic, but documenting the intent