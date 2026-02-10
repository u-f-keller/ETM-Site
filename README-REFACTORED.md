# Корпоративный сайт ООО "ЭТМ" - Refactored Version 2.0

Современный корпоративный веб-сайт для инжиниринговой компании с полностью отрефакторенной кодовой базой.

## 🎯 Что нового в версии 2.0

### Архитектура
- ✅ **Модульная структура** - код разделён на логические модули
- ✅ **ES6 Modules** - использование нативных модулей браузера
- ✅ **Централизованный API клиент** - единая точка для всех запросов
- ✅ **Компонентный подход** - переиспользуемые UI компоненты

### Безопасность
- ✅ **XSS защита** - санитизация всех пользовательских данных
- ✅ **URL валидация** - проверка всех внешних ссылок
- ✅ **Улучшенная аутентификация** - с авто-продлением сессии
- ✅ **CSP headers** - защита от injection атак

### UX/UI
- ✅ **Toast notifications** - красивые уведомления вместо alert()
- ✅ **Редактирование записей** - полный CRUD функционал
- ✅ **Улучшенные индикаторы загрузки** - skeleton screens, spinners
- ✅ **Модальные окна** - универсальный компонент

### Code Quality
- ✅ **DRY принцип** - устранение дублирования кода
- ✅ **Читаемость** - понятные имена переменных и функций
- ✅ **Error handling** - обработка всех ошибок
- ✅ **JSDoc комментарии** - документация в коде

## 📁 Новая структура проекта

```
/
├── index.html              # Главная страница
├── projects.html           # Страница портфолио
├── login.html              # Страница входа
├── admin-panel.html        # Админ-панель
├── admin.html              # Редирект на login.html
├── favicon.png
├── images/
│   ├── logo-full.png
│   └── logo-icon.png
├── src/                    # Новая структура!
│   ├── js/
│   │   ├── config/         # Конфигурация
│   │   │   ├── api.js                  # API клиент
│   │   │   └── constants.js            # Константы
│   │   ├── utils/          # Утилиты
│   │   │   ├── helpers.js              # Общие помощники
│   │   │   ├── dom.js                  # DOM утилиты
│   │   │   ├── sanitize.js             # XSS защита
│   │   │   ├── auth.js                 # Аутентификация
│   │   │   └── notification.js         # Toast уведомления
│   │   ├── components/     # Компоненты
│   │   │   ├── navbar.js               # Навигация
│   │   │   ├── modal.js                # Модальные окна
│   │   │   └── loader.js               # Индикаторы загрузки
│   │   ├── modules/        # Бизнес-логика
│   │   │   ├── projects.js             # Публичные проекты
│   │   │   ├── partners.js             # Публичные партнёры
│   │   │   ├── certificates.js         # Публичные сертификаты
│   │   │   └── admin/      # Админские модули
│   │   │       ├── projects-admin.js   # CRUD проектов
│   │   │       ├── partners-admin.js   # CRUD партнёров
│   │   │       └── certificates-admin.js # CRUD сертификатов
│   │   └── pages/          # Страничные скрипты
│   │       ├── main.js                 # index.html
│   │       ├── projects-page.js        # projects.html
│   │       ├── login.js                # login.html
│   │       └── admin.js                # admin-panel.html
│   └── css/
│       └── custom.css      # Кастомные стили
├── js/                     # Старые файлы (deprecated)
│   ├── main.js
│   ├── projects.js
│   ├── admin.js
│   └── admin-extended.js
├── .gitignore
└── README.md
```

## 🚀 Быстрый старт

### 1. Подключение к HTML

Обновлённые HTML файлы используют ES6 modules:

```html
<!-- index.html -->
<script type="module" src="/src/js/pages/main.js"></script>

<!-- projects.html -->
<script type="module" src="/src/js/pages/projects-page.js"></script>

<!-- login.html -->
<script type="module" src="/src/js/pages/login.js"></script>

<!-- admin-panel.html -->
<script type="module" src="/src/js/pages/admin.js"></script>
```

### 2. Логин в админ-панель

**Пароль по умолчанию:** `etm2026`

Для изменения пароля отредактируйте файл `src/js/config/constants.js`:

