<?php
require_once __DIR__ . '/../config/config.php';

class EmailService {
    private $smtp_host;
    private $smtp_port;
    private $smtp_username;
    private $smtp_password;
    private $smtp_secure;
    
    public function __construct() {
        $this->smtp_host = defined('SMTP_HOST') ? SMTP_HOST : 'localhost';
        $this->smtp_port = defined('SMTP_PORT') ? SMTP_PORT : 587;
        $this->smtp_username = defined('SMTP_USERNAME') ? SMTP_USERNAME : '';
        $this->smtp_password = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : '';
        $this->smtp_secure = defined('SMTP_SECURE') ? SMTP_SECURE : 'tls';
    }
    
    public function sendEmail($to, $subject, $body, $isHTML = true) {
        // Use PHP's built-in mail() function for simplicity
        // In production, you should use PHPMailer or similar
        $headers = [
            'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM . '>',
            'Reply-To: ' . EMAIL_FROM,
            'X-Mailer: PHP/' . phpversion()
        ];
        
        if ($isHTML) {
            $headers[] = 'MIME-Version: 1.0';
            $headers[] = 'Content-type: text/html; charset=UTF-8';
        }
        
        $header_string = implode("\r\n", $headers);
        
        return mail($to, $subject, $body, $header_string);
    }
    
    public function sendVerificationEmail($user_email, $user_name, $verification_token) {
        $verification_url = FRONTEND_URL . '/verify-email?token=' . $verification_token;
        
        $subject = 'Please verify your email address';
        
        $body = $this->getVerificationEmailTemplate($user_name, $verification_url);
        
        return $this->sendEmail($user_email, $subject, $body, true);
    }
    
    public function sendPasswordResetEmail($user_email, $user_name, $reset_token) {
        $reset_url = FRONTEND_URL . '/reset-password?token=' . $reset_token;
        
        $subject = 'Password Reset Request';
        
        $body = $this->getPasswordResetEmailTemplate($user_name, $reset_url);
        
        return $this->sendEmail($user_email, $subject, $body, true);
    }
    
    private function getVerificationEmailTemplate($user_name, $verification_url) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Verification</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Ice Time Management System</h1>
                </div>
                <div class="content">
                    <h2>Hello ' . htmlspecialchars($user_name) . ',</h2>
                    <p>Thank you for registering with Ice Time Management System. To complete your registration, please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="' . htmlspecialchars($verification_url) . '" class="button">Verify Email Address</a>
                    </p>
                    <p>If the button doesn\'t work, you can also copy and paste this link into your browser:</p>
                    <p><a href="' . htmlspecialchars($verification_url) . '">' . htmlspecialchars($verification_url) . '</a></p>
                    <p>This verification link will expire in 24 hours for security reasons.</p>
                    <p>If you didn\'t create an account with us, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Ice Time Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
    }
    
    private function getPasswordResetEmailTemplate($user_name, $reset_url) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Reset</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello ' . htmlspecialchars($user_name) . ',</h2>
                    <p>We received a request to reset your password for Ice Time Management System. Click the button below to reset your password:</p>
                    <p style="text-align: center;">
                        <a href="' . htmlspecialchars($reset_url) . '" class="button">Reset Password</a>
                    </p>
                    <p>If the button doesn\'t work, you can also copy and paste this link into your browser:</p>
                    <p><a href="' . htmlspecialchars($reset_url) . '">' . htmlspecialchars($reset_url) . '</a></p>
                    <p>This password reset link will expire in 1 hour for security reasons.</p>
                    <p>If you didn\'t request a password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Ice Time Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
    }
}
?>