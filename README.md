# demo-messenger

Тестовое задание: UI для отправки и получения текстовых сообщений в **MAX** и **Telegram** через [GREEN-API](https://green-api.com/).

Онлайн: https://demo.linkbit.live

## Почему такая архитектура

| Выбор | Зачем |
| --- | --- |
| **Vite + React + TypeScript** | Быстрый старт, простой локальный запуск, строгая типизация API. |
| **Express-прокси** | Обход CORS, единая точка логирования на сервере, токен не уходит в браузере напрямую на чужой домен (только на наш бэкенд). |
| **Куки в браузере** | `idInstance`, `apiTokenInstance`, `apiUrl` хранятся только у пользователя; сервер их не сохраняет. |
| **localStorage для чатов** | История сообщений только в браузере, без БД. |
| **Один процесс (static + API)** | Проще развернуть: `npm run build && npm start`. |
| **Vitest** | Юнит-тесты утилит без тяжёлого E2E. |

Альтернатива «чистый SPA → GREEN-API» отвергнута: CORS, нет серверных логов, токен виден в каждом запросе к стороннему хосту.

## Стек

- React 19, TypeScript, Vite
- Express (прокси + раздача `dist` + логи в файл)
- Vitest
- i18n: RU / EN

## Структура проекта

```
demo-messenger/
├── LOCAL.md                 # локальный запуск
├── README.md
├── Egor Elkin Ru React.pdf  # резюме
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── server/
│   ├── index.ts             # Express: /api/* + static
│   ├── logger.ts            # запись логов в logs/app.log
│   └── proxy.ts             # прокси к GREEN-API
├── src/
│   ├── main.tsx
│   ├── App.tsx              # вкладки MAX / Telegram
│   ├── i18n/                # словари RU/EN
│   ├── lib/
│   │   ├── cookies.ts       # учётные данные в куках
│   │   ├── greenApi.ts      # клиент API через наш прокси
│   │   ├── chatId.ts        # нормализация телефона / chatId
│   │   ├── notifications.ts # разбор ReceiveNotification
│   │   ├── storage.ts       # история чатов в localStorage
│   │   └── loggerClient.ts  # отправка клиентских событий в /api/log
│   ├── hooks/
│   │   └── useReceiveLoop.ts
│   ├── components/
│   │   ├── SettingsModal.tsx
│   │   ├── Toast.tsx
│   │   ├── Spinner.tsx
│   │   ├── NewChatModal.tsx
│   │   └── messengers/
│   │       ├── MaxShell.tsx       # стиль web.max.ru
│   │       └── TelegramShell.tsx  # стиль Telegram Web
│   └── styles/
└── logs/                    # создаётся на сервере, в git не входит
```

## Функции и решения

| Функция | Решение |
| --- | --- |
| Вход | Иконка настроек → `apiUrl`, `idInstance`, `apiTokenInstance` → куки (отдельно для MAX и Telegram). |
| Проверка инстанса | `getStateInstance` → ожидаем `authorized`. |
| Новый чат | MAX: `checkAccount` → числовой `chatId`. Telegram: `phone@c.us` (или chatId как есть). |
| Отправка | `SendMessage` `{ chatId, message }`. |
| Получение | Цикл `ReceiveNotification` → обработка → `DeleteNotification`. |
| UI | Две вкладки: MAX / Telegram, разные визуальные оболочки. |
| Ожидание | Спиннер / skeleton при запросах. |
| Ошибки | Тосты (не alert). |
| Логи | Сервер: `logs/app.log`. Клиент шлёт важные события на `POST /api/log`. |
| Язык | Переключатель RU/EN. |

## Тесты

```bash
npm test
```

Покрытие: нормализация телефона/`chatId`, разбор уведомлений, работа с куками (jsdom).

```bash
npm run test:coverage   # отчёт coverage/
```

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Vite + Express (прокси) |
| `npm test` | Vitest |
| `npm run build` | Сборка клиента + сервера |
| `npm start` | Продакшен: один порт (static + API) |

Подробности локального запуска — в [LOCAL.md](./LOCAL.md).  
Деплой на VPS — в [deploy/README.md](./deploy/README.md).

## GREEN-API

- MAX: https://green-api.com/v3/docs/api/sending/SendMessage/
- Получение: https://green-api.com/v3/docs/api/receiving/technology-http-api/
- Telegram: https://green-api.com/en/telegram/docs/api/

Учётные данные берутся из [консоли GREEN-API](https://console.green-api.com/) (`apiUrl`, `idInstance`, `apiTokenInstance`). Для MAX и Telegram нужны **разные** инстансы.
