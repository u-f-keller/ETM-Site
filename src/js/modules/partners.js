/**
 * Модуль для работы с партнёрами (публичная часть)
 * Отображение партнёров на главной странице
 */

import { api } from '../config/api.js';
import { API_ENDPOINTS, PLACEHOLDER_IMAGE } from '../config/constants.js';
import { $, empty, setHTML } from '../utils/dom.js';
import { sanitizeURL } from '../utils/sanitize.js';
import { loader } from '../components/loader.js';

/**
 * Класс для управления партнёрами (публичная часть)
 */
export class PublicPartners {
  constructor(options = {}) {
    this.options = {
      containerSelector: options.containerSelector || '#partners-container',
      loadingSelector: options.loadingSelector || '#partners-loading',
      ...options
    };

    this.container = $(this.options.containerSelector);
    this.loadingEl = $(this.options.loadingSelector);
    
    this.partners = [];
  }

  /**
   * Инициализация
   */
  async init() {
    await this.loadPartners();
  }

  /**
   * Загрузка партнёров из API
   */
  async loadPartners() {
    if (!this.container) return;

    try {
      const response = await api.get(API_ENDPOINTS.partners, {
        limit: 100,
        sort: 'order'
      }, {
        useCache: true,
        cacheTTL: 600000 // 10 минут
      });

      this.partners = response.data || [];
      
      this.hideLoading();
      this.displayPartners();
      
    } catch (error) {
      console.error('Error loading partners:', error);
      this.hideLoading();
    }
  }

  /**
   * Отображение партнёров
   */
  displayPartners() {
    if (!this.container || this.partners.length === 0) return;

    const partnersHTML = this.partners.map(partner => {
      const logoUrl = partner.logo_url || PLACEHOLDER_IMAGE.partner(partner.name);
      const websiteUrl = sanitizeURL(partner.website);
      
      return `
        <div class="bg-white p-6 rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition flex items-center justify-center">
          ${websiteUrl ? `
            <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="block w-full">
              <img src="${logoUrl}" 
                   alt="${partner.name}" 
                   class="w-full h-20 object-contain grayscale hover:grayscale-0 transition"
                   title="${partner.description || partner.name}"
                   onerror="this.src='${PLACEHOLDER_IMAGE.partner(partner.name)}'">
            </a>
          ` : `
            <div class="w-full">
              <img src="${logoUrl}" 
                   alt="${partner.name}" 
                   class="w-full h-20 object-contain"
                   title="${partner.description || partner.name}"
                   onerror="this.src='${PLACEHOLDER_IMAGE.partner(partner.name)}'">
            </div>
          `}
        </div>
      `;
    }).join('');

    setHTML(this.container, partnersHTML);
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
   * Перезагрузка партнёров
   */
  async reload() {
    if (this.loadingEl) {
      this.loadingEl.style.display = '';
    }
    
    api.clearCache();
    await this.loadPartners();
  }
}

/**
 * Инициализация модуля партнёров
 */
export function initPartners(options = {}) {
  const partners = new PublicPartners(options);
  partners.init();
  return partners;
}
