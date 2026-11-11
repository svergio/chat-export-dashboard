[English](README.md) | [Русский](README.ru.md) · [![Поддержать на DonationAlerts](https://img.shields.io/badge/Поддержать-DonationAlerts-orange)](https://www.donationalerts.com/r/svwergio_mel)

# chat-export-dashboard

**Дашборд оператора** для [chat-export-server](https://github.com/svergio/chat-export-server). Браузеры, очереди задач, кеш чатов, логи и MCP-токены — статический React на `http://127.0.0.1:8765/dashboard/`, когда сервер подключает этот репозиторий как submodule `dashboard/`.

Работает с [расширением Chat Export](https://github.com/svergio/chat-export-extension); облачный аккаунт не нужен.

## Зачем

MCP и CLI неудобны, когда задача зависла, браузер отвалился или нужно скопировать лог. Дашборд — **локальная** панель с той же границей безопасности, что и сервер.

## Возможности

| Раздел | Содержимое |
|--------|------------|
| Обзор | Состояние, MCP, ресурсы |
| Браузеры | Профили, подсказки bind, вкладки |
| Очереди | Пайплайн задач |
| Кеш | Временный кеш чатов |
| Логи | Поток логов сервера |
| Настройки | EN/RU, скины провайдеров, MCP |

Сессия: cookie `ce_dash_sid`; API: `/dashboard/api`.

```mermaid
flowchart LR
  USER[Браузер оператора]
  USER --> DASH[/dashboard/]
  DASH --> API[/dashboard/api/]
  API --> SRV[chat-export-server]
  SRV --> EXT[Расширение]
```

## Быстрый старт (3 шага)

1. [chat-export-server](https://github.com/svergio/chat-export-server), `git submodule update --init dashboard`.
2. Здесь: `npm ci && npm run build` → `public/`.
3. `chat-export-server start`, откройте `http://127.0.0.1:8765/dashboard/`, войдите паролем дашборда.

## Настройка

Дашборд — статика на **`http://127.0.0.1:8765/dashboard/`**, которую отдаёт [chat-export-server](https://github.com/svergio/chat-export-server).

### Вход

| Параметр | Значение |
|----------|----------|
| URL | `http://127.0.0.1:8765/dashboard/` |
| Логин | `admin` (`dashboard.username` в `~/.chat-export/config.json`) |
| Пароль | `changeme`, пока не задали `dashboard.password` |
| Сессия | cookie `ce_dash_sid` (это не Bearer `cem_` для MCP) |

Входите паролем дашборда. Ключи MCP (`cem_` / `cek_`) — только для Cursor и HTTP API.

### Разделы

| Страница | Назначение |
|----------|------------|
| **Браузеры** | Выпуск `ceb_` для двух профилей Chrome |
| **Настройки** | Смена MCP-токена, язык, скины |
| **Очереди** | Статусы `jobs_*` |
| **Кеш** | Локальный `chat_cache_*` |
| **Логи** | `~/.chat-export/server.log` |

После `npm run build` скопируйте `public/` в `chat-export-server/dashboard/public/` или обновите submodule.

Связка с расширением: [настройка extension](https://github.com/svergio/chat-export-extension#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0), [настройка server](https://github.com/svergio/chat-export-server#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0).

## Сборка и разработка

```bash
npm ci && npm run build
npm run dev   # proxy /dashboard/api на сервер
```

React 19, TypeScript, Vite; пять скинов провайдеров.

## Безопасность

- Доступен там, где слушает сервер — держите **loopback**, если не настроили TLS и усиленную аутентификацию.
- Пароль дашборда ≠ MCP Bearer.
- [SECURITY.md](SECURITY.md).

## Репозитории

| Репозиторий | Роль |
|-------------|------|
| [extension](https://github.com/svergio/chat-export-extension) | Мост |
| [server](https://github.com/svergio/chat-export-server) | Хост + API |
| [dashboard](https://github.com/svergio/chat-export-dashboard) (этот) | UI |
| [Wiki](https://github.com/svergio/chat-export-extension/wiki) | Документация |

## Поддержка проекта

- [DonationAlerts — svwergio_mel](https://www.donationalerts.com/r/svwergio_mel)

## Лицензия

[LICENSE](LICENSE).
