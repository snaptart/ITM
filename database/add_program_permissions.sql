-- Add program management permissions to existing roles
-- Run this after the main schema is created

USE ice_time_management;

-- Check current permissions
SELECT name, display_name, permissions FROM roles;

-- Update system_admin role to include program_management permission if not already present
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'program_management')
WHERE name = 'system_admin' 
AND NOT JSON_CONTAINS(permissions, '"program_management"');

-- Update facility_admin role to include program_management permission if not already present
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'program_management')
WHERE name = 'facility_admin' 
AND NOT JSON_CONTAINS(permissions, '"program_management"');

-- Also add view_allocations permission for program users who need to see program information
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'view_allocations')
WHERE name = 'program_user' 
AND NOT JSON_CONTAINS(permissions, '"view_allocations"');

-- Verify the updates
SELECT name, display_name, permissions FROM roles;

-- Show sample of how permissions look after update
SELECT name, display_name, JSON_PRETTY(permissions) as formatted_permissions FROM roles;