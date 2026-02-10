/**
 * Модуль аутентификации
 * Управление сессиями, вход/выход, проверка прав доступа
 */

import { SESSION_CONFIG, ADMIN_CONFIG, MESSAGES } from '../config/constants.js';
import { storage } from './helpers.js';
import { showNotification } from './notification.js';

/**
 * Хеширование пароля с использованием Web Crypto API
 * @param {string} password - Пароль для хеширования
 * @returns {Promise<string>} Hex строка SHA-256 хеша
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Класс для управления аутентификацией
 */
export class Auth {
  constructor() {
    this.sessionKey = SESSION_CONFIG.key;
    this.sessionDuration = SESSION_CONFIG.duration;
  }

  /**
   * Попытка входа
   * @param {string} password - Введённый пароль
   * @returns {Promise<boolean>}
   */
  async login(password) {
    try {
      // В production здесь должно быть сравнение хешей
      // const passwordHash = await hashPassword(password);
      // const isValid = passwordHash === ADMIN_CONFIG.passwordHash;
      
      // Для простоты используем plaintext (ИЗМЕНИТЬ В PRODUCTION!)
      const isValid = password === ADMIN_CONFIG.password;
      
      if (!isValid) {
        showNotification('Неверный пароль', 'error');
        return false;
      }

      // Создание сессии
      const now = Date.now();
      const sessionData = {
        loggedIn: true,
        loginTime: now,
        expiry: now + this.sessionDuration,
        lastActivity: now
      };

      storage.set(this.sessionKey, sessionData);
      showNotification(MESSAGES.success.loginSuccess, 'success');
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      showNotification(MESSAGES.error.unknownError, 'error');
      return false;
    }
  }

  /**
   * Выход из системы
   */
  logout() {
    storage.remove(this.sessionKey);
    showNotification(MESSAGES.success.logoutSuccess, 'info');
  }

  /**
   * Проверка, авторизован ли пользователь
   * @param {boolean} redirect - Перенаправлять на login.html если не авторизован
   * @returns {boolean}
   */
  isAuthenticated(redirect = false) {
    const session = storage.get(this.sessionKey);
    
    if (!session || !session.loggedIn) {
      if (redirect) {
        this.redirectToLogin();
      }
      return false;
    }

    const now = Date.now();

    // Проверка истечения сессии
    if (now >= session.expiry) {
      this.logout();
      if (redirect) {
        showNotification('Сессия истекла. Войдите снова.', 'warning');
        this.redirectToLogin();
      }
      return false;
    }

    // Обновление времени последней активности
    session.lastActivity = now;
    storage.set(this.sessionKey, session);

    return true;
  }

  /**
   * Получение информации о сессии
   * @returns {Object|null}
   */
  getSessionInfo() {
    const session = storage.get(this.sessionKey);
    
    if (!session || !this.isAuthenticated()) {
      return null;
    }

    const now = Date.now();
    const timeLeft = session.expiry - now;
    const minutesLeft = Math.floor(timeLeft / 60000);

    return {
      loginTime: new Date(session.loginTime),
      expiryTime: new Date(session.expiry),
      minutesLeft,
      isExpiringSoon: minutesLeft < 30
    };
  }

  /**
   * Продление сессии
   */
  extendSession() {
    const session = storage.get(this.sessionKey);
    
    if (!session) return false;

    const now = Date.now();
    session.expiry = now + this.sessionDuration;
    session.lastActivity = now;
    
    storage.set(this.sessionKey, session);
    return true;
  }

  /**
   * Перенаправление на страницу входа
   * @private
   */
  redirectToLogin() {
    // Сохраняем текущий URL для возврата после входа
    const returnURL = window.location.pathname + window.location.search;
    if (returnURL !== '/login.html') {
      storage.set('auth_return_url', returnURL);
    }
    
    window.location.href = '/login.html';
  }

  /**
   * Перенаправление на сохранённый URL после входа
   */
  redirectAfterLogin() {
    const returnURL = storage.get('auth_return_url');
    storage.remove('auth_return_url');
    
    if (returnURL && returnURL !== '/login.html') {
      window.location.href = returnURL;
    } else {
      window.location.href = '/admin-panel.html';
    }
  }

  /**
   * Проверка прав доступа к админ-панели
   * Вызывается при загрузке защищённых страниц
   * @returns {boolean}
   */
  requireAuth() {
    return this.isAuthenticated(true);
  }
}

// Создаём глобальный экземпляр
export const auth = new Auth();

/**
 * Middleware для защиты страниц
 * Используется в начале скриптов защищённых страниц
 */
export function protectPage() {
  if (!auth.requireAuth()) {
    // Пользователь будет перенаправлен в auth.requireAuth()
    throw new Error('Unauthorized access');
  }
}

/**
 * Автоматическое продление сессии при активности
 * Вызывается один раз при загрузке страницы
 */
export function setupSessionAutoExtend() {
  let activityTimeout;

  const resetActivityTimer = () => {
    clearTimeout(activityTimeout);
    
    activityTimeout = setTimeout(() => {
      const sessionInfo = auth.getSessionInfo();
      
      if (sessionInfo && sessionInfo.isExpiringSoon) {
        // Показываем предупреждение за 5 минут до истечения
        if (sessionInfo.minutesLeft <= 5) {
          showNotification(
            `Сессия истекает через ${sessionInfo.minutesLeft} мин. Продлить?`,
            'warning'
          );
        }
      }
    }, 60000); // Проверяем каждую минуту
  };

  // Отслеживаем активность пользователя
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetActivityTimer, { passive: true });
  });

  resetActivityTimer();
}

/**
 * Показать информацию о сессии в консоли (для отладки)
 */
export function debugSession() {
  const session = auth.getSessionInfo();
  
  if (!session) {
    console.log('No active session');
    return;
  }

  console.log('Session Info:', {
    loginTime: session.loginTime.toLocaleString('ru-RU'),
    expiryTime: session.expiryTime.toLocaleString('ru-RU'),
    timeLeft: `${session.minutesLeft} minutes`,
    isExpiringSoon: session.isExpiringSoon
  });
}
