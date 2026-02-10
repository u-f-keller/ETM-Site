/**
 * Админ-панель (admin-panel.html)
 * Инициализация всех админских модулей и защита страницы
 */

import { auth, protectPage, setupSessionAutoExtend } from '../utils/auth.js';
import { $, $$, on, addClass, removeClass } from '../utils/dom.js';
import { initProjectsAdmin } from '../modules/admin/projects-admin.js';
import { initPartnersAdmin } from '../modules/admin/partners-admin.js';
import { initCertificatesAdmin } from '../modules/admin/certificates-admin.js';
import { confirmModal } from '../components/modal.js';

/**
 * Инициализация админ-панели
 */
function initAdminPanel() {
  // Защита страницы - требуем авторизацию
  try {
    protectPage();
  } catch (error) {
    // Пользователь будет перенаправлен на login.html
    return;
  }

  // Автоматическое продление сессии
  setupSessionAutoExtend();

  // Инициализация табов
  setupTabs();

  // Кнопка выхода
  setupLogout();

  // Мобильное меню (если есть)
  setupMobileMenu();

  // Инициализация модулей
  let projectsAdmin, partnersAdmin, certificatesAdmin;

  // Projects module
  projectsAdmin = initProjectsAdmin({
    formSelector: '#project-form',
    listSelector: '#projects-list',
    loadingSelector: '#loading-projects',
    noProjectsSelector: '#no-projects-admin'
  });

  // Partners module (ленивая загрузка - загружается при переходе на таб)
  let partnersLoaded = false;
  let certificatesLoaded = false;

  /**
   * Настройка переключения табов
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

        // Ленивая инициализация модулей
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
   * Настройка кнопки выхода
   */
  function setupLogout() {
    const logoutBtn = $('#logout-btn');
    
    if (logoutBtn) {
      on(logoutBtn, 'click', () => {
        confirmModal(
          'Подтвердите выход',
          'Вы уверены, что хотите выйти из системы?',
          () => {
            auth.logout();
            window.location.href = '/login.html';
          }
        );
      });
    }
  }

  /**
   * Настройка мобильного меню
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
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
  initAdminPanel();
}
