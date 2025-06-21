<?php
/**
 * Simple JWT implementation for Ice Time Management System
 * Based on Firebase JWT library structure but simplified
 */

class JWT {
    public static function encode($payload, $key, $alg = 'HS256') {
        $header = json_encode(['typ' => 'JWT', 'alg' => $alg]);
        $payload = json_encode($payload);
        
        $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $key, true);
        $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }
    
    public static function decode($jwt, $key) {
        $parts = explode('.', $jwt);
        
        if (count($parts) != 3) {
            throw new Exception('Wrong number of segments');
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $headerEncoded)), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadEncoded)), true);
        
        if (!$header || !$payload) {
            throw new Exception('Invalid encoding');
        }
        
        if ($header['alg'] !== 'HS256') {
            throw new Exception('Algorithm not supported');
        }
        
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $signatureEncoded));
        $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $key->getKeyMaterial(), true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception('Signature verification failed');
        }
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token has expired');
        }
        
        return (object) $payload;
    }
}

class Key {
    private $keyMaterial;
    private $algorithm;
    
    public function __construct($keyMaterial, $algorithm = 'HS256') {
        $this->keyMaterial = $keyMaterial;
        $this->algorithm = $algorithm;
    }
    
    public function getKeyMaterial() {
        return $this->keyMaterial;
    }
    
    public function getAlgorithm() {
        return $this->algorithm;
    }
}
?>