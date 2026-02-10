/**
 * Модуль для управления партнёрами (админская часть)
 * CRUD операции с партнёрами в админ-панели
 */

import { api } from '../config/api.js';
import { API_ENDPOINTS, MESSAGES } from '../config/constants.js';
import { $, $$, getValue, setValue, empty, setHTML, on, addClass, removeClass } from '../utils/dom.js';
import { sanitizeText, sanitizeURL } from '../utils/sanitize.js';
import { showSuccess, showError } from '../utils/notification.js';
import { confirmModal } from '../components/modal.js';
import { loader } from '../components/loader.js';

/**
 * Класс для управления партнёрами (админ)
 */
export class PartnersAdmin {
  constructor(options = {}) {
    this.options = {
      formSelector: options.formSelector || '#partner-form',
      listSelector: options.listSelector || '#partners-list',
      loadingSelector: options.loadingSelector || '#loading-partners',
      ...options
    };

    this.form = $(this.options.formSelector);
    this.listContainer = $(this.options.listSelector);
    this.loadingEl = $(this.options.loadingSelector);
    
    this.partners = [];
    this.editingPartnerId = null;
  }

  /**
   * Инициализация
   */
  async init() {
    this.setupFormHandlers();
    await this.loadPartners();
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
    const resetBtn = $('#reset-partner-btn');
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
      const validation = this.validatePartnerData(formData);
      if (!validation.valid) {
        showError(validation.errors.join(', '));
        return;
      }

      loader.button(submitBtn, this.editingPartnerId ? 'Сохранение...' : 'Добавление...');

      if (this.editingPartnerId) {
        await api.put(API_ENDPOINTS.partners, this.editingPartnerId, formData);
        showSuccess(MESSAGES.success.partnerUpdated);
      } else {
        await api.post(API_ENDPOINTS.partners, formData);
        showSuccess(MESSAGES.success.partnerCreated);
      }

      this.resetForm();
      await this.loadPartners();

    } catch (error) {
      console.error('Error saving partner:', error);
      showError('Ошибка при сохранении партнёра');
    } finally {
      loader.hideButton(submitBtn);
    }
  }

  /**
   * Получение данных из формы
   */
  getFormData() {
    return {
      name: getValue($('#partner-name')),
      logo_url: getValue($('#partner-logo')),
      website: getValue($('#partner-website')),
      description: getValue($('#partner-description')),
      order: parseInt(getValue($('#partner-order'))) || 1
    };
  }

  /**
   * Валидация данных партнёра
   */
  validatePartnerData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Название компании должно содержать минимум 2 символа');
    }

    if (!data.logo_url || !sanitizeURL(data.logo_url)) {
      errors.push('Укажите корректный URL логотипа');
    }

    if (data.website && !sanitizeURL(data.website)) {
      errors.push('Укажите корректный URL сайта');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Загрузка партнёров
   */
  async loadPartners() {
    if (!this.listContainer) return;

    try {
      loader.show(this.loadingEl, 'Загрузка партнёров...');

      const response = await api.get(API_ENDPOINTS.partners, {
        limit: 1000,
        sort: 'order'
      });

      this.partners = response.data || [];
      
      loader.hide(this.loadingEl);
      this.displayPartners();

    } catch (error) {
      console.error('Error loading partners:', error);
      loader.hide(this.loadingEl);
    }
  }

  /**
   * Отображение списка партнёров
   */
  displayPartners() {
    if (!this.listContainer || this.partners.length === 0) {
      empty(this.listContainer);
      return;
    }

    const partnersHTML = this.partners.map(partner => `
      <div class="border border-gray-200 rounded-xl p-6 hover:border-cyan-300 transition">
        <div class="flex items-start justify-between">
          <div class="flex-1 flex items-center gap-4">
            <img src="${partner.logo_url}" 
                 alt="${sanitizeText(partner.name)}" 
                 class="h-16 w-32 object-contain">
            <div>
              <h3 class="text-xl font-bold text-gray-900">${sanitizeText(partner.name)}</h3>
              ${partner.website ? `
                <a href="${sanitizeURL(partner.website)}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="text-cyan-600 hover:text-cyan-700 text-sm">
                  <i class="fas fa-external-link-alt mr-1"></i>${sanitizeText(partner.website)}
                </a>
              ` : ''}
              ${partner.description ? `
                <p class="text-gray-600 text-sm mt-2">${sanitizeText(partner.description)}</p>
              ` : ''}
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button class="edit-partner w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" data-id="${partner.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-partner w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" data-id="${partner.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    setHTML(this.listContainer, partnersHTML);

    // Обработчики кнопок
    $$('.edit-partner', this.listContainer).forEach(btn => {
      on(btn, 'click', () => this.editPartner(btn.dataset.id));
    });

    $$('.delete-partner', this.listContainer).forEach(btn => {
      on(btn, 'click', () => this.deletePartner(btn.dataset.id));
    });
  }

  /**
   * Редактирование партнёра
   */
  editPartner(partnerId) {
    const partner = this.partners.find(p => p.id === partnerId);
    if (!partner) return;

    setValue($('#partner-name'), partner.name);
    setValue($('#partner-logo'), partner.logo_url);
    setValue($('#partner-website'), partner.website || '');
    setValue($('#partner-description'), partner.description || '');
    setValue($('#partner-order'), partner.order || 1);

    this.editingPartnerId = partnerId;

    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Обновить партнёра';
    }

    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Удаление партнёра
   */
  async deletePartner(partnerId) {
    const partner = this.partners.find(p => p.id === partnerId);
    if (!partner) return;

    confirmModal(
      'Подтвердите удаление',
      `Удалить партнёра "${partner.name}"?`,
      async () => {
        try {
          await api.delete(API_ENDPOINTS.partners, partnerId);
          showSuccess(MESSAGES.success.partnerDeleted);
          await this.loadPartners();
        } catch (error) {
          console.error('Error deleting partner:', error);
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

    this.editingPartnerId = null;

    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Сохранить партнёра';
    }
  }
}

/**
 * Инициализация модуля
 */
export function initPartnersAdmin(options = {}) {
  const partnersAdmin = new PartnersAdmin(options);
  partnersAdmin.init();
  return partnersAdmin;
}
