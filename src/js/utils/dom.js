/**
 * Утилиты для работы с DOM
 */

/**
 * Безопасное получение элемента
 * @param {string} selector - CSS селектор
 * @param {Element} context - Контекст поиска (по умолчанию document)
 * @returns {Element|null}
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Получение всех элементов
 * @param {string} selector - CSS селектор
 * @param {Element} context - Контекст поиска
 * @returns {Array<Element>}
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Переключение класса
 * @param {Element} element - Элемент
 * @param {string} className - Класс
 * @param {boolean} force - Принудительно добавить/удалить
 */
export function toggleClass(element, className, force = undefined) {
  if (!element) return;
  element.classList.toggle(className, force);
}

/**
 * Добавление класса
 * @param {Element} element - Элемент
 * @param {...string} classNames - Классы
 */
export function addClass(element, ...classNames) {
  if (!element) return;
  element.classList.add(...classNames);
}

/**
 * Удаление класса
 * @param {Element} element - Элемент
 * @param {...string} classNames - Классы
 */
export function removeClass(element, ...classNames) {
  if (!element) return;
  element.classList.remove(...classNames);
}

/**
 * Проверка наличия класса
 * @param {Element} element - Элемент
 * @param {string} className - Класс
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element ? element.classList.contains(className) : false;
}

/**
 * Показать элемент
 * @param {Element} element - Элемент
 */
export function show(element) {
  if (!element) return;
  element.classList.remove('hidden');
  element.style.display = '';
}

/**
 * Скрыть элемент
 * @param {Element} element - Элемент
 */
export function hide(element) {
  if (!element) return;
  element.classList.add('hidden');
}

/**
 * Переключить видимость
 * @param {Element} element - Элемент
 * @param {boolean} visible - Показать или скрыть
 */
export function toggle(element, visible = undefined) {
  if (!element) return;
  
  if (visible === undefined) {
    toggleClass(element, 'hidden');
  } else {
    toggleClass(element, 'hidden', !visible);
  }
}

/**
 * Установка HTML с санитизацией
 * @param {Element} element - Элемент
 * @param {string} html - HTML строка
 */
export function setHTML(element, html) {
  if (!element) return;
  element.innerHTML = html;
}

/**
 * Установка текста
 * @param {Element} element - Элемент
 * @param {string} text - Текст
 */
export function setText(element, text) {
  if (!element) return;
  element.textContent = text;
}

/**
 * Получение/установка атрибута
 * @param {Element} element - Элемент
 * @param {string} name - Название атрибута
 * @param {string} value - Значение (если undefined, то получение)
 * @returns {string|null}
 */
export function attr(element, name, value = undefined) {
  if (!element) return null;
  
  if (value === undefined) {
    return element.getAttribute(name);
  }
  
  element.setAttribute(name, value);
  return value;
}

/**
 * Удаление атрибута
 * @param {Element} element - Элемент
 * @param {string} name - Название атрибута
 */
export function removeAttr(element, name) {
  if (!element) return;
  element.removeAttribute(name);
}

/**
 * Получение/установка data-атрибута
 * @param {Element} element - Элемент
 * @param {string} key - Ключ
 * @param {any} value - Значение
 * @returns {any}
 */
export function data(element, key, value = undefined) {
  if (!element) return null;
  
  if (value === undefined) {
    return element.dataset[key];
  }
  
  element.dataset[key] = value;
  return value;
}

/**
 * Добавление обработчика события
 * @param {Element} element - Элемент
 * @param {string} event - Событие
 * @param {Function} handler - Обработчик
 * @param {Object} options - Опции addEventListener
 */
export function on(element, event, handler, options = {}) {
  if (!element) return;
  element.addEventListener(event, handler, options);
}

/**
 * Удаление обработчика события
 * @param {Element} element - Элемент
 * @param {string} event - Событие
 * @param {Function} handler - Обработчик
 */
export function off(element, event, handler) {
  if (!element) return;
  element.removeEventListener(event, handler);
}

/**
 * Однократное выполнение обработчика
 * @param {Element} element - Элемент
 * @param {string} event - Событие
 * @param {Function} handler - Обработчик
 */
export function once(element, event, handler) {
  if (!element) return;
  element.addEventListener(event, handler, { once: true });
}

/**
 * Делегирование события
 * @param {Element} parent - Родительский элемент
 * @param {string} event - Событие
 * @param {string} selector - Селектор потомка
 * @param {Function} handler - Обработчик
 */
export function delegate(parent, event, selector, handler) {
  if (!parent) return;
  
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e);
    }
  });
}

