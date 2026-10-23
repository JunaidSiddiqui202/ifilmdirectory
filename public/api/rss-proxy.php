<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$url = isset($_GET['url']) ? trim($_GET['url']) : '';
if (empty($url)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Missing target url parameter']);
    exit;
}

$parsed = parse_url($url);
if (!$parsed || !isset($parsed['scheme']) || !in_array(strtolower($parsed['scheme']), ['http', 'https'])) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Invalid URL scheme']);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode >= 400) {
    http_response_code($httpCode ? $httpCode : 502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Failed to fetch RSS source',
        'details' => $error,
        'http_code' => $httpCode
    ]);
    exit;
}

if ($contentType) {
    header('Content-Type: ' . $contentType);
} else {
    header('Content-Type: application/xml; charset=utf-8');
}

echo $response;
