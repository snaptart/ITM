<?php
require_once __DIR__ . '/../models/Allocation.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

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
            $auth_result = AuthMiddleware::authenticate();
            if (!$auth_result['success']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }

            $user = $auth_result['user'];
            $filters = [];

            // Apply role-based filtering
            if (!AuthMiddleware::hasPermission($user['role'], 'allocation_management')) {
                // Program users only see their own allocations
                $filters['program_id'] = $user['program_id'] ?? 0;
                
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
}
?>