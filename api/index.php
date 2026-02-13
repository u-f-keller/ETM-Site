<?php
/**
 * Роутер API
 * Все запросы к /api/ проходят через этот файл
 *
 * Маршруты:
 *   POST   /api/auth/login       — вход
 *   POST   /api/auth/logout      — выход
 *   GET    /api/auth/check       — проверка сессии
 *
 *   GET    /api/projects          — список проектов
 *   POST   /api/projects          — создать проект (auth)
 *   PUT    /api/projects/{id}     — обновить проект (auth)
 *   DELETE /api/projects/{id}     — удалить проект (auth)
 *
 *   GET    /api/partners          — список партнёров
 *   POST   /api/partners          — создать (auth)
 *   PUT    /api/partners/{id}     — обновить (auth)
 *   DELETE /api/partners/{id}     — удалить (auth)
 *
 *   GET    /api/certificates      — список сертификатов
 *   POST   /api/certificates      — создать (auth)
 *   PUT    /api/certificates/{id} — обновить (auth)
 *   DELETE /api/certificates/{id} — удалить (auth)
 *
 *   POST   /api/upload            — загрузка изображения (auth)
 */

require_once __DIR__ . '/helpers.php';

// CORS и заголовки
setup_cors();

// Определяем путь запроса относительно /api/
$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$base_path = dirname($_SERVER['SCRIPT_NAME']); // /new/api
$path = parse_url($request_uri, PHP_URL_PATH);
$path = substr($path, strlen($base_path));     // Убираем базовый путь
$path = trim($path, '/');                       // Убираем слеши по краям

// Разбиваем путь на сегменты: resource/id
$segments = $path ? explode('/', $path) : [];
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;

$method = get_method();

// Роутинг
switch ($resource) {

    case 'auth':
        require_once __DIR__ . '/auth.php';
        $action = $segments[1] ?? '';
        handle_auth($action, $method);
        break;

    case 'projects':
        require_once __DIR__ . '/projects.php';
        handle_projects($method, $id);
        break;

    case 'partners':
        require_once __DIR__ . '/partners.php';
        handle_partners($method, $id);
        break;

    case 'certificates':
        require_once __DIR__ . '/certificates.php';
        handle_certificates($method, $id);
        break;

    case 'upload':
        require_once __DIR__ . '/upload.php';
        handle_upload($method);
        break;

    default:
        json_error('Маршрут не найден', 404);
}
