<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../includes/jwt.php';

class UserController {
    private $db;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function getAll() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'user_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 25;
        $offset = ($page - 1) * $limit;

        $users = $this->user->getAll($limit, $offset);
        $total = $this->user->getTotalCount();

        foreach ($users as &$user) {
            unset($user['password_hash']);
            unset($user['password_reset_token']);
            unset($user['email_verification_token']);
        }

        http_response_code(200);
        echo json_encode([
            'users' => $users,
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

        if (!$this->hasPermission($current_user, 'user_management') && $current_user['id'] != $id) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $user_data = $this->user->findById($id);

        if (!$user_data) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        unset($user_data['password_hash']);
        unset($user_data['password_reset_token']);
        unset($user_data['email_verification_token']);

        http_response_code(200);
        echo json_encode(['user' => $user_data]);
    }

    public function create() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'user_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['role_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, email, password, and role_id are required']);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }

        if (strlen($data['password']) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters long']);
            return;
        }

        if ($this->user->emailExists($data['email'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            return;
        }

        if (!$this->isValidRoleId($data['role_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid role_id']);
            return;
        }

        $this->user->name = $data['name'];
        $this->user->email = $data['email'];
        $this->user->password_hash = $data['password'];
        $this->user->role_id = $data['role_id'];

        if ($this->user->create()) {
            $user_data = $this->user->findById($this->user->id);
            unset($user_data['password_hash']);

            http_response_code(201);
            echo json_encode([
                'message' => 'User created successfully',
                'user' => $user_data
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create user']);
        }
    }

    public function update($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'user_management') && $current_user['id'] != $id) {
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

        $user_data = $this->user->findById($id);
        if (!$user_data) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        $updates = [];
        $params = [':id' => $id];

        if (isset($data['name'])) {
            $updates[] = "name = :name";
            $params[':name'] = htmlspecialchars(strip_tags($data['name']));
        }

        if (isset($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                return;
            }

            if ($data['email'] !== $user_data['email'] && $this->user->emailExists($data['email'])) {
                http_response_code(409);
                echo json_encode(['error' => 'Email already exists']);
                return;
            }

            $updates[] = "email = :email";
            $params[':email'] = htmlspecialchars(strip_tags($data['email']));
        }

        if (isset($data['role_id'])) {
            if (!$this->hasPermission($current_user, 'user_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions to change user role']);
                return;
            }

            if (!$this->isValidRoleId($data['role_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid role_id']);
                return;
            }

            $updates[] = "role_id = :role_id";
            $params[':role_id'] = intval($data['role_id']);
        }

        if (isset($data['active'])) {
            if (!$this->hasPermission($current_user, 'user_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions to change user status']);
                return;
            }

            $updates[] = "active = :active";
            $params[':active'] = $data['active'] ? 1 : 0;
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }

        $query = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
        
        try {
            $stmt = $this->db->prepare($query);
            if ($stmt->execute($params)) {
                $updated_user = $this->user->findById($id);
                unset($updated_user['password_hash']);

                http_response_code(200);
                echo json_encode([
                    'message' => 'User updated successfully',
                    'user' => $updated_user
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update user']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function delete($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'user_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        if ($current_user['id'] == $id) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete your own account']);
            return;
        }

        $user_data = $this->user->findById($id);
        if (!$user_data) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        $query = "UPDATE users SET active = 0, updated_at = NOW() WHERE id = :id";
        
        try {
            $stmt = $this->db->prepare($query);
            if ($stmt->execute([':id' => $id])) {
                http_response_code(200);
                echo json_encode(['message' => 'User deactivated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to deactivate user']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function changePassword($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'user_management') && $current_user['id'] != $id) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['new_password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'New password is required']);
            return;
        }

        if ($current_user['id'] == $id && !isset($data['current_password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Current password is required when changing your own password']);
            return;
        }

        if (strlen($data['new_password']) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters long']);
            return;
        }

        $user_data = $this->user->findById($id);
        if (!$user_data) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        if ($current_user['id'] == $id && isset($data['current_password'])) {
            if (!password_verify($data['current_password'], $user_data['password_hash'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Current password is incorrect']);
                return;
            }
        }

        $this->user->id = $id;
        if ($this->user->resetPassword($data['new_password'])) {
            http_response_code(200);
            echo json_encode(['message' => 'Password changed successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to change password']);
        }
    }

    public function getRoles() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'user_management')) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }

        $query = "SELECT id, name, display_name, description FROM roles ORDER BY id";
        
        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(['roles' => $roles]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
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
            $user_data = $this->user->findById($decoded->user_id);

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
                'permissions' => $user_data['permissions']
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

    private function isValidRoleId($role_id) {
        $query = "SELECT id FROM roles WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $role_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
}
?>