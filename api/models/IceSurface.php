<?php
class IceSurface {
    private $conn;
    private $table = 'ice_surfaces';

    public $id;
    public $facility_id;
    public $name;
    public $surface_type;
    public $capacity;
    public $hourly_rate;
    public $description;
    public $active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  SET facility_id = :facility_id, 
                      name = :name, 
                      surface_type = :surface_type, 
                      capacity = :capacity, 
                      hourly_rate = :hourly_rate, 
                      description = :description, 
                      active = :active";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(':facility_id', $this->facility_id, PDO::PARAM_INT);
        $stmt->bindValue(':name', htmlspecialchars(strip_tags($this->name)));
        $stmt->bindValue(':surface_type', htmlspecialchars(strip_tags($this->surface_type)));
        
        if ($this->capacity === null || $this->capacity === '') {
            $stmt->bindValue(':capacity', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':capacity', $this->capacity, PDO::PARAM_INT);
        }
        
        if ($this->hourly_rate === null || $this->hourly_rate === '') {
            $stmt->bindValue(':hourly_rate', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':hourly_rate', $this->hourly_rate);
        }
        
        $stmt->bindValue(':description', htmlspecialchars(strip_tags($this->description)));
        $stmt->bindValue(':active', $this->active ? 1 : 0, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function findById($id) {
        $query = "SELECT ice.*, f.name as facility_name 
                  FROM " . $this->table . " ice
                  LEFT JOIN facilities f ON ice.facility_id = f.id 
                  WHERE ice.id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->id = $row['id'];
            $this->facility_id = $row['facility_id'];
            $this->name = $row['name'];
            $this->surface_type = $row['surface_type'];
            $this->capacity = $row['capacity'];
            $this->hourly_rate = $row['hourly_rate'];
            $this->description = $row['description'];
            $this->active = $row['active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            
            return $row;
        }

        return false;
    }

    public function getAll($limit = 25, $offset = 0) {
        $query = "SELECT ice.*, f.name as facility_name 
                  FROM " . $this->table . " ice
                  LEFT JOIN facilities f ON ice.facility_id = f.id 
                  ORDER BY f.name, ice.name 
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $ice_surfaces = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ice_surfaces[] = $row;
        }

        return $ice_surfaces;
    }

    public function update($id) {
        $query = "UPDATE " . $this->table . " 
                  SET facility_id = :facility_id, 
                      name = :name, 
                      surface_type = :surface_type, 
                      capacity = :capacity, 
                      hourly_rate = :hourly_rate, 
                      description = :description, 
                      active = :active, 
                      updated_at = CURRENT_TIMESTAMP 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(':facility_id', $this->facility_id, PDO::PARAM_INT);
        $stmt->bindValue(':name', htmlspecialchars(strip_tags($this->name)));
        $stmt->bindValue(':surface_type', htmlspecialchars(strip_tags($this->surface_type)));
        
        if ($this->capacity === null || $this->capacity === '') {
            $stmt->bindValue(':capacity', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':capacity', $this->capacity, PDO::PARAM_INT);
        }
        
        if ($this->hourly_rate === null || $this->hourly_rate === '') {
            $stmt->bindValue(':hourly_rate', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':hourly_rate', $this->hourly_rate);
        }
        
        $stmt->bindValue(':description', htmlspecialchars(strip_tags($this->description)));
        $stmt->bindValue(':active', $this->active ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    public function getByFacilityId($facility_id) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE facility_id = :facility_id AND active = 1 
                  ORDER BY name";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':facility_id', $facility_id, PDO::PARAM_INT);
        $stmt->execute();

        $ice_surfaces = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ice_surfaces[] = $row;
        }

        return $ice_surfaces;
    }
}
?>