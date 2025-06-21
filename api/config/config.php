<?php
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 86400); // 24 hours in seconds

define('BCRYPT_ROUNDS', 12);

define('API_BASE_URL', '/api');
define('FRONTEND_URL', 'http://localhost');

define('EMAIL_FROM', 'noreply@icetimemanagement.com');
define('EMAIL_FROM_NAME', 'Ice Time Management System');

// SMTP Configuration (for production email sending)
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('SMTP_SECURE', 'tls'); // 'tls' or 'ssl'

define('TIMEZONE', 'America/Toronto');
date_default_timezone_set(TIMEZONE);

define('MAX_ADVANCE_BOOKING_DAYS', 365);
define('AUTO_CONFIRM_TIMEOUT_HOURS', 72);

define('CORS_ALLOWED_ORIGINS', [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8000'
]);

define('RATE_LIMIT_REQUESTS', 100);
define('RATE_LIMIT_WINDOW', 3600); // 1 hour

define('LOG_LEVEL', 'INFO');
define('LOG_FILE', __DIR__ . '/../logs/app.log');

error_reporting(E_ALL);
ini_set('display_errors', 1);
?>