<?php
/**
 * Первоначальная настройка
 * Запустить ОДИН РАЗ после создания базы: https://etm-murmansk.ru/new/api/setup.php
 * После использования — УДАЛИТЬ этот файл с сервера!
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: text/html; charset=utf-8');

echo '<h1>ETM Site — Первоначальная настройка</h1>';

// 1. Проверяем подключение к БД
echo '<h2>1. Подключение к БД</h2>';
try {
    $pdo = get_db();
    echo '<p style="color:green">✅ Подключение к MySQL успешно</p>';
} catch (Exception $e) {
    echo '<p style="color:red">❌ Ошибка подключения: ' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p>Проверьте config.php (DB_HOST, DB_NAME, DB_USER, DB_PASS)</p>';
    exit;
}

// 2. Проверяем таблицы
echo '<h2>2. Проверка таблиц</h2>';
$tables = ['admins', 'projects', 'partners', 'certificates', 'auth_tokens'];
foreach ($tables as $table) {
    try {
        $pdo->query("SELECT 1 FROM $table LIMIT 1");
        echo "<p style='color:green'>✅ Таблица <strong>$table</strong> существует</p>";
    } catch (Exception $e) {
        echo "<p style='color:red'>❌ Таблица <strong>$table</strong> не найдена. Выполните database.sql</p>";
    }
}

// 3. Создаём/обновляем пароль админа
echo '<h2>3. Настройка пароля админа</h2>';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['password'])) {
    $password = $_POST['password'];
    $login = trim($_POST['login'] ?? 'admin');

    if (mb_strlen($password) < 6) {
        echo '<p style="color:red">❌ Пароль должен быть не менее 6 символов</p>';
    } else {
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        // Проверяем, есть ли админ
        $stmt = $pdo->prepare('SELECT id FROM admins WHERE login = ?');
        $stmt->execute([$login]);

        if ($stmt->fetch()) {
            // Обновляем
            $pdo->prepare('UPDATE admins SET password_hash = ? WHERE login = ?')
                ->execute([$hash, $login]);
            echo "<p style='color:green'>✅ Пароль для <strong>$login</strong> обновлён</p>";
        } else {
            // Создаём
            $pdo->prepare('INSERT INTO admins (login, password_hash) VALUES (?, ?)')
                ->execute([$login, $hash]);
            echo "<p style='color:green'>✅ Админ <strong>$login</strong> создан</p>";
        }

        echo '<p><strong>Хеш:</strong> <code>' . htmlspecialchars($hash) . '</code></p>';
    }
}

// 4. Проверяем папку uploads
echo '<h2>4. Проверка папки uploads</h2>';
$upload_dir = __DIR__ . '/../uploads/';
if (is_dir($upload_dir) && is_writable($upload_dir)) {
    echo '<p style="color:green">✅ Папка uploads/ существует и доступна для записи</p>';
} elseif (is_dir($upload_dir)) {
    echo '<p style="color:orange">⚠️ Папка uploads/ существует, но НЕ доступна для записи. Установите chmod 755</p>';
} else {
    if (mkdir($upload_dir, 0755, true)) {
        echo '<p style="color:green">✅ Папка uploads/ создана</p>';
    } else {
        echo '<p style="color:red">❌ Не удалось создать папку uploads/. Создайте вручную</p>';
    }
}

?>

<hr>

<h2>Установить/изменить пароль админа</h2>
<form method="POST">
    <p>
        <label>Логин: <input type="text" name="login" value="admin" required></label>
    </p>
    <p>
        <label>Новый пароль: <input type="password" name="password" minlength="6" required></label>
    </p>
    <p>
        <button type="submit" style="padding:10px 20px; font-size:16px; cursor:pointer;">
            Сохранить пароль
        </button>
    </p>
</form>

<hr>
<p style="color:red"><strong>⚠️ ВАЖНО: Удалите этот файл (setup.php) после настройки!</strong></p>
