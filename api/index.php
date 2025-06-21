<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'config/config.php';
require_once 'config/database.php';

$database = new Database();
$db = $database->connect();

if (!$db) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

$base_path = '/itm/api';
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));
$path = trim($path, '/');

$path_parts = explode('/', $path);
$endpoint = $path_parts[0] ?? '';

try {
    switch ($endpoint) {
        case 'login':
            if ($request_method === 'POST') {
                require_once 'controllers/AuthController.php';
                $controller = new AuthController($db);
                $controller->login();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'register':
            if ($request_method === 'POST') {
                require_once 'controllers/AuthController.php';
                $controller = new AuthController($db);
                $controller->register();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'validate-token':
            if ($request_method === 'GET') {
                require_once 'controllers/AuthController.php';
                $controller = new AuthController($db);
                $controller->validateToken();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'password-reset':
            if ($request_method === 'POST') {
                require_once 'controllers/AuthController.php';
                $controller = new AuthController($db);
                $controller->passwordReset();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'me':
        case 'current-user':
            if ($request_method === 'GET') {
                require_once 'controllers/AuthController.php';
                $controller = new AuthController($db);
                $controller->getCurrentUser();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'dashboard-data':
            if ($request_method === 'GET') {
                require_once 'controllers/DashboardController.php';
                $controller = new DashboardController($db);
                $controller->getDashboardData();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'calendar-events':
            if ($request_method === 'GET') {
                require_once 'controllers/CalendarController.php';
                $controller = new CalendarController($db);
                $controller->getEvents();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'events':
            if ($request_method === 'GET') {
                require_once 'controllers/SSEController.php';
                $controller = new SSEController($db);
                $controller->streamEvents();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'health':
            http_response_code(200);
            echo json_encode([
                'status' => 'healthy',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0.0'
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>