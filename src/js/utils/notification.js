/**
 * Система уведомлений (Toast notifications)
 * Заменяет стандартные alert() на красивые всплывающие уведомления
 */

import { NOTIFICATION_CONFIG } from '../config/constants.js';

/**
 * Типы уведомлений
 */
const NOTIFICATION_TYPES = {
  success: {
    icon: 'fa-check-circle',
    bgColor: 'bg-green-500',
    textColor: 'text-white'
  },
  error: {
    icon: 'fa-times-circle',
    bgColor: 'bg-red-500',
    textColor: 'text-white'
  },
  warning: {
    icon: 'fa-exclamation-triangle',
    bgColor: 'bg-yellow-500',
    textColor: 'text-white'
  },
  info: {
    icon: 'fa-info-circle',
    bgColor: 'bg-blue-500',
    textColor: 'text-white'
  }
};

/**
 * Контейнер для уведомлений
 */
let notificationContainer = null;

/**
 * Инициализация контейнера для уведомлений
 */
function initContainer() {
  if (notificationContainer) return;

  notificationContainer = document.createElement('div');
  notificationContainer.id = 'notification-container';
  notificationContainer.className = 'fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none';
  notificationContainer.style.maxWidth = '400px';
  
  document.body.appendChild(notificationContainer);
}

/**
 * Показать уведомление
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления: success, error, warning, info
 * @param {number} duration - Длительность показа в мс (0 = не скрывать автоматически)
 * @returns {HTMLElement} Элемент уведомления
 */
export function showNotification(message, type = 'info', duration = NOTIFICATION_CONFIG.duration) {
  initContainer();

  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
  
  // Создание элемента уведомления
  const notification = document.createElement('div');
  notification.className = `
    ${config.bgColor} ${config.textColor}
    rounded-lg shadow-2xl p-4 pr-12
    transform transition-all duration-300 ease-out
    translate-x-full opacity-0
    pointer-events-auto
    relative
    max-w-md
  `;
  
  notification.innerHTML = `
    <div class="flex items-start space-x-3">
      <i class="fas ${config.icon} text-xl flex-shrink-0 mt-0.5"></i>
      <div class="flex-1 text-sm font-medium leading-relaxed">${message}</div>
      <button class="notification-close absolute top-2 right-2 p-2 hover:bg-white/20 rounded-lg transition">
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>
  `;

  // Добавление в контейнер
  notificationContainer.appendChild(notification);

  // Анимация появления
  requestAnimationFrame(() => {
    notification.classList.remove('translate-x-full', 'opacity-0');
  });

  // Обработчик закрытия
  const closeBtn = notification.querySelector('.notification-close');
  const closeNotification = () => {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      
      // Удаляем контейнер если пустой
      if (notificationContainer && notificationContainer.children.length === 0) {
        notificationContainer.remove();
        notificationContainer = null;
      }
    }, 300);
  };

  closeBtn.addEventListener('click', closeNotification);

  // Автоматическое скрытие
  if (duration > 0) {
    setTimeout(closeNotification, duration);
  }

  return notification;
}

/**
 * Показать уведомление об успехе
 * @param {string} message - Текст сообщения
 * @param {number} duration - Длительность
 */
export function showSuccess(message, duration) {
  return showNotification(message, 'success', duration);
}

/**
 * Показать уведомление об ошибке
 * @param {string} message - Текст сообщения
 * @param {number} duration - Длительность
 */
export function showError(message, duration) {
  return showNotification(message, 'error', duration);
}

/**
 * Показать предупреждение
 * @param {string} message - Текст сообщения
 * @param {number} duration - Длительность
 */
export function showWarning(message, duration) {
  return showNotification(message, 'warning', duration);
}

/**
 * Показать информационное сообщение
 * @param {string} message - Текст сообщения
 * @param {number} duration - Длительность
 */
export function showInfo(message, duration) {
  return showNotification(message, 'info', duration);
}

