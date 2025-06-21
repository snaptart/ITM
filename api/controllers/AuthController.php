<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../includes/jwt.php';

class AuthController {
    private $db;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required']);
            return;
        }

        $user_data = $this->user->findByEmail($data['email']);

        if (!$user_data) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        $password_hash = $user_data['password_hash'] ?? '';
        $password_valid = password_verify($data['password'], $password_hash);
        
        if (!$password_valid) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        if (!$user_data['email_verified']) {
            http_response_code(401);
            echo json_encode(['error' => 'Please verify your email address']);
            return;
        }

        $token_payload = [
            'user_id' => $user_data['id'],
            'email' => $user_data['email'],
            'role' => $user_data['role_name'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRY
        ];

        $token = JWT::encode($token_payload, JWT_SECRET, JWT_ALGORITHM);

        $this->user->id = $user_data['id'];
        $this->user->updateLastLogin();

        unset($user_data['password_hash']);

        http_response_code(200);
        echo json_encode([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user_data['id'],
                'name' => $user_data['name'],
                'email' => $user_data['email'],
                'role' => $user_data['role_name'],
                'role_display_name' => $user_data['role_display_name'],
                'permissions' => $user_data['permissions']
            ]
        ]);
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, email and password are required']);
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

        $this->user->name = $data['name'];
        $this->user->email = $data['email'];
        $this->user->password_hash = $data['password'];
        $this->user->role_id = 4; // Default to 'public' role

        if ($this->user->create()) {
            http_response_code(201);
            echo json_encode([
                'message' => 'User registered successfully',
                'user_id' => $this->user->id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Registration failed']);
        }
    }

    public function validateToken() {
        $headers = getallheaders();
        $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided']);
            return;
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, JWT_ALGORITHM));
            $user_data = $this->user->findById($decoded->user_id);

            if (!$user_data) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid token']);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'valid' => true,
                'user' => [
                    'id' => $user_data['id'],
                    'name' => $user_data['name'],
                    'email' => $user_data['email'],
                    'role' => $user_data['role_name'],
                    'role_display_name' => $user_data['role_display_name'],
                    'permissions' => $user_data['permissions']
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
        }
    }

    public function passwordReset() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email is required']);
            return;
        }

        $user_data = $this->user->findByEmail($data['email']);

        if (!$user_data) {
            http_response_code(200);
            echo json_encode(['message' => 'If the email exists, a reset link has been sent']);
            return;
        }

        $reset_token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $this->user->id = $user_data['id'];
        if ($this->user->setPasswordResetToken($reset_token, $expires)) {
            http_response_code(200);
            echo json_encode(['message' => 'Password reset link sent']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to generate reset token']);
        }
    }

    public function getCurrentUser() {
        $user = $this->authenticateRequest();
        if (!$user) return;

        http_response_code(200);
        echo json_encode(['user' => $user]);
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
}
?>