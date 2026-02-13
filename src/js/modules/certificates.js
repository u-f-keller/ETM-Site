/**
 * Модуль для работы с сертификатами (публичная часть)
 * Отображение сертификатов на главной странице с модальным просмотром
 */

import { api } from '../config/api.js';
import { API_ENDPOINTS, PLACEHOLDER_IMAGE } from '../config/constants.js';
import { $, $$, empty, setHTML, addClass, removeClass, on } from '../utils/dom.js';
import { sanitizeURL } from '../utils/sanitize.js';
import { ModalManager } from '../components/modal.js';

/**
 * Класс для управления сертификатами (публичная часть)
 */
export class PublicCertificates {
  constructor(options = {}) {
    this.options = {
      containerSelector: options.containerSelector || '#certificates-container',
      loadingSelector: options.loadingSelector || '#certificates-loading',
      modalId: options.modalId || 'certificate-modal',
      ...options
    };

    this.container = $(this.options.containerSelector);
    this.loadingEl = $(this.options.loadingSelector);
    
    this.certificates = [];
    this.certificateModal = null;
  }

  /**
   * Инициализация
   */
  async init() {
    this.setupModal();
    await this.loadCertificates();
  }

  /**
   * Загрузка сертификатов из API
   */
  async loadCertificates() {
    if (!this.container) return;

    try {
      const response = await api.get(API_ENDPOINTS.certificates, {
        limit: 100,
        sort: 'order'
      }, {
        useCache: true,
        cacheTTL: 600000 // 10 минут
      });

      this.certificates = response.data || [];
      
      this.hideLoading();
      this.displayCertificates();
      
    } catch (error) {
      console.error('Error loading certificates:', error);
      this.hideLoading();
    }
  }

  /**
   * Отображение сертификатов
   */
  displayCertificates() {
    if (!this.container || this.certificates.length === 0) return;

    const certificatesHTML = this.certificates.map(cert => {
      const imageUrl = cert.image_url || PLACEHOLDER_IMAGE.certificate(cert.title);
      
      return `
        <div class="card-hover bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" 
             data-cert-id="${cert.id}">
          <div class="relative h-64 overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
            <img src="${imageUrl}" 
                 alt="${cert.title}" 
                 class="w-full h-full object-cover"
                 onerror="this.src='${PLACEHOLDER_IMAGE.certificate(cert.title)}'">
          </div>
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              ${cert.title}
            </h3>
            <div class="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span><i class="fas fa-hashtag mr-1"></i>${cert.number}</span>
              <span><i class="fas fa-calendar mr-1"></i>${cert.issued_date}</span>
            </div>
            <p class="text-gray-600 text-sm line-clamp-2 mb-4">
              ${cert.description || ''}
            </p>
            <button class="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
              Подробнее <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    setHTML(this.container, certificatesHTML);

    // Навешиваем обработчики кликов
    $$('[data-cert-id]', this.container).forEach(card => {
      on(card, 'click', () => {
        const certId = card.dataset.certId;
        const cert = this.certificates.find(c => c.id === certId);
        if (cert) {
          this.openCertificateModal(cert);
        }
      });
    });
  }

  /**
   * Настройка модального окна
   */
  setupModal() {
    // Создаём модал если его нет
    if (!$(this.options.modalId)) {
      this.certificateModal = ModalManager.create(this.options.modalId, {
        title: '',
        content: '',
        size: 'large',
        showClose: true
      });
    }
  }

  /**
   * Открытие модального окна с сертификатом
   */
  openCertificateModal(cert) {
    const imageUrl = cert.image_url || PLACEHOLDER_IMAGE.certificate(cert.title);
    const pdfUrl = sanitizeURL(cert.pdf_url);
    
    const content = `
      <img src="${imageUrl}" 
           alt="${cert.title}" 
           class="w-full max-h-[600px] object-contain rounded-xl mb-6"
           onerror="this.src='${PLACEHOLDER_IMAGE.certificate(cert.title)}'">
      
      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-hashtag text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Номер</div>
            <div class="font-semibold text-gray-900">${cert.number}</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-calendar text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Дата выдачи</div>
            <div class="font-semibold text-gray-900">${cert.issued_date}</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-clock text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Действителен до</div>
            <div class="font-semibold text-gray-900">${cert.expiry_date}</div>
          </div>
        </div>
      </div>
      
      ${cert.description ? `
        <div class="mb-6">
          <h4 class="font-semibold text-gray-900 mb-3">Описание</h4>
          <div class="text-gray-600 leading-relaxed">
            ${cert.description}
          </div>
        </div>
      ` : ''}
      
      ${pdfUrl ? `
        <div>
          <a href="${pdfUrl}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-xl transition font-semibold">
            <i class="fas fa-download mr-2"></i>Скачать PDF
          </a>
        </div>
      ` : ''}
    `;

    // Используем существующий модал или создаём новый
    if (!this.certificateModal) {
      this.setupModal();
    }

    this.certificateModal.setTitle(cert.title);
    this.certificateModal.setContent(content);
    this.certificateModal.open();
  }

  /**
   * Скрыть индикатор загрузки
   */
  hideLoading() {
    if (this.loadingEl) {
      this.loadingEl.style.display = 'none';
    }
  }

  /**
   * Перезагрузка сертификатов
   */
  async reload() {
    if (this.loadingEl) {
      this.loadingEl.style.display = '';
    }
    
    api.clearCache();
    await this.loadCertificates();
  }
}

/**
 * Инициализация модуля сертификатов
 */
export function initCertificates(options = {}) {
  const certificates = new PublicCertificates(options);
  certificates.init();
  return certificates;
}

/**
 * Глобальная функция для открытия модала (для совместимости со старым кодом)
 * Вызывается из onclick в HTML
 */
window.openCertificateModal = function(certId) {
  // Эту функцию можно удалить после рефакторинга HTML
  console.warn('Using deprecated window.openCertificateModal. Update HTML to use data attributes.');
};
