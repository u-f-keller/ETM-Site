<?php
/**
 * CRUD операции с проектами
 */

require_once __DIR__ . '/helpers.php';

function handle_projects(string $method, ?string $id): void
{
    match ($method) {
        'GET'    => $id ? get_project($id) : get_projects(),
        'POST'   => create_project(),
        'PUT'    => update_project($id),
        'DELETE' => delete_project($id),
        default  => json_error('Метод не разрешён', 405),
    };
}

// ── GET /api/projects ──

function get_projects(): void
{
    $pdo = get_db();

    $limit  = min((int) get_param('limit', 100), 1000);
    $offset = max((int) get_param('offset', 0), 0);
    $sort   = get_param('sort', '-year');

    // Определяем сортировку
    $order_column = 'year';
    $order_dir = 'DESC';

    if (str_starts_with($sort, '-')) {
        $order_dir = 'DESC';
        $order_column = substr($sort, 1);
    } else {
        $order_dir = 'ASC';
        $order_column = $sort;
    }

    // Белый список колонок для сортировки
    $allowed_columns = ['year', 'title', 'category', 'created_at', 'updated_at'];
    if (!in_array($order_column, $allowed_columns, true)) {
        $order_column = 'year';
    }

    $sql = "SELECT * FROM projects ORDER BY $order_column $order_dir LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$limit, $offset]);
    $projects = $stmt->fetchAll();

    // Декодируем JSON-теги
    foreach ($projects as &$project) {
        $project['tags'] = json_decode($project['tags'] ?? '[]', true) ?: [];
        $project['id'] = (string) $project['id'];
    }

    // Общее количество
    $total = (int) $pdo->query('SELECT COUNT(*) FROM projects')->fetchColumn();

    json_response([
        'data'  => $projects,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
    ]);
}

// ── GET /api/projects/{id} ──

function get_project(string $id): void
{
    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    $project = $stmt->fetch();

    if (!$project) {
        json_error('Проект не найден', 404);
    }

    $project['tags'] = json_decode($project['tags'] ?? '[]', true) ?: [];
    $project['id'] = (string) $project['id'];

    json_response($project);
}

// ── POST /api/projects ──

function create_project(): void
{
    require_auth();

    $data = get_json_body();

    // Валидация
    $errors = validate_required($data, ['title', 'year', 'category']);

    if (isset($data['title']) && mb_strlen($data['title']) < 3) {
        $errors[] = 'Название должно содержать минимум 3 символа';
    }

    $year = (int) ($data['year'] ?? 0);
    if ($year < 2000 || $year > 2100) {
        $errors[] = 'Некорректный год';
    }

    if (!empty($data['image_url']) && !is_valid_url($data['image_url'])) {
        $errors[] = 'Некорректный URL изображения';
    }

    if (!empty($errors)) {
        json_error(implode(', ', $errors), 422);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO projects (title, year, category, client, location, description, image_url, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $tags = isset($data['tags']) && is_array($data['tags']) ? $data['tags'] : [];

    $stmt->execute([
        clean_string($data['title']),
        $year,
        clean_string($data['category']),
        clean_string($data['client'] ?? ''),
        clean_string($data['location'] ?? ''),
        $data['description'] ?? '',  // HTML от Quill, хранить as-is
        clean_string($data['image_url'] ?? ''),
        json_encode($tags, JSON_UNESCAPED_UNICODE),
    ]);

    $new_id = $pdo->lastInsertId();

    json_response([
        'success' => true,
        'id'      => (string) $new_id,
        'message' => 'Проект создан',
    ], 201);
}

// ── PUT /api/projects/{id} ──

function update_project(?string $id): void
{
    require_auth();

    if (!$id) {
        json_error('ID проекта обязателен', 400);
    }

    $pdo = get_db();

    // Проверяем существование
    $stmt = $pdo->prepare('SELECT id FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_error('Проект не найден', 404);
    }

    $data = get_json_body();

    // Валидация
    $errors = [];
    if (isset($data['title']) && mb_strlen($data['title']) < 3) {
        $errors[] = 'Название должно содержать минимум 3 символа';
    }
    if (isset($data['year'])) {
        $year = (int) $data['year'];
        if ($year < 2000 || $year > 2100) {
            $errors[] = 'Некорректный год';
        }
    }
    if (!empty($data['image_url']) && !is_valid_url($data['image_url'])) {
        $errors[] = 'Некорректный URL изображения';
    }
    if (!empty($errors)) {
        json_error(implode(', ', $errors), 422);
    }

    $tags = isset($data['tags']) && is_array($data['tags']) ? $data['tags'] : [];

    $stmt = $pdo->prepare(
        'UPDATE projects SET
            title = ?, year = ?, category = ?, client = ?,
            location = ?, description = ?, image_url = ?, tags = ?
         WHERE id = ?'
    );

    $stmt->execute([
        clean_string($data['title'] ?? ''),
        (int) ($data['year'] ?? 2025),
        clean_string($data['category'] ?? ''),
        clean_string($data['client'] ?? ''),
        clean_string($data['location'] ?? ''),
        $data['description'] ?? '',
        clean_string($data['image_url'] ?? ''),
        json_encode($tags, JSON_UNESCAPED_UNICODE),
        $id,
    ]);

    json_success('Проект обновлён');
}

// ── DELETE /api/projects/{id} ──

function delete_project(?string $id): void
{
    require_auth();

    if (!$id) {
        json_error('ID проекта обязателен', 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM projects WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        json_error('Проект не найден', 404);
    }

    json_success('Проект удалён');
}