```javascript
export const ADMIN_CONFIG = {
  password: 'ваш_новый_пароль'
};
```

## 📚 Архитектурные решения

### API Client

Централизованный клиент для всех запросов:

```javascript
import { api } from '../config/api.js';

// GET запрос
const response = await api.get('tables/projects', { limit: 100 });

// POST запрос
await api.post('tables/projects', { title: 'Новый проект' });

// PUT запрос (обновление)
await api.put('tables/projects', projectId, updatedData);

// DELETE запрос
await api.delete('tables/projects', projectId);
```

**Особенности:**
- Автоматические повторы при ошибках
- Встроенное кеширование
- Единообразная обработка ошибок
- Инвалидация кеша при изменениях

### Notifications System

Замена `alert()` на красивые toast уведомления:

```javascript
import { showSuccess, showError, showWarning, showInfo } from '../utils/notification.js';

// Успех
showSuccess('Проект успешно сохранён!');

// Ошибка
showError('Не удалось загрузить данные');

// Предупреждение
showWarning('Сессия истекает через 5 минут');

// Информация
showInfo('Загрузка завершена');
```

### Modal System

Универсальные модальные окна:

```javascript
import { ModalManager, confirmModal, infoModal } from '../components/modal.js';

// Создание модала
const modal = ModalManager.create('my-modal', {
  title: 'Заголовок',
  content: '<p>Контент</p>',
  size: 'large' // small, medium, large, full
});

modal.open();

// Модал с подтверждением
confirmModal(
  'Удалить проект?',
  'Это действие нельзя отменить.',
  () => console.log('Подтверждено'),
  () => console.log('Отменено')
);
```

### Authentication

Улучшенная система аутентификации:

```javascript
import { auth } from '../utils/auth.js';

// Вход
await auth.login(password);

// Выход
auth.logout();

// Проверка авторизации
if (auth.isAuthenticated()) {
  // Пользователь залогинен
}

// Защита страницы
protectPage(); // Перенаправит на login.html если не авторизован
```

## 🔒 Безопасность

### XSS Protection

Все пользовательские данные санитизируются:

```javascript
import { sanitizeText, sanitizeHTML, sanitizeURL } from '../utils/sanitize.js';

// Обычный текст
const safe = sanitizeText(userInput);

// HTML (для Rich Text)
const safeHTML = sanitizeHTML(richTextContent);

// URL
const safeURL = sanitizeURL(externalLink);
```

### Валидация данных

Перед отправкой в API данные валидируются:

```javascript
function validateProjectData(data) {
  const errors = [];

  if (!data.title || data.title.length < 3) {
    errors.push('Название слишком короткое');
  }

  if (data.year < 2000 || data.year > 2100) {
    errors.push('Некорректный год');
  }

  return { valid: errors.length === 0, errors };
}
```

## 🎨 UI Компоненты

### Loader

Индикаторы загрузки:

```javascript
import { loader } from '../components/loader.js';

// В контейнере
loader.show('#container', 'Загрузка...');
loader.hide('#container');

// Полноэкранный
loader.fullscreen('Сохранение...');
loader.hideFullscreen();

// В кнопке
loader.button(button, 'Отправка...');
loader.hideButton(button);

// Skeleton
loader.skeleton('#container', 3); // 3 skeleton элемента
```

### Navbar

Навигация с мобильным меню:

```javascript
import { initNavbar } from '../components/navbar.js';

const navbar = initNavbar({
  navSelector: '.navbar-scroll',
  mobileMenuBtnSelector: '#mobile-menu-btn',
  mobileMenuSelector: '#mobile-menu',
  scrollThreshold: 50
});
```

## 📊 Модули данных

### Projects

```javascript
import { initProjects } from '../modules/projects.js';

const projects = initProjects({
  containerSelector: '#projects-container',
  loadingSelector: '#loading-skeleton',
  noProjectsSelector: '#no-projects',
  modalId: 'project-modal'
});

// Перезагрузка
await projects.reload();
```

### Partners

```javascript
import { initPartners } from '../modules/partners.js';

const partners = initPartners({
  containerSelector: '#partners-container',
  loadingSelector: '#partners-loading'
});
```

