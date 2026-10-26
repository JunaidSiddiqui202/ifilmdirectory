<?php
// ==============================================================================
// iFilmDirectory - Protected RSS Feed Proxy Endpoint
// SSRF Defense, Hostname Allowlist, IP Range Validation, Manual Redirect Loop,
// Strict TLS Verification, and CURLOPT_RESOLVE Pinning (DNS Rebinding Defense)
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

// 3. Trusted Hostname Allowlist
$allowedHostSuffixes = [
    'news.google.com',
    '123telugu.com',
    'greatandhra.com',
    'filmyfocus.com',
    'onlykollywood.com',
    'idlebrain.com',
    'weworkremotely.com'
];

function isHostPermitted(string $host, array $allowedSuffixes): bool {
    $host = strtolower(trim($host));
    foreach ($allowedSuffixes as $allowed) {
        if ($host === $allowed || substr($host, -(strlen($allowed) + 1)) === '.' . $allowed) {
            return true;
        }
    }
    return false;
}

// 4. IP Validation: Reject private, loopback, link-local, cloud-metadata addresses
function isPrivateOrReservedIp(string $ip): bool {
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return true;
    }

    $flags = FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
    if (filter_var($ip, FILTER_VALIDATE_IP, $flags) === false) {
        return true;
    }

    if (strpos($ip, '127.') === 0 || $ip === '::1' || $ip === '0.0.0.0') {
        return true;
    }
    // AWS/GCP/Azure link-local metadata address 169.254.169.254
    if (strpos($ip, '169.254.') === 0) {
        return true;
    }

    return false;
}

// 5. URL Validator and Host/IP Resolver
function validateAndResolveUrl(string $targetUrl, array $allowedSuffixes): array {
    $parsed = parse_url($targetUrl);
    if (!$parsed || !isset($parsed['scheme']) || !in_array(strtolower($parsed['scheme']), ['http', 'https'], true)) {
        return ['valid' => false, 'error' => 'Invalid URL scheme. Only HTTP and HTTPS are permitted.'];
    }

    $host = strtolower($parsed['host'] ?? '');
    if (empty($host) || !isHostPermitted($host, $allowedSuffixes)) {
        return ['valid' => false, 'error' => 'Target host is not permitted by proxy policy.'];
    }

    // Resolve DNS records
    $dnsRecords = @dns_get_record($host, DNS_A);
    $validIps = [];

    if (!empty($dnsRecords)) {
        foreach ($dnsRecords as $rec) {
            $ip = $rec['ip'] ?? '';
            if (!empty($ip) && !isPrivateOrReservedIp($ip)) {
                $validIps[] = $ip;
            } else {
                return ['valid' => false, 'error' => 'Destination host resolves to a private or disallowed IP address.'];
            }
        }
    } else {
        $ip = gethostbyname($host);
        if ($ip === $host || isPrivateOrReservedIp($ip)) {
            return ['valid' => false, 'error' => 'Destination host cannot be safely resolved or points to a disallowed IP.'];
        }
        $validIps[] = $ip;
    }

    if (empty($validIps)) {
        return ['valid' => false, 'error' => 'No valid public IP address found for host.'];
    }

    $port = isset($parsed['port']) ? (int)$parsed['port'] : (strtolower($parsed['scheme']) === 'https' ? 443 : 80);

    return [
        'valid' => true,
        'scheme' => strtolower($parsed['scheme']),
        'host' => $host,
        'port' => $port,
        'pinnedIp' => $validIps[0]
    ];
}

// 6. Manual Safe Fetch Loop with Step-by-Step Redirect Validation & DNS Pinning
$currentUrl = $url;
$redirectCount = 0;
$maxRedirects = 3;
$responseBuffer = '';
$finalContentType = '';
$finalHttpCode = 0;

while ($redirectCount <= $maxRedirects) {
    $val = validateAndResolveUrl($currentUrl, $allowedHostSuffixes);
    if (!$val['valid']) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $val['error']]);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $currentUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // Explicitly disable automated cURL redirects; we validate every single hop manually
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
    curl_setopt($ch, CURLOPT_USERAGENT, 'iFilmDirectory-RSS-FeedBot/2.0 (+https://ifilmdirectory.com)');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
    ]);

    // Pin cURL to the exact pre-validated IP to eliminate DNS rebinding (TOCTOU)
    $resolveEntry = "{$val['host']}:{$val['port']}:{$val['pinnedIp']}";
    curl_setopt($ch, CURLOPT_RESOLVE, [$resolveEntry]);

    // Strict TLS Verification
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_HEADER, true);

    $maxBytes = 4 * 1024 * 1024; // 4MB maximum response limit
    $rawResponse = '';
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($handle, $chunk) use (&$rawResponse, $maxBytes) {
        $rawResponse .= $chunk;
        if (strlen($rawResponse) > $maxBytes) {
            return 0; // Abort download if exceeding limit
        }
        return strlen($chunk);
    });

    $success = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($success === false) {
        http_response_code(502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Failed to connect to RSS source', 'details' => $curlErr]);
        exit;
    }

    $headers = substr($rawResponse, 0, $headerSize);
    $body = substr($rawResponse, $headerSize);

    // Handle HTTP Redirects (301, 302, 303, 307, 308)
    if (in_array($httpCode, [301, 302, 303, 307, 308], true)) {
        if (!preg_match('/^Location:\s*(.*)$/mi', $headers, $locMatches)) {
            http_response_code(502);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Redirect location missing in response.']);
            exit;
        }

        $nextLocation = trim($locMatches[1]);
        if (strpos($nextLocation, 'http://') !== 0 && strpos($nextLocation, 'https://') !== 0) {
            // Resolve relative redirect
            $baseParsed = parse_url($currentUrl);
            $nextLocation = "{$baseParsed['scheme']}://{$baseParsed['host']}" . (strpos($nextLocation, '/') === 0 ? '' : '/') . $nextLocation;
        }

        $currentUrl = $nextLocation;
        $redirectCount++;
        continue;
    }

    $finalHttpCode = $httpCode;
    $finalContentType = $contentType;
    $responseBuffer = $body;
    break;
}

if ($finalHttpCode >= 400 || empty($responseBuffer)) {
    http_response_code($finalHttpCode ? $finalHttpCode : 502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'RSS source responded with an error',
        'http_code' => $finalHttpCode
    ]);
    exit;
}

if ($finalContentType) {
    header('Content-Type: ' . $finalContentType);
} else {
    header('Content-Type: application/xml; charset=utf-8');
}

echo $responseBuffer;
