<?php
class DashboardController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function getDashboardData() {
        try {
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'stats' => [
                        'total_facilities' => 0,
                        'total_programs' => 0,
                        'allocated_slots' => 0,
                        'pending_confirmations' => 0
                    ],
                    'recent_activity' => [],
                    'upcoming_allocations' => []
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to fetch dashboard data',
                'message' => $e->getMessage()
            ]);
        }
    }
}
?>