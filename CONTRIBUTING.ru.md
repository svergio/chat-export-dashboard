# Участие в разработке chat-export-dashboard

[English](CONTRIBUTING.md) | [Русский](CONTRIBUTING.ru.md)

React + Vite дашборд для [chat-export-server](https://github.com/svergio/chat-export-server). Сборка встраивается в сервер как `chat-export-server/dashboard/public/`.

Без `Co-authored-by`. Фичи — в `main`; тяжёлые тесты — сначала на `test`, если так требует CI.

См. [SECURITY.md](./SECURITY.md) и [CONTRIBUTING extension (RU)](https://github.com/svergio/chat-export-extension/blob/main/CONTRIBUTING.ru.md).

## Требования

- **Node.js** 20+ (в CI — 22)
- npm

## Разработка

```bash
npm ci
npm run dev          # Vite :5173, proxy /dashboard/api
npm run build        # tsc && vite → public/
npm run preview
```

`vite.config.ts`: `base: '/dashboard/'`, `publicDir: 'static'`.

При смене dependencies: `npm run licenses` → [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Локали и legal notice

| Файл | Роль |
|------|------|
| `static/locales/en.json`, `ru.json` | UI-строки |
| `src/i18n/fallback.ts` | EN fallback |
| `src/hooks/useLocale.ts` | `/dashboard/locales/{code}.json` |

При добавлении/переименовании ключей:

1. Одинаковый набор в **en** и **ru**.
2. Зеркало в `fallback.ts`, если UI должен жить до fetch.
3. `npm test` (паритет + legal-строки).
4. `npm run build` и sync в сервер (ниже).

## Скины

`useTheme.ts`, `SkinIcons.tsx`, `static/skins.css`, `AppearanceControls.tsx`.

## Тесты и CI

```bash
npm test             # scripts/test-i18n.mjs
```

CI на **`test`** и **`main`**: `npm ci`, `npm test`, `npm run build`, `npm audit --audit-level=high`.

## Embed в chat-export-server

```bash
npm run build
rsync -a --delete public/ ../chat-export-server/dashboard/public/
```

Сервер отдаёт файлы с `/dashboard/`. При релизе коммитьте обновлённые assets в дереве сервера.

## Docker (split stack)

См. `Dockerfile` и `nginx.conf.template`.

## Гигиена PR

- Падение CI: `.cursor/rules/chat-export-mr-review-after-tests.mdc`
- 100% паритет ключей EN/RU
- Без API-секретов во фронтовом бандле
- Согласовывайте форму API с PR сервера

Вопросы: [Issues](https://github.com/svergio/chat-export-dashboard/issues).
