<?php
/**
 * Cineyast — proxy TMDB pour la production (hébergement LWS / Apache + PHP).
 *
 * Le navigateur appelle  /api/tmdb.php?path=/movie/550&language=fr-FR
 * et ce script relaie la requête vers https://api.themoviedb.org/3 en y
 * ajoutant la clé, qui ne quitte donc jamais le serveur.
 *
 * Où est lue la clé (dans cet ordre) :
 *   1. variable d'environnement TMDB_API_KEY (SetEnv dans un .htaccess, panneau LWS…)
 *   2. fichier tmdb-config.php placé UN NIVEAU AU-DESSUS du dossier web (recommandé)
 *   3. fichier api/tmdb-config.php (repli ; son accès HTTP est bloqué par api/.htaccess)
 *
 * La liste blanche ci-dessous doit rester synchronisée avec server/tmdb-dev-proxy.ts.
 * Compatible PHP 7.4+.
 */

declare(strict_types=1);

ini_set('display_errors', '0');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const CACHE_TTL = 900; // secondes

const ALLOWED_PATHS = [
    '#^/trending/movie/(day|week)$#',
    '#^/movie/(popular|top_rated|now_playing|upcoming)$#',
    '#^/movie/\d{1,9}$#',
    '#^/movie/\d{1,9}/(recommendations|similar|videos|credits)$#',
    '#^/search/movie$#',
    '#^/discover/movie$#',
    '#^/genre/movie/list$#',
];

const ALLOWED_PARAMS = [
    'language',
    'region',
    'page',
    'query',
    'year',
    'primary_release_year',
    'primary_release_date.gte',
    'primary_release_date.lte',
    'with_genres',
    'vote_average.gte',
    'vote_count.gte',
    'sort_by',
    'append_to_response',
    'include_video_language',
];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');

function respond(int $status, string $body, string $cacheStatus = ''): void
{
    http_response_code($status);
    header($status === 200 ? 'Cache-Control: public, max-age=600' : 'Cache-Control: no-store');
    if ($cacheStatus !== '') {
        header('X-Cache: ' . $cacheStatus);
    }
    echo $body;
    exit;
}

function fail(int $status, string $error, string $message): void
{
    respond($status, (string) json_encode(
        ['error' => $error, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    ));
}

function read_api_key(): string
{
    $fromEnv = [
        getenv('TMDB_API_KEY'),
        $_SERVER['TMDB_API_KEY'] ?? null,
        $_SERVER['REDIRECT_TMDB_API_KEY'] ?? null, // SetEnv + mod_rewrite préfixe REDIRECT_
    ];
    foreach ($fromEnv as $value) {
        if (is_string($value) && trim($value) !== '') {
            return trim($value);
        }
    }

    $files = [dirname(__DIR__, 2) . '/tmdb-config.php', __DIR__ . '/tmdb-config.php'];
    foreach ($files as $file) {
        if (@is_readable($file)) {
            $config = include $file;
            if (is_array($config) && isset($config['api_key']) && is_string($config['api_key'])) {
                return trim($config['api_key']);
            }
        }
    }
    return '';
}

/** $_GET remplace les points par des underscores (vote_average.gte → vote_average_gte) : on relit la query brute. */
function parse_query(string $raw): array
{
    $params = [];
    foreach (explode('&', $raw) as $pair) {
        if ($pair === '') {
            continue;
        }
        $parts = explode('=', $pair, 2);
        $params[urldecode($parts[0])] = urldecode($parts[1] ?? '');
    }
    return $params;
}

function is_read_access_token(string $key): bool
{
    return strpos($key, 'eyJ') === 0 && substr_count($key, '.') === 2;
}

function cache_dir(): ?string
{
    $candidates = [dirname(__DIR__, 2) . '/cineyast-cache', sys_get_temp_dir() . '/cineyast-cache'];
    foreach ($candidates as $dir) {
        if ((@is_dir($dir) || @mkdir($dir, 0700, true)) && @is_writable($dir)) {
            return $dir;
        }
    }
    return null;
}

/** @return array{0:int,1:string} [statut HTTP, corps] ; statut 0 = échec réseau */
function tmdb_get(string $url, array $headers): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        return $body === false ? [0, ''] : [$status, (string) $body];
    }

    $context = stream_context_create(['http' => [
        'method' => 'GET',
        'header' => implode("\r\n", $headers),
        'timeout' => 8,
        'ignore_errors' => true,
    ]]);
    $body = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('#^HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m)) {
        $status = (int) $m[1];
    }
    return [$status, $body === false ? '' : $body];
}

// ─── Traitement de la requête ────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    header('Allow: GET, HEAD');
    fail(405, 'method_not_allowed', 'Seules les requêtes GET sont acceptées.');
}

$incoming = parse_query((string) ($_SERVER['QUERY_STRING'] ?? ''));
$path = $incoming['path'] ?? '';

$allowed = false;
foreach (ALLOWED_PATHS as $pattern) {
    if (preg_match($pattern, $path) === 1) {
        $allowed = true;
        break;
    }
}
if (!$allowed) {
    fail(400, 'path_not_allowed', 'Endpoint TMDB non autorisé.');
}

$apiKey = read_api_key();
if ($apiKey === '') {
    fail(500, 'missing_api_key', 'Clé TMDB introuvable sur le serveur (voir README, section Déploiement).');
}

$params = [];
foreach (ALLOWED_PARAMS as $name) {
    if (isset($incoming[$name]) && strlen($incoming[$name]) <= 200) {
        $params[$name] = $incoming[$name];
    }
}
$params['include_adult'] = 'false';
ksort($params);

$cacheKey = sha1($path . '?' . http_build_query($params));
$dir = cache_dir();
$cacheFile = $dir !== null ? $dir . '/' . $cacheKey . '.json' : null;

if ($cacheFile !== null && @is_file($cacheFile) && (time() - (int) @filemtime($cacheFile)) < CACHE_TTL) {
    $cached = @file_get_contents($cacheFile);
    if (is_string($cached) && $cached !== '') {
        respond(200, $cached, 'HIT');
    }
}

$headers = ['Accept: application/json'];
if (is_read_access_token($apiKey)) {
    $headers[] = 'Authorization: Bearer ' . $apiKey;
} else {
    $params['api_key'] = $apiKey;
}

$url = TMDB_BASE . $path . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
[$status, $body] = tmdb_get($url, $headers);

if ($status === 0) {
    fail(502, 'upstream_unreachable', 'TMDB est momentanément injoignable.');
}

if ($status === 200 && $cacheFile !== null) {
    @file_put_contents($cacheFile, $body, LOCK_EX);
}

respond($status, $body, 'MISS');