/**
 * Очистка содержимого элемента
 * @param {Element} element - Элемент
 */
export function empty(element) {
  if (!element) return;
  element.innerHTML = '';
}

/**
 * Удаление элемента
 * @param {Element} element - Элемент
 */
export function remove(element) {
  if (!element || !element.parentNode) return;
  element.parentNode.removeChild(element);
}

/**
 * Вставка HTML после начала элемента
 * @param {Element} element - Элемент
 * @param {string} html - HTML
 */
export function prepend(element, html) {
  if (!element) return;
  element.insertAdjacentHTML('afterbegin', html);
}

/**
 * Вставка HTML перед концом элемента
 * @param {Element} element - Элемент
 * @param {string} html - HTML
 */
export function append(element, html) {
  if (!element) return;
  element.insertAdjacentHTML('beforeend', html);
}

/**
 * Получение родителя по селектору
 * @param {Element} element - Элемент
 * @param {string} selector - Селектор
 * @returns {Element|null}
 */
export function closest(element, selector) {
  return element ? element.closest(selector) : null;
}

/**
 * Получение следующего соседнего элемента
 * @param {Element} element - Элемент
 * @param {string} selector - Опциональный селектор
 * @returns {Element|null}
 */
export function next(element, selector = null) {
  if (!element) return null;
  
  let sibling = element.nextElementSibling;
  
  if (selector) {
    while (sibling && !sibling.matches(selector)) {
      sibling = sibling.nextElementSibling;
    }
  }
  
  return sibling;
}

/**
 * Получение предыдущего соседнего элемента
 * @param {Element} element - Элемент
 * @param {string} selector - Опциональный селектор
 * @returns {Element|null}
 */
export function prev(element, selector = null) {
  if (!element) return null;
  
  let sibling = element.previousElementSibling;
  
  if (selector) {
    while (sibling && !sibling.matches(selector)) {
      sibling = sibling.previousElementSibling;
    }
  }
  
  return sibling;
}

/**
 * Проверка видимости элемента
 * @param {Element} element - Элемент
 * @returns {boolean}
 */
export function isVisible(element) {
  if (!element) return false;
  return element.offsetParent !== null && !hasClass(element, 'hidden');
}

/**
 * Фокус на элементе
 * @param {Element} element - Элемент
 */
export function focus(element) {
  if (!element) return;
  element.focus();
}

/**
 * Получение значения поля формы
 * @param {Element} element - Поле формы
 * @returns {string|boolean}
 */
export function getValue(element) {
  if (!element) return '';
  
  if (element.type === 'checkbox') {
    return element.checked;
  }
  
  if (element.type === 'radio') {
    const form = element.form;
    if (form) {
      const checked = form.querySelector(`input[name="${element.name}"]:checked`);
      return checked ? checked.value : '';
    }
    return element.checked ? element.value : '';
  }
  
  return element.value;
}

/**
 * Установка значения поля формы
 * @param {Element} element - Поле формы
 * @param {string|boolean} value - Значение
 */
export function setValue(element, value) {
  if (!element) return;
  
  if (element.type === 'checkbox') {
    element.checked = Boolean(value);
  } else if (element.type === 'radio') {
    element.checked = (element.value === value);
  } else {
    element.value = value;
  }
}

/**
 * Disable/Enable элемент
 * @param {Element} element - Элемент
 * @param {boolean} disabled - Отключить или включить
 */
export function setDisabled(element, disabled = true) {
  if (!element) return;
  
  if (disabled) {
    element.setAttribute('disabled', '');
  } else {
    element.removeAttribute('disabled');
  }
}

/**
 * Получение размеров и позиции элемента
 * @param {Element} element - Элемент
 * @returns {Object} { top, left, width, height }
 */
export function getRect(element) {
  if (!element) return { top: 0, left: 0, width: 0, height: 0 };
  return element.getBoundingClientRect();
}

/**
 * Анимация появления элемента
 * @param {Element} element - Элемент
 * @param {number} duration - Длительность в мс
 */
export function fadeIn(element, duration = 300) {
  if (!element) return;
  
  element.style.opacity = '0';
  element.style.display = '';
  element.classList.remove('hidden');
  
  setTimeout(() => {
    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '1';
  }, 10);
}

/**
 * Анимация исчезновения элемента
 * @param {Element} element - Элемент
 * @param {number} duration - Длительность в мс
 */
export function fadeOut(element, duration = 300) {
  if (!element) return;
  
  element.style.transition = `opacity ${duration}ms`;
  element.style.opacity = '0';
  
  setTimeout(() => {
    element.style.display = 'none';
    element.classList.add('hidden');
  }, duration);
}
