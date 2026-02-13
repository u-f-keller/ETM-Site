-- ============================================
-- ETM Site — структура базы данных
-- MySQL 5.7+ / MariaDB 10.3+
-- ============================================

CREATE DATABASE IF NOT EXISTS cc71829_etmsite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cc71829_etmsite;

-- --------------------------------------------
-- Таблица админов
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Дефолтный админ: login=admin, password=etm2026
-- Пароль ОБЯЗАТЕЛЬНО сменить после первого входа!
INSERT INTO admins (login, password_hash) VALUES
  ('admin', '$2y$12$placeholder_hash_replace_me');
-- Реальный хеш будет сгенерирован при первом запуске через setup.php

-- --------------------------------------------
-- Проекты
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT '',
  client VARCHAR(200) DEFAULT '',
  location VARCHAR(200) DEFAULT '',
  description TEXT,
  image_url VARCHAR(500) DEFAULT '',
  tags JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_year (year),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Партнёры
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS partners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  logo_url VARCHAR(500) NOT NULL DEFAULT '',
  website VARCHAR(500) DEFAULT '',
  description TEXT,
  sort_order SMALLINT UNSIGNED DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_sort (sort_order)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Сертификаты
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  number VARCHAR(100) NOT NULL DEFAULT '',
  issued_date DATE DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  pdf_url VARCHAR(500) DEFAULT '',
  description TEXT,
  sort_order SMALLINT UNSIGNED DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_sort (sort_order)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Токены сессий (серверная аутентификация)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_token (token),
  INDEX idx_expires (expires_at),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;
