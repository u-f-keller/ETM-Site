/**
 * Константы и конфигурация приложения
 */

// API эндпоинты (относительно baseURL 'api/')
export const API_ENDPOINTS = {
  projects: 'projects',
  partners: 'partners',
  certificates: 'certificates',
  upload: 'upload',
  authLogin: 'auth/login',
  authLogout: 'auth/logout',
  authCheck: 'auth/check',
};

// Категории проектов
export const PROJECT_CATEGORIES = [
  'Монтажные работы',
  'Пусконаладочные работы',
  'АСУТП',
  'Энергетика',
  'Горнодобывающая промышленность'
];

// Конфигурация сессии (клиентская часть)
export const SESSION_CONFIG = {
  tokenKey: 'etm_auth_token',
  checkInterval: 30 * 60 * 1000, // Проверять токен каждые 30 минут
};

// Настройки пагинации
export const PAGINATION = {
  defaultLimit: 100,
  maxLimit: 1000
};

// Настройки кеша
export const CACHE_CONFIG = {
  ttl: 60000,
  enabled: true
};

// Годы для фильтрации проектов
export const PROJECT_YEARS = [2023, 2024, 2025, 2026];

// Настройки уведомлений
export const NOTIFICATION_CONFIG = {
  duration: 3000,
  position: 'top-right'
};

// Allowed HTML tags для Rich Text (Quill)
export const ALLOWED_HTML_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
];

export const ALLOWED_HTML_ATTRS = ['href', 'target', 'rel', 'class'];

// Текстовые сообщения
export const MESSAGES = {
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
  error: {
    networkError: 'Ошибка сети. Проверьте подключение.',
    serverError: 'Ошибка сервера. Попробуйте позже.',
    notFound: 'Запрашиваемый ресурс не найден.',
    unauthorized: 'Требуется авторизация.',
    invalidCredentials: 'Неверный логин или пароль.',
    validationError: 'Проверьте правильность заполнения формы.',
    deleteError: 'Ошибка при удалении.',
    unknownError: 'Произошла неизвестная ошибка.'
  },
  confirm: {
    deleteProject: 'Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.',
    deletePartner: 'Удалить партнёра?',
    deleteCertificate: 'Удалить сертификат?',
    logout: 'Вы уверены, что хотите выйти?',
    unsavedChanges: 'У вас есть несохранённые изменения. Продолжить?'
  },
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

// Regex patterns
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