### Certificates

```javascript
import { initCertificates } from '../modules/certificates.js';

const certificates = initCertificates({
  containerSelector: '#certificates-container',
  loadingSelector: '#certificates-loading',
  modalId: 'certificate-modal'
});
```

## 🛠️ Утилиты

### DOM Helpers

Упрощённая работа с DOM:

```javascript
import { $, $$, on, addClass, removeClass, toggle } from '../utils/dom.js';

// Получение элемента
const btn = $('#my-button');

// Получение всех элементов
const links = $$('a.nav-link');

// Обработчик события
on(btn, 'click', () => console.log('Clicked'));

// Работа с классами
addClass(element, 'active', 'visible');
removeClass(element, 'hidden');
toggle(element, 'expanded');
```

### Common Helpers

```javascript
import { debounce, formatDate, sleep, stripHTML } from '../utils/helpers.js';

// Debounce
const debouncedSearch = debounce(() => {
  // Поиск
}, 300);

// Форматирование даты
const formatted = formatDate(new Date(), 'DD.MM.YYYY');

// Задержка
await sleep(1000);

// Удаление HTML
const text = stripHTML('<p>Hello</p>'); // "Hello"
```

## 🔄 Миграция со старой версии

### 1. Сохранение старой версии

Старые файлы перемещены в отдельную ветку `legacy/old-version`.

### 2. Обновление HTML

Обновите подключение скриптов в HTML файлах:

**Было:**
```html
<script src="js/main.js"></script>
```

**Стало:**
```html
<script type="module" src="/src/js/pages/main.js"></script>
```

### 3. Удаление старых файлов

После проверки работоспособности можно удалить:
- `js/main.js`
- `js/projects.js`
- `js/admin.js`
- `js/admin-extended.js`

## 📈 Производительность

### Кеширование

API запросы кешируются автоматически:

```javascript
// Кеширование на 5 минут
const response = await api.get('tables/projects', {}, {
  useCache: true,
  cacheTTL: 300000
});
```

### Lazy Loading

Изображения загружаются лениво:

```html
<img loading="lazy" src="image.jpg" alt="...">
```

### Debouncing

Поиск использует debounce для снижения нагрузки:

```javascript
const debouncedSearch = debounce(searchFunction, 300);
```

## 🐛 Отладка

### Проверка сессии

```javascript
import { debugSession } from '../utils/auth.js';

debugSession(); // Выводит информацию о сессии в консоль
```

### Очистка кеша

```javascript
import { api } from '../config/api.js';

api.clearCache(); // Очистить весь кеш
```

## 📝 Changelog

### Version 2.0.0 (Февраль 2026)

**Added:**
- Модульная архитектура с ES6 modules
- Централизованный API клиент
- Toast notification system
- Универсальный modal компонент
- Редактирование записей (PUT запросы)
- XSS защита для всех входных данных
- Улучшенная система аутентификации
- Skeleton loaders
- Debounced search
- API request caching

**Improved:**
- Переработана структура кода
- Улучшена обработка ошибок
- Оптимизирована производительность
- Улучшена безопасность
- Добавлена документация в коде

**Fixed:**
- Дублирование кода
- Глобальные функции (window.*)
- Отсутствие валидации
- Плохая обработка ошибок
- XSS уязвимости

**Deprecated:**
- `js/main.js` → `src/js/pages/main.js`
- `js/projects.js` → `src/js/pages/projects-page.js`
- `js/admin.js` → `src/js/pages/admin.js`
- `js/admin-extended.js` → разделён на модули

## 🤝 Контрибьютинг

При добавлении нового функционала следуйте архитектуре:

1. **Config** - глобальные настройки
2. **Utils** - переиспользуемые утилиты
3. **Components** - UI компоненты
4. **Modules** - бизнес-логика
5. **Pages** - инициализация страниц

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера
2. Убедитесь, что браузер поддерживает ES6 modules
3. Очистите кеш браузера

## 📄 Лицензия

Корпоративный проект для ООО "ЭТМ" © 2026

---

**Версия:** 2.0.0  
**Дата релиза:** Февраль 2026  
**Статус:** ✅ Production Ready
