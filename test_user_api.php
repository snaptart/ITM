<?php
// Simple test script for User Management API endpoints
// This can be run from command line: php test_user_api.php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'api/config/database.php';
require_once 'api/models/User.php';
require_once 'api/controllers/UserController.php';

echo "=== User Management API Test ===\n\n";

// Test database connection
try {
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo "✓ Database connection successful\n";
    } else {
        echo "✗ Database connection failed\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "✗ Database connection error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test User model
try {
    $user = new User($db);
    echo "✓ User model instantiated successfully\n";
    
    // Test getting all users
    $users = $user->getAll(10, 0);
    echo "✓ Retrieved " . count($users) . " users\n";
    
    // Test getting total count
    $total = $user->getTotalCount();
    echo "✓ Total users count: " . $total . "\n";
    
} catch (Exception $e) {
    echo "✗ User model error: " . $e->getMessage() . "\n";
}

// Test roles query
try {
    $query = "SELECT id, name, display_name, description FROM roles ORDER BY id";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✓ Retrieved " . count($roles) . " roles:\n";
    foreach ($roles as $role) {
        echo "  - {$role['display_name']} (ID: {$role['id']})\n";
    }
    
} catch (Exception $e) {
    echo "✗ Roles query error: " . $e->getMessage() . "\n";
}

// Test UserController instantiation
try {
    $controller = new UserController($db);
    echo "✓ UserController instantiated successfully\n";
} catch (Exception $e) {
    echo "✗ UserController error: " . $e->getMessage() . "\n";
}

echo "\n=== Test completed ===\n";
echo "If all tests passed, the User Management system should be ready to use.\n";
echo "Access the system through: http://localhost/itm/public/\n";
echo "Default admin login: admin@example.com / admin123\n";
?>