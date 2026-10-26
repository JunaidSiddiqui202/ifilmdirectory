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
$firebaseApiKey = getenv('VITE_FIREBASE_API_KEY') ?: getenv('FIREBASE_API_KEY');
if (!$firebaseApiKey) {
    // Attempt reading from secure server config outside public web root
    $securePhpConfig = dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/config.secure.php';
    if (file_exists($securePhpConfig) && is_readable($securePhpConfig)) {
        $cfg = @include $securePhpConfig;
        if (is_array($cfg) && !empty($cfg['FIREBASE_API_KEY'])) {
            $firebaseApiKey = $cfg['FIREBASE_API_KEY'];
        }
    }
}

$verifyUrl = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" . urlencode($firebaseApiKey ?: '');

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

// 5. Atomic Rate Limiting (Independent Per-Account AND Per-IP Quotas via File Locking)
// Anti-Spoofing & Trusted Edge Topology:
// Validate REMOTE_ADDR against loopback or official Cloudflare edge IP subnets before honoring forwarding headers
$remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

function ipInCidr(string $ip, string $cidr): bool {
    if (strpos($cidr, '/') === false) return $ip === $cidr;
    list($subnet, $bits) = explode('/', $cidr, 2);
    $bits = (int)$bits;
    
    // IPv4
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);
        $mask = -1 << (32 - $bits);
        $subnetLong &= $mask;
        return ($ipLong & $mask) === $subnetLong;
    }
    // IPv6
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $ipBin = inet_pton($ip);
        $subnetBin = inet_pton($subnet);
        if ($ipBin === false || $subnetBin === false) return false;
        $byteLength = intdiv($bits, 8);
        $bitLength = $bits % 8;
        if (substr($ipBin, 0, $byteLength) !== substr($subnetBin, 0, $byteLength)) return false;
        if ($bitLength > 0) {
            $mask = chr(0xFF << (8 - $bitLength));
            return ($ipBin[$byteLength] & $mask) === ($subnetBin[$byteLength] & $mask);
        }
        return true;
    }
    return false;
}

$trustedCidrs = [
    '127.0.0.1/32',
    '::1/128',
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32'
];

$isTrustedProxy = false;
foreach ($trustedCidrs as $cidr) {
    if (ipInCidr($remoteAddr, $cidr)) {
        $isTrustedProxy = true;
        break;
    }
}

$candidateIp = $remoteAddr;
if ($isTrustedProxy && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
    $candidateIp = trim($_SERVER['HTTP_CF_CONNECTING_IP']);
} elseif ($isTrustedProxy && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $forwarded = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $candidateIp = trim($forwarded[0]);
}

// Canonical validation: Fall back strictly to socket IP if candidate is invalid or malformed
$clientIp = filter_var($candidateIp, FILTER_VALIDATE_IP) ? $candidateIp : $remoteAddr;

// Function to atomically evaluate sliding-window rate limit
function checkAtomicRateLimit(string $bucketName, string $idKey, int $maxRequests, int $windowSeconds, string $errorMessage): void {
    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $idKey);
    $rateLimitFile = sys_get_temp_dir() . '/ai_rate_' . $bucketName . '_' . md5($safeKey) . '.json';
    $fp = fopen($rateLimitFile, 'c+');

    if (!$fp || !flock($fp, LOCK_EX)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Concurrency rate lock error.']);
        exit;
    }

    $fileData = '';
    while (!feof($fp)) {
        $fileData .= fread($fp, 8192);
    }

    $currentTime = time();
    $timestamps = json_decode($fileData, true) ?: [];

    // Sliding window: filter entries within window
    $timestamps = array_filter($timestamps, function($ts) use ($currentTime, $windowSeconds) {
        return ($currentTime - $ts) < $windowSeconds;
    });

    if (count($timestamps) >= $maxRequests) {
        flock($fp, LOCK_UN);
        fclose($fp);
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $errorMessage]);
        exit;
    }

    $timestamps[] = $currentTime;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(array_values($timestamps)));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

// Enforce independent per-account rate limit: 15 req/min
checkAtomicRateLimit('user', $authenticatedUid, 15, 60, 'Account AI rate limit exceeded (15 req/min). Please try again shortly.');

// Enforce independent per-IP rate limit: 30 req/min (protects against multi-account IP bot attacks)
checkAtomicRateLimit('ip', $clientIp, 30, 60, 'IP AI rate limit exceeded (30 req/min). Please try again shortly.');

// Enforce daily per-account budget: 200 req/day
checkAtomicRateLimit('user_daily', $authenticatedUid, 200, 86400, 'Daily account AI quota exceeded (200 requests/day).');

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

// 7. Load Credentials Strictly from Server Environment or Secure Storage Outside Public Web Root
$GROQ_KEY = getenv('GROQ_API_KEY') ?: getenv('REDIRECT_GROQ_API_KEY');
$GEMINI_KEY = getenv('GEMINI_API_KEY') ?: getenv('REDIRECT_GEMINI_API_KEY');

if (!$GROQ_KEY || !$GEMINI_KEY) {
    // 1. Check for PHP configuration array outside web root
    $securePhpConfig = dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/config.secure.php';
    if (file_exists($securePhpConfig) && is_readable($securePhpConfig)) {
        $cfg = @include $securePhpConfig;
        if (is_array($cfg)) {
            if (!$GROQ_KEY && !empty($cfg['GROQ_API_KEY'])) $GROQ_KEY = $cfg['GROQ_API_KEY'];
            if (!$GEMINI_KEY && !empty($cfg['GEMINI_API_KEY'])) $GEMINI_KEY = $cfg['GEMINI_API_KEY'];
        }
    }

    // 2. Check for external environment files located strictly above public_html
    if (!$GROQ_KEY || !$GEMINI_KEY) {
        $candidatePaths = [
            dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env.ai',
            dirname(__DIR__, 2) . '/.env.ai',
            dirname(__DIR__, 2) . '/.env' // Root workspace repository level (excluded from public_html)
        ];

        foreach ($candidatePaths as $candidate) {
            if (!empty($candidate) && file_exists($candidate) && is_readable($candidate)) {
                $lines = @file($candidate, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (strpos($line, '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($k, $v) = explode('=', $line, 2);
                        $k = trim($k);
                        $v = trim($v);
                        if (($k === 'GROQ_API_KEY' || $k === 'VITE_GROQ_API_KEY') && !$GROQ_KEY) $GROQ_KEY = $v;
                        if (($k === 'GEMINI_API_KEY' || $k === 'VITE_GEMINI_API_KEY') && !$GEMINI_KEY) $GEMINI_KEY = $v;
                    }
                }
                if ($GROQ_KEY && $GEMINI_KEY) break;
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
