<?php
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']); exit; }
$name=trim($_POST['name'] ?? ''); $email=filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL); $message=trim($_POST['message'] ?? '');
if (!$name || !$email || !$message) { http_response_code(422); echo json_encode(['success'=>false,'message'=>'Please complete all required fields.']); exit; }
$config = @file_get_contents(__DIR__ . '/config/config.js');
preg_match("/email:\s*'([^']+)'/", $config ?: '', $match);
preg_match("/companyName:\s*'([^']+)'/", $config ?: '', $companyMatch);
$to = $match[1] ?? 'hello@sidings-studio.com';
$company = $companyMatch[1] ?? 'Website';
$domain = $_SERVER['HTTP_HOST'] ?? substr(strrchr($to, '@'), 1);
$domain = preg_replace('/:\d+$/', '', (string) $domain);
$from = 'no-reply@' . ($domain ?: substr(strrchr($to, '@'), 1));
$subject='New ' . $company . ' enquiry'; $body="Name: $name\nEmail: $email\n\n$message";
$headers = "From: {$company} <{$from}>\r\nReply-To: {$email}\r\n";
$sent=@mail($to,$subject,$body,$headers);
echo json_encode($sent ? ['success'=>true] : ['success'=>false,'message'=>'Unable to send your message. Please try again later.']);
