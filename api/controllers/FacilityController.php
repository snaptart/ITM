<?php
require_once __DIR__ . '/../models/Facility.php';
require_once __DIR__ . '/../includes/jwt.php';

class FacilityController {
    private $db;
    private $facility;

    public function __construct($db) {
        $this->db = $db;
        $this->facility = new Facility($db);
    }

    public function getAll() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'facility_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 25;
        $offset = ($page - 1) * $limit;

        $facilities = $this->facility->getAll($limit, $offset);
        $total = $this->facility->getTotalCount();

        http_response_code(200);
        echo json_encode([
            'facilities' => $facilities,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function getById($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'facility_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $facility_data = $this->facility->findById($id);

        if (!$facility_data) {
            http_response_code(404);
            echo json_encode(['error' => 'Facility not found']);
            return;
        }

        http_response_code(200);
        echo json_encode(['facility' => $facility_data]);
    }

    public function create() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'facility_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Facility name is required']);
            return;
        }

        if (isset($data['email']) && !empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }

        $this->facility->name = $data['name'];
        $this->facility->address = $data['address'] ?? '';
        $this->facility->city = $data['city'] ?? '';
        $this->facility->province = $data['province'] ?? '';
        $this->facility->postal_code = $data['postal_code'] ?? '';
        $this->facility->phone = $data['phone'] ?? '';
        $this->facility->email = $data['email'] ?? '';
        $this->facility->contact_person = $data['contact_person'] ?? '';
        $this->facility->facility_admin_id = !empty($data['facility_admin_id']) ? $data['facility_admin_id'] : null;
        $this->facility->active = isset($data['active']) ? intval($data['active']) : 1;

        try {
            if ($this->facility->create()) {
                $facility_data = $this->facility->findById($this->facility->id);

                http_response_code(201);
                echo json_encode([
                    'message' => 'Facility created successfully',
                    'facility' => $facility_data
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create facility']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function update($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'facility_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'No data provided']);
            return;
        }

        $facility_data = $this->facility->findById($id);
        if (!$facility_data) {
            http_response_code(404);
            echo json_encode(['error' => 'Facility not found']);
            return;
        }

        if (!isset($data['name']) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Facility name is required']);
            return;
        }

        if (isset($data['email']) && !empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }

        $this->facility->name = $data['name'];
        $this->facility->address = $data['address'] ?? '';
        $this->facility->city = $data['city'] ?? '';
        $this->facility->province = $data['province'] ?? '';
        $this->facility->postal_code = $data['postal_code'] ?? '';
        $this->facility->phone = $data['phone'] ?? '';
        $this->facility->email = $data['email'] ?? '';
        $this->facility->contact_person = $data['contact_person'] ?? '';
        $this->facility->facility_admin_id = !empty($data['facility_admin_id']) ? $data['facility_admin_id'] : null;
        $this->facility->active = isset($data['active']) ? intval($data['active']) : 1;

        try {
            if ($this->facility->update($id)) {
                $updated_facility = $this->facility->findById($id);

                http_response_code(200);
                echo json_encode([
                    'message' => 'Facility updated successfully',
                    'facility' => $updated_facility
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update facility']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function delete($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'facility_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $facility_data = $this->facility->findById($id);
        if (!$facility_data) {
            http_response_code(404);
            echo json_encode(['error' => 'Facility not found']);
            return;
        }

        try {
            $this->facility->id = $id;
            if ($this->facility->delete()) {
                http_response_code(200);
                echo json_encode(['message' => 'Facility deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete facility']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function getFacilityAdmins() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'facility_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $admins = $this->facility->getFacilityAdmins();

        http_response_code(200);
        echo json_encode(['admins' => $admins]);
    }

    private function authenticateRequest() {
        $headers = getallheaders();
        $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided']);
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
                echo json_encode(['error' => 'Invalid token']);
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
            echo json_encode(['error' => 'Invalid token']);
            return false;
        }
    }

    private function hasPermission($user, $permission) {
        return in_array($permission, $user['permissions'] ?? []);
    }
}
?>