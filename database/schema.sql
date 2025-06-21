-- Ice Time Management System Database Schema
-- Created: 2024-06-21

-- Create database
CREATE DATABASE IF NOT EXISTS ice_time_management;
USE ice_time_management;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role_id)
);

-- Roles table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Facilities table
CREATE TABLE facilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    facility_admin_id INT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_facility_admin (facility_admin_id),
    FOREIGN KEY (facility_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Ice surfaces table
CREATE TABLE ice_surfaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    surface_type ENUM('hockey', 'figure_skating', 'curling', 'multi_purpose') DEFAULT 'hockey',
    capacity INT,
    hourly_rate DECIMAL(10,2),
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_facility (facility_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Programs table
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program_type ENUM('hockey', 'figure_skating', 'speed_skating', 'curling', 'public_skating', 'other') NOT NULL,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    program_admin_id INT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_program_admin (program_admin_id),
    FOREIGN KEY (program_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Ice time slots table
CREATE TABLE ice_time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ice_surface_id INT NOT NULL,
    day_of_week TINYINT NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    recurring BOOLEAN DEFAULT TRUE,
    slot_type ENUM('available', 'maintenance', 'reserved', 'blocked') DEFAULT 'available',
    priority_level TINYINT DEFAULT 1, -- 1=lowest, 5=highest
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ice_surface (ice_surface_id),
    INDEX idx_day_time (day_of_week, start_time),
    INDEX idx_effective_date (effective_date),
    FOREIGN KEY (ice_surface_id) REFERENCES ice_surfaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Allocations table
CREATE TABLE allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ice_time_slot_id INT NOT NULL,
    program_id INT NOT NULL,
    allocation_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    confirmed_at TIMESTAMP NULL,
    confirmed_by INT,
    allocation_type ENUM('regular', 'one_time', 'tournament', 'special') DEFAULT 'regular',
    cost DECIMAL(10,2),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slot_date (ice_time_slot_id, allocation_date),
    INDEX idx_program (program_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_slot_date (ice_time_slot_id, allocation_date),
    FOREIGN KEY (ice_time_slot_id) REFERENCES ice_time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Program users association table
CREATE TABLE program_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member', 'viewer') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_program (program_id),
    INDEX idx_user (user_id),
    UNIQUE KEY unique_program_user (program_id, user_id),
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications log table
CREATE TABLE notifications_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    message TEXT NOT NULL,
    notification_data JSON,
    target_users JSON, -- Array of user IDs who should receive this notification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- Session tokens table (for JWT token blacklisting)
CREATE TABLE session_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    INDEX idx_user (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
('system_admin', 'System Administrator', 'Full system access and configuration', 
 '["user_management", "facility_management", "program_management", "system_settings", "reports"]'),
('facility_admin', 'Facility Administrator', 'Manages facility operations and ice time allocation', 
 '["facility_management", "ice_time_management", "program_coordination", "allocation_management"]'),
('program_user', 'Program User', 'Views and confirms allocated ice time for their programs', 
 '["view_allocations", "confirm_allocations", "view_calendar"]'),
('public', 'Public User', 'Limited access for registration and public information', 
 '["registration", "public_info"]');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'Ice Time Management System', 'string', 'Display name for the system'),
('admin_email', 'admin@example.com', 'string', 'System administrator email'),
('session_timeout', '1440', 'integer', 'Session timeout in minutes'),
('email_notifications', 'true', 'boolean', 'Enable email notifications'),
('auto_confirm_timeout', '72', 'integer', 'Hours to wait before auto-confirming allocations'),
('max_advance_booking', '365', 'integer', 'Maximum days in advance for booking'),
('timezone', 'America/Toronto', 'string', 'System timezone');

-- Create a default system admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role_id, email_verified) VALUES
('System Administrator', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, TRUE);