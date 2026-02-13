<?php
/**
 * Загрузка изображений на сервер
 * POST /api/upload
 * Принимает multipart/form-data с полем "file"
 * Возвращает URL загруженного файла
 */

require_once __DIR__ . '/helpers.php';

function handle_upload(string $method): void
{
    if ($method !== 'POST') {
        json_error('Метод не разрешён', 405);
    }

    require_auth();

    // Проверяем наличие файла
    if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        json_error('Файл не загружен', 400);
    }

    $file = $_FILES['file'];

    // Проверяем ошибки загрузки
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $error_messages = [
            UPLOAD_ERR_INI_SIZE   => 'Файл слишком большой (ограничение сервера)',
            UPLOAD_ERR_FORM_SIZE  => 'Файл слишком большой (ограничение формы)',
            UPLOAD_ERR_PARTIAL    => 'Файл загружен частично',
            UPLOAD_ERR_NO_TMP_DIR => 'Ошибка сервера: нет временной папки',
            UPLOAD_ERR_CANT_WRITE => 'Ошибка сервера: не удалось записать файл',
        ];
        $msg = $error_messages[$file['error']] ?? 'Неизвестная ошибка загрузки';
        json_error($msg, 400);
    }

    // Проверяем размер
    if ($file['size'] > MAX_FILE_SIZE) {
        $max_mb = MAX_FILE_SIZE / 1024 / 1024;
        json_error("Файл слишком большой. Максимум: {$max_mb} MB", 400);
    }

    // Проверяем расширение
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTENSIONS, true)) {
        json_error('Недопустимый формат файла. Разрешены: ' . implode(', ', ALLOWED_EXTENSIONS), 400);
    }

    // Проверяем MIME-тип
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, ALLOWED_MIME_TYPES, true)) {
        json_error('Недопустимый тип файла', 400);
    }

    // Создаём папку uploads если нет
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    // Организуем по месяцам: uploads/2026-02/
    $subdir = date('Y-m');
    $upload_path = UPLOAD_DIR . $subdir . '/';
    if (!is_dir($upload_path)) {
        mkdir($upload_path, 0755, true);
    }

    // Генерируем уникальное имя файла
    $filename = uniqid('img_', true) . '.' . $ext;
    $full_path = $upload_path . $filename;

    // Перемещаем файл
    if (!move_uploaded_file($file['tmp_name'], $full_path)) {
        json_error('Не удалось сохранить файл', 500);
    }

    // Формируем URL для фронтенда (относительный)
    $url = UPLOAD_URL_PREFIX . $subdir . '/' . $filename;

    json_response([
        'success'  => true,
        'url'      => $url,
        'filename' => $filename,
        'size'     => $file['size'],
        'mime'     => $mime,
    ], 201);
}
