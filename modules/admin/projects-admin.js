/**
 * Модуль для управления проектами (админская часть)
 * CRUD операции с проектами в админ-панели
 */

import { api } from '../config/api.js';
import { API_ENDPOINTS, PROJECT_CATEGORIES, MESSAGES, FIELD_LIMITS } from '../config/constants.js';
import { $, $$, getValue, setValue, empty, setHTML, on, addClass, removeClass } from '../utils/dom.js';
import { sanitizeHTML, sanitizeText } from '../utils/sanitize.js';
import { showNotification, showSuccess, showError } from '../utils/notification.js';
import { confirmModal } from '../components/modal.js';
import { loader } from '../components/loader.js';

/**
 * Класс для управления проектами (админ)
 */
export class ProjectsAdmin {
  constructor(options = {}) {
    this.options = {
      formSelector: options.formSelector || '#project-form',
      listSelector: options.listSelector || '#projects-list',
      loadingSelector: options.loadingSelector || '#loading-projects',
      noProjectsSelector: options.noProjectsSelector || '#no-projects-admin',
      ...options
    };

    this.form = $(this.options.formSelector);
    this.listContainer = $(this.options.listSelector);
    this.loadingEl = $(this.options.loadingSelector);
    this.noProjectsEl = $(this.options.noProjectsSelector);
    
    this.projects = [];
    this.tags = [];
    this.quillEditor = null;
    this.editingProjectId = null;
  }

  /**
   * Инициализация
   */
  async init() {
    this.initQuillEditor();
    this.setupTagsInput();
    this.setupFormHandlers();
    await this.loadProjects();
  }

