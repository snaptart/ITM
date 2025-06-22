<?php
class IceTimeSlot {
    private $conn;
    private $table = 'ice_time_slots';

    public $id;
    public $ice_surface_id;
    public $day_of_week;
    public $start_time;
    public $end_time;
    public $effective_date;
    public $expiry_date;
    public $recurring;
    public $slot_type;
    public $priority_level;
    public $notes;
    public $created_by;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  SET ice_surface_id = :ice_surface_id, 
                      day_of_week = :day_of_week, 
                      start_time = :start_time, 
                      end_time = :end_time, 
                      effective_date = :effective_date, 
                      expiry_date = :expiry_date, 
                      recurring = :recurring, 
                      slot_type = :slot_type, 
                      priority_level = :priority_level, 
                      notes = :notes, 
                      created_by = :created_by";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(':ice_surface_id', $this->ice_surface_id, PDO::PARAM_INT);
        $stmt->bindValue(':day_of_week', $this->day_of_week, PDO::PARAM_INT);
        $stmt->bindValue(':start_time', $this->start_time);
        $stmt->bindValue(':end_time', $this->end_time);
        $stmt->bindValue(':effective_date', $this->effective_date);
        
        if ($this->expiry_date === null || $this->expiry_date === '') {
            $stmt->bindValue(':expiry_date', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':expiry_date', $this->expiry_date);
        }
        
        $stmt->bindValue(':recurring', $this->recurring ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':slot_type', $this->slot_type);
        
        if ($this->priority_level === null || $this->priority_level === '') {
            $stmt->bindValue(':priority_level', 1, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':priority_level', $this->priority_level, PDO::PARAM_INT);
        }
        
        $stmt->bindValue(':notes', htmlspecialchars(strip_tags($this->notes)));
        
        if ($this->created_by === null || $this->created_by === '') {
            $stmt->bindValue(':created_by', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':created_by', $this->created_by, PDO::PARAM_INT);
        }

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function findById($id) {
        $query = "SELECT its.*, 
                         ice.name as ice_surface_name, 
                         f.name as facility_name,
                         u.name as created_by_name
                  FROM " . $this->table . " its
                  LEFT JOIN ice_surfaces ice ON its.ice_surface_id = ice.id
                  LEFT JOIN facilities f ON ice.facility_id = f.id
                  LEFT JOIN users u ON its.created_by = u.id
                  WHERE its.id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->id = $row['id'];
            $this->ice_surface_id = $row['ice_surface_id'];
            $this->day_of_week = $row['day_of_week'];
            $this->start_time = $row['start_time'];
            $this->end_time = $row['end_time'];
            $this->effective_date = $row['effective_date'];
            $this->expiry_date = $row['expiry_date'];
            $this->recurring = $row['recurring'];
            $this->slot_type = $row['slot_type'];
            $this->priority_level = $row['priority_level'];
            $this->notes = $row['notes'];
            $this->created_by = $row['created_by'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            
            return $row;
        }

        return false;
    }

    public function getAll($limit = 25, $offset = 0) {
        $query = "SELECT its.*, 
                         ice.name as ice_surface_name, 
                         f.name as facility_name,
                         u.name as created_by_name
                  FROM " . $this->table . " its
                  LEFT JOIN ice_surfaces ice ON its.ice_surface_id = ice.id
                  LEFT JOIN facilities f ON ice.facility_id = f.id
                  LEFT JOIN users u ON its.created_by = u.id
                  ORDER BY f.name, ice.name, its.day_of_week, its.start_time 
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $ice_time_slots = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ice_time_slots[] = $row;
        }

