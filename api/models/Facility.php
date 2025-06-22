<?php
class Facility {
    private $conn;
    private $table = 'facilities';

    public $id;
    public $name;
    public $address;
    public $city;
    public $province;
    public $postal_code;
    public $phone;
    public $email;
    public $contact_person;
    public $facility_admin_id;
    public $active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  SET name = :name, 
                      address = :address, 
                      city = :city, 
                      province = :province, 
                      postal_code = :postal_code, 
                      phone = :phone, 
                      email = :email, 
                      contact_person = :contact_person, 
                      facility_admin_id = :facility_admin_id, 
                      active = :active";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(':name', htmlspecialchars(strip_tags($this->name)));
        $stmt->bindValue(':address', htmlspecialchars(strip_tags($this->address)));
        $stmt->bindValue(':city', htmlspecialchars(strip_tags($this->city)));
        $stmt->bindValue(':province', htmlspecialchars(strip_tags($this->province)));
        $stmt->bindValue(':postal_code', htmlspecialchars(strip_tags($this->postal_code)));
        $stmt->bindValue(':phone', htmlspecialchars(strip_tags($this->phone)));
        $stmt->bindValue(':email', htmlspecialchars(strip_tags($this->email)));
        $stmt->bindValue(':contact_person', htmlspecialchars(strip_tags($this->contact_person)));
        if ($this->facility_admin_id === null || $this->facility_admin_id === '') {
            $stmt->bindValue(':facility_admin_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':facility_admin_id', $this->facility_admin_id, PDO::PARAM_INT);
        }
        $stmt->bindValue(':active', $this->active);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function findById($id) {
        $query = "SELECT f.*, u.name as admin_name 
                  FROM " . $this->table . " f 
                  LEFT JOIN users u ON f.facility_admin_id = u.id 
                  WHERE f.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAll($limit = 25, $offset = 0) {
        $query = "SELECT f.*, u.name as admin_name 
                  FROM " . $this->table . " f 
                  LEFT JOIN users u ON f.facility_admin_id = u.id 
                  ORDER BY f.created_at DESC 
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function update($id) {
        $query = "UPDATE " . $this->table . " 
                  SET name = :name, 
                      address = :address, 
                      city = :city, 
                      province = :province, 
                      postal_code = :postal_code, 
                      phone = :phone, 
                      email = :email, 
                      contact_person = :contact_person, 
                      facility_admin_id = :facility_admin_id, 
                      active = :active,
                      updated_at = NOW()
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(':id', $id);
        $stmt->bindValue(':name', htmlspecialchars(strip_tags($this->name)));
        $stmt->bindValue(':address', htmlspecialchars(strip_tags($this->address)));
        $stmt->bindValue(':city', htmlspecialchars(strip_tags($this->city)));
        $stmt->bindValue(':province', htmlspecialchars(strip_tags($this->province)));
        $stmt->bindValue(':postal_code', htmlspecialchars(strip_tags($this->postal_code)));
        $stmt->bindValue(':phone', htmlspecialchars(strip_tags($this->phone)));
        $stmt->bindValue(':email', htmlspecialchars(strip_tags($this->email)));
        $stmt->bindValue(':contact_person', htmlspecialchars(strip_tags($this->contact_person)));
        if ($this->facility_admin_id === null || $this->facility_admin_id === '') {
            $stmt->bindValue(':facility_admin_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':facility_admin_id', $this->facility_admin_id, PDO::PARAM_INT);
        }
        $stmt->bindValue(':active', $this->active);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        return $stmt->execute();
    }

    public function getFacilityAdmins() {
        $query = "SELECT id, name, email FROM users WHERE role_id = 2 AND active = 1 ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>