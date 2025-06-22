<?php
require_once __DIR__ . '/../models/Allocation.php';
require_once __DIR__ . '/../includes/jwt.php';

class AllocationController {
    private $allocation;
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
        $this->allocation = new Allocation($db);
    }

    // GET /api/allocations - Get all allocations with filtering
    public function getAll() {
        try {
            // Check authentication and permissions
            $current_user = $this->authenticateRequest();
            if (!$current_user) return;

            $filters = [];

            // Apply role-based filtering
            if ($this->hasPermission($current_user, 'allocation_management')) {
                // Facility admin - can see all allocations for their facilities
                if (isset($_GET['facility_id'])) {
                    $filters['facility_id'] = $_GET['facility_id'];
                }
            } else {
                // Program user - only see their own allocations and available slots
                $filters['program_id'] = $current_user['program_id'] ?? 0;
                
                // Also include available slots they might request
                if (!isset($_GET['include_available']) || $_GET['include_available'] === 'true') {
                    $filters['status'] = ['available', 'proposed', 'confirmed'];
                }
            }

            // Add other filters from query params
            if (isset($_GET['status'])) {
                $filters['status'] = $_GET['status'];
            }
            if (isset($_GET['ice_surface_id'])) {
                $filters['ice_surface_id'] = $_GET['ice_surface_id'];
            }
            if (isset($_GET['date_from'])) {
                $filters['date_from'] = $_GET['date_from'];
            }
            if (isset($_GET['date_to'])) {
                $filters['date_to'] = $_GET['date_to'];
            }

            $allocations = $this->allocation->getAll($filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $allocations,
                'count' => count($allocations)
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch allocations: ' . $e->getMessage()]);
        }
    }

    // GET /api/allocations/{id} - Get allocation by ID
    public function getById($id) {
        try {
            $current_user = $this->authenticateRequest();
            if (!$current_user) return;

            $allocation = $this->allocation->getById($id);
            
            if (!$allocation) {
                http_response_code(404);
                echo json_encode(['error' => 'Allocation not found']);
                return;
            }
            
            // Check if user can view this allocation
            if (!$this->hasPermission($current_user, 'allocation_management')) {
                // Program users can only see their own allocations
                if ($allocation['program_id'] != ($current_user['program_id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied']);
                    return;
                }
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $allocation
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch allocation: ' . $e->getMessage()]);
        }
    }

    // POST /api/allocations - Create/assign allocation
    public function create() {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            if (!$this->hasPermission($current_user, 'allocation_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['ice_time_slot_id']) || !isset($data['program_id']) || !isset($data['allocation_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                return;
            }

            // Check if allocation already exists
            if ($this->allocation->existsForSlotAndDate($data['ice_time_slot_id'], $data['allocation_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Allocation already exists for this slot and date']);
                return;
            }

            $allocation_data = [
                'ice_time_slot_id' => $data['ice_time_slot_id'],
                'program_id' => $data['program_id'],
                'allocation_date' => $data['allocation_date'],
                'status' => $data['program_id'] == 0 ? 'available' : 'proposed',
                'allocation_type' => $data['allocation_type'] ?? 'regular',
                'cost' => $data['cost'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $auth_result['user']['id']
            ];

            $allocation_id = $this->allocation->create($allocation_data);
            
            if ($allocation_id) {
                $created_allocation = $this->allocation->getById($allocation_id);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $created_allocation,
                    'message' => 'Allocation created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create allocation']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create allocation: ' . $e->getMessage()]);
        }
    }

    // PUT /api/allocations/{id} - Update allocation
    public function update($id) {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            if (!$this->hasPermission($current_user, 'allocation_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            // Get existing allocation
            $existing = $this->allocation->getById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['error' => 'Allocation not found']);
                return;
            }

            $update_data = [
                'program_id' => $data['program_id'] ?? $existing['program_id'],
                'status' => $data['status'] ?? $existing['status'],
                'allocation_type' => $data['allocation_type'] ?? $existing['allocation_type'],
                'cost' => $data['cost'] ?? $existing['cost'],
                'notes' => $data['notes'] ?? $existing['notes'],
                'confirmed_at' => $data['confirmed_at'] ?? $existing['confirmed_at'],
                'confirmed_by' => $data['confirmed_by'] ?? $existing['confirmed_by']
            ];

            if ($this->allocation->update($id, $update_data)) {
                $updated_allocation = $this->allocation->getById($id);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updated_allocation,
                    'message' => 'Allocation updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update allocation']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update allocation: ' . $e->getMessage()]);
        }
    }

    // DELETE /api/allocations/{id} - Delete allocation
    public function delete($id) {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            if (!$this->hasPermission($current_user, 'allocation_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions']);
                return;
            }

            $allocation = $this->allocation->getById($id);
            if (!$allocation) {
                http_response_code(404);
                echo json_encode(['error' => 'Allocation not found']);
                return;
            }

            if ($this->allocation->delete($id)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Allocation deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete allocation']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete allocation: ' . $e->getMessage()]);
        }
    }

    // POST /api/allocations/bulk-assign - Bulk assign allocations to program
    public function bulkAssign() {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            if (!$this->hasPermission($current_user, 'allocation_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['allocation_ids']) || !isset($data['program_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields: allocation_ids, program_id']);
                return;
            }

            if (!is_array($data['allocation_ids']) || empty($data['allocation_ids'])) {
                http_response_code(400);
                echo json_encode(['error' => 'allocation_ids must be a non-empty array']);
                return;
            }

            $result = $this->allocation->bulkAssign(
                $data['allocation_ids'],
                $data['program_id'],
                $data['cost'] ?? null,
                $data['notes'] ?? null,
                $auth_result['user']['id']
            );

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Allocations assigned successfully',
                    'assigned_count' => count($data['allocation_ids'])
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to assign allocations']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to bulk assign: ' . $e->getMessage()]);
        }
    }

    // POST /api/allocations/bulk-unassign - Bulk unassign allocations
    public function bulkUnassign() {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            if (!$this->hasPermission($current_user, 'allocation_management')) {
                http_response_code(403);
                echo json_encode(['error' => 'Insufficient permissions']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['allocation_ids']) || !is_array($data['allocation_ids']) || empty($data['allocation_ids'])) {
                http_response_code(400);
                echo json_encode(['error' => 'allocation_ids must be a non-empty array']);
                return;
            }

            $result = $this->allocation->bulkUnassign($data['allocation_ids']);

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Allocations unassigned successfully',
                    'unassigned_count' => count($data['allocation_ids'])
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to unassign allocations']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to bulk unassign: ' . $e->getMessage()]);
        }
    }

    // POST /api/allocations/confirm/{id} - Confirm allocation (program user)
    public function confirm($id) {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $allocation = $this->allocation->getById($id);
            if (!$allocation) {
                http_response_code(404);
                echo json_encode(['error' => 'Allocation not found']);
                return;
            }

            $current_user = $auth_result['user'];

            // Check if user can confirm this allocation
            if (!$this->hasPermission($current_user, 'allocation_management')) {
                // Program user can only confirm their own allocations
                if ($allocation['program_id'] != ($current_user['program_id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied']);
                    return;
                }
            }

            if ($allocation['status'] !== 'proposed') {
                http_response_code(400);
                echo json_encode(['error' => 'Only proposed allocations can be confirmed']);
                return;
            }

            if ($this->allocation->confirm($id, $current_user['id'])) {
                $updated_allocation = $this->allocation->getById($id);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updated_allocation,
                    'message' => 'Allocation confirmed successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to confirm allocation']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to confirm allocation: ' . $e->getMessage()]);
        }
    }

    // POST /api/allocations/decline/{id} - Decline allocation (program user)
    public function decline($id) {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $allocation = $this->allocation->getById($id);
            if (!$allocation) {
                http_response_code(404);
                echo json_encode(['error' => 'Allocation not found']);
                return;
            }

            $current_user = $auth_result['user'];

            // Check if user can decline this allocation
            if (!$this->hasPermission($current_user, 'allocation_management')) {
                // Program user can only decline their own allocations
                if ($allocation['program_id'] != ($current_user['program_id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied']);
                    return;
                }
            }

            if ($allocation['status'] !== 'proposed') {
                http_response_code(400);
                echo json_encode(['error' => 'Only proposed allocations can be declined']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $decline_notes = $data['notes'] ?? 'Declined by program user';

            if ($this->allocation->decline($id, $decline_notes)) {
                $updated_allocation = $this->allocation->getById($id);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updated_allocation,
                    'message' => 'Allocation declined successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to decline allocation']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to decline allocation: ' . $e->getMessage()]);
        }
    }

    // GET /api/allocations/available - Get available (unassigned) allocations
    public function getAvailable() {
        try {
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $filters = [];

            // Add query filters
            if (isset($_GET['facility_id'])) {
                $filters['facility_id'] = $_GET['facility_id'];
            }
            if (isset($_GET['ice_surface_id'])) {
                $filters['ice_surface_id'] = $_GET['ice_surface_id'];
            }
            if (isset($_GET['date_from'])) {
                $filters['date_from'] = $_GET['date_from'];
            }
            if (isset($_GET['date_to'])) {
                $filters['date_to'] = $_GET['date_to'];
            }

            $allocations = $this->allocation->getAvailable($filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $allocations,
                'count' => count($allocations)
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch available allocations: ' . $e->getMessage()]);
        }
    }

    // GET /api/allocations/pending-confirmation - Get allocations pending confirmation
    public function getPendingConfirmations() {
        try {
            $current_user = $this->authenticateRequest();
            if (!$current_user) return;
            $program_id = $_GET['program_id'] ?? ($current_user['program_id'] ?? null);

            if (!$program_id) {
                http_response_code(400);
                echo json_encode(['error' => 'Program ID required']);
                return;
            }

            // Non-admin users can only see their own pending confirmations
            if (!$this->hasPermission($current_user, 'allocation_management')) {
                if ($program_id != ($current_user['program_id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied']);
                    return;
                }
            }

            $allocations = $this->allocation->getPendingConfirmations($program_id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $allocations,
                'count' => count($allocations)
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch pending confirmations: ' . $e->getMessage()]);
        }
    }

    // GET /api/allocations/by-program/{program_id} - Get allocations for a program
    public function getByProgram($program_id) {
        try {
            $current_user = $this->authenticateRequest();
            if (!$current_user) return;

            // Non-admin users can only see their own program's allocations
            if (!$this->hasPermission($current_user, 'allocation_management')) {
                if ($program_id != ($current_user['program_id'] ?? 0)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied']);
                    return;
                }
            }

            $filters = [];
            if (isset($_GET['date_from'])) {
                $filters['date_from'] = $_GET['date_from'];
            }
            if (isset($_GET['date_to'])) {
                $filters['date_to'] = $_GET['date_to'];
            }

            $allocations = $this->allocation->getByProgram($program_id, $filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $allocations,
                'count' => count($allocations)
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch program allocations: ' . $e->getMessage()]);
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
            
            // Get fresh user data from database to ensure current permissions
            require_once __DIR__ . '/../models/User.php';
            $user_model = new User($this->db);
            $user_data = $user_model->findById($decoded->user_id);

            if (!$user_data) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid token']);
                return false;
            }

            return [
                'user_id' => $user_data['id'],
                'id' => $user_data['id'],
                'name' => $user_data['name'],
                'email' => $user_data['email'],
                'role' => $user_data['role_name'],
                'role_display_name' => $user_data['role_display_name'],
                'permissions' => $user_data['permissions'],
                'program_id' => $user_data['program_id'] ?? null
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
}
?>