<?php
require_once __DIR__ . '/../models/Program.php';
require_once __DIR__ . '/../includes/jwt.php';

class ProgramController {
    private $db;
    private $program;

    public function __construct($db) {
        $this->db = $db;
        $this->program = new Program($db);
    }

    public function getAll() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'program_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 25;
        $offset = ($page - 1) * $limit;

        $programs = $this->program->getAll($limit, $offset);
        $total = $this->program->getTotalCount();

        http_response_code(200);
        echo json_encode([
            'programs' => $programs,
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

        if (!$this->hasPermission($current_user, 'program_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $program = $this->program->getById($id);
        
        if (!$program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }

        http_response_code(200);
        echo json_encode(['program' => $program]);
    }

    public function create() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'program_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            return;
        }

        // Set defaults for missing fields
        $data = [
            'name' => $input['name'] ?? '',
            'program_type' => $input['program_type'] ?? '',
            'contact_person' => $input['contact_person'] ?? '',
            'contact_email' => $input['contact_email'] ?? '',
            'contact_phone' => $input['contact_phone'] ?? '',
            'program_admin_id' => !empty($input['program_admin_id']) ? $input['program_admin_id'] : null,
            'description' => $input['description'] ?? '',
            'active' => isset($input['active']) ? (bool)$input['active'] : true
        ];

        // Validate data
        $errors = $this->program->validateData($data);
        
        // Check for duplicate name
        if ($this->program->checkNameExists($data['name'])) {
            $errors[] = 'Program name already exists';
        }
        
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['error' => implode(', ', $errors)]);
            return;
        }

        try {
            $program_id = $this->program->create($data);
            
            if ($program_id) {
                // Log the activity
                $this->logActivity('program_created', 'program', $program_id, 
                    "Program '{$data['name']}' created", $current_user['user_id']);
                
                $new_program = $this->program->getById($program_id);
                
                http_response_code(201);
                echo json_encode([
                    'message' => 'Program created successfully',
                    'program' => $new_program
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create program']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function update($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'program_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            return;
        }

        // Check if program exists
        $existing_program = $this->program->getById($id);
        if (!$existing_program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }

        // Set data with current values as defaults
        $data = [
            'name' => $input['name'] ?? $existing_program['name'],
            'program_type' => $input['program_type'] ?? $existing_program['program_type'],
            'contact_person' => $input['contact_person'] ?? $existing_program['contact_person'],
            'contact_email' => $input['contact_email'] ?? $existing_program['contact_email'],
            'contact_phone' => $input['contact_phone'] ?? $existing_program['contact_phone'],
            'program_admin_id' => isset($input['program_admin_id']) ? (!empty($input['program_admin_id']) ? $input['program_admin_id'] : null) : $existing_program['program_admin_id'],
            'description' => $input['description'] ?? $existing_program['description'],
            'active' => isset($input['active']) ? (bool)$input['active'] : (bool)$existing_program['active']
        ];

        // Validate data
        $errors = $this->program->validateData($data, true);
        
        // Check for duplicate name (excluding current program)
        if ($this->program->checkNameExists($data['name'], $id)) {
            $errors[] = 'Program name already exists';
        }
        
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['error' => implode(', ', $errors)]);
            return;
        }

        try {
            if ($this->program->update($id, $data)) {
                // Log the activity
                $this->logActivity('program_updated', 'program', $id, 
                    "Program '{$data['name']}' updated", $current_user['user_id']);
                
                $updated_program = $this->program->getById($id);
                
                http_response_code(200);
                echo json_encode([
                    'message' => 'Program updated successfully',
                    'program' => $updated_program
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update program']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function delete($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'program_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        // Check if program exists
        $existing_program = $this->program->getById($id);
        if (!$existing_program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }

        try {
            $result = $this->program->delete($id);
            
            if (is_array($result) && isset($result['error'])) {
                http_response_code(400);
                echo json_encode($result);
                return;
            }
            
            if ($result) {
                // Log the activity
                $this->logActivity('program_deleted', 'program', $id, 
                    "Program '{$existing_program['name']}' deleted", $current_user['user_id']);
                
                http_response_code(200);
                echo json_encode(['message' => 'Program deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete program']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    private function authenticateRequest() {
        $headers = getallheaders();
        $auth_header = $headers['Authorization'] ?? '';
        
        if (!$auth_header || !preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            return false;
        }
        
        $token = $matches[1];
        
        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, JWT_ALGORITHM));
            
            if (!$decoded) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid token']);
                return false;
            }
            
            return (array) $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token: ' . $e->getMessage()]);
            return false;
        }
    }

    private function hasPermission($user, $permission) {
        return in_array($permission, $user['permissions'] ?? []);
    }

    private function logActivity($event_type, $entity_type, $entity_id, $message, $user_id) {
        try {
            $query = "INSERT INTO notifications_log 
                      (event_type, entity_type, entity_id, message, target_users, created_at) 
                      VALUES (:event_type, :entity_type, :entity_id, :message, :target_users, NOW())";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':event_type', $event_type);
            $stmt->bindParam(':entity_type', $entity_type);
            $stmt->bindParam(':entity_id', $entity_id, PDO::PARAM_INT);
            $stmt->bindParam(':message', $message);
            $target_users = json_encode([$user_id]);
            $stmt->bindParam(':target_users', $target_users);
            $stmt->execute();
        } catch (Exception $e) {
            // Log activity failed, but don't interrupt the main operation
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
}