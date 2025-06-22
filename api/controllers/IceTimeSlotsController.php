<?php
require_once __DIR__ . '/../models/IceTimeSlot.php';
require_once __DIR__ . '/../models/IceSurface.php';
require_once __DIR__ . '/../models/Allocation.php';
require_once __DIR__ . '/../includes/jwt.php';

class IceTimeSlotsController {
    private $db;
    private $ice_time_slot;
    private $allocation;

    public function __construct($db) {
        $this->db = $db;
        $this->ice_time_slot = new IceTimeSlot($db);
        $this->allocation = new Allocation($db);
    }

    public function getAll() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $ice_time_slots = $this->ice_time_slot->getAll($limit, $offset);
            $total = $this->ice_time_slot->getTotalCount();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'ice_time_slots' => $ice_time_slots,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice time slots: ' . $e->getMessage()
            ]);
        }
    }

    public function getById($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $ice_time_slot_data = $this->ice_time_slot->findById($id);
            
            if ($ice_time_slot_data) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'ice_time_slot' => $ice_time_slot_data
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice time slot not found'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice time slot: ' . $e->getMessage()
            ]);
        }
    }

    public function create() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $data = json_decode(file_get_contents("php://input"));

            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            if (!isset($data->ice_surface_id) || !isset($data->start_time) || !isset($data->end_time) || !isset($data->days_of_week) || !isset($data->effective_date)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice surface ID, start time, end time, days of week, and effective date are required'
                ]);
                return;
            }

            $this->ice_time_slot->ice_surface_id = $data->ice_surface_id;
            $this->ice_time_slot->days_of_week = $data->days_of_week;
            
            $this->ice_time_slot->start_time = $data->start_time;
            $this->ice_time_slot->end_time = $data->end_time;
            $this->ice_time_slot->effective_date = $data->effective_date;
            $this->ice_time_slot->expiry_date = isset($data->expiry_date) ? $data->expiry_date : null;
            $this->ice_time_slot->recurring = isset($data->recurring) ? $data->recurring : true;
            $this->ice_time_slot->slot_type = isset($data->slot_type) ? $data->slot_type : 'available';
            $this->ice_time_slot->priority_level = isset($data->priority_level) ? $data->priority_level : 1;
            $this->ice_time_slot->notes = isset($data->notes) ? $data->notes : '';
            $this->ice_time_slot->created_by = $current_user['id'];

            if ($this->ice_time_slot->create()) {
                $slot_id = $this->ice_time_slot->id;
                
                // Auto-create allocations for this ice time slot
                $allocations_created = 0;
                if ($this->ice_time_slot->recurring) {
                    $days_data = $this->ice_time_slot->days_of_week;
                    
                    $allocations_created = $this->allocation->createAllocationsForSlot(
                        $slot_id,
                        $this->ice_time_slot->effective_date,
                        $this->ice_time_slot->expiry_date,
                        $days_data,
                        $current_user['id']
                    );
                } else {
                    // For non-recurring slots, create a single allocation
                    $allocation_data = [
                        'ice_time_slot_id' => $slot_id,
                        'program_id' => null, // Unassigned
                        'allocation_date' => $this->ice_time_slot->effective_date,
                        'status' => 'available',
                        'allocation_type' => 'one_time',
                        'cost' => null,
                        'notes' => 'Auto-created from ice time slot',
                        'created_by' => $current_user['id']
                    ];
                    
                    if ($this->allocation->create($allocation_data)) {
                        $allocations_created = 1;
                    }
                }

                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Ice time slot created successfully',
                    'id' => $slot_id,
                    'allocations_created' => $allocations_created
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to create ice time slot'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating ice time slot: ' . $e->getMessage()
            ]);
        }
    }

    public function update($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $data = json_decode(file_get_contents("php://input"));

            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            $existing = $this->ice_time_slot->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice time slot not found'
                ]);
                return;
            }

            $this->ice_time_slot->ice_surface_id = isset($data->ice_surface_id) ? $data->ice_surface_id : $existing['ice_surface_id'];
            $this->ice_time_slot->days_of_week = isset($data->days_of_week) ? $data->days_of_week : $existing['days_of_week'];
            $this->ice_time_slot->start_time = isset($data->start_time) ? $data->start_time : $existing['start_time'];
            $this->ice_time_slot->end_time = isset($data->end_time) ? $data->end_time : $existing['end_time'];
            $this->ice_time_slot->effective_date = isset($data->effective_date) ? $data->effective_date : $existing['effective_date'];
            $this->ice_time_slot->expiry_date = isset($data->expiry_date) ? $data->expiry_date : $existing['expiry_date'];
            $this->ice_time_slot->recurring = isset($data->recurring) ? $data->recurring : $existing['recurring'];
            $this->ice_time_slot->slot_type = isset($data->slot_type) ? $data->slot_type : $existing['slot_type'];
            $this->ice_time_slot->priority_level = isset($data->priority_level) ? $data->priority_level : $existing['priority_level'];
            $this->ice_time_slot->notes = isset($data->notes) ? $data->notes : $existing['notes'];

            if ($this->ice_time_slot->update($id)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Ice time slot updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to update ice time slot'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating ice time slot: ' . $e->getMessage()
            ]);
        }
    }

    public function delete($id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $existing = $this->ice_time_slot->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ice time slot not found'
                ]);
                return;
            }

            $this->ice_time_slot->id = $id;
            
            if ($this->ice_time_slot->delete()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Ice time slot deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to delete ice time slot'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting ice time slot: ' . $e->getMessage()
            ]);
        }
    }

    public function getByIceSurface($ice_surface_id) {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $ice_time_slots = $this->ice_time_slot->getByIceSurfaceId($ice_surface_id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'ice_time_slots' => $ice_time_slots
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice time slots for ice surface: ' . $e->getMessage()
            ]);
        }
    }

    public function getAvailable() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        try {
            $ice_surface_id = isset($_GET['ice_surface_id']) ? $_GET['ice_surface_id'] : null;
            $date_from = isset($_GET['date_from']) ? $_GET['date_from'] : null;
            $date_to = isset($_GET['date_to']) ? $_GET['date_to'] : null;

            $ice_time_slots = $this->ice_time_slot->getAvailable($ice_surface_id, $date_from, $date_to);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'ice_time_slots' => $ice_time_slots
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving available ice time slots: ' . $e->getMessage()
            ]);
        }
    }

    public function getIceSurfaces() {
        $current_user = $this->authenticateRequest();
        if (!$current_user) return;

        if (!$this->hasPermission($current_user, 'ice_time_management')) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Insufficient permissions'
            ]);
            return;
        }

        try {
            $ice_surface = new IceSurface($this->db);
            $ice_surfaces = $ice_surface->getAll(100, 0);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'ice_surfaces' => $ice_surfaces
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving ice surfaces: ' . $e->getMessage()
            ]);
        }
    }


    private function authenticateRequest() {
        $headers = getallheaders();
        $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'No token provided'
            ]);
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
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid token'
                ]);
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
            echo json_encode([
                'success' => false,
                'message' => 'Invalid token'
            ]);
            return false;
        }
    }

    private function hasPermission($user, $permission) {
        return in_array($permission, $user['permissions'] ?? []);
    }
}
?>