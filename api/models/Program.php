<?php

class Program {
    private $conn;
    private $table = 'programs';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($limit = 25, $offset = 0) {
        $query = "SELECT p.*, 
                         u.name as contact_person_name, 
                         u.email as contact_person_email
                  FROM {$this->table} p
                  LEFT JOIN users u ON p.program_admin_id = u.id
                  ORDER BY p.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM {$this->table}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function getById($id) {
        $query = "SELECT p.*, 
                         u.name as contact_person_name, 
                         u.email as contact_person_email
                  FROM {$this->table} p
                  LEFT JOIN users u ON p.program_admin_id = u.id
                  WHERE p.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (name, program_type, contact_person, contact_email, contact_phone, 
                   program_admin_id, description, active) 
                  VALUES 
                  (:name, :program_type, :contact_person, :contact_email, :contact_phone, 
                   :program_admin_id, :description, :active)";
        
        $stmt = $this->conn->prepare($query);
        
        // Bind parameters
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':program_type', $data['program_type']);
        $stmt->bindParam(':contact_person', $data['contact_person']);
        $stmt->bindParam(':contact_email', $data['contact_email']);
        $stmt->bindParam(':contact_phone', $data['contact_phone']);
        $stmt->bindParam(':program_admin_id', $data['program_admin_id']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }

    public function update($id, $data) {
        $query = "UPDATE {$this->table} 
                  SET name = :name, 
                      program_type = :program_type, 
                      contact_person = :contact_person, 
                      contact_email = :contact_email, 
                      contact_phone = :contact_phone, 
                      program_admin_id = :program_admin_id, 
                      description = :description, 
                      active = :active,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        // Bind parameters
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':program_type', $data['program_type']);
        $stmt->bindParam(':contact_person', $data['contact_person']);
        $stmt->bindParam(':contact_email', $data['contact_email']);
        $stmt->bindParam(':contact_phone', $data['contact_phone']);
        $stmt->bindParam(':program_admin_id', $data['program_admin_id']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);
        
        return $stmt->execute();
    }

    public function delete($id) {
        // Check if program has allocations
        $check_query = "SELECT COUNT(*) as count FROM allocations WHERE program_id = :id";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $check_stmt->execute();
        $result = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            return ['error' => 'Cannot delete program with existing allocations'];
        }
        
        // Delete program
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function validateData($data, $isUpdate = false) {
        $errors = [];
        
        // Required fields
        if (empty($data['name'])) {
            $errors[] = 'Program name is required';
        }
        
        if (empty($data['program_type'])) {
            $errors[] = 'Program type is required';
        }
        
        // Validate program type
        $valid_types = ['hockey', 'figure_skating', 'speed_skating', 'curling', 'public_skating', 'other'];
        if (!empty($data['program_type']) && !in_array($data['program_type'], $valid_types)) {
            $errors[] = 'Invalid program type';
        }
        
        // Validate email format if provided
        if (!empty($data['contact_email']) && !filter_var($data['contact_email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Invalid email format';
        }
        
        // Validate program admin exists if provided
        if (!empty($data['program_admin_id'])) {
            $user_query = "SELECT id FROM users WHERE id = :id AND active = 1";
            $user_stmt = $this->conn->prepare($user_query);
            $user_stmt->bindParam(':id', $data['program_admin_id'], PDO::PARAM_INT);
            $user_stmt->execute();
            
            if ($user_stmt->rowCount() === 0) {
                $errors[] = 'Invalid program administrator';
            }
        }
        
        return $errors;
    }

    public function checkNameExists($name, $excludeId = null) {
        $query = "SELECT id FROM {$this->table} WHERE name = :name";
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $name);
        
        if ($excludeId) {
            $stmt->bindParam(':exclude_id', $excludeId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function getByFacility($facilityId) {
        // This would be used if we add facility association to programs
        // For now, return all programs
        return $this->getAll();
    }
}