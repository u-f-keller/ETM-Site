/**
 * Константы и конфигурация приложения
 */

// API эндпоинты
export const API_ENDPOINTS = {
  projects: 'tables/projects',
  partners: 'tables/partners',
  certificates: 'tables/certificates'
};

// Категории проектов
export const PROJECT_CATEGORIES = [
  'Монтажные работы',
  'Пусконаладочные работы',
  'АСУТП',
  'Энергетика',
  'Горнодобывающая промышленность'
];

// Конфигурация сессии
export const SESSION_CONFIG = {
  key: 'etm_admin_session',
  duration: 24 * 60 * 60 * 1000 // 24 часа в миллисекундах
};

// Конфигурация пароля администратора
// В production это должен быть хеш пароля из переменных окружения
export const ADMIN_CONFIG = {
  // SHA-256 hash от 'etm2026'
  passwordHash: 'e8c8c0c8b5e5a5d5f5c5b5a5d5f5c5b5a5d5f5c5b5a5d5f5c5b5a5d5f5c5b5a5',
  // Для разработки используем plaintext (ИЗМЕНИТЬ В PRODUCTION!)
  password: 'etm2026'
};

// Настройки пагинации
export const PAGINATION = {
  defaultLimit: 100,
  maxLimit: 1000
};

// Настройки кеша
export const CACHE_CONFIG = {
  ttl: 60000, // 1 минута
  enabled: true
};

// Годы для фильтрации проектов
export const PROJECT_YEARS = [2023, 2024, 2025, 2026];

// Настройки уведомлений
export const NOTIFICATION_CONFIG = {
  duration: 3000, // 3 секунды
  position: 'top-right'
};

// Allowed HTML tags для Rich Text (Quill)
export const ALLOWED_HTML_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
];

// Allowed HTML attributes
export const ALLOWED_HTML_ATTRS = ['href', 'target', 'rel', 'class'];

// Текстовые сообщения
export const MESSAGES = {
  // Success messages
  success: {
    projectCreated: 'Проект успешно добавлен!',
    projectUpdated: 'Проект успешно обновлён!',
    projectDeleted: 'Проект удалён',
    partnerCreated: 'Партнёр успешно добавлен!',
    partnerUpdated: 'Партнёр успешно обновлён!',
    partnerDeleted: 'Партнёр удалён',
    certificateCreated: 'Сертификат успешно добавлен!',
    certificateUpdated: 'Сертификат успешно обновлён!',
    certificateDeleted: 'Сертификат удалён',
    loginSuccess: 'Вход выполнен успешно',
    logoutSuccess: 'Вы вышли из системы'
  },
  
  // Error messages
  error: {
    networkError: 'Ошибка сети. Проверьте подключение.',
    serverError: 'Ошибка сервера. Попробуйте позже.',
    notFound: 'Запрашиваемый ресурс не найден.',
    unauthorized: 'Требуется авторизация.',
    validationError: 'Проверьте правильность заполнения формы.',
    deleteError: 'Ошибка при удалении.',
    unknownError: 'Произошла неизвестная ошибка.'
  },
  
  // Confirmation messages
  confirm: {
    deleteProject: 'Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.',
    deletePartner: 'Удалить партнёра?',
    deleteCertificate: 'Удалить сертификат?',
    logout: 'Вы уверены, что хотите выйти?',
    unsavedChanges: 'У вас есть несохранённые изменения. Продолжить?'
  },
  
  // Info messages
  info: {
    noProjects: 'Пока нет добавленных проектов',
    noPartners: 'Пока нет добавленных партнёров',
    noCertificates: 'Пока нет добавленных сертификатов',
    loading: 'Загрузка...',
    searching: 'Поиск...'
  }
};

// Placeholder изображения
export const PLACEHOLDER_IMAGE = {
  project: (title) => `https://via.placeholder.com/400x300/3b82f6/ffffff?text=${encodeURIComponent(title)}`,
  partner: (name) => `https://via.placeholder.com/200x100/f3f4f6/6b7280?text=${encodeURIComponent(name)}`,
  certificate: (title) => `https://via.placeholder.com/400x600/3b82f6/ffffff?text=${encodeURIComponent(title)}`
};

// Regex patterns для валидации
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  year: /^\d{4}$/,
  phone: /^[\d\s\-\+\(\)]+$/
};

// Лимиты для полей
export const FIELD_LIMITS = {
  title: { min: 3, max: 200 },
  description: { min: 10, max: 5000 },
  name: { min: 2, max: 100 },
  url: { max: 500 },
  tag: { max: 50 },
  tags: { max: 20 }
};

// Debounce delays (ms)
export const DEBOUNCE_DELAYS = {
  search: 300,
  input: 500,
  resize: 150
};
