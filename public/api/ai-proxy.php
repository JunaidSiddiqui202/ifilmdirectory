<?php
// ==============================================================================
// iFilmDirectory - Protected AI Proxy Endpoint
// Strict Authentication (Firebase ID Token), CORS Lockdown, Rate Limiting & Quotas
// ==============================================================================

// 1. Strict Origin Validation (No Wildcard CORS)
$allowedOrigins = [
    'https://ifilmdirectory.com',
    'https://www.ifilmdirectory.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'capacitor://localhost'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    // If not in allowed list, default to own origin or reject
    header('Access-Control-Allow-Origin: https://ifilmdirectory.com');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// 2. Request Size Enforcement (Max 32 KB to prevent buffer inflation/DoS)
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 32768) {
    http_response_code(413);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Payload too large. Maximum size is 32 KB.']);
    exit;
}

// 3. Extract & Validate Bearer Token
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (empty($authHeader) && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
}

if (!preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Unauthorized: Missing or invalid Bearer authentication token.']);
    exit;
}

$idToken = $matches[1];

// 4. Verify Firebase ID Token via Google Identity Toolkit
// Note: We never trust user IDs passed in the body.
$verifyUrl = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" . 
    (getenv('VITE_FIREBASE_API_KEY') ?: 'AIzaSyA0Cy6uodQxw7mC05S5f09XVww9X9P6nnE');

$ch = curl_init($verifyUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['idToken' => $idToken]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 6);

$verifyResp = curl_exec($ch);
$verifyHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($verifyHttpCode !== 200 || !$verifyResp) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Unauthorized: Invalid or expired Firebase ID token.']);
    exit;
}

$verifyData = json_decode($verifyResp, true);
$authenticatedUid = $verifyData['users'][0]['localId'] ?? null;

if (!$authenticatedUid) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Unauthorized: Could not determine verified user identity.']);
    exit;
}

// 5. Atomic Rate Limiting (Per-User & Per-IP via File Locking)
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$lockKey = md5($authenticatedUid . '_' . $clientIp);
$rateLimitFile = sys_get_temp_dir() . '/ai_rate_' . $lockKey . '.json';
$fp = fopen($rateLimitFile, 'c+');

if (!$fp || !flock($fp, LOCK_EX)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Internal concurrency lock error.']);
    exit;
}

$fileData = '';
while (!feof($fp)) {
    $fileData .= fread($fp, 8192);
}

$currentTime = time();
$requests = json_decode($fileData, true) ?: [];

// Sliding window: prune records older than 60 seconds
$requests = array_filter($requests, function($ts) use ($currentTime) {
    return ($currentTime - $ts) < 60;
});

// Enforce quota: Max 15 AI requests per minute per verified account
if (count($requests) >= 15) {
    flock($fp, LOCK_UN);
    fclose($fp);
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Account AI rate limit exceeded (15 req/min). Please try again shortly.']);
    exit;
}

$requests[] = $currentTime;
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode(array_values($requests)));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

// 6. Parse and Validate Request Payload
$input = file_get_contents('php://input');
$body = json_decode($input, true);

if (!$body || empty($body['prompt'])) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Missing prompt in request payload']);
    exit;
}

$prompt = trim($body['prompt']);
$context = trim($body['context'] ?? '');
$language = trim($body['language'] ?? 'English');
$provider = trim($body['provider'] ?? 'groq'); // 'groq' or 'gemini'
$jsonMode = !empty($body['jsonMode']);

// Limit prompt length to 8,000 characters to prevent resource exhaustion
if (strlen($prompt) > 8000) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Prompt text exceeds maximum allowed length (8,000 chars).']);
    exit;
}

// 7. Load Credentials from Server Environment or Secure Config Outside Web Root
$GROQ_KEY = getenv('GROQ_API_KEY');
$GEMINI_KEY = getenv('GEMINI_API_KEY');

if (!$GROQ_KEY || !$GEMINI_KEY) {
    $envPath = dirname(__DIR__, 2) . '/.env';
    if (!file_exists($envPath)) {
        $envPath = dirname(__DIR__) . '/.env';
    }
    if (file_exists($envPath)) {
        $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v);
                if (($k === 'VITE_GROQ_API_KEY' || $k === 'GROQ_API_KEY') && !$GROQ_KEY) $GROQ_KEY = $v;
                if (($k === 'VITE_GEMINI_API_KEY' || $k === 'GEMINI_API_KEY') && !$GEMINI_KEY) $GEMINI_KEY = $v;
            }
        }
    }
}

// 8. Execute AI Request
if ($provider === 'gemini') {
    if (!$GEMINI_KEY) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Gemini provider is not configured on server.']);
        exit;
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $GEMINI_KEY;
    $ch = curl_init($url);
    $payload = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 2048
        ]
    ];

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode >= 400) {
        http_response_code($httpCode ?: 502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Gemini upstream API call failed.']);
        exit;
    }

    $decoded = json_decode($response, true);
    $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['text' => $text, 'provider' => 'gemini', 'uid' => $authenticatedUid]);
    exit;
}

// Default: Groq API
if (!$GROQ_KEY) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Groq provider is not configured on server.']);
    exit;
}

$groqUrl = "https://api.groq.com/openai/v1/chat/completions";
$systemPrompt = "You are an elite cinema and film industry AI copilot for iFilmDirectory. Respond in {$language}.";
if ($context) {
    $systemPrompt .= " Context: {$context}.";
}

$ch = curl_init($groqUrl);
$payload = [
    'model' => 'llama-3.3-70b-versatile',
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $prompt]
    ],
    'temperature' => 0.7,
    'max_tokens' => 2048
];

if ($jsonMode) {
    $payload['response_format'] = ['type' => 'json_object'];
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $GROQ_KEY
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode >= 400) {
    http_response_code($httpCode ?: 502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Groq upstream API call failed.']);
    exit;
}

$decoded = json_decode($response, true);
$text = $decoded['choices'][0]['message']['content'] ?? '';
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['text' => $text, 'provider' => 'groq', 'uid' => $authenticatedUid]);
