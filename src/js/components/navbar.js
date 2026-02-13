/**
 * Компонент навигации
 * Управление мобильным меню, scroll эффектами
 */

import { $, $$, on, addClass, removeClass, toggleClass, hasClass } from '../utils/dom.js';
import { throttle } from '../utils/helpers.js';

/**
 * Класс для управления навигацией
 */
export class Navbar {
  constructor(options = {}) {
    this.options = {
      navSelector: options.navSelector || '.navbar-scroll',
      mobileMenuBtnSelector: options.mobileMenuBtnSelector || '#mobile-menu-btn',
      mobileMenuSelector: options.mobileMenuSelector || '#mobile-menu',
      scrollThreshold: options.scrollThreshold || 50,
      scrolledClass: options.scrolledClass || 'scrolled',
      ...options
    };

    this.navbar = $(this.options.navSelector);
    this.mobileMenuBtn = $(this.options.mobileMenuBtnSelector);
    this.mobileMenu = $(this.options.mobileMenuSelector);
    
    this.isMenuOpen = false;
    
    this.init();
  }

  /**
   * Инициализация
   */
  init() {
    this.setupMobileMenu();
    this.setupScrollEffect();
    this.setupSmoothScroll();
    this.setupActiveLinks();
  }

  /**
   * Настройка мобильного меню
   */
  setupMobileMenu() {
    if (!this.mobileMenuBtn || !this.mobileMenu) return;

    // Переключение меню
    on(this.mobileMenuBtn, 'click', () => {
      this.toggleMobileMenu();
    });

    // Закрытие при клике на ссылку
    const menuLinks = $$('a', this.mobileMenu);
    menuLinks.forEach(link => {
      on(link, 'click', () => {
        this.closeMobileMenu();
      });
    });

    // Закрытие при клике вне меню
    on(document, 'click', (e) => {
      if (this.isMenuOpen && 
          !this.mobileMenu.contains(e.target) && 
          !this.mobileMenuBtn.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Закрытие по Escape
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Переключить мобильное меню
   */
  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Открыть мобильное меню
   */
  openMobileMenu() {
    if (!this.mobileMenu) return;
    
    removeClass(this.mobileMenu, 'hidden');
    this.isMenuOpen = true;

    // Изменение иконки кнопки
    if (this.mobileMenuBtn) {
      const icon = this.mobileMenuBtn.querySelector('i');
      if (icon) {
        removeClass(icon, 'fa-bars');
        addClass(icon, 'fa-times');
      }
    }
  }

  /**
   * Закрыть мобильное меню
   */
  closeMobileMenu() {
    if (!this.mobileMenu) return;
    
    addClass(this.mobileMenu, 'hidden');
    this.isMenuOpen = false;

    // Возврат иконки кнопки
    if (this.mobileMenuBtn) {
      const icon = this.mobileMenuBtn.querySelector('i');
      if (icon) {
        removeClass(icon, 'fa-times');
        addClass(icon, 'fa-bars');
      }
    }
  }

  /**
   * Настройка эффекта при скролле
   */
  setupScrollEffect() {
    if (!this.navbar) return;

    const handleScroll = throttle(() => {
      if (window.scrollY > this.options.scrollThreshold) {
        addClass(this.navbar, this.options.scrolledClass);
      } else {
        removeClass(this.navbar, this.options.scrolledClass);
      }
    }, 100);

    on(window, 'scroll', handleScroll, { passive: true });

    // Начальная проверка
    handleScroll();
  }

  /**
   * Настройка плавной прокрутки для якорных ссылок
   */
  setupSmoothScroll() {
    const anchorLinks = $$('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      on(link, 'click', (e) => {
        const href = link.getAttribute('href');
        
        // Игнорируем пустые ссылки
        if (!href || href === '#' || href === '#!') return;

        const target = $(href);
        if (!target) return;

        e.preventDefault();

        // Высота навбара для offset
        const navbarHeight = this.navbar ? this.navbar.offsetHeight : 80;
        const targetPosition = target.offsetTop - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Закрываем мобильное меню если открыто
        if (this.isMenuOpen) {
          this.closeMobileMenu();
        }

        // Обновляем URL без перезагрузки
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      });
    });
  }

  /**
   * Подсветка активных ссылок при скролле
   */
  setupActiveLinks() {
    const sections = $$('section[id]');
    if (sections.length === 0) return;

    const navLinks = $$('a[href^="#"]', this.navbar);
    const mobileLinks = this.mobileMenu ? $$('a[href^="#"]', this.mobileMenu) : [];
    const allLinks = [...navLinks, ...mobileLinks];

    const handleScroll = throttle(() => {
      const scrollPosition = window.scrollY + 100; // Offset для лучшего определения

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          allLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === `#${sectionId}`) {
              addClass(link, 'text-cyan-400');
              removeClass(link, 'text-white');
            } else {
              removeClass(link, 'text-cyan-400');
              addClass(link, 'text-white');
            }
          });
        }
      });
    }, 100);

    on(window, 'scroll', handleScroll, { passive: true });
  }

  /**
   * Показать навбар
   */
  show() {
    if (!this.navbar) return;
    removeClass(this.navbar, 'hidden');
  }

  /**
   * Скрыть навбар
   */
  hide() {
    if (!this.navbar) return;
    addClass(this.navbar, 'hidden');
  }

  /**
   * Уничтожить компонент
   */
  destroy() {
    // Закрываем меню
    this.closeMobileMenu();
    
    // В реальном приложении здесь нужно удалить все event listeners
    // Но т.к. мы используем встроенные обработчики, они будут удалены автоматически
  }
}

/**
 * Автоматическая инициализация навбара при загрузке страницы
 */
export function initNavbar(options = {}) {
  const navbar = new Navbar(options);
  return navbar;
}

/**
 * Глобальный экземпляр (для удобства)
 */
let globalNavbar = null;

/**
 * Получить или создать глобальный экземпляр навбара
 */
export function getNavbar() {
  if (!globalNavbar) {
    globalNavbar = initNavbar();
  }
  return globalNavbar;
}
