<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $name;
    public $email;
    public $password_hash;
    public $role_id;
    public $email_verified;
    public $email_verification_token;
    public $password_reset_token;
    public $password_reset_expires;
    public $created_at;
    public $updated_at;
    public $active;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 SET name=:name, email=:email, password_hash=:password_hash, role_id=:role_id";

        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT, ['cost' => BCRYPT_ROUNDS]);
        $this->role_id = intval($this->role_id);

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":role_id", $this->role_id);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function findByEmail($email) {
        $query = "SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.permissions 
                 FROM " . $this->table_name . " u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.email = :email AND u.active = 1 
                 LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->email = $row['email'];
            $this->password_hash = $row['password_hash'];
            $this->role_id = $row['role_id'];
            $this->email_verified = $row['email_verified'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            $this->active = $row['active'];
            
            return [
                'id' => $this->id,
                'name' => $this->name,
                'email' => $this->email,
                'password_hash' => $this->password_hash,
                'role_id' => $this->role_id,
                'role_name' => $row['role_name'],
                'role_display_name' => $row['role_display_name'],
                'permissions' => json_decode($row['permissions'] ?? '[]', true),
                'email_verified' => $this->email_verified,
                'created_at' => $this->created_at,
                'updated_at' => $this->updated_at
            ];
        }

        return false;
    }

    public function findById($id) {
        $query = "SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.permissions 
                 FROM " . $this->table_name . " u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = :id AND u.active = 1 
                 LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            return [
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role_id' => $row['role_id'],
                'role_name' => $row['role_name'],
                'role_display_name' => $row['role_display_name'],
                'permissions' => json_decode($row['permissions'] ?? '[]', true),
                'email_verified' => $row['email_verified'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
        }

        return false;
    }

    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    public function verifyPassword($password) {
        return password_verify($password, $this->password_hash);
    }

    public function updateLastLogin() {
        $query = "UPDATE " . $this->table_name . " SET updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        return $stmt->execute();
    }

    public function setPasswordResetToken($token, $expires) {
        $query = "UPDATE " . $this->table_name . " 
                 SET password_reset_token = :token, password_reset_expires = :expires 
                 WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expires', $expires);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }

    public function resetPassword($new_password) {
        $password_hash = password_hash($new_password, PASSWORD_BCRYPT, ['cost' => BCRYPT_ROUNDS]);
        
        $query = "UPDATE " . $this->table_name . " 
                 SET password_hash = :password_hash, 
                     password_reset_token = NULL, 
                     password_reset_expires = NULL 
                 WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':password_hash', $password_hash);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }

    public function getAll($limit = 50, $offset = 0) {
        $query = "SELECT u.*, r.name as role_name, r.display_name as role_display_name 
                 FROM " . $this->table_name . " u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.active = 1 
                 ORDER BY u.created_at DESC 
                 LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE active = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }
}
?>