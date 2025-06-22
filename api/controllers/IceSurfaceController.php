<?php
require_once __DIR__ . '/../models/IceSurface.php';
require_once __DIR__ . '/../models/Facility.php';
require_once __DIR__ . '/../includes/jwt.php';

class IceSurfaceController {
    private $db;
    private $ice_surface;

    public function __construct($db) {
        $this->db = $db;
        $this->ice_surface = new IceSurface($db);
    }

    public function getAll() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $ice_surfaces = $this->ice_surface->getAll($limit, $offset);
            $total = $this->ice_surface->getTotalCount();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'ice_surfaces' => $ice_surfaces,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice surfaces: ' . $e->getMessage()
            ]);
        }
    }

    public function getById($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $ice_surface_data = $this->ice_surface->findById($id);
            
            if ($ice_surface_data) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'ice_surface' => $ice_surface_data
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice surface not found'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice surface: ' . $e->getMessage()
            ]);
        }
    }

    public function create() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $data = json_decode(file_get_contents("php://input"));

            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            if (!isset($data->facility_id) || !isset($data->name)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Facility ID and name are required'
                ]);
                return;
            }

            $this->ice_surface->facility_id = $data->facility_id;
            $this->ice_surface->name = $data->name;
            $this->ice_surface->surface_type = isset($data->surface_type) ? $data->surface_type : 'hockey';
            $this->ice_surface->capacity = isset($data->capacity) ? $data->capacity : null;
            $this->ice_surface->hourly_rate = isset($data->hourly_rate) ? $data->hourly_rate : null;
            $this->ice_surface->description = isset($data->description) ? $data->description : '';
            $this->ice_surface->active = isset($data->active) ? $data->active : true;

            if ($this->ice_surface->create()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Ice surface created successfully',
                    'id' => $this->ice_surface->id
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to create ice surface'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating ice surface: ' . $e->getMessage()
            ]);
        }
    }

    public function update($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $data = json_decode(file_get_contents("php://input"));

            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            $existing = $this->ice_surface->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice surface not found'
                ]);
                return;
            }

            $this->ice_surface->facility_id = isset($data->facility_id) ? $data->facility_id : $existing['facility_id'];
            $this->ice_surface->name = isset($data->name) ? $data->name : $existing['name'];
            $this->ice_surface->surface_type = isset($data->surface_type) ? $data->surface_type : $existing['surface_type'];
            $this->ice_surface->capacity = isset($data->capacity) ? $data->capacity : $existing['capacity'];
            $this->ice_surface->hourly_rate = isset($data->hourly_rate) ? $data->hourly_rate : $existing['hourly_rate'];
            $this->ice_surface->description = isset($data->description) ? $data->description : $existing['description'];
            $this->ice_surface->active = isset($data->active) ? $data->active : $existing['active'];

            if ($this->ice_surface->update($id)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Ice surface updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to update ice surface'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating ice surface: ' . $e->getMessage()
            ]);
        }
    }

    public function delete($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $existing = $this->ice_surface->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice surface not found'
                ]);
                return;
            }

            $this->ice_surface->id = $id;
            
            if ($this->ice_surface->delete()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Ice surface deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to delete ice surface'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting ice surface: ' . $e->getMessage()
            ]);
        }
    }

    public function getByFacility($facility_id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $ice_surfaces = $this->ice_surface->getByFacilityId($facility_id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'ice_surfaces' => $ice_surfaces
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice surfaces for facility: ' . $e->getMessage()
            ]);
        }
    }

    public function getFacilities() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_surface_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $facility = new Facility($this->db);
            $facilities = $facility->getAll(100, 0);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'facilities' => $facilities
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving facilities: ' . $e->getMessage()
            ]);
        }
    }

    private function authenticateRequest() {
        $headers = getallheaders();
        $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'No token provided'
            ]);
            return false;
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, JWT_ALGORITHM));
            
            $user_query = "SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.permissions 
                          FROM users u 
                          JOIN roles r ON u.role_id = r.id 
                          WHERE u.id = ? AND u.active = 1";
            $stmt = $this->db->prepare($user_query);
            $stmt->execute([$decoded->user_id]);
            $user_data = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user_data) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid token'
                ]);
                return false;
            }

            return [
                'id' => $user_data['id'],
                'name' => $user_data['name'],
                'email' => $user_data['email'],
                'role' => $user_data['role_name'],
                'role_display_name' => $user_data['role_display_name'],
                'permissions' => json_decode($user_data['permissions'], true) ?? []
            ];
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid token'
            ]);
            return false;
        }
    }

    private function hasPermission($user, $permission) {
        return in_array($permission, $user['permissions'] ?? []);
    }
}
?>