<?php
/**
 * Общие вспомогательные функции API
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// ── CORS и заголовки ──

function setup_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json; charset=utf-8');

    // Preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ── JSON-ответы ──

function json_response(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $code = 400): never
{
    json_response(['error' => $message], $code);
}

function json_success(string $message = 'OK', mixed $data = null): never
{
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    json_response($response);
}

// ── Входные данные ──

/**
 * Получить JSON из тела запроса
 */
function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_error('Некорректный JSON', 400);
    }

    return $data;
}

/**
 * Получить HTTP-метод (с поддержкой _method override)
 */
function get_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD']);
}

/**
 * Получить query-параметр со значением по умолчанию
 */
function get_param(string $name, mixed $default = null): mixed
{
    return $_GET[$name] ?? $default;
}

// ── Аутентификация по токену ──

/**
 * Проверить токен из заголовка Authorization: Bearer <token>
 * Возвращает admin_id или null
 */
function check_auth(): ?int
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }

    $token = $matches[1];
    $pdo = get_db();

    $stmt = $pdo->prepare(
        'SELECT admin_id FROM auth_tokens WHERE token = ? AND expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    return $row ? (int) $row['admin_id'] : null;
}

/**
 * Требовать авторизацию — если нет валидного токена, вернуть 401
 */
function require_auth(): int
{
    $admin_id = check_auth();
    if ($admin_id === null) {
        json_error('Требуется авторизация', 401);
    }
    return $admin_id;
}

// ── Валидация ──

/**
 * Проверить обязательные поля
 */
function validate_required(array $data, array $fields): array
{
    $errors = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            $errors[] = "Поле '$field' обязательно";
        }
    }
    return $errors;
}

/**
 * Очистить строку от XSS
 */
function clean_string(?string $value): string
{
    if ($value === null) {
        return '';
    }
    return trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
}

/**
 * Проверить URL
 */
function is_valid_url(?string $url): bool
{
    if (empty($url)) {
        return true; // Пустой URL допустим
    }
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}
