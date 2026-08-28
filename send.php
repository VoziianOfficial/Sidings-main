<?php
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']); exit; }
$name=trim($_POST['name'] ?? ''); $email=filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL); $message=trim($_POST['message'] ?? '');
if (!$name || !$email || !$message) { http_response_code(422); echo json_encode(['success'=>false,'message'=>'Заполните все поля.']); exit; }
$config = @file_get_contents(__DIR__ . '/config/config.js');
preg_match("/email:\s*'([^']+)'/", $config ?: '', $match);
$to = $match[1] ?? 'hello@sidings-studio.com';
$subject='New SIDINGS enquiry'; $body="Name: $name\nEmail: $email\n\n$message";
$sent=@mail($to,$subject,$body,"From: $email\r\nReply-To: $email");
echo json_encode($sent ? ['success'=>true] : ['success'=>false,'message'=>'Не удалось отправить. Попробуйте позже.']);
