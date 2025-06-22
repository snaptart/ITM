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

        case 'verify-email':
            if ($request_method === 'POST') {
                require_once 'controllers/AuthController.php';
                $controller = new AuthController($db);
                $controller->verifyEmail();
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

        case 'users':
            require_once 'controllers/UserController.php';
            $controller = new UserController($db);
            
            if ($request_method === 'GET' && !isset($path_parts[1])) {
                $controller->getAll();
            } elseif ($request_method === 'GET' && isset($path_parts[1])) {
                $controller->getById($path_parts[1]);
            } elseif ($request_method === 'POST') {
                $controller->create();
            } elseif ($request_method === 'PUT' && isset($path_parts[1])) {
                $controller->update($path_parts[1]);
            } elseif ($request_method === 'DELETE' && isset($path_parts[1])) {
                $controller->delete($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'users-password':
            if ($request_method === 'PUT' && isset($path_parts[1])) {
                require_once 'controllers/UserController.php';
                $controller = new UserController($db);
                $controller->changePassword($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'roles':
            if ($request_method === 'GET') {
                require_once 'controllers/UserController.php';
                $controller = new UserController($db);
                $controller->getRoles();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'facilities':
            require_once 'controllers/FacilityController.php';
            $controller = new FacilityController($db);
            
            if ($request_method === 'GET' && !isset($path_parts[1])) {
                $controller->getAll();
            } elseif ($request_method === 'GET' && isset($path_parts[1])) {
                $controller->getById($path_parts[1]);
            } elseif ($request_method === 'POST') {
                $controller->create();
            } elseif ($request_method === 'PUT' && isset($path_parts[1])) {
                $controller->update($path_parts[1]);
            } elseif ($request_method === 'DELETE' && isset($path_parts[1])) {
                $controller->delete($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'facility-admins':
            if ($request_method === 'GET') {
                require_once 'controllers/FacilityController.php';
                $controller = new FacilityController($db);
                $controller->getFacilityAdmins();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-surfaces':
            require_once 'controllers/IceSurfaceController.php';
            $controller = new IceSurfaceController($db);
            
            if ($request_method === 'GET' && !isset($path_parts[1])) {
                $controller->getAll();
            } elseif ($request_method === 'GET' && isset($path_parts[1])) {
                $controller->getById($path_parts[1]);
            } elseif ($request_method === 'POST') {
                $controller->create();
            } elseif ($request_method === 'PUT' && isset($path_parts[1])) {
                $controller->update($path_parts[1]);
            } elseif ($request_method === 'DELETE' && isset($path_parts[1])) {
                $controller->delete($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-surfaces-by-facility':
            if ($request_method === 'GET' && isset($path_parts[1])) {
                require_once 'controllers/IceSurfaceController.php';
                $controller = new IceSurfaceController($db);
                $controller->getByFacility($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-surface-facilities':
            if ($request_method === 'GET') {
                require_once 'controllers/IceSurfaceController.php';
                $controller = new IceSurfaceController($db);
                $controller->getFacilities();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'programs':
            require_once 'controllers/ProgramController.php';
            $controller = new ProgramController($db);
            
            if ($request_method === 'GET' && !isset($path_parts[1])) {
                $controller->getAll();
            } elseif ($request_method === 'GET' && isset($path_parts[1])) {
                $controller->getById($path_parts[1]);
            } elseif ($request_method === 'POST') {
                $controller->create();
            } elseif ($request_method === 'PUT' && isset($path_parts[1])) {
                $controller->update($path_parts[1]);
            } elseif ($request_method === 'DELETE' && isset($path_parts[1])) {
                $controller->delete($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-time-slots':
            require_once 'controllers/IceTimeSlotsController.php';
            $controller = new IceTimeSlotsController($db);
            
            if ($request_method === 'GET' && !isset($path_parts[1])) {
                $controller->getAll();
            } elseif ($request_method === 'GET' && isset($path_parts[1])) {
                $controller->getById($path_parts[1]);
            } elseif ($request_method === 'POST') {
                $controller->create();
            } elseif ($request_method === 'PUT' && isset($path_parts[1])) {
                $controller->update($path_parts[1]);
            } elseif ($request_method === 'DELETE' && isset($path_parts[1])) {
                $controller->delete($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-time-slots-by-surface':
            if ($request_method === 'GET' && isset($path_parts[1])) {
                require_once 'controllers/IceTimeSlotsController.php';
                $controller = new IceTimeSlotsController($db);
                $controller->getByIceSurface($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-time-slots-available':
            if ($request_method === 'GET') {
                require_once 'controllers/IceTimeSlotsController.php';
                $controller = new IceTimeSlotsController($db);
                $controller->getAvailable();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'ice-time-slots-ice-surfaces':
            if ($request_method === 'GET') {
                require_once 'controllers/IceTimeSlotsController.php';
                $controller = new IceTimeSlotsController($db);
                $controller->getIceSurfaces();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations':
            require_once 'controllers/AllocationController.php';
            $controller = new AllocationController($db);
            
            if ($request_method === 'GET' && !isset($path_parts[1])) {
                $controller->getAll();
            } elseif ($request_method === 'GET' && isset($path_parts[1])) {
                $controller->getById($path_parts[1]);
            } elseif ($request_method === 'POST') {
                $controller->create();
            } elseif ($request_method === 'PUT' && isset($path_parts[1])) {
                $controller->update($path_parts[1]);
            } elseif ($request_method === 'DELETE' && isset($path_parts[1])) {
                $controller->delete($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-bulk-assign':
            if ($request_method === 'POST') {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->bulkAssign();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-bulk-unassign':
            if ($request_method === 'POST') {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->bulkUnassign();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-confirm':
            if ($request_method === 'POST' && isset($path_parts[1])) {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->confirm($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-decline':
            if ($request_method === 'POST' && isset($path_parts[1])) {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->decline($path_parts[1]);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-available':
            if ($request_method === 'GET') {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->getAvailable();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-pending-confirmation':
            if ($request_method === 'GET') {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->getPendingConfirmations();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'allocations-by-program':
            if ($request_method === 'GET' && isset($path_parts[1])) {
                require_once 'controllers/AllocationController.php';
                $controller = new AllocationController($db);
                $controller->getByProgram($path_parts[1]);
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