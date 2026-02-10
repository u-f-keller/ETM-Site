/**
 * Главная страница (index.html)
 * Инициализация навигации, партнёров и сертификатов
 */

import { initNavbar } from '../components/navbar.js';
import { initPartners } from '../modules/partners.js';
import { initCertificates } from '../modules/certificates.js';

/**
 * Инициализация главной страницы
 */
function initMainPage() {
  // Навигация
  initNavbar();

  // Партнёры
  initPartners({
    containerSelector: '#partners-container',
    loadingSelector: '#partners-loading'
  });

  // Сертификаты
  initCertificates({
    containerSelector: '#certificates-container',
    loadingSelector: '#certificates-loading',
    modalId: 'certificate-modal'
  });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainPage);
} else {
  initMainPage();
}
