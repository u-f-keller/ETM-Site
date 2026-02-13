/**
 * Страница проектов (projects.html)
 * Инициализация навигации и модуля проектов
 */

import { initNavbar } from '../components/navbar.js';
import { initProjects } from '../modules/projects.js';

/**
 * Инициализация страницы проектов
 */
function initProjectsPage() {
  // Навигация
  initNavbar();

  // Проекты
  initProjects({
    containerSelector: '#projects-container',
    loadingSelector: '#loading-skeleton',
    noProjectsSelector: '#no-projects',
    modalId: 'project-modal'
  });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsPage);
} else {
  initProjectsPage();
}
