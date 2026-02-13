/**
 * Страница входа (login.html)
 * Серверная аутентификация через API
 */

import { auth } from '../utils/auth.js';
import { $ } from '../utils/dom.js';

function initLoginPage() {
  // Если уже авторизован — редирект в админку
  if (auth.isAuthenticated()) {
    window.location.href = 'admin-panel.html';
    return;
  }

  const form = $('#login-form');
  const loginInput = $('#login-input');
  const passwordInput = $('#password-input');
  const errorMessage = $('#error-message');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const login = loginInput ? loginInput.value.trim() : 'admin';
    const password = passwordInput ? passwordInput.value : '';

    if (!password) {
      showError('Введите пароль');
      return;
    }

    // Показываем загрузку
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Вход...';
    }

    try {
      await auth.login(login, password);
      window.location.href = 'admin-panel.html';
    } catch (error) {
      showError(error.message || 'Неверный логин или пароль');
      // Анимация тряски
      const card = form.closest('.bg-white');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Войти';
      }
    }
  });

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
      setTimeout(() => errorMessage.classList.add('hidden'), 5000);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
