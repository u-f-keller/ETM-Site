/**
 * Универсальный компонент модального окна
 */

import { $, addClass, removeClass, on, off, empty, setHTML } from '../utils/dom.js';

/**
 * Класс модального окна
 */
export class Modal {
  constructor(id, options = {}) {
    this.id = id;
    this.options = {
      title: options.title || '',
      content: options.content || '',
      size: options.size || 'medium', // small, medium, large, full
      showClose: options.showClose !== false,
      closeOnBackdrop: options.closeOnBackdrop !== false,
      closeOnEscape: options.closeOnEscape !== false,
      onOpen: options.onOpen || null,
      onClose: options.onClose || null,
      footer: options.footer || null
    };

    this.isOpen = false;
    this.element = null;
    
    this.handleEscape = this.handleEscape.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
  }

  /**
   * Создать HTML модального окна
   * @private
   */
  createHTML() {
    const sizeClasses = {
      small: 'max-w-md',
      medium: 'max-w-2xl',
      large: 'max-w-4xl',
      full: 'max-w-7xl'
    };

    return `
      <div id="${this.id}" class="modal hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl ${sizeClasses[this.options.size]} w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0">
          ${this.options.title || this.options.showClose ? `
            <div class="modal-header sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl z-10">
              <h3 class="modal-title text-2xl font-bold text-gray-900">${this.options.title}</h3>
              ${this.options.showClose ? `
                <button class="modal-close text-gray-400 hover:text-gray-600 transition">
                  <i class="fas fa-times text-2xl"></i>
                </button>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="modal-body p-6">
            ${this.options.content}
          </div>
          
          ${this.options.footer ? `
            <div class="modal-footer border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
              ${this.options.footer}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Инициализация модального окна
   */
  init() {
    // Проверяем, не существует ли уже модал
    let existing = $(`#${this.id}`);
    if (existing) {
      this.element = existing;
      return this;
    }

    // Создаём новый модал
    const modalHTML = this.createHTML();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.element = $(`#${this.id}`);

    // Навешиваем обработчики
    this.attachEventListeners();

    return this;
  }

  /**
   * Навешивание обработчиков событий
   * @private
   */
  attachEventListeners() {
    if (!this.element) return;

    // Кнопка закрытия
    const closeBtn = this.element.querySelector('.modal-close');
    if (closeBtn) {
      on(closeBtn, 'click', () => this.close());
    }

    // Закрытие по клику на backdrop
    if (this.options.closeOnBackdrop) {
      on(this.element, 'click', this.handleBackdropClick);
    }
  }

  /**
   * Обработчик клика на backdrop
   * @private
   */
  handleBackdropClick(e) {
    if (e.target === this.element) {
      this.close();
    }
  }

  /**
   * Обработчик нажатия Escape
   * @private
   */
  handleEscape(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Открыть модальное окно
   */
  open() {
    if (!this.element) {
      this.init();
    }

    this.isOpen = true;
    removeClass(this.element, 'hidden');
    document.body.style.overflow = 'hidden';

    // Анимация появления
    requestAnimationFrame(() => {
      const content = this.element.querySelector('.modal-content');
      if (content) {
        removeClass(content, 'scale-95', 'opacity-0');
        addClass(content, 'scale-100', 'opacity-100');
      }
    });

    // Обработчик Escape
    if (this.options.closeOnEscape) {
      on(document, 'keydown', this.handleEscape);
    }

    // Callback
    if (this.options.onOpen) {
      this.options.onOpen(this);
    }

    return this;
  }

  /**
   * Закрыть модальное окно
   */
  close() {
    if (!this.isOpen) return;

    const content = this.element.querySelector('.modal-content');
    
    // Анимация исчезновения
    if (content) {
      addClass(content, 'scale-95', 'opacity-0');
      removeClass(content, 'scale-100', 'opacity-100');
    }

    setTimeout(() => {
      addClass(this.element, 'hidden');
      document.body.style.overflow = '';
      this.isOpen = false;

      // Удаляем обработчик Escape
      off(document, 'keydown', this.handleEscape);

      // Callback
      if (this.options.onClose) {
        this.options.onClose(this);
      }
    }, 300);

    return this;
  }

  /**
   * Переключить состояние модального окна
   */
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  /**
   * Обновить контент модального окна
   * @param {string} content - Новый контент
   */
  setContent(content) {
    const body = this.element?.querySelector('.modal-body');
    if (body) {
      setHTML(body, content);
    }
    return this;
  }

  /**
   * Обновить заголовок модального окна
   * @param {string} title - Новый заголовок
   */
  setTitle(title) {
    const titleEl = this.element?.querySelector('.modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
    return this;
  }

  /**
   * Обновить футер модального окна
   * @param {string} footer - Новый футер
   */
  setFooter(footer) {
    const footerEl = this.element?.querySelector('.modal-footer');
    if (footerEl) {
      setHTML(footerEl, footer);
    }
    return this;
  }

  /**
   * Уничтожить модальное окно
   */
  destroy() {
    if (this.isOpen) {
      this.close();
    }

    setTimeout(() => {
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }, 300);

    return this;
  }
}

/**
 * Менеджер модальных окон
 */
export class ModalManager {
  static modals = new Map();

  /**
   * Создать и зарегистрировать модальное окно
   * @param {string} id - ID модального окна
   * @param {Object} options - Опции
   * @returns {Modal}
   */
  static create(id, options = {}) {
    if (this.modals.has(id)) {
      return this.modals.get(id);
    }

    const modal = new Modal(id, options);
    modal.init();
    this.modals.set(id, modal);

    return modal;
  }

  /**
   * Получить модальное окно по ID
   * @param {string} id - ID модального окна
   * @returns {Modal|null}
   */
  static get(id) {
    return this.modals.get(id) || null;
  }

  /**
   * Открыть модальное окно
   * @param {string} id - ID модального окна
   */
  static open(id) {
    const modal = this.get(id);
    if (modal) {
      modal.open();
    }
  }

  /**
   * Закрыть модальное окно
   * @param {string} id - ID модального окна
   */
  static close(id) {
    const modal = this.get(id);
    if (modal) {
      modal.close();
    }
  }

  /**
   * Закрыть все модальные окна
   */
  static closeAll() {
    this.modals.forEach(modal => modal.close());
  }

  /**
   * Удалить модальное окно
   * @param {string} id - ID модального окна
   */
  static destroy(id) {
    const modal = this.get(id);
    if (modal) {
      modal.destroy();
      this.modals.delete(id);
    }
  }

  /**
   * Удалить все модальные окна
   */
  static destroyAll() {
    this.modals.forEach(modal => modal.destroy());
    this.modals.clear();
  }
}

/**
 * Быстрое создание модального окна с подтверждением
 * @param {string} title - Заголовок
 * @param {string} message - Сообщение
 * @param {Function} onConfirm - Callback при подтверждении
 * @param {Function} onCancel - Callback при отмене
 */
export function confirmModal(title, message, onConfirm, onCancel = null) {
  const modalId = 'confirm-modal-' + Date.now();
  
  const modal = ModalManager.create(modalId, {
    title: title,
    content: `<p class="text-gray-700 leading-relaxed">${message}</p>`,
    footer: `
      <div class="flex gap-4">
        <button class="modal-cancel flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition font-semibold">
          Отмена
        </button>
        <button class="modal-confirm flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:shadow-xl transition font-semibold">
          Подтвердить
        </button>
      </div>
    `,
    size: 'small',
    onOpen: (m) => {
      const confirmBtn = m.element.querySelector('.modal-confirm');
      const cancelBtn = m.element.querySelector('.modal-cancel');

      on(confirmBtn, 'click', () => {
        modal.close();
        if (onConfirm) onConfirm();
        setTimeout(() => modal.destroy(), 300);
      });

      on(cancelBtn, 'click', () => {
        modal.close();
        if (onCancel) onCancel();
        setTimeout(() => modal.destroy(), 300);
      });
    }
  });

  modal.open();
  return modal;
}

/**
 * Быстрое создание информационного модального окна
 * @param {string} title - Заголовок
 * @param {string} content - Контент
 * @param {string} size - Размер
 */
export function infoModal(title, content, size = 'medium') {
  const modalId = 'info-modal-' + Date.now();
  
  const modal = ModalManager.create(modalId, {
    title: title,
    content: content,
    size: size,
    footer: `
      <button class="modal-ok w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:shadow-xl transition font-semibold">
        OK
      </button>
    `,
    onOpen: (m) => {
      const okBtn = m.element.querySelector('.modal-ok');
      on(okBtn, 'click', () => {
        modal.close();
        setTimeout(() => modal.destroy(), 300);
      });
    }
  });

  modal.open();
  return modal;
}
