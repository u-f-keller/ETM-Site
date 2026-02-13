/**
 * Модуль для управления сертификатами (админская часть)
 * CRUD операции с сертификатами в админ-панели
 */

import { api } from '../config/api.js';
import { API_ENDPOINTS, MESSAGES } from '../config/constants.js';
import { $, $$, getValue, setValue, empty, setHTML, on, addClass, removeClass } from '../utils/dom.js';
import { sanitizeText, sanitizeURL } from '../utils/sanitize.js';
import { showSuccess, showError } from '../utils/notification.js';
import { confirmModal } from '../components/modal.js';
import { loader } from '../components/loader.js';

/**
 * Класс для управления сертификатами (админ)
 */
export class CertificatesAdmin {
  constructor(options = {}) {
    this.options = {
      formSelector: options.formSelector || '#certificate-form',
      listSelector: options.listSelector || '#certificates-list',
      loadingSelector: options.loadingSelector || '#loading-certificates',
      ...options
    };

    this.form = $(this.options.formSelector);
    this.listContainer = $(this.options.listSelector);
    this.loadingEl = $(this.options.loadingSelector);
    
    this.certificates = [];
    this.editingCertificateId = null;
  }

  /**
   * Инициализация
   */
  async init() {
    this.setupFormHandlers();
    await this.loadCertificates();
  }

  /**
   * Настройка обработчиков формы
   */
  setupFormHandlers() {
    if (!this.form) return;

    // Отправка формы
    on(this.form, 'submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmit();
    });

    // Кнопка сброса
    const resetBtn = $('#reset-cert-btn');
    if (resetBtn) {
      on(resetBtn, 'click', () => this.resetForm());
    }
  }

  /**
   * Обработка отправки формы
   */
  async handleFormSubmit() {
    const submitBtn = this.form.querySelector('button[type="submit"]');
    
    try {
      const formData = this.getFormData();
      
      // Валидация
      const validation = this.validateCertificateData(formData);
      if (!validation.valid) {
        showError(validation.errors.join(', '));
        return;
      }

      loader.button(submitBtn, this.editingCertificateId ? 'Сохранение...' : 'Добавление...');

      if (this.editingCertificateId) {
        await api.put(API_ENDPOINTS.certificates, this.editingCertificateId, formData);
        showSuccess(MESSAGES.success.certificateUpdated);
      } else {
        await api.post(API_ENDPOINTS.certificates, formData);
        showSuccess(MESSAGES.success.certificateCreated);
      }

      this.resetForm();
      await this.loadCertificates();

    } catch (error) {
      console.error('Error saving certificate:', error);
      showError('Ошибка при сохранении сертификата');
    } finally {
      loader.hideButton(submitBtn);
    }
  }

  /**
   * Получение данных из формы
   */
  getFormData() {
    return {
      title: getValue($('#cert-title')),
      number: getValue($('#cert-number')),
      issued_date: getValue($('#cert-issued')),
      expiry_date: getValue($('#cert-expiry')),
      image_url: getValue($('#cert-image')),
      pdf_url: getValue($('#cert-pdf')),
      description: getValue($('#cert-description')),
      order: parseInt(getValue($('#cert-order'))) || 1
    };
  }

  /**
   * Валидация данных сертификата
   */
  validateCertificateData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push('Название должно содержать минимум 3 символа');
    }

    if (!data.number || data.number.trim().length < 1) {
      errors.push('Укажите номер сертификата');
    }

    if (!data.image_url || !sanitizeURL(data.image_url)) {
      errors.push('Укажите корректный URL изображения');
    }

    if (data.pdf_url && !sanitizeURL(data.pdf_url)) {
      errors.push('Укажите корректный URL PDF');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Загрузка сертификатов
   */
  async loadCertificates() {
    if (!this.listContainer) return;

    try {
      loader.show(this.loadingEl, 'Загрузка сертификатов...');

      const response = await api.get(API_ENDPOINTS.certificates, {
        limit: 1000,
        sort: 'order'
      });

      this.certificates = response.data || [];
      
      loader.hide(this.loadingEl);
      this.displayCertificates();

    } catch (error) {
      console.error('Error loading certificates:', error);
      loader.hide(this.loadingEl);
    }
  }

  /**
   * Отображение списка сертификатов
   */
  displayCertificates() {
    if (!this.listContainer || this.certificates.length === 0) {
      empty(this.listContainer);
      return;
    }

    const certificatesHTML = this.certificates.map(cert => `
      <div class="border border-gray-200 rounded-xl p-6 hover:border-cyan-300 transition">
        <div class="flex items-start justify-between">
          <div class="flex-1 flex gap-4">
            <img src="${cert.image_url}" 
                 alt="${sanitizeText(cert.title)}" 
                 class="h-24 w-20 object-cover rounded">
            <div>
              <h3 class="text-xl font-bold text-gray-900">${sanitizeText(cert.title)}</h3>
              <p class="text-gray-600 text-sm mt-1">${sanitizeText(cert.number)}</p>
              <p class="text-gray-600 text-sm mt-1">
                <i class="fas fa-calendar mr-1"></i>${cert.issued_date} - ${cert.expiry_date}
              </p>
              ${cert.description ? `
                <p class="text-gray-600 text-sm mt-2">${sanitizeText(cert.description)}</p>
              ` : ''}
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button class="edit-certificate w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" data-id="${cert.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-certificate w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" data-id="${cert.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    setHTML(this.listContainer, certificatesHTML);

    // Обработчики кнопок
    $$('.edit-certificate', this.listContainer).forEach(btn => {
      on(btn, 'click', () => this.editCertificate(btn.dataset.id));
    });

    $$('.delete-certificate', this.listContainer).forEach(btn => {
      on(btn, 'click', () => this.deleteCertificate(btn.dataset.id));
    });
  }

  /**
   * Редактирование сертификата
   */
  editCertificate(certificateId) {
    const cert = this.certificates.find(c => c.id === certificateId);
    if (!cert) return;

    setValue($('#cert-title'), cert.title);
    setValue($('#cert-number'), cert.number);
    setValue($('#cert-issued'), cert.issued_date || '');
    setValue($('#cert-expiry'), cert.expiry_date || '');
    setValue($('#cert-image'), cert.image_url);
    setValue($('#cert-pdf'), cert.pdf_url || '');
    setValue($('#cert-description'), cert.description || '');
    setValue($('#cert-order'), cert.order || 1);

    this.editingCertificateId = certificateId;

    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Обновить сертификат';
    }

    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Удаление сертификата
   */
  async deleteCertificate(certificateId) {
    const cert = this.certificates.find(c => c.id === certificateId);
    if (!cert) return;

    confirmModal(
      'Подтвердите удаление',
      `Удалить сертификат "${cert.title}"?`,
      async () => {
        try {
          await api.delete(API_ENDPOINTS.certificates, certificateId);
          showSuccess(MESSAGES.success.certificateDeleted);
          await this.loadCertificates();
        } catch (error) {
          console.error('Error deleting certificate:', error);
          showError('Ошибка при удалении');
        }
      }
    );
  }

  /**
   * Сброс формы
   */
  resetForm() {
    if (this.form) {
      this.form.reset();
    }

    this.editingCertificateId = null;

    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Сохранить сертификат';
    }
  }
}

/**
 * Инициализация модуля
 */
export function initCertificatesAdmin(options = {}) {
  const certificatesAdmin = new CertificatesAdmin(options);
  certificatesAdmin.init();
  return certificatesAdmin;
}
