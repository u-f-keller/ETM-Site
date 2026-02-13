/**
 * Модуль для работы с проектами (публичная часть)
 * Отображение проектов на странице projects.html
 */

import { api } from '../config/api.js';
import { API_ENDPOINTS, PLACEHOLDER_IMAGE, MESSAGES } from '../config/constants.js';
import { $, $$, empty, setHTML, addClass, removeClass, on } from '../utils/dom.js';
import { stripHTML, debounce } from '../utils/helpers.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { loader } from '../components/loader.js';
import { ModalManager } from '../components/modal.js';
import { showNotification } from '../utils/notification.js';

/**
 * Класс для управления проектами (публичная часть)
 */
export class PublicProjects {
  constructor(options = {}) {
    this.options = {
      containerSelector: options.containerSelector || '#projects-container',
      loadingSelector: options.loadingSelector || '#loading-skeleton',
      noProjectsSelector: options.noProjectsSelector || '#no-projects',
      modalId: options.modalId || 'project-modal',
      ...options
    };

    this.container = $(this.options.containerSelector);
    this.loadingEl = $(this.options.loadingSelector);
    this.noProjectsEl = $(this.options.noProjectsSelector);
    
    this.allProjects = [];
    this.filteredProjects = [];
    this.currentFilter = {
      year: 'all',
      category: '',
      search: ''
    };

    this.projectModal = null;
  }

  /**
   * Инициализация
   */
  async init() {
    this.setupFilters();
    this.setupModal();
    await this.loadProjects();
  }

  /**
   * Загрузка проектов из API
   */
  async loadProjects() {
    try {
      const response = await api.get(API_ENDPOINTS.projects, {
        limit: 1000,
        sort: '-year'
      }, {
        useCache: true,
        cacheTTL: 300000 // 5 минут
      });

      this.allProjects = response.data || [];
      this.filteredProjects = [...this.allProjects];
      
      this.hideLoading();
      this.displayProjects();
      
    } catch (error) {
      console.error('Error loading projects:', error);
      this.hideLoading();
      this.showNoProjects();
    }
  }

  /**
   * Отображение проектов
   */
  displayProjects() {
    if (!this.container) return;

    if (this.filteredProjects.length === 0) {
      this.showNoProjects();
      return;
    }

    this.hideNoProjects();
    empty(this.container);

    this.filteredProjects.forEach((project, index) => {
      const card = this.createProjectCard(project);
      this.container.appendChild(card);

      // Анимация появления с задержкой
      setTimeout(() => {
        addClass(card, 'show');
      }, index * 50);
    });
  }

  /**
   * Создание карточки проекта
   */
  createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card card-hover bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer';
    
    const imageUrl = project.image_url || PLACEHOLDER_IMAGE.project(project.title);
    
    card.innerHTML = `
      <div class="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
        <img src="${imageUrl}" 
             alt="${project.title}" 
             class="w-full h-full object-cover"
             onerror="this.src='${PLACEHOLDER_IMAGE.project(project.title)}'">
        <div class="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
          ${project.year}
        </div>
      </div>
      <div class="p-6">
        <div class="flex items-center space-x-2 mb-3">
          <span class="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
            ${project.category || 'Без категории'}
          </span>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          ${project.title}
        </h3>
        <p class="text-gray-600 mb-4 line-clamp-3">
          ${stripHTML(project.description)}
        </p>
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <div class="flex items-center text-sm text-gray-500">
            <i class="fas fa-map-marker-alt mr-2"></i>
            ${project.location || 'Не указано'}
          </div>
          <button class="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
            Подробнее <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
    `;

    // Обработчик клика
    on(card, 'click', () => this.openProjectModal(project));

