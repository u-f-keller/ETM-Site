<?php
/**
 * CRUD операции с партнёрами
 */

require_once __DIR__ . '/helpers.php';

function handle_partners(string $method, ?string $id): void
{
    match ($method) {
        'GET'    => $id ? get_partner($id) : get_partners(),
        'POST'   => create_partner(),
        'PUT'    => update_partner($id),
        'DELETE' => delete_partner($id),
        default  => json_error('Метод не разрешён', 405),
    };
}

// ── GET /api/partners ──

function get_partners(): void
{
    $pdo = get_db();

    $limit  = min((int) get_param('limit', 100), 1000);
    $offset = max((int) get_param('offset', 0), 0);
    $sort   = get_param('sort', 'order');

    // Маппинг: фронтенд шлёт "order", в БД колонка "sort_order"
    $order_column = 'sort_order';
    $order_dir = 'ASC';

    if (str_starts_with($sort, '-')) {
        $order_dir = 'DESC';
    }

    $sql = "SELECT * FROM partners ORDER BY $order_column $order_dir LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$limit, $offset]);
    $partners = $stmt->fetchAll();

    foreach ($partners as &$partner) {
        $partner['id'] = (string) $partner['id'];
        // Фронтенд ожидает поле "order", а в БД "sort_order"
        $partner['order'] = (int) $partner['sort_order'];
    }

    $total = (int) $pdo->query('SELECT COUNT(*) FROM partners')->fetchColumn();

    json_response([
        'data'  => $partners,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
    ]);
}

// ── GET /api/partners/{id} ──

function get_partner(string $id): void
{
    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT * FROM partners WHERE id = ?');
    $stmt->execute([$id]);
    $partner = $stmt->fetch();

    if (!$partner) {
        json_error('Партнёр не найден', 404);
    }

    $partner['id'] = (string) $partner['id'];
    $partner['order'] = (int) $partner['sort_order'];

    json_response($partner);
}

// ── POST /api/partners ──

function create_partner(): void
{
    require_auth();

    $data = get_json_body();

    $errors = validate_required($data, ['name', 'logo_url']);

    if (isset($data['name']) && mb_strlen($data['name']) < 2) {
        $errors[] = 'Название должно содержать минимум 2 символа';
    }
    if (!empty($data['logo_url']) && !is_valid_url($data['logo_url'])) {
        $errors[] = 'Некорректный URL логотипа';
    }
    if (!empty($data['website']) && !is_valid_url($data['website'])) {
        $errors[] = 'Некорректный URL сайта';
    }
    if (!empty($errors)) {
        json_error(implode(', ', $errors), 422);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO partners (name, logo_url, website, description, sort_order)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        clean_string($data['name']),
        clean_string($data['logo_url']),
        clean_string($data['website'] ?? ''),
        clean_string($data['description'] ?? ''),
        (int) ($data['order'] ?? 1),
    ]);

    json_response([
        'success' => true,
        'id'      => (string) $pdo->lastInsertId(),
        'message' => 'Партнёр создан',
    ], 201);
}

// ── PUT /api/partners/{id} ──

function update_partner(?string $id): void
{
    require_auth();

    if (!$id) {
        json_error('ID партнёра обязателен', 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT id FROM partners WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_error('Партнёр не найден', 404);
    }

    $data = get_json_body();

    $errors = [];
    if (isset($data['name']) && mb_strlen($data['name']) < 2) {
        $errors[] = 'Название должно содержать минимум 2 символа';
    }
    if (!empty($data['logo_url']) && !is_valid_url($data['logo_url'])) {
        $errors[] = 'Некорректный URL логотипа';
    }
    if (!empty($data['website']) && !is_valid_url($data['website'])) {
        $errors[] = 'Некорректный URL сайта';
    }
    if (!empty($errors)) {
        json_error(implode(', ', $errors), 422);
    }

    $stmt = $pdo->prepare(
        'UPDATE partners SET name = ?, logo_url = ?, website = ?, description = ?, sort_order = ?
         WHERE id = ?'
    );
    $stmt->execute([
        clean_string($data['name'] ?? ''),
        clean_string($data['logo_url'] ?? ''),
        clean_string($data['website'] ?? ''),
        clean_string($data['description'] ?? ''),
        (int) ($data['order'] ?? 1),
        $id,
    ]);

    json_success('Партнёр обновлён');
}

// ── DELETE /api/partners/{id} ──

function delete_partner(?string $id): void
{
    require_auth();

    if (!$id) {
        json_error('ID партнёра обязателен', 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM partners WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        json_error('Партнёр не найден', 404);
    }

    json_success('Партнёр удалён');
}
