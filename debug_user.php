<?php
require_once 'api/config/config.php';
require_once 'api/config/database.php';
require_once 'api/models/User.php';

$database = new Database();
$db = $database->connect();
$user = new User($db);

echo "Testing admin user lookup...\n";

$admin_data = $user->findByEmail('admin@example.com');

if ($admin_data) {
    echo "User found!\n";
    echo "Email: " . $admin_data['email'] . "\n";
    echo "Name: " . $admin_data['name'] . "\n";
    echo "Email verified: " . ($admin_data['email_verified'] ? 'Yes' : 'No') . "\n";
    echo "Password hash: " . $admin_data['password_hash'] . "\n";
    
    // Test password verification
    $test_password = 'admin123';
    $password_correct = password_verify($test_password, $admin_data['password_hash']);
    echo "Password 'admin123' correct: " . ($password_correct ? 'Yes' : 'No') . "\n";
    
    // Test the setup.sql hash directly
    $setup_hash = '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBWY3/lbwG8sF2';
    $setup_password_correct = password_verify($test_password, $setup_hash);
    echo "Setup.sql hash with 'admin123': " . ($setup_password_correct ? 'Yes' : 'No') . "\n";
    
} else {
    echo "User not found!\n";
}
?>