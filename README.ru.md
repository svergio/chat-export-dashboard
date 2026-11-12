[English](README.md) | [Русский](README.ru.md) · [![Поддержать на DonationAlerts](https://img.shields.io/badge/Поддержать-DonationAlerts-orange)](https://www.donationalerts.com/r/svwergio_mel) · [![chat-export-server MCP server](https://glama.ai/mcp/servers/svergio/chat-export-server/badges/score.svg)](https://glama.ai/mcp/servers/svergio/chat-export-server) · [![MCP Servers](https://img.shields.io/badge/MCP_Servers-listed-2563eb)](https://mcpservers.org/ru/)

# chat-export-dashboard

<p align="center">
  <img src="docs/media/demo-dashboard.gif" alt="Вход, обзор, браузеры (два профиля), очереди" width="720" />
</p>

**Дашборд оператора** для [chat-export-server](https://github.com/svergio/chat-export-server). Браузеры, очереди задач, кеш чатов, логи и MCP-токены — статический React на `http://127.0.0.1:8765/dashboard/`, когда сервер подключает этот репозиторий как submodule `dashboard/`.

Работает с [расширением Chat Export](https://github.com/svergio/chat-export-extension); облачный аккаунт не нужен.

## Автономный продукт

Дашборд — **опциональный** UI для `chat-export-server`. Chat Export не требует Cursor, Chrome DevTools MCP, Open WebUI или встроенных локальных агентов — достаточно расширения + сервера (+ этого UI при желании).

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
| Настройки | EN/RU, 8 скинов провайдеров, MCP |

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

## Сборка и разработка

```bash
npm ci && npm run build
npm run dev   # proxy /dashboard/api на сервер
```

React 19, TypeScript, Vite; восемь скинов (ChatGPT, Grok, Grok-X, Copilot, Claude, Qwen, DeepSeek, Perplexity).

## Docker (опциональный фронт)

[`Dockerfile`](Dockerfile): сборка в Node 22, раздача статики через **nginx**, прокси `/dashboard/api`, `/mcp`, `/ws`, `/ext`, `/enroll`, `/health` на `SERVER_UPSTREAM` (по умолчанию `server:8765`). Запуск через Colima (`docker --context colima …`) вместе с `chat-export-server` в `docker-compose.yml` дерева Chat Export.

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

## Тесты

```bash
npm test
```

CI (`.github/workflows/ci.yml`) на ветках **`test`** и **`main`**: `npm test` (паритет локалей и legal-строк), сборка, audit.

## Участие в разработке

См. [CONTRIBUTING.md](./CONTRIBUTING.md) (локали, `LegalFooter`, синхронизация embed в сервер) и [CONTRIBUTING extension](https://github.com/svergio/chat-export-extension/blob/main/CONTRIBUTING.md) для общей i18n.

## Зависимости

**Runtime:** React 19 + react-dom (Vite/TypeScript только для сборки; в проде — статика `public/`).

**Связка:** встраивается в [chat-export-server](https://github.com/svergio/chat-export-server) на `/dashboard/`; API с того же origin. [Расширение](https://github.com/svergio/chat-export-extension) не добавляет npm-зависимостей сюда. Общий wire-контракт — `packages/protocol/` в сервере.

Docker (опционально): сборка Node + **nginx:1.27-alpine**. См. [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md), `npm run licenses`.

**Не обязательны:** Cursor, Open WebUI, BibLLMsteak, Bonsai-27B, NodeRed.

## Лицензия

[LICENSE](LICENSE).
