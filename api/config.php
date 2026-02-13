<?php
/**
 * Конфигурация приложения
 * ВАЖНО: заполнить реальными данными перед деплоем!
 */

// Режим разработки (true = показывать ошибки)
define('DEBUG_MODE', false);

// База данных
define('DB_HOST', 'localhost');
define('DB_NAME', 'cc71829_etmsite');       // Имя базы данных
define('DB_USER', 'cc71829_etmsite');       // Пользователь MySQL
define('DB_PASS', 'VU6eUUBj');      // Пароль MySQL — ИЗМЕНИТЬ!
define('DB_CHARSET', 'utf8mb4');

// Аутентификация
define('TOKEN_LIFETIME', 24 * 60 * 60); // 24 часа в секундах
define('TOKEN_LENGTH', 64);              // Длина токена в символах

// Загрузка файлов
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL_PREFIX', 'uploads/');  // Относительный URL для фронтенда
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5 MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);
define('ALLOWED_MIME_TYPES', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
]);

// CORS (разрешённые домены)
define('ALLOWED_ORIGINS', [
    'https://etm-murmansk.ru',
    'http://localhost',
]);
