<?php
class SSEController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function streamEvents() {
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Cache-Control');

        try {
            echo "data: " . json_encode([
                'type' => 'connection',
                'message' => 'Connected to event stream',
                'timestamp' => date('c')
            ]) . "\n\n";
            
            flush();
            
            while (true) {
                echo "data: " . json_encode([
                    'type' => 'heartbeat',
                    'timestamp' => date('c')
                ]) . "\n\n";
                
                flush();
                sleep(30);
            }
        } catch (Exception $e) {
            echo "data: " . json_encode([
                'type' => 'error',
                'message' => $e->getMessage()
            ]) . "\n\n";
            flush();
        }
    }
}
?>