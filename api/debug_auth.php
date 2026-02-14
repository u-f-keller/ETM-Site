<?php
/**
 * Диагностика авторизации — УДАЛИТЬ после отладки!
 */
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_db();

// 1. Текущее время MySQL
$mysql_now = $pdo->query("SELECT NOW() as now")->fetch()['now'];

// 2. Все токены в таблице
$tokens = $pdo->query("SELECT id, admin_id, LEFT(token, 16) as token_prefix, expires_at, created_at FROM auth_tokens ORDER BY id DESC LIMIT 10")->fetchAll();

// 3. Заголовок Authorization
$auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'НЕ НАЙДЕН';

// 4. Проверяем токен из заголовка
$found_token = null;
if (preg_match('/^Bearer\s+(.+)$/i', $auth_header, $m)) {
    $stmt = $pdo->prepare('SELECT * FROM auth_tokens WHERE token = ?');
    $stmt->execute([$m[1]]);
    $found_token = $stmt->fetch();
    
    if ($found_token) {
        $found_token['token'] = substr($found_token['token'], 0, 16) . '...';
    }
    
    // Проверяем отдельно без условия expires
    $stmt2 = $pdo->prepare('SELECT token, expires_at, (expires_at > NOW()) as is_valid FROM auth_tokens WHERE token = ?');
    $stmt2->execute([$m[1]]);
    $token_check = $stmt2->fetch();
    if ($token_check) {
        $token_check['token'] = substr($token_check['token'], 0, 16) . '...';
    }
}

echo json_encode([
    'mysql_now' => $mysql_now,
    'php_time' => date('Y-m-d H:i:s'),
    'php_timezone' => date_default_timezone_get(),
    'auth_header' => substr($auth_header, 0, 30) . '...',
    'tokens_in_db' => $tokens,
    'token_from_header' => $found_token ?: 'НЕ НАЙДЕН В БД',
    'token_expiry_check' => $token_check ?? null,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
