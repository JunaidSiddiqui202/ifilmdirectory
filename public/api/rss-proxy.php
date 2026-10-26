<?php
// ==============================================================================
// iFilmDirectory - Protected RSS Feed Proxy Endpoint
// SSRF Defense, Hostname Allowlist, IP Range Validation & TLS Verification
// ==============================================================================

// 1. CORS Enforcement
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
    header('Access-Control-Allow-Origin: https://ifilmdirectory.com');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Method not allowed. Use GET.']);
    exit;
}

// 2. Target URL Extraction
$url = isset($_GET['url']) ? trim($_GET['url']) : '';
if (empty($url)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Missing target url parameter']);
    exit;
}

// 3. Scheme Validation (HTTPS strictly preferred; HTTP allowed for standard web feeds)
$parsed = parse_url($url);
if (!$parsed || !isset($parsed['scheme']) || !in_array(strtolower($parsed['scheme']), ['http', 'https'], true)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Invalid URL scheme. Only HTTP and HTTPS are permitted.']);
    exit;
}

$host = strtolower($parsed['host'] ?? '');
if (empty($host)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Missing host in URL.']);
    exit;
}

// 4. Hostname Allowlist Check
// Trusted South Cinema RSS feeds & Job boards used across rssNewsService & rssJobService
$allowedHostSuffixes = [
    'news.google.com',
    '123telugu.com',
    'greatandhra.com',
    'filmyfocus.com',
    'onlykollywood.com',
    'idlebrain.com',
    'weworkremotely.com'
];

$isHostAllowed = false;
foreach ($allowedHostSuffixes as $allowedHost) {
    if ($host === $allowedHost || substr($host, -(strlen($allowedHost) + 1)) === '.' . $allowedHost) {
        $isHostAllowed = true;
        break;
    }
}

if (!$isHostAllowed) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Target host is not permitted by proxy policy.']);
    exit;
}

// 5. Anti-SSRF: Resolve Host and Block Private, Loopback, or Link-Local IP Ranges
function isPrivateOrReservedIp(string $ip): bool {
    // If not a valid IP, reject
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return true;
    }

    // Filter private and reserved ranges
    $flags = FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
    if (filter_var($ip, FILTER_VALIDATE_IP, $flags) === false) {
        return true;
    }

    // Additional safeguard for loopback and cloud metadata ranges
    if (strpos($ip, '127.') === 0 || $ip === '::1' || $ip === '0.0.0.0') {
        return true;
    }
    // AWS/GCP/Azure link-local metadata address 169.254.169.254
    if (strpos($ip, '169.254.') === 0) {
        return true;
    }

    return false;
}

$dnsRecords = dns_get_record($host, DNS_A + DNS_AAAA);
if (empty($dnsRecords)) {
    // Fallback gethostbyname
    $resolvedIp = gethostbyname($host);
    if ($resolvedIp === $host || isPrivateOrReservedIp($resolvedIp)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Destination host resolves to an invalid or disallowed IP address.']);
        exit;
    }
} else {
    foreach ($dnsRecords as $record) {
        $ip = $record['ip'] ?? $record['ipv6'] ?? '';
        if (empty($ip) || isPrivateOrReservedIp($ip)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Destination host resolves to an invalid or disallowed IP address.']);
            exit;
        }
    }
}

// 6. Execute Secure cURL Request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Follow up to 3 redirects, validating protocol restrictions
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_USERAGENT, 'iFilmDirectory-RSS-FeedBot/2.0 (+https://ifilmdirectory.com)');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
]);
// Strict TLS Verification
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

// Limit response size to 4 MB to prevent memory exhaustion
$responseBuffer = '';
$maxBytes = 4 * 1024 * 1024;
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($handle, $chunk) use (&$responseBuffer, $maxBytes) {
    $responseBuffer .= $chunk;
    if (strlen($responseBuffer) > $maxBytes) {
        return 0; // Abort transfer if exceeding limit
    }
    return strlen($chunk);
});

$success = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

// Verify that final redirected URL did not escape the allowed hosts
if ($effectiveUrl) {
    $effParsed = parse_url($effectiveUrl);
    $effHost = strtolower($effParsed['host'] ?? '');
    $isEffHostAllowed = false;
    foreach ($allowedHostSuffixes as $allowedHost) {
        if ($effHost === $allowedHost || substr($effHost, -(strlen($allowedHost) + 1)) === '.' . $allowedHost) {
            $isEffHostAllowed = true;
            break;
        }
    }
    if (!$isEffHostAllowed) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Redirect to disallowed host was rejected.']);
        exit;
    }
}

if ($success === false || $httpCode >= 400) {
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

echo $responseBuffer;
