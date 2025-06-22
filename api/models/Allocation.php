<?php
require_once __DIR__ . '/../config/database.php';

class Allocation {
    private $conn;
    private $table_name = "allocations";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create allocation
    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (ice_time_slot_id, program_id, allocation_date, status, allocation_type, cost, notes, created_by) 
                  VALUES (:ice_time_slot_id, :program_id, :allocation_date, :status, :allocation_type, :cost, :notes, :created_by)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":ice_time_slot_id", $data['ice_time_slot_id']);
        $stmt->bindParam(":program_id", $data['program_id']);
        $stmt->bindParam(":allocation_date", $data['allocation_date']);
        $stmt->bindParam(":status", $data['status']);
        $stmt->bindParam(":allocation_type", $data['allocation_type']);
        $stmt->bindParam(":cost", $data['cost']);
        $stmt->bindParam(":notes", $data['notes']);
        $stmt->bindParam(":created_by", $data['created_by']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Get all allocations with joins for enriched data
    public function getAll($filters = []) {
        $query = "SELECT 
                    a.*,
                    its.day_of_week,
                    its.start_time,
                    its.end_time,
                    its.slot_type,
                    its.priority_level,
                    its.effective_date,
                    its.expiry_date,
                    isu.name as ice_surface_name,
                    f.name as facility_name,
                    f.id as facility_id,
                    p.name as program_name,
                    p.contact_email as program_contact,
                    creator.email as created_by_email
                  FROM " . $this->table_name . " a
                  LEFT JOIN ice_time_slots its ON a.ice_time_slot_id = its.id
                  LEFT JOIN ice_surfaces isu ON its.ice_surface_id = isu.id
                  LEFT JOIN facilities f ON isu.facility_id = f.id
                  LEFT JOIN programs p ON a.program_id = p.id
                  LEFT JOIN users creator ON a.created_by = creator.id";

        $conditions = [];
        $params = [];

        // Add filters
        if (isset($filters['facility_id'])) {
            $conditions[] = "f.id = :facility_id";
            $params[':facility_id'] = $filters['facility_id'];
        }

        if (isset($filters['program_id'])) {
            $conditions[] = "a.program_id = :program_id";
            $params[':program_id'] = $filters['program_id'];
        }

        if (isset($filters['status'])) {
            if (is_array($filters['status'])) {
                $placeholders = implode(',', array_fill(0, count($filters['status']), '?'));
                $conditions[] = "a.status IN ($placeholders)";
                $params = array_merge($params, $filters['status']);
            } else {
                $conditions[] = "a.status = :status";
                $params[':status'] = $filters['status'];
            }
        }

        if (isset($filters['ice_surface_id'])) {
            $conditions[] = "its.ice_surface_id = :ice_surface_id";
            $params[':ice_surface_id'] = $filters['ice_surface_id'];
        }

        if (isset($filters['date_from'])) {
            $conditions[] = "a.allocation_date >= :date_from";
            $params[':date_from'] = $filters['date_from'];
        }

        if (isset($filters['date_to'])) {
            $conditions[] = "a.allocation_date <= :date_to";
            $params[':date_to'] = $filters['date_to'];
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY a.allocation_date ASC, its.start_time ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get allocation by ID
    public function getById($id) {
        $query = "SELECT 
                    a.*,
                    its.day_of_week,
                    its.start_time,
                    its.end_time,
                    its.slot_type,
                    its.priority_level,
                    its.effective_date,
                    its.expiry_date,
                    isu.name as ice_surface_name,
                    f.name as facility_name,
                    f.id as facility_id,
                    p.name as program_name,
                    p.contact_email as program_contact,
                    creator.email as created_by_email
                  FROM " . $this->table_name . " a
                  LEFT JOIN ice_time_slots its ON a.ice_time_slot_id = its.id
                  LEFT JOIN ice_surfaces isu ON its.ice_surface_id = isu.id
                  LEFT JOIN facilities f ON isu.facility_id = f.id
                  LEFT JOIN programs p ON a.program_id = p.id
                  LEFT JOIN users creator ON a.created_by = creator.id
                  WHERE a.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Update allocation
    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET program_id = :program_id,
                      status = :status,
                      allocation_type = :allocation_type,
                      cost = :cost,
                      notes = :notes,
                      confirmed_at = :confirmed_at,
                      confirmed_by = :confirmed_by,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":program_id", $data['program_id']);
        $stmt->bindParam(":status", $data['status']);
        $stmt->bindParam(":allocation_type", $data['allocation_type']);
        $stmt->bindParam(":cost", $data['cost']);
        $stmt->bindParam(":notes", $data['notes']);
        $stmt->bindParam(":confirmed_at", $data['confirmed_at']);
        $stmt->bindParam(":confirmed_by", $data['confirmed_by']);

        return $stmt->execute();
    }

    // Delete allocation
    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
    }

    // Bulk create allocations for ice time slot (supports multi-day)
    public function createAllocationsForSlot($ice_time_slot_id, $effective_date, $expiry_date, $days_of_week, $created_by) {
        $allocations_created = 0;
        
        // Handle both legacy single day and new multi-day format
        if (is_numeric($days_of_week)) {
            // Legacy single day format
            $days_array = [(int)$days_of_week];
        } else if (is_string($days_of_week)) {
            // JSON string format
            $days_array = json_decode($days_of_week, true) ?: [];
        } else if (is_array($days_of_week)) {
            // Already an array
            $days_array = $days_of_week;
        } else {
            // Fallback
            $days_array = [1]; // Default to Monday
        }
        
        if (empty($days_array)) {
            return 0;
        }
        
        $start_date = new DateTime($effective_date);
        $end_date = $expiry_date ? new DateTime($expiry_date) : new DateTime('+1 year');
        
        // For each day of the week in the slot
        foreach ($days_array as $day_of_week) {
            $day_of_week = (int)$day_of_week;
            
            // Find the first occurrence of this day of week on or after effective_date
            $current_date = clone $start_date;
            
            // Adjust to the correct day of week
            while ($current_date->format('w') != $day_of_week) {
                $current_date->add(new DateInterval('P1D'));
            }
            
            // Create allocations for this day of week
            while ($current_date <= $end_date) {
                $allocation_data = [
                    'ice_time_slot_id' => $ice_time_slot_id,
                    'program_id' => 0, // Unassigned
                    'allocation_date' => $current_date->format('Y-m-d'),
                    'status' => 'available',
                    'allocation_type' => 'regular',
                    'cost' => null,
                    'notes' => 'Auto-created from ice time slot',
                    'created_by' => $created_by
                ];
                
                // Check if allocation already exists for this slot and date
                if (!$this->existsForSlotAndDate($ice_time_slot_id, $current_date->format('Y-m-d'))) {
                    if ($this->create($allocation_data)) {
                        $allocations_created++;
                    }
                }
                
                // Move to next week (same day next week)
                $current_date->add(new DateInterval('P7D'));
            }
        }
        
        return $allocations_created;
    }

    // Bulk assign allocations to a program
    public function bulkAssign($allocation_ids, $program_id, $cost = null, $notes = null, $assigned_by = null) {
        $query = "UPDATE " . $this->table_name . " 
                  SET program_id = :program_id,
                      status = 'proposed',
                      cost = :cost,
                      notes = :notes,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id IN (" . implode(',', array_fill(0, count($allocation_ids), '?')) . ")
                  AND status = 'available'";

        $stmt = $this->conn->prepare($query);
        
        $params = [$program_id, $cost, $notes];
        $params = array_merge($params, $allocation_ids);
        
        return $stmt->execute($params);
    }

    // Bulk unassign allocations
    public function bulkUnassign($allocation_ids) {
        $query = "UPDATE " . $this->table_name . " 
                  SET program_id = 0,
                      status = 'available',
                      cost = NULL,
                      notes = 'Unassigned',
                      confirmed_at = NULL,
                      confirmed_by = NULL,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id IN (" . implode(',', array_fill(0, count($allocation_ids), '?')) . ")";

        $stmt = $this->conn->prepare($query);
        return $stmt->execute($allocation_ids);
    }

    // Confirm allocation (program user action)
    public function confirm($id, $confirmed_by) {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = 'confirmed',
                      confirmed_at = CURRENT_TIMESTAMP,
                      confirmed_by = :confirmed_by,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id AND status = 'proposed'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":confirmed_by", $confirmed_by);
        
        return $stmt->execute();
    }

    // Decline allocation (program user action)
    public function decline($id, $notes = null) {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = 'declined',
                      notes = :notes,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id AND status = 'proposed'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":notes", $notes);
        
        return $stmt->execute();
    }

    // Get available allocations (unassigned)
    public function getAvailable($filters = []) {
        $filters['status'] = 'available';
        return $this->getAll($filters);
    }

    // Get pending confirmations for a program
    public function getPendingConfirmations($program_id) {
        $filters = [
            'program_id' => $program_id,
            'status' => 'proposed'
        ];
        return $this->getAll($filters);
    }

    // Get allocations by program
    public function getByProgram($program_id, $filters = []) {
        $filters['program_id'] = $program_id;
        return $this->getAll($filters);
    }

    // Check if allocation exists for slot and date
    public function existsForSlotAndDate($ice_time_slot_id, $allocation_date) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE ice_time_slot_id = :ice_time_slot_id 
                  AND allocation_date = :allocation_date";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":ice_time_slot_id", $ice_time_slot_id);
        $stmt->bindParam(":allocation_date", $allocation_date);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }
}
?>