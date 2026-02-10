/**
 * Страница входа (login.html)
 * Обработка аутентификации
 */

import { auth } from '../utils/auth.js';
import { $, on, getValue } from '../utils/dom.js';
import { loader } from '../components/loader.js';

/**
 * Инициализация страницы входа
 */
function initLoginPage() {
  // Проверка, не залогинен ли уже пользователь
  if (auth.isAuthenticated()) {
    auth.redirectAfterLogin();
    return;
  }

  const loginForm = $('#login-form');
  const passwordInput = $('#password-input');
  const errorMessage = $('#error-message');

  if (!loginForm || !passwordInput) {
    console.error('Login form elements not found');
    return;
  }

  // Обработка отправки формы
  on(loginForm, 'submit', async (e) => {
    e.preventDefault();

    const password = getValue(passwordInput);
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    try {
      // Показываем индикатор загрузки
      loader.button(submitBtn, 'Вход...');

      // Попытка входа
      const success = await auth.login(password);

      if (success) {
        // Успешный вход - перенаправление
        auth.redirectAfterLogin();
      } else {
        // Показываем ошибку
        if (errorMessage) {
          errorMessage.classList.remove('hidden');
        }

        // Анимация тряски
        passwordInput.parentElement.classList.add('shake');
        setTimeout(() => {
          passwordInput.parentElement.classList.remove('shake');
        }, 500);

        // Очищаем поле
        passwordInput.value = '';
        passwordInput.focus();

        // Скрываем ошибку через 3 секунды
        setTimeout(() => {
          if (errorMessage) {
            errorMessage.classList.add('hidden');
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      loader.hideButton(submitBtn);
    }
  });

  // Скрытие ошибки при вводе
  on(passwordInput, 'input', () => {
    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }
  });

  // Автофокус на поле пароля
  passwordInput.focus();
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
