/**
 * Компонент индикатора загрузки
 */

import { $, empty, setHTML, addClass, removeClass } from '../utils/dom.js';

/**
 * Класс для управления индикаторами загрузки
 */
export class LoadingIndicator {
  /**
   * Показать индикатор загрузки в контейнере
   * @param {Element|string} target - Элемент или селектор
   * @param {string} message - Сообщение
   * @param {boolean} fullscreen - Полноэкранный режим
   */
  static show(target, message = 'Загрузка...', fullscreen = false) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    if (fullscreen) {
      this.showFullscreen(message);
      return;
    }

    // Сохраняем оригинальный контент
    if (!element.dataset.originalContent) {
      element.dataset.originalContent = element.innerHTML;
    }

    const loaderHTML = `
      <div class="loading-indicator text-center py-8">
        <i class="fas fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
        <p class="text-gray-600">${message}</p>
      </div>
    `;

    setHTML(element, loaderHTML);
  }

  /**
   * Скрыть индикатор загрузки
   * @param {Element|string} target - Элемент или селектор
   */
  static hide(target) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    // Восстанавливаем оригинальный контент
    if (element.dataset.originalContent) {
      setHTML(element, element.dataset.originalContent);
      delete element.dataset.originalContent;
    } else {
      empty(element);
    }
  }

  /**
   * Показать полноэкранный индикатор
   * @param {string} message - Сообщение
   */
  static showFullscreen(message = 'Загрузка...') {
    // Проверяем, нет ли уже индикатора
    let overlay = $('#loading-overlay');
    
    if (overlay) {
      const messageEl = overlay.querySelector('.loading-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
      return;
    }

    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <i class="fas fa-spinner fa-spin text-5xl text-cyan-500 mb-4"></i>
        <p class="loading-message text-gray-900 font-medium text-lg">${message}</p>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Скрыть полноэкранный индикатор
   */
  static hideFullscreen() {
    const overlay = $('#loading-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  /**
   * Показать скелетон для списка
   * @param {Element|string} target - Элемент или селектор
   * @param {number} count - Количество элементов скелетона
   */
  static showSkeleton(target, count = 3) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    const skeletonHTML = Array(count).fill(null).map(() => `
      <div class="skeleton bg-gray-200 rounded-2xl h-96 animate-pulse"></div>
    `).join('');

    setHTML(element, skeletonHTML);
  }

  /**
   * Показать индикатор в кнопке
   * @param {Element} button - Кнопка
   * @param {string} message - Текст кнопки во время загрузки
   */
  static showInButton(button, message = 'Загрузка...') {
    if (!button) return;

    // Сохраняем оригинальный текст
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.disabled = true;
    addClass(button, 'opacity-75', 'cursor-not-allowed');
    
    button.innerHTML = `
      <i class="fas fa-spinner fa-spin mr-2"></i>${message}
    `;
  }

  /**
   * Скрыть индикатор в кнопке
   * @param {Element} button - Кнопка
   */
  static hideInButton(button) {
    if (!button) return;

    button.disabled = false;
    removeClass(button, 'opacity-75', 'cursor-not-allowed');

    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  /**
   * Показать мини-индикатор (маленький спиннер)
   * @param {Element|string} target - Элемент или селектор
   */
  static showMini(target) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    const spinner = document.createElement('i');
    spinner.className = 'fas fa-spinner fa-spin text-cyan-500 mini-loader';
    element.appendChild(spinner);
  }

  /**
   * Скрыть мини-индикатор
   * @param {Element|string} target - Элемент или селектор
   */
  static hideMini(target) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    const spinner = element.querySelector('.mini-loader');
    if (spinner) {
      spinner.remove();
    }
  }
}

/**
 * Упрощённые функции для быстрого использования
 */
export const loader = {
  show: (target, message) => LoadingIndicator.show(target, message),
  hide: (target) => LoadingIndicator.hide(target),
  fullscreen: (message) => LoadingIndicator.showFullscreen(message),
  hideFullscreen: () => LoadingIndicator.hideFullscreen(),
  skeleton: (target, count) => LoadingIndicator.showSkeleton(target, count),
  button: (button, message) => LoadingIndicator.showInButton(button, message),
  hideButton: (button) => LoadingIndicator.hideInButton(button)
};