  /**
   * Инициализация Rich Text редактора Quill
   */
  initQuillEditor() {
    const editorContainer = $('#editor-container');
    if (!editorContainer || typeof Quill === 'undefined') {
      console.error('Quill editor not found');
      return;
    }

    this.quillEditor = new Quill('#editor-container', {
      theme: 'snow',
      placeholder: 'Введите подробное описание проекта...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link'],
          ['clean']
        ]
      }
    });
  }

  /**
   * Настройка ввода тегов
   */
  setupTagsInput() {
    const tagInput = $('#tag-input');
    const tagsContainer = $('#tags-container');
    
    if (!tagInput || !tagsContainer) return;

    on(tagInput, 'keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim();
        
        if (tag && !this.tags.includes(tag)) {
          if (this.tags.length >= FIELD_LIMITS.tags.max) {
            showError(`Максимум ${FIELD_LIMITS.tags.max} тегов`);
            return;
          }
          
          if (tag.length > FIELD_LIMITS.tag.max) {
            showError(`Тег слишком длинный (макс. ${FIELD_LIMITS.tag.max} символов)`);
            return;
          }
          
          this.tags.push(tag);
          this.renderTags();
        }
        
        tagInput.value = '';
      }
    });
  }

  /**
   * Отображение тегов
   */
  renderTags() {
    const tagsContainer = $('#tags-container');
    if (!tagsContainer) return;

    const tagsHTML = this.tags.map(tag => `
      <span class="tag-item px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded-full flex items-center gap-2">
        ${sanitizeText(tag)}
        <button type="button" class="remove-tag hover:text-cyan-900" data-tag="${sanitizeText(tag)}">
          <i class="fas fa-times"></i>
        </button>
      </span>
    `).join('');

    setHTML(tagsContainer, tagsHTML);

    // Обработчики удаления тегов
    $$('.remove-tag', tagsContainer).forEach(btn => {
      on(btn, 'click', () => {
        const tag = btn.dataset.tag;
        this.tags = this.tags.filter(t => t !== tag);
        this.renderTags();
      });
    });
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
    const resetBtn = $('#reset-btn');
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
      // Получаем данные формы
      const formData = this.getFormData();
      
      // Валидация
      const validation = this.validateProjectData(formData);
      if (!validation.valid) {
        showError(validation.errors.join(', '));
        return;
      }

      // Показываем индикатор загрузки
      loader.button(submitBtn, this.editingProjectId ? 'Сохранение...' : 'Добавление...');

      // Отправка данных
      if (this.editingProjectId) {
        await api.put(API_ENDPOINTS.projects, this.editingProjectId, formData);
        showSuccess(MESSAGES.success.projectUpdated);
      } else {
        await api.post(API_ENDPOINTS.projects, formData);
        showSuccess(MESSAGES.success.projectCreated);
      }

      // Сброс формы и перезагрузка списка
      this.resetForm();
      await this.loadProjects();

    } catch (error) {
      console.error('Error saving project:', error);
      showError('Ошибка при сохранении проекта');
    } finally {
      loader.hideButton(submitBtn);
    }
  }

  /**
   * Получение данных из формы
   */
  getFormData() {
    return {
      title: getValue($('#title')),
      year: parseInt(getValue($('#year'))),
      category: getValue($('#category')),
      client: getValue($('#client')),
      location: getValue($('#location')),
      image_url: getValue($('#image_url')),
      description: this.quillEditor ? this.quillEditor.root.innerHTML : '',
      tags: [...this.tags]
    };
  }

  /**
   * Валидация данных проекта
   */
  validateProjectData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < FIELD_LIMITS.title.min) {
      errors.push(`Название должно содержать минимум ${FIELD_LIMITS.title.min} символа`);
    }

    if (data.title.length > FIELD_LIMITS.title.max) {
      errors.push(`Название слишком длинное (макс. ${FIELD_LIMITS.title.max} символов)`);
    }

    if (!data.year || data.year < 2000 || data.year > 2100) {
      errors.push('Некорректный год');
    }

    if (!data.category) {
      errors.push('Выберите категорию');
    }

    if (!data.description || data.description.trim().length < FIELD_LIMITS.description.min) {
      errors.push(`Описание должно содержать минимум ${FIELD_LIMITS.description.min} символов`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Загрузка проектов
   */
  async loadProjects() {
    if (!this.listContainer) return;

    try {
      loader.show(this.loadingEl, 'Загрузка проектов...');

      const response = await api.get(API_ENDPOINTS.projects, {
        limit: 1000,
        sort: '-year'
      });

      this.projects = response.data || [];
      
      loader.hide(this.loadingEl);
      this.displayProjects();

    } catch (error) {
      console.error('Error loading projects:', error);
      loader.hide(this.loadingEl);
      this.showNoProjects();
    }
  }

  /**
   * Отображение списка проектов
   */
  displayProjects() {
    if (!this.listContainer) return;

    if (this.projects.length === 0) {
      this.showNoProjects();
      return;
    }

    this.hideNoProjects();

    const projectsHTML = this.projects.map(project => `
      <div class="border border-gray-200 rounded-xl p-6 hover:border-cyan-300 transition">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-xl font-bold text-gray-900">${sanitizeText(project.title)}</h3>
              <span class="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                ${project.year}
              </span>
              <span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                ${project.category || 'Без категории'}
              </span>
            </div>
            <div class="text-gray-600 text-sm mb-2">
              <i class="fas fa-building mr-2"></i>${project.client || 'Клиент не указан'}
              <span class="mx-2">•</span>
              <i class="fas fa-map-marker-alt mr-2"></i>${project.location || 'Локация не указана'}
            </div>
            ${project.tags && project.tags.length > 0 ? `
              <div class="flex flex-wrap gap-2 mt-3">
                ${project.tags.map(tag => `
                  <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">${sanitizeText(tag)}</span>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="flex gap-2 ml-4">
            <button class="edit-project w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" data-id="${project.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-project w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" data-id="${project.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    setHTML(this.listContainer, projectsHTML);

    // Обработчики кнопок
    $$('.edit-project', this.listContainer).forEach(btn => {
      on(btn, 'click', () => this.editProject(btn.dataset.id));
    });

    $$('.delete-project', this.listContainer).forEach(btn => {
      on(btn, 'click', () => this.deleteProject(btn.dataset.id));
    });
  }

  /**
   * Редактирование проекта
   */
  editProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Заполнение формы
    setValue($('#title'), project.title);
    setValue($('#year'), project.year);
    setValue($('#category'), project.category);
    setValue($('#client'), project.client || '');
    setValue($('#location'), project.location || '');
    setValue($('#image_url'), project.image_url || '');

    // Quill контент
    if (this.quillEditor && project.description) {
      this.quillEditor.root.innerHTML = project.description;
    }

    // Теги
    this.tags = project.tags ? [...project.tags] : [];
    this.renderTags();

    // Сохраняем ID редактируемого проекта
    this.editingProjectId = projectId;

    // Меняем текст кнопки
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Обновить проект';
    }

    // Прокрутка к форме
    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Удаление проекта
   */
  async deleteProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    confirmModal(
      'Подтвердите удаление',
      `Вы уверены, что хотите удалить проект "${project.title}"? Это действие нельзя отменить.`,
      async () => {
        try {
          await api.delete(API_ENDPOINTS.projects, projectId);
          showSuccess(MESSAGES.success.projectDeleted);
          await this.loadProjects();
        } catch (error) {
          console.error('Error deleting project:', error);
          showError('Ошибка при удалении проекта');
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

    if (this.quillEditor) {
      this.quillEditor.setContents([]);
    }

    this.tags = [];
    this.renderTags();
    this.editingProjectId = null;

    // Возврат текста кнопки
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Сохранить проект';
    }
  }

  /**
   * Показать сообщение "нет проектов"
   */
  showNoProjects() {
    if (this.listContainer) empty(this.listContainer);
    if (this.noProjectsEl) removeClass(this.noProjectsEl, 'hidden');
  }

  /**
   * Скрыть сообщение "нет проектов"
   */
  hideNoProjects() {
    if (this.noProjectsEl) addClass(this.noProjectsEl, 'hidden');
  }
}

/**
 * Инициализация модуля
 */
export function initProjectsAdmin(options = {}) {
  const projectsAdmin = new ProjectsAdmin(options);
  projectsAdmin.init();
  return projectsAdmin;
}
