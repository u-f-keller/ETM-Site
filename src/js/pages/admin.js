/**
 * Админ-панель (admin-panel.html)
 * Инициализация всех админских модулей и защита страницы
 */

import { auth, protectPage, setupSessionAutoExtend } from '../utils/auth.js';
import { $, $$, on, addClass, removeClass } from '../utils/dom.js';
/*
import { initProjectsAdmin } from '../modules/admin/projects-admin.js';
import { initPartnersAdmin } from '../modules/admin/partners-admin.js';
import { initCertificatesAdmin } from '../modules/admin/certificates-admin.js';
*/
import { confirmModal } from '../components/modal.js';
import { api } from '../config/api.js';
import { showError } from '../utils/notification.js';

/**
 * Инициализация админ-панели
 */
function initAdminPanel() {
  // Защита страницы — требуем авторизацию
  try {
    protectPage();
  } catch (error) {
    return;
  }

  // Автоматическое продление сессии
  setupSessionAutoExtend();

  // Модули
  let projectsAdmin, partnersAdmin, certificatesAdmin;
  let partnersLoaded = false;
  let certificatesLoaded = false;

  // Инициализация табов
  setupTabs();

  // Кнопка выхода
  setupLogout();

  // Мобильное меню
  setupMobileMenu();

  // Загрузка файлов (универсальный обработчик)
  setupFileUploads();

  // Projects — загружаем сразу
  projectsAdmin = initProjectsAdmin({
    formSelector: '#project-form',
    listSelector: '#projects-list',
    loadingSelector: '#loading-projects',
    noProjectsSelector: '#no-projects-admin'
  });

  /**
   * Переключение табов
   */
  function setupTabs() {
    const tabButtons = $$('.admin-tab');
    const tabContents = $$('.tab-content');

    tabButtons.forEach(btn => {
      on(btn, 'click', () => {
        const targetTab = btn.dataset.tab;

        // Обновление кнопок
        tabButtons.forEach(t => {
          removeClass(t, 'active', 'bg-white', 'text-blue-600');
          addClass(t, 'bg-white/10', 'text-white');
        });
        addClass(btn, 'active', 'bg-white', 'text-blue-600');
        removeClass(btn, 'bg-white/10', 'text-white');

        // Обновление контента
        tabContents.forEach(content => {
          addClass(content, 'hidden');
        });

        const activeContent = $(`#tab-${targetTab}`);
        if (activeContent) {
          removeClass(activeContent, 'hidden');
        }

        // Ленивая инициализация
        if (targetTab === 'partners' && !partnersLoaded) {
          partnersAdmin = initPartnersAdmin({
            formSelector: '#partner-form',
            listSelector: '#partners-list',
            loadingSelector: '#loading-partners'
          });
          partnersLoaded = true;
        }

        if (targetTab === 'certificates' && !certificatesLoaded) {
          certificatesAdmin = initCertificatesAdmin({
            formSelector: '#certificate-form',
            listSelector: '#certificates-list',
            loadingSelector: '#loading-certificates'
          });
          certificatesLoaded = true;
        }
      });
    });
  }

  /**
   * Кнопка выхода
   */
  function setupLogout() {
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
      on(logoutBtn, 'click', () => {
        confirmModal(
          'Подтвердите выход',
          'Вы уверены, что хотите выйти из системы?',
          async () => {
            await auth.logout();
            window.location.href = 'login.html';
          }
        );
      });
    }
  }

  /**
   * Мобильное меню
   */
  function setupMobileMenu() {
    const mobileMenuBtn = $('#mobile-menu-btn');
    const mobileMenu = $('#mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      on(mobileMenuBtn, 'click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  }

  /**
   * Загрузка файлов — универсальный обработчик для всех file input
   * Загружает файл на сервер через API и вставляет URL в целевое поле
   */
  function setupFileUploads() {
    // Проект — основное изображение
    const projectUpload = $('#image_upload');
    if (projectUpload) {
      on(projectUpload, 'change', async () => {
        await handleFileUpload(projectUpload, $('#image_url'));
      });
    }

    // Все file input с data-target (партнёры, сертификаты)
    $$('input[type="file"][data-target]').forEach(input => {
      on(input, 'change', async () => {
        const targetId = input.dataset.target;
        const targetField = $(`#${targetId}`);
        await handleFileUpload(input, targetField);
      });
    });
  }

  /**
   * Загрузить файл и вставить URL в поле
   */
  async function handleFileUpload(fileInput, urlField) {
    const file = fileInput.files[0];
    if (!file) return;

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Файл слишком большой. Максимум 5 MB');
      fileInput.value = '';
      return;
    }

    // Показываем индикатор в поле
    if (urlField) {
      urlField.value = 'Загрузка...';
      urlField.disabled = true;
    }

    try {
      const result = await api.uploadFile(file);
      if (result.success && result.url && urlField) {
        urlField.value = result.url;
      }
    } catch (error) {
      showError('Ошибка загрузки файла');
      if (urlField) {
        urlField.value = '';
      }
    } finally {
      if (urlField) {
        urlField.disabled = false;
      }
      fileInput.value = '';
    }
  }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
  initAdminPanel();
}
