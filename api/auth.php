<?php
/**
 * Аутентификация администратора
 * Серверная проверка пароля + токены
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

require_once __DIR__ . '/helpers.php';

function handle_auth(string $action, string $method): void
{
    match ($action) {
        'login'  => auth_login($method),
        'logout' => auth_logout($method),
        'check'  => auth_check($method),
        default  => json_error('Неизвестное действие', 404),
    };
}

/**
 * POST /api/auth/login
 * Body: { "login": "admin", "password": "..." }
 * Ответ: { "success": true, "token": "...", "expires_at": "..." }
 */
function auth_login(string $method): void
{
    if ($method !== 'POST') {
        json_error('Метод не разрешён', 405);
    }

    $data = get_json_body();
    $login = trim($data['login'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($login) || empty($password)) {
        json_error('Логин и пароль обязательны', 400);
    }

    $pdo = get_db();

    // Ищем админа по логину
    $stmt = $pdo->prepare('SELECT id, password_hash FROM admins WHERE login = ?');
    $stmt->execute([$login]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        // Задержка для защиты от перебора
        usleep(random_int(100000, 500000));
        json_error('Неверный логин или пароль', 401);
    }

    // Генерируем токен
    $token = bin2hex(random_bytes(TOKEN_LENGTH / 2));
    $expires_at = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);

    // Удаляем старые просроченные токены этого админа
    $pdo->prepare('DELETE FROM auth_tokens WHERE admin_id = ? AND expires_at < NOW()')
        ->execute([$admin['id']]);

    // Сохраняем новый токен
    $stmt = $pdo->prepare(
        'INSERT INTO auth_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)'
    );
    $stmt->execute([$admin['id'], $token, $expires_at]);

    json_response([
        'success'    => true,
        'token'      => $token,
        'expires_at' => $expires_at,
        'login'      => $login,
    ]);
}

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 */
function auth_logout(string $method): void
{
    if ($method !== 'POST') {
        json_error('Метод не разрешён', 405);
    }

    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        $token = $matches[1];
        $pdo = get_db();
        $pdo->prepare('DELETE FROM auth_tokens WHERE token = ?')->execute([$token]);
    }

    json_success('Выход выполнен');
}

/**
 * GET /api/auth/check
 * Header: Authorization: Bearer <token>
 * Проверяет, жив ли токен. Продлевает если жив.
 */
function auth_check(string $method): void
{
    if ($method !== 'GET') {
        json_error('Метод не разрешён', 405);
    }

    $admin_id = check_auth();
    if ($admin_id === null) {
        json_error('Токен недействителен', 401);
    }

    // Продлеваем токен
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        $new_expires = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
        $pdo = get_db();
        $pdo->prepare('UPDATE auth_tokens SET expires_at = ? WHERE token = ?')
            ->execute([$new_expires, $matches[1]]);
    }

    json_response([
        'success'  => true,
        'admin_id' => $admin_id,
    ]);
}
