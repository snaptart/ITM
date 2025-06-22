-- Add ice_surface_management permission to existing roles
-- This script updates the roles table to include the new ice_surface_management permission

-- Update System Administrator role to include ice_surface_management
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'ice_surface_management')
WHERE name = 'system_admin';

-- Update Facility Administrator role to include ice_surface_management  
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'ice_surface_management')
WHERE name = 'facility_admin';

-- Verify the updates
SELECT name, permissions FROM roles WHERE name IN ('system_admin', 'facility_admin');