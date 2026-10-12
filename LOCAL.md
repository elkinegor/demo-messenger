# Локальный запуск

Нужен **Node.js 20+**.

## Установка

```bash
git clone https://github.com/elkinegor/demo-messenger.git
cd demo-messenger
npm install
```

## Режим разработки

```bash
npm run dev
```

Откроется http://localhost:5173  
API-прокси: http://localhost:3210 (Vite проксирует `/api` туда автоматически).

## Продакшен локально

```bash
npm run build
npm start
```

Приложение: http://localhost:3210

## Учётные данные

1. Зарегистрируйтесь в [GREEN-API](https://console.green-api.com/).
2. Создайте инстанс **MAX** и/или **Telegram**, авторизуйте его.
3. В приложении откройте ⚙ и вставьте `apiUrl`, `idInstance`, `apiTokenInstance`.
4. Данные сохранятся в куках браузера (не на сервере).

## Проверка сценария

1. Вкладка MAX (или Telegram) → настройки → сохранить ключи.
2. «Новый чат» → номер получателя.
3. Отправить текст.
4. Ответить из мессенджера на телефоне — ответ появится в UI.

## Тесты

```bash
npm test
```

## Логи

При работе сервера файл: `logs/app.log`  
Каталог создаётся автоматически.