    return card;
  }

  /**
   * Настройка фильтров
   */
  setupFilters() {
    // Фильтр по году
    $$('.filter-btn[data-year], .filter-btn[data-filter]').forEach(btn => {
      on(btn, 'click', () => {
        // Удаляем active у всех кнопок
        $$('.filter-btn[data-year], .filter-btn[data-filter]').forEach(b => {
          removeClass(b, 'active');
        });

        // Добавляем active текущей кнопке
        addClass(btn, 'active');

        // Обновляем фильтр
        if (btn.dataset.filter === 'all') {
          this.currentFilter.year = 'all';
        } else {
          this.currentFilter.year = btn.dataset.year;
        }

        this.applyFilters();
      });
    });

    // Фильтр по категории
    const categoryFilter = $('#category-filter');
    if (categoryFilter) {
      on(categoryFilter, 'change', () => {
        this.currentFilter.category = categoryFilter.value;
        this.applyFilters();
      });
    }

    // Поиск
    const searchInput = $('#search-input');
    if (searchInput) {
      const debouncedSearch = debounce(() => {
        this.currentFilter.search = searchInput.value;
        this.applyFilters();
      }, 300);

      on(searchInput, 'input', debouncedSearch);
    }
  }

  /**
   * Применение фильтров
   */
  applyFilters() {
    this.filteredProjects = this.allProjects.filter(project => {
      // Фильтр по году
      if (this.currentFilter.year !== 'all' && 
          project.year !== parseInt(this.currentFilter.year)) {
        return false;
      }

      // Фильтр по категории
      if (this.currentFilter.category && 
          project.category !== this.currentFilter.category) {
        return false;
      }

      // Поиск
      if (this.currentFilter.search) {
        const searchLower = this.currentFilter.search.toLowerCase();
        const titleMatch = project.title.toLowerCase().includes(searchLower);
        const descriptionMatch = stripHTML(project.description).toLowerCase().includes(searchLower);
        const clientMatch = (project.client || '').toLowerCase().includes(searchLower);
        const locationMatch = (project.location || '').toLowerCase().includes(searchLower);

        if (!titleMatch && !descriptionMatch && !clientMatch && !locationMatch) {
          return false;
        }
      }

      return true;
    });

    this.displayProjects();
  }

  /**
   * Настройка модального окна
   */
  setupModal() {
    this.projectModal = ModalManager.create(this.options.modalId, {
      title: '',
      content: '',
      size: 'large',
      showClose: true
    });
  }

  /**
   * Открытие модального окна с проектом
   */
  openProjectModal(project) {
    const imageUrl = project.image_url || PLACEHOLDER_IMAGE.project(project.title);
    
    const content = `
      <img src="${imageUrl}" 
           alt="${project.title}" 
           class="w-full h-64 object-cover rounded-xl mb-6"
           onerror="this.src='${PLACEHOLDER_IMAGE.project(project.title)}'">
      
      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-calendar text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Год</div>
            <div class="font-semibold text-gray-900">${project.year}</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-tag text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Категория</div>
            <div class="font-semibold text-gray-900">${project.category || 'Без категории'}</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-building text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Клиент</div>
            <div class="font-semibold text-gray-900">${project.client || 'Не указан'}</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-map-marker-alt text-cyan-600"></i>
          </div>
          <div>
            <div class="text-sm text-gray-600">Локация</div>
            <div class="font-semibold text-gray-900">${project.location || 'Не указана'}</div>
          </div>
        </div>
      </div>
      
      <div class="mb-6">
        <h4 class="font-semibold text-gray-900 mb-3">Описание проекта</h4>
        <div class="text-gray-600 leading-relaxed prose max-w-none">
          ${sanitizeHTML(project.description)}
        </div>
      </div>
      
      ${project.tags && Array.isArray(project.tags) && project.tags.length > 0 ? `
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Теги</h4>
          <div class="flex flex-wrap gap-2">
            ${project.tags.map(tag => `
              <span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">${tag}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    this.projectModal.setTitle(project.title);
    this.projectModal.setContent(content);
    this.projectModal.open();
  }

  /**
   * Показать сообщение "нет проектов"
   */
  showNoProjects() {
    if (this.container) empty(this.container);
    if (this.noProjectsEl) removeClass(this.noProjectsEl, 'hidden');
  }

  /**
   * Скрыть сообщение "нет проектов"
   */
  hideNoProjects() {
    if (this.noProjectsEl) addClass(this.noProjectsEl, 'hidden');
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
   * Перезагрузка проектов
   */
  async reload() {
    if (this.loadingEl) {
      this.loadingEl.style.display = '';
    }
    
    // Очистка кеша
    api.clearCache();
    
    await this.loadProjects();
  }
}

/**
 * Инициализация модуля проектов
 */
export function initProjects(options = {}) {
  const projects = new PublicProjects(options);
  projects.init();
  return projects;
}
