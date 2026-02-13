/**
 * Вспомогательные утилиты
 */

/**
 * Задержка выполнения
 * @param {number} ms - Миллисекунды
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce функции
 * @param {Function} fn - Функция для debounce
 * @param {number} delay - Задержка в мс
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle функции
 * @param {Function} fn - Функция для throttle
 * @param {number} limit - Минимальный интервал в мс
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Форматирование даты
 * @param {string|Date} date - Дата
 * @param {string} format - Формат ('DD.MM.YYYY', 'YYYY-MM-DD')
 * @returns {string}
 */
export function formatDate(date, format = 'DD.MM.YYYY') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (!(d instanceof Date) || isNaN(d)) {
    return '';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  const formats = {
    'DD.MM.YYYY': `${day}.${month}.${year}`,
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'DD/MM/YYYY': `${day}/${month}/${year}`
  };
  
  return formats[format] || formats['DD.MM.YYYY'];
}

/**
 * Генерация UUID v4
 * @returns {string}
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Удаление HTML тегов из строки
 * @param {string} html - HTML строка
 * @returns {string}
 */
export function stripHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Обрезка строки с добавлением многоточия
 * @param {string} text - Исходный текст
 * @param {number} maxLength - Максимальная длина
 * @returns {string}
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Проверка валидности URL
 * @param {string} url - URL для проверки
 * @returns {boolean}
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Проверка валидности email
 * @param {string} email - Email для проверки
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Экранирование HTML специальных символов
 * @param {string} text - Текст для экранирования
 * @returns {string}
 */
export function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Получение параметров из URL
 * @param {string} param - Название параметра
 * @returns {string|null}
 */
export function getURLParameter(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

/**
 * Копирование в буфер обмена
 * @param {string} text - Текст для копирования
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Проверка, является ли устройство мобильным
 * @returns {boolean}
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Получение размера экрана
 * @returns {Object} { width, height, isMobile, isTablet, isDesktop }
 */
export function getScreenSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
}

/**
 * Плавная прокрутка к элементу
 * @param {string|Element} target - Селектор или элемент
 * @param {number} offset - Смещение в пикселях
 */
export function scrollToElement(target, offset = 80) {
  const element = typeof target === 'string' 
    ? document.querySelector(target) 
    : target;
    
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Локальное хранилище с обработкой ошибок
 */
export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

/**
 * Создание элемента DOM с атрибутами
 * @param {string} tag - Тег элемента
 * @param {Object} attrs - Атрибуты
 * @param {string|Array} children - Дочерние элементы
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = null) {
  const element = document.createElement(tag);
  
  // Установка атрибутов
  Object.keys(attrs).forEach(key => {
    if (key === 'className') {
      element.className = attrs[key];
    } else if (key === 'dataset') {
      Object.keys(attrs[key]).forEach(dataKey => {
        element.dataset[dataKey] = attrs[key][dataKey];
      });
    } else if (key.startsWith('on')) {
      const event = key.substring(2).toLowerCase();
      element.addEventListener(event, attrs[key]);
    } else {
      element.setAttribute(key, attrs[key]);
    }
  });
  
  // Добавление дочерних элементов
  if (children) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
          element.appendChild(child);
        }
      });
    } else if (typeof children === 'string') {
      element.textContent = children;
    } else if (children instanceof HTMLElement) {
      element.appendChild(children);
    }
  }
  
  return element;
}

/**
 * Группировка массива по ключу
 * @param {Array} array - Массив объектов
 * @param {string} key - Ключ для группировки
 * @returns {Object}
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Сортировка массива объектов
 * @param {Array} array - Массив для сортировки
 * @param {string} key - Ключ для сортировки
 * @param {string} order - 'asc' или 'desc'
 * @returns {Array}
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}
