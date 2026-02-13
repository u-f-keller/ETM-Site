/**
 * Централизованный API клиент
 * Работает с локальным PHP backend (/api/)
 */

import { showNotification } from '../utils/notification.js';
import { sleep } from '../utils/helpers.js';

// Ключ для хранения токена в localStorage
const TOKEN_KEY = 'etm_auth_token';

export class APIClient {
  constructor(baseURL = 'api/') {
    // Относительный путь — работает и в /new/, и в корне
    this.baseURL = baseURL;
    this.cache = new Map();
    this.defaultRetries = 2;
    this.defaultRetryDelay = 1000;
  }

  /**
   * Получить сохранённый токен
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Сохранить токен
   */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Удалить токен
   */
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Заголовки с авторизацией
   */
  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * GET запрос
   */
  async get(endpoint, params = {}, options = {}) {
    const { useCache = false, cacheTTL = 60000, retries = this.defaultRetries } = options;

    const url = this.buildURL(endpoint, params);
    const cacheKey = url;

    if (useCache && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < cacheTTL) {
        return data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }, retries);

      const data = await response.json();

      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      this.handleError('GET', endpoint, error);
      throw error;
    }
  }

  /**
   * POST запрос
   */
  async post(endpoint, data, options = {}) {
    const { retries = this.defaultRetries } = options;
    const url = this.buildURL(endpoint);

    try {
      const response = await this.fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data),
        },
        retries
      );

      this.invalidateCache(endpoint);

      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      this.handleError('POST', endpoint, error);
      throw error;
    }
  }

  /**
   * PUT запрос
   */
  async put(endpoint, id, data, options = {}) {
    const { retries = this.defaultRetries } = options;
    const url = this.buildURL(`${endpoint}/${id}`);

    try {
      const response = await this.fetchWithRetry(
        url,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data),
        },
        retries
      );

      this.invalidateCache(endpoint);

      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      this.handleError('PUT', endpoint, error);
      throw error;
    }
  }

  /**
   * DELETE запрос
   */
  async delete(endpoint, id, options = {}) {
    const { retries = this.defaultRetries } = options;
    const url = this.buildURL(`${endpoint}/${id}`);

    try {
      const response = await this.fetchWithRetry(
        url,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        },
        retries
      );

      this.invalidateCache(endpoint);

      if (response.status === 204 || response.ok) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      this.handleError('DELETE', endpoint, error);
      throw error;
    }
  }

  /**
   * Загрузка файла (multipart/form-data)
   */
  async uploadFile(file) {
    const url = this.buildURL('upload');
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // НЕ ставим Content-Type — браузер сам поставит multipart с boundary

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.handleError('UPLOAD', 'upload', error);
      throw error;
    }
  }

  // ── Вспомогательные методы ──

  async fetchWithRetry(url, options, retries) {
    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          // Для 401 не повторяем
          if (response.status === 401) {
            throw new Error('HTTP 401: Требуется авторизация');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        if (i < retries && !error.message.includes('401')) {
          await sleep(this.defaultRetryDelay * (i + 1));
          continue;
        }
      }
    }
    throw lastError;
  }

  buildURL(endpoint, params = {}) {
    // Относительный URL от текущей страницы
    const url = new URL(this.baseURL + endpoint, window.location.href);

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  invalidateCache(endpoint) {
    for (const key of this.cache.keys()) {
      if (key.includes(endpoint)) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  handleError(method, endpoint, error) {
    console.error(`[API ${method}] ${endpoint}:`, error);

    if (error.message.includes('Failed to fetch')) {
      showNotification('Ошибка сети. Проверьте подключение.', 'error');
    } else if (error.message.includes('401')) {
      showNotification('Сессия истекла. Войдите снова.', 'error');
    } else if (error.message.includes('404')) {
      showNotification('Ресурс не найден.', 'error');
    } else if (error.message.includes('500')) {
      showNotification('Ошибка сервера. Попробуйте позже.', 'error');
    } else {
      showNotification(`Ошибка: ${error.message}`, 'error');
    }
  }
}

// Глобальный экземпляр
export const api = new APIClient();