/**
 * Показать уведомление с подтверждением действия
 * @param {string} message - Текст вопроса
 * @param {Function} onConfirm - Callback при подтверждении
 * @param {Function} onCancel - Callback при отмене
 * @returns {HTMLElement}
 */
export function showConfirm(message, onConfirm, onCancel = null) {
  initContainer();

  const notification = document.createElement('div');
  notification.className = `
    bg-white
    rounded-lg shadow-2xl p-4
    transform transition-all duration-300 ease-out
    translate-x-full opacity-0
    pointer-events-auto
    max-w-md
    border-2 border-gray-200
  `;
  
  notification.innerHTML = `
    <div class="mb-4">
      <div class="flex items-start space-x-3 text-gray-900">
        <i class="fas fa-question-circle text-xl text-blue-500 flex-shrink-0 mt-0.5"></i>
        <div class="flex-1 text-sm font-medium leading-relaxed">${message}</div>
      </div>
    </div>
    <div class="flex space-x-3">
      <button class="confirm-yes flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition font-medium text-sm">
        Да
      </button>
      <button class="confirm-no flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition font-medium text-sm">
        Отмена
      </button>
    </div>
  `;

  notificationContainer.appendChild(notification);

  // Анимация появления
  requestAnimationFrame(() => {
    notification.classList.remove('translate-x-full', 'opacity-0');
  });

  const closeNotification = () => {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      
      if (notificationContainer && notificationContainer.children.length === 0) {
        notificationContainer.remove();
        notificationContainer = null;
      }
    }, 300);
  };

  // Обработчики кнопок
  const yesBtn = notification.querySelector('.confirm-yes');
  const noBtn = notification.querySelector('.confirm-no');

  yesBtn.addEventListener('click', () => {
    closeNotification();
    if (onConfirm) onConfirm();
  });

  noBtn.addEventListener('click', () => {
    closeNotification();
    if (onCancel) onCancel();
  });

  return notification;
}

/**
 * Показать уведомление с прогресс-баром
 * @param {string} message - Текст сообщения
 * @returns {Object} { update, close }
 */
export function showProgress(message) {
  initContainer();

  const notification = document.createElement('div');
  notification.className = `
    bg-white
    rounded-lg shadow-2xl p-4
    transform transition-all duration-300 ease-out
    translate-x-full opacity-0
    pointer-events-auto
    max-w-md
    border-2 border-blue-200
  `;
  
  notification.innerHTML = `
    <div class="mb-3">
      <div class="flex items-center space-x-3 text-gray-900">
        <i class="fas fa-spinner fa-spin text-xl text-blue-500 flex-shrink-0"></i>
        <div class="flex-1 text-sm font-medium progress-message">${message}</div>
      </div>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div class="progress-bar bg-blue-500 h-full transition-all duration-300" style="width: 0%"></div>
    </div>
    <div class="mt-2 text-xs text-gray-600 text-right progress-percentage">0%</div>
  `;

  notificationContainer.appendChild(notification);

  // Анимация появления
  requestAnimationFrame(() => {
    notification.classList.remove('translate-x-full', 'opacity-0');
  });

  const progressBar = notification.querySelector('.progress-bar');
  const progressPercentage = notification.querySelector('.progress-percentage');
  const progressMessage = notification.querySelector('.progress-message');

  const closeNotification = () => {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      
      if (notificationContainer && notificationContainer.children.length === 0) {
        notificationContainer.remove();
        notificationContainer = null;
      }
    }, 300);
  };

  return {
    update(percent, newMessage = null) {
      const clampedPercent = Math.min(100, Math.max(0, percent));
      progressBar.style.width = `${clampedPercent}%`;
      progressPercentage.textContent = `${Math.round(clampedPercent)}%`;
      
      if (newMessage) {
        progressMessage.textContent = newMessage;
      }

      if (clampedPercent >= 100) {
        setTimeout(closeNotification, 1000);
      }
    },
    close: closeNotification
  };
}

/**
 * Очистить все уведомления
 */
export function clearAllNotifications() {
  if (notificationContainer) {
    notificationContainer.remove();
    notificationContainer = null;
  }
}
