<?php
header('Content-Type: application/json');

// Проверяем подключение к БД
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=cc71829_etmsite;charset=utf8mb4',
        'cc71829_etmsite',
        'VU6eUUBj'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo json_encode([
        'db' => 'OK',
        'php' => phpversion(),
        'extensions' => [
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'json' => extension_loaded('json'),
            'mbstring' => extension_loaded('mbstring'),
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'db' => 'FAIL',
        'error' => $e->getMessage()
    ]);
}
