/**
 * Утилиты для санитизации и защиты от XSS атак
 */

import { ALLOWED_HTML_TAGS, ALLOWED_HTML_ATTRS } from '../config/constants.js';

/**
 * Санитизация обычного текста
 * Преобразует все HTML в текст
 * @param {string} text - Текст для санитизации
 * @returns {string}
 */
export function sanitizeText(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Санитизация HTML контента (для Rich Text от Quill)
 * Удаляет опасные теги и атрибуты
 * @param {string} html - HTML для санитизации
 * @returns {string}
 */
export function sanitizeHTML(html) {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Удаляем опасные теги
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    temp.querySelectorAll(tag).forEach(el => el.remove());
  });
  
  // Рекурсивная очистка элементов
  cleanElement(temp);
  
  return temp.innerHTML;
}

/**
 * Очистка элемента и его потомков
 * @private
 * @param {HTMLElement} element - Элемент для очистки
 */
function cleanElement(element) {
  // Получаем все дочерние элементы
  const children = Array.from(element.children);
  
  children.forEach(child => {
    const tagName = child.tagName.toLowerCase();
    
    // Если тег не в whitelist - удаляем его, но сохраняем контент
    if (!ALLOWED_HTML_TAGS.includes(tagName)) {
      const textNode = document.createTextNode(child.textContent);
      child.replaceWith(textNode);
      return;
    }
    
    // Очищаем атрибуты
    cleanAttributes(child);
    
    // Рекурсивно очищаем потомков
    if (child.children.length > 0) {
      cleanElement(child);
    }
  });
}

/**
 * Очистка атрибутов элемента
 * @private
 * @param {HTMLElement} element - Элемент
 */
function cleanAttributes(element) {
  const attrs = Array.from(element.attributes);
  
  attrs.forEach(attr => {
    const name = attr.name.toLowerCase();
    
    // Удаляем event handlers (onclick, onload и т.д.)
    if (name.startsWith('on')) {
      element.removeAttribute(name);
      return;
    }
    
    // Удаляем data-* атрибуты (могут содержать вредоносный код)
    if (name.startsWith('data-')) {
      element.removeAttribute(name);
      return;
    }
    
    // Проверяем whitelist атрибутов
    if (!ALLOWED_HTML_ATTRS.includes(name) && name !== 'class') {
      element.removeAttribute(name);
      return;
    }
    
    // Санитизация href и src атрибутов
    if (name === 'href' || name === 'src') {
      const value = attr.value.toLowerCase().trim();
      
      // Блокируем javascript: и data: протоколы
      if (value.startsWith('javascript:') || value.startsWith('data:')) {
        element.removeAttribute(name);
      }
    }
  });
  
  // Для ссылок добавляем безопасные атрибуты
  if (element.tagName.toLowerCase() === 'a') {
    if (element.hasAttribute('href')) {
      element.setAttribute('rel', 'noopener noreferrer');
      
      // Внешние ссылки открываем в новой вкладке
      const href = element.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('/')) {
        element.setAttribute('target', '_blank');
      }
    }
  }
}

/**
 * Валидация и санитизация URL
 * @param {string} url - URL для проверки
 * @param {boolean} allowRelative - Разрешить относительные URL
 * @returns {string|null}
 */
export function sanitizeURL(url, allowRelative = false) {
  if (!url) return null;
  
  const trimmedURL = url.trim();
  
  // Проверка на опасные протоколы
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerURL = trimmedURL.toLowerCase();
  
  if (dangerousProtocols.some(protocol => lowerURL.startsWith(protocol))) {
    return null;
  }
  
  // Относительные URL
  if (allowRelative && (trimmedURL.startsWith('/') || trimmedURL.startsWith('#'))) {
    return trimmedURL;
  }
  
  // Проверка абсолютных URL
  try {
    const urlObj = new URL(trimmedURL);
    
    // Разрешаем только http и https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Санитизация для использования в атрибутах
 * @param {string} value - Значение
 * @returns {string}
 */
export function sanitizeAttribute(value) {
  if (!value) return '';
  
  return String(value)
    .replace(/[&<>"']/g, char => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[char];
    });
}

/**
 * Санитизация имени файла
 * @param {string} filename - Имя файла
 * @returns {string}
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Проверка на потенциальный SQL injection
 * (базовая проверка, основная защита должна быть на сервере)
 * @param {string} input - Входные данные
 * @returns {boolean}
 */
export function containsSQLInjection(input) {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=.*|1=1|'=')/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Экранирование для использования в RegExp
 * @param {string} string - Строка
 * @returns {string}
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Валидация и санитизация email
 * @param {string} email - Email адрес
 * @returns {string|null}
 */
export function sanitizeEmail(email) {
  if (!email) return null;
  
  const trimmed = email.trim().toLowerCase();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!pattern.test(trimmed)) {
    return null;
  }
  
  // Дополнительная проверка на опасные символы
  if (trimmed.includes('<') || trimmed.includes('>') || trimmed.includes('"')) {
    return null;
  }
  
  return trimmed;
}

/**
 * Санитизация номера телефона
 * @param {string} phone - Номер телефона
 * @returns {string|null}
 */
export function sanitizePhone(phone) {
  if (!phone) return null;
  
  // Оставляем только цифры, пробелы, +, -, (, )
  const cleaned = phone.replace(/[^\d\s\+\-\(\)]/g, '');
  
  // Проверка минимальной длины (без пробелов и символов)
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return null;
  }
  
  return cleaned.trim();
}

/**
 * Безопасное создание innerHTML
 * @param {string} html - HTML строка
 * @returns {DocumentFragment}
 */
export function createSafeHTML(html) {
  const sanitized = sanitizeHTML(html);
  const template = document.createElement('template');
  template.innerHTML = sanitized;
  return template.content;
}
