<?php
/**
 * CRUD операции с сертификатами
 */

require_once __DIR__ . '/helpers.php';

function handle_certificates(string $method, ?string $id): void
{
    match ($method) {
        'GET'    => $id ? get_certificate($id) : get_certificates(),
        'POST'   => create_certificate(),
        'PUT'    => update_certificate($id),
        'DELETE' => delete_certificate($id),
        default  => json_error('Метод не разрешён', 405),
    };
}

// ── GET /api/certificates ──

function get_certificates(): void
{
    $pdo = get_db();

    $limit  = min((int) get_param('limit', 100), 1000);
    $offset = max((int) get_param('offset', 0), 0);
    $sort   = get_param('sort', 'order');

    $order_column = 'sort_order';
    $order_dir = 'ASC';
    if (str_starts_with($sort, '-')) {
        $order_dir = 'DESC';
    }

    $sql = "SELECT * FROM certificates ORDER BY $order_column $order_dir LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$limit, $offset]);
    $certificates = $stmt->fetchAll();

    foreach ($certificates as &$cert) {
        $cert['id'] = (string) $cert['id'];
        $cert['order'] = (int) $cert['sort_order'];
    }

    $total = (int) $pdo->query('SELECT COUNT(*) FROM certificates')->fetchColumn();

    json_response([
        'data'  => $certificates,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
    ]);
}

// ── GET /api/certificates/{id} ──

function get_certificate(string $id): void
{
    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT * FROM certificates WHERE id = ?');
    $stmt->execute([$id]);
    $cert = $stmt->fetch();

    if (!$cert) {
        json_error('Сертификат не найден', 404);
    }

    $cert['id'] = (string) $cert['id'];
    $cert['order'] = (int) $cert['sort_order'];

    json_response($cert);
}

// ── POST /api/certificates ──

function create_certificate(): void
{
    require_auth();

    $data = get_json_body();

    $errors = validate_required($data, ['title', 'number', 'image_url']);

    if (isset($data['title']) && mb_strlen($data['title']) < 3) {
        $errors[] = 'Название должно содержать минимум 3 символа';
    }
    if (!empty($data['image_url']) && !is_valid_url($data['image_url'])) {
        $errors[] = 'Некорректный URL изображения';
    }
    if (!empty($data['pdf_url']) && !is_valid_url($data['pdf_url'])) {
        $errors[] = 'Некорректный URL PDF';
    }
    if (!empty($errors)) {
        json_error(implode(', ', $errors), 422);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO certificates (title, number, issued_date, expiry_date, image_url, pdf_url, description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        clean_string($data['title']),
        clean_string($data['number']),
        $data['issued_date'] ?: null,
        $data['expiry_date'] ?: null,
        clean_string($data['image_url']),
        clean_string($data['pdf_url'] ?? ''),
        clean_string($data['description'] ?? ''),
        (int) ($data['order'] ?? 1),
    ]);

    json_response([
        'success' => true,
        'id'      => (string) $pdo->lastInsertId(),
        'message' => 'Сертификат создан',
    ], 201);
}

// ── PUT /api/certificates/{id} ──

function update_certificate(?string $id): void
{
    require_auth();

    if (!$id) {
        json_error('ID сертификата обязателен', 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT id FROM certificates WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_error('Сертификат не найден', 404);
    }

    $data = get_json_body();

    $errors = [];
    if (isset($data['title']) && mb_strlen($data['title']) < 3) {
        $errors[] = 'Название должно содержать минимум 3 символа';
    }
    if (!empty($data['image_url']) && !is_valid_url($data['image_url'])) {
        $errors[] = 'Некорректный URL изображения';
    }
    if (!empty($data['pdf_url']) && !is_valid_url($data['pdf_url'])) {
        $errors[] = 'Некорректный URL PDF';
    }
    if (!empty($errors)) {
        json_error(implode(', ', $errors), 422);
    }

    $stmt = $pdo->prepare(
        'UPDATE certificates SET
            title = ?, number = ?, issued_date = ?, expiry_date = ?,
            image_url = ?, pdf_url = ?, description = ?, sort_order = ?
         WHERE id = ?'
    );
    $stmt->execute([
        clean_string($data['title'] ?? ''),
        clean_string($data['number'] ?? ''),
        $data['issued_date'] ?: null,
        $data['expiry_date'] ?: null,
        clean_string($data['image_url'] ?? ''),
        clean_string($data['pdf_url'] ?? ''),
        clean_string($data['description'] ?? ''),
        (int) ($data['order'] ?? 1),
        $id,
    ]);

    json_success('Сертификат обновлён');
}

// ── DELETE /api/certificates/{id} ──

function delete_certificate(?string $id): void
{
    require_auth();

    if (!$id) {
        json_error('ID сертификата обязателен', 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM certificates WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        json_error('Сертификат не найден', 404);
    }

    json_success('Сертификат удалён');
}
