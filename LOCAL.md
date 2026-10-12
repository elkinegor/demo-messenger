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
2. Создайте инстанс **MAX**, **Telegram** и/или **WhatsApp**, авторизуйте его.
3. В приложении откройте ⚙ на нужной вкладке и вставьте `apiUrl`, `idInstance`, `apiTokenInstance`.
   - WhatsApp: `apiUrl` часто `https://1100.api.green-api.com` (смотрите в карточке).
   - Telegram: чаще `https://4100.api.green-api.com`.
   - Не путайте с адресом консоли (`console.green-api.com`) — это не apiUrl.
4. Данные сохранятся в куках браузера (не на сервере), отдельно для каждой вкладки.

Если видите «GREEN-API unreachable»: проверьте, что с вашего ПК открывается `apiUrl` (не только консоль). Запросы идут из браузера, не с сервера demo.linkbit.live.

## Проверка сценария

1. Вкладка MAX / Telegram / WhatsApp → настройки → сохранить ключи.
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
