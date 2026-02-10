/**
 * Централизованный API клиент для работы с таблицами данных
 * Обеспечивает единообразную обработку запросов, ошибок и кеширования
 */

import { showNotification } from '../utils/notification.js';
import { sleep } from '../utils/helpers.js';

export class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.defaultRetries = 3;
    this.defaultRetryDelay = 1000;
  }

  /**
   * Выполнить GET запрос
   * @param {string} endpoint - URL эндпоинта
   * @param {Object} params - Query параметры
   * @param {Object} options - Дополнительные опции (cache, retries)
   * @returns {Promise<Object>}
   */
  async get(endpoint, params = {}, options = {}) {
    const { useCache = false, cacheTTL = 60000, retries = this.defaultRetries } = options;
    
    const url = this.buildURL(endpoint, params);
    const cacheKey = url;

    // Проверка кеша
    if (useCache && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < cacheTTL) {
        return data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await this.fetchWithRetry(url, { method: 'GET' }, retries);
      const data = await response.json();

      // Сохранение в кеш
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
   * Выполнить POST запрос
   * @param {string} endpoint - URL эндпоинта
   * @param {Object} data - Данные для отправки
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>}
   */
  async post(endpoint, data, options = {}) {
    const { retries = this.defaultRetries } = options;
    const url = this.buildURL(endpoint);

    try {
      const response = await this.fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        },
        retries
      );

      // Инвалидация кеша для этого эндпоинта
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
   * Выполнить PUT запрос (для редактирования)
   * @param {string} endpoint - URL эндпоинта
   * @param {string} id - ID записи
   * @param {Object} data - Данные для обновления
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>}
   */
  async put(endpoint, id, data, options = {}) {
    const { retries = this.defaultRetries } = options;
    const url = this.buildURL(`${endpoint}/${id}`);

    try {
      const response = await this.fetchWithRetry(
        url,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        },
        retries
      );

      // Инвалидация кеша
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
   * Выполнить DELETE запрос
   * @param {string} endpoint - URL эндпоинта
   * @param {string} id - ID записи для удаления
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>}
   */
  async delete(endpoint, id, options = {}) {
    const { retries = this.defaultRetries } = options;
    const url = this.buildURL(`${endpoint}/${id}`);

    try {
      const response = await this.fetchWithRetry(
        url,
        { method: 'DELETE' },
        retries
      );

      // Инвалидация кеша
      this.invalidateCache(endpoint);

      if (response.ok || response.status === 204) {
        return { success: true };
      }

      throw new Error(`Delete failed with status ${response.status}`);
    } catch (error) {
      this.handleError('DELETE', endpoint, error);
      throw error;
    }
  }

  /**
   * Fetch с автоматическими повторами при ошибке
   * @private
   */
  async fetchWithRetry(url, options, retries) {
    let lastError;

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error;

        // Не повторяем на последней попытке
        if (i < retries) {
          await sleep(this.defaultRetryDelay * (i + 1)); // Exponential backoff
          continue;
        }
      }
    }

    throw lastError;
  }

  /**
   * Построить полный URL с параметрами
   * @private
   */
  buildURL(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin + this.baseURL);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  /**
   * Инвалидировать кеш для эндпоинта
   * @private
   */
  invalidateCache(endpoint) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(endpoint)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Очистить весь кеш
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Обработка ошибок
   * @private
   */
  handleError(method, endpoint, error) {
    console.error(`[API ${method}] ${endpoint}:`, error);
    
    // Показываем пользователю понятное сообщение
    if (error.message.includes('Failed to fetch')) {
      showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
    } else if (error.message.includes('HTTP 404')) {
      showNotification('Запрашиваемый ресурс не найден.', 'error');
    } else if (error.message.includes('HTTP 500')) {
      showNotification('Ошибка сервера. Попробуйте позже.', 'error');
    } else {
      showNotification(`Ошибка: ${error.message}`, 'error');
    }
  }
}

// Создаём глобальный экземпляр API клиента
export const api = new APIClient();