        return $ice_time_slots;
    }

    public function update($id) {
        $query = "UPDATE " . $this->table . " 
                  SET ice_surface_id = :ice_surface_id, 
                      day_of_week = :day_of_week, 
                      start_time = :start_time, 
                      end_time = :end_time, 
                      effective_date = :effective_date, 
                      expiry_date = :expiry_date, 
                      recurring = :recurring, 
                      slot_type = :slot_type, 
                      priority_level = :priority_level, 
                      notes = :notes, 
                      updated_at = CURRENT_TIMESTAMP 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(':ice_surface_id', $this->ice_surface_id, PDO::PARAM_INT);
        $stmt->bindValue(':day_of_week', $this->day_of_week, PDO::PARAM_INT);
        $stmt->bindValue(':start_time', $this->start_time);
        $stmt->bindValue(':end_time', $this->end_time);
        $stmt->bindValue(':effective_date', $this->effective_date);
        
        if ($this->expiry_date === null || $this->expiry_date === '') {
            $stmt->bindValue(':expiry_date', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':expiry_date', $this->expiry_date);
        }
        
        $stmt->bindValue(':recurring', $this->recurring ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':slot_type', $this->slot_type);
        
        if ($this->priority_level === null || $this->priority_level === '') {
            $stmt->bindValue(':priority_level', 1, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':priority_level', $this->priority_level, PDO::PARAM_INT);
        }
        
        $stmt->bindValue(':notes', htmlspecialchars(strip_tags($this->notes)));
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

    public function getByIceSurfaceId($ice_surface_id) {
        $query = "SELECT its.*, 
                         ice.name as ice_surface_name, 
                         f.name as facility_name,
                         u.name as created_by_name
                  FROM " . $this->table . " its
                  LEFT JOIN ice_surfaces ice ON its.ice_surface_id = ice.id
                  LEFT JOIN facilities f ON ice.facility_id = f.id
                  LEFT JOIN users u ON its.created_by = u.id
                  WHERE its.ice_surface_id = :ice_surface_id 
                  ORDER BY its.day_of_week, its.start_time";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':ice_surface_id', $ice_surface_id, PDO::PARAM_INT);
        $stmt->execute();

        $ice_time_slots = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ice_time_slots[] = $row;
        }

        return $ice_time_slots;
    }

    public function getAvailable($ice_surface_id = null, $date_from = null, $date_to = null) {
        $where_conditions = ["its.slot_type = 'available'"];
        $params = [];

        if ($ice_surface_id) {
            $where_conditions[] = "its.ice_surface_id = :ice_surface_id";
            $params[':ice_surface_id'] = $ice_surface_id;
        }

        if ($date_from) {
            $where_conditions[] = "its.effective_date <= :date_to";
            $where_conditions[] = "(its.expiry_date IS NULL OR its.expiry_date >= :date_from)";
            $params[':date_from'] = $date_from;
            $params[':date_to'] = $date_to ?: $date_from;
        }

        $query = "SELECT its.*, 
                         ice.name as ice_surface_name, 
                         f.name as facility_name
                  FROM " . $this->table . " its
                  LEFT JOIN ice_surfaces ice ON its.ice_surface_id = ice.id
                  LEFT JOIN facilities f ON ice.facility_id = f.id
                  WHERE " . implode(' AND ', $where_conditions) . "
                  ORDER BY f.name, ice.name, its.day_of_week, its.start_time";

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();

        $ice_time_slots = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ice_time_slots[] = $row;
        }

        return $ice_time_slots;
    }

    public function getByDateRange($date_from, $date_to, $ice_surface_id = null) {
        $where_conditions = [
            "its.effective_date <= :date_to",
            "(its.expiry_date IS NULL OR its.expiry_date >= :date_from)"
        ];
        $params = [':date_from' => $date_from, ':date_to' => $date_to];

        if ($ice_surface_id) {
            $where_conditions[] = "its.ice_surface_id = :ice_surface_id";
            $params[':ice_surface_id'] = $ice_surface_id;
        }

        $query = "SELECT its.*, 
                         ice.name as ice_surface_name, 
                         f.name as facility_name,
                         u.name as created_by_name
                  FROM " . $this->table . " its
                  LEFT JOIN ice_surfaces ice ON its.ice_surface_id = ice.id
                  LEFT JOIN facilities f ON ice.facility_id = f.id
                  LEFT JOIN users u ON its.created_by = u.id
                  WHERE " . implode(' AND ', $where_conditions) . "
                  ORDER BY f.name, ice.name, its.day_of_week, its.start_time";

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();

        $ice_time_slots = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ice_time_slots[] = $row;
        }

        return $ice_time_slots;
    }
}
?>