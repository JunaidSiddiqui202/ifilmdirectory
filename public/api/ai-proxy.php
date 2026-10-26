<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Simple IP-based rate limiting using local file cache
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = sys_get_temp_dir() . '/ai_rate_' . md5($clientIp);
$currentTime = time();
$requests = [];

if (file_exists($rateLimitFile)) {
    $data = @file_get_contents($rateLimitFile);
    if ($data) {
        $requests = json_decode($data, true) ?: [];
    }
}

// Prune requests older than 60 seconds
$requests = array_filter($requests, function($timestamp) use ($currentTime) {
    return ($currentTime - $timestamp) < 60;
});

// Max 20 AI requests per minute per IP
if (count($requests) >= 20) {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Rate limit exceeded. Please wait a moment before sending more AI requests.']);
    exit;
}

$requests[] = $currentTime;
@file_put_contents($rateLimitFile, json_encode($requests));

// Parse incoming request payload
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

// Server-side securely configured credentials from server environment or host config
$GROQ_KEY = getenv('GROQ_API_KEY');
$GEMINI_KEY = getenv('GEMINI_API_KEY');

// Attempt to read from .env in document root if environment variables not explicitly passed
if (!$GROQ_KEY || !$GEMINI_KEY) {
    $envPath = dirname(__DIR__, 2) . '/.env';
    if (!file_exists($envPath)) {
        $envPath = dirname(__DIR__) . '/.env';
    }
    if (file_exists($envPath)) {
        $envLines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($envLines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                if ($key === 'VITE_GROQ_API_KEY' && !$GROQ_KEY) $GROQ_KEY = $val;
                if ($key === 'VITE_GEMINI_API_KEY' && !$GEMINI_KEY) $GEMINI_KEY = $val;
                if ($key === 'GROQ_API_KEY' && !$GROQ_KEY) $GROQ_KEY = $val;
                if ($key === 'GEMINI_API_KEY' && !$GEMINI_KEY) $GEMINI_KEY = $val;
            }
        }
    }
}

if ($provider === 'gemini') {
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
        echo json_encode(['error' => 'Gemini API call failed', 'details' => $response]);
        exit;
    }

    $decoded = json_decode($response, true);
    $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['text' => $text, 'provider' => 'gemini']);
    exit;
}

// Default: Groq API
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
    echo json_encode(['error' => 'Groq API call failed', 'details' => $response]);
    exit;
}

$decoded = json_decode($response, true);
$text = $decoded['choices'][0]['message']['content'] ?? '';
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['text' => $text, 'provider' => 'groq']);
