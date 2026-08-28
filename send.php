<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $success, string $message = ''): void
{
    http_response_code($status);
    $payload = ['success' => $success];
    if ($message !== '') {
        $payload['message'] = $message;
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_text(?string $value, int $limit): string
{
    $value = trim((string) $value);
    $value = preg_replace('/[^\P{C}\r\n\t]+/u', '', $value) ?? '';
    $value = preg_replace("/\r\n|\r|\n/", "\n", $value) ?? '';
    return limit_text($value, $limit);
}

function clean_header_text(string $value, int $limit): string
{
    $value = preg_replace('/[\r\n]+/', ' ', $value) ?? '';
    $value = trim($value);
    return limit_text($value, $limit);
}

function limit_text(string $value, int $limit): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $limit, 'UTF-8');
    }
    return substr($value, 0, $limit);
}

function has_header_injection(string $value): bool
{
    return preg_match('/[\r\n]/', $value) === 1;
}

function site_config_value(string $source, string $key): string
{
    preg_match('/' . preg_quote($key, '/') . "\\s*:\\s*['\"]([^'\"]*)['\"]/", $source, $match);
    return trim($match[1] ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Method not allowed');
}

$name = clean_text($_POST['name'] ?? '', 120);
$rawEmail = trim((string) ($_POST['email'] ?? ''));
$message = clean_text($_POST['message'] ?? '', 4000);

if ($name === '' || $rawEmail === '' || $message === '') {
    respond(422, false, 'Please complete all required fields.');
}

if (has_header_injection($rawEmail)) {
    respond(422, false, 'Please enter a valid email address.');
}

$userEmail = filter_var($rawEmail, FILTER_VALIDATE_EMAIL);
if (!$userEmail) {
    respond(422, false, 'Please enter a valid email address.');
}

$config = @file_get_contents(__DIR__ . '/config/config.js') ?: '';
$siteEmail = site_config_value($config, 'email');
if (has_header_injection($siteEmail) || !filter_var($siteEmail, FILTER_VALIDATE_EMAIL)) {
    respond(500, false, 'The contact email is not configured.');
}

$company = clean_header_text(site_config_value($config, 'companyName') ?: 'Website', 80);
$subject = clean_header_text('New ' . $company . ' enquiry', 120);
$body = "Name: {$name}\nEmail: {$userEmail}\n\n{$message}";
$headers = [
    'From: ' . $company . ' <' . $siteEmail . '>',
    'Reply-To: ' . $userEmail,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8'
];

$sent = @mail($siteEmail, $subject, $body, implode("\r\n", $headers));
if (!$sent) {
    respond(500, false, 'Unable to send your message. Please try again.');
}

respond(200, true, 'Successfully sent');
