 /**
  * Аутентификация — серверная проверка через API
  * Токен хранится в localStorage, проверяется на сервере
  */
 
 import { api } from '../config/api.js';
 import { API_ENDPOINTS, SESSION_CONFIG } from '../config/constants.js';
 
 const TOKEN_KEY = SESSION_CONFIG.tokenKey;
 
+/**
+ * Безопасно распарсить JSON-ответ и дать понятную ошибку,
+ * если сервер вернул пустое тело или не-JSON.
+ */
+async function parseJsonOrThrow(response, context = 'API') {
+  const raw = await response.text();
+
+  if (!raw || !raw.trim()) {
+    throw new Error(
+      `[${context}] Пустой ответ сервера (HTTP ${response.status}). ` +
+      'Проверьте URL API, .htaccess/роутинг и серверные логи PHP.'
+    );
+  }
+
+  try {
+    return JSON.parse(raw);
+  } catch {
+    const preview = raw.slice(0, 200).replace(/\s+/g, ' ').trim();
+    throw new Error(
+      `[${context}] Сервер вернул не JSON (HTTP ${response.status}): ${preview || '<empty>'}`
+    );
+  }
+}
+
 export const auth = {
   /**
    * Вход: отправляем логин и пароль на сервер
    * Возвращает { success, token, expires_at } или выбрасывает ошибку
    */
   async login(login, password) {
     const response = await fetch(api.buildURL(API_ENDPOINTS.authLogin), {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ login, password }),
     });
 
-    const data = await response.json();
+    const data = await parseJsonOrThrow(response, 'auth/login');
 
     if (!response.ok || !data.success) {
       throw new Error(data.error || 'Ошибка входа');
     }
 
     // Сохраняем токен
     localStorage.setItem(TOKEN_KEY, data.token);
     localStorage.setItem(TOKEN_KEY + '_expires', data.expires_at);
 
     return data;
   },
 
   /**
    * Выход: удаляем токен на сервере и локально
    */
   async logout() {
     try {
       const token = localStorage.getItem(TOKEN_KEY);
       if (token) {
         await fetch(api.buildURL(API_ENDPOINTS.authLogout), {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${token}` },
         });
       }
     } catch (e) {
@@ -51,50 +75,54 @@ export const auth = {
 
     localStorage.removeItem(TOKEN_KEY);
     localStorage.removeItem(TOKEN_KEY + '_expires');
   },
 
   /**
    * Проверить, есть ли действующий токен
    */
   isAuthenticated() {
     return !!localStorage.getItem(TOKEN_KEY);
   },
 
   /**
    * Проверить токен на сервере и продлить
    */
   async checkSession() {
     const token = localStorage.getItem(TOKEN_KEY);
     if (!token) return false;
 
     try {
       const response = await fetch(api.buildURL(API_ENDPOINTS.authCheck), {
         method: 'GET',
         headers: { 'Authorization': `Bearer ${token}` },
       });
 
+      // Даже если тело нам здесь не нужно, читаем и проверяем формат,
+      // чтобы ловить серверные проблемы раньше.
+      await parseJsonOrThrow(response, 'auth/check');
+
       if (!response.ok) {
         // Токен невалиден — очищаем
         localStorage.removeItem(TOKEN_KEY);
         localStorage.removeItem(TOKEN_KEY + '_expires');
         return false;
       }
 
       return true;
     } catch (e) {
       // Ошибка сети — не удаляем токен, может быть временная
       return false;
     }
   },
 
   /**
    * Получить токен
    */
   getToken() {
     return localStorage.getItem(TOKEN_KEY);
   },
 };
 
 /**
  * Защита страницы — редирект на login.html если нет токена
  */
