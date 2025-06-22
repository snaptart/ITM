<?php
require_once __DIR__ . '/../models/Allocation.php';
require_once __DIR__ . '/../includes/jwt.php';

class CalendarController {
    private $db;
    private $allocation;

    public function __construct($database) {
        $this->db = $database;
        $this->allocation = new Allocation($database);
    }

    public function getEvents() {
        try {
            // Check authentication
            $current_user = $this->authenticateRequest();
            if (!$current_user) return;

            $filters = [];

            // Apply role-based filtering
            if (!$this->hasPermission($current_user, 'allocation_management')) {
                // Program users only see their own allocations
                $filters['program_id'] = $current_user['program_id'] ?? 0;
                
                // Also include available slots they might request
                $filters['status'] = ['available', 'proposed', 'confirmed'];
            }

            // Add query filters for date range
            if (isset($_GET['start'])) {
                $filters['date_from'] = $_GET['start'];
            }
            if (isset($_GET['end'])) {
                $filters['date_to'] = $_GET['end'];
            }
            if (isset($_GET['facility_id'])) {
                $filters['facility_id'] = $_GET['facility_id'];
            }

            // Get allocations data
            $allocations = $this->allocation->getAll($filters);
            
            // Transform allocations into FullCalendar events
            $events = [];
            foreach ($allocations as $allocation) {
                $event = $this->transformAllocationToEvent($allocation);
                if ($event) {
                    $events[] = $event;
                }
            }

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'events' => $events,
                'count' => count($events)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to fetch calendar events',
                'message' => $e->getMessage()
            ]);
        }
    }

    private function transformAllocationToEvent($allocation) {
        if (!$allocation['allocation_date'] || !$allocation['start_time'] || !$allocation['end_time']) {
            return null;
        }

        // Create event datetime strings
        $startDateTime = $allocation['allocation_date'] . 'T' . $allocation['start_time'];
        $endDateTime = $allocation['allocation_date'] . 'T' . $allocation['end_time'];

        // Determine event color and title based on status
        $colorMap = [
            'available' => '#9CA3AF',     // Gray - unassigned
            'proposed' => '#F59E0B',      // Yellow - proposed
            'confirmed' => '#10B981',     // Green - confirmed
            'declined' => '#EF4444',      // Red - declined
            'cancelled' => '#EF4444'      // Red - cancelled
        ];

        $color = $colorMap[$allocation['status']] ?? '#9CA3AF';

        // Build event title
        $title = '';
        if ($allocation['program_id'] == 0 || !$allocation['program_name']) {
            $title = 'Available';
        } else {
            $title = $allocation['program_name'];
            if ($allocation['status'] === 'proposed') {
                $title = 'Proposed: ' . $title;
            }
        }

        // Add ice surface info
        if ($allocation['ice_surface_name']) {
            $title .= ' - ' . $allocation['ice_surface_name'];
        }

        return [
            'id' => 'allocation_' . $allocation['id'],
            'title' => $title,
            'start' => $startDateTime,
            'end' => $endDateTime,
            'color' => $color,
            'extendedProps' => [
                'allocation_id' => $allocation['id'],
                'status' => $allocation['status'],
                'program_id' => $allocation['program_id'],
                'program_name' => $allocation['program_name'],
                'ice_surface_name' => $allocation['ice_surface_name'],
                'facility_name' => $allocation['facility_name'],
                'cost' => $allocation['cost'],
                'notes' => $allocation['notes'],
                'allocation_type' => $allocation['allocation_type'],
                'type' => 'allocation'
            ],
            'description' => $this->buildEventDescription($allocation)
        ];
    }

    private function buildEventDescription($allocation) {
        $description = '';
        
        if ($allocation['facility_name']) {
            $description .= "Facility: {$allocation['facility_name']}\n";
        }
        
        if ($allocation['ice_surface_name']) {
            $description .= "Ice Surface: {$allocation['ice_surface_name']}\n";
        }
        
        $description .= "Status: " . ucfirst($allocation['status']) . "\n";
        
        if ($allocation['program_name']) {
            $description .= "Program: {$allocation['program_name']}\n";
        }
        
        if ($allocation['cost']) {
            $description .= "Cost: $" . number_format($allocation['cost'], 2) . "\n";
        }
        
        if ($allocation['notes']) {
            $description .= "Notes: {$allocation['notes']}\n";
        }
        
        return trim($description);
    }

    private function authenticateRequest() {
        $headers = getallheaders();
        
        // Try different case variations of Authorization header
        $auth_header = '';
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $auth_header = $value;
                break;
            }
        }

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