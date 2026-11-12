# Contributing to chat-export-dashboard

[English](CONTRIBUTING.md) | [Русский](CONTRIBUTING.ru.md)

React + Vite dashboard for [chat-export-server](https://github.com/svergio/chat-export-server). Static build output is embedded under the server at `chat-export-server/dashboard/public/`.

Do not add `Co-authored-by` trailers to commits. Open feature PRs against `main`; land heavier test changes on branch `test` first when CI policy requires it.

Related: [SECURITY.md](./SECURITY.md) and extension [CONTRIBUTING.md](https://github.com/svergio/chat-export-extension/blob/main/CONTRIBUTING.md) (cross-repo i18n tables).

## Prerequisites

- **Node.js** 20+ (CI uses 22)
- npm

## Development

```bash
npm ci
npm run dev          # Vite on :5173, proxies /dashboard/api -> server
npm run build        # tsc && vite build -> public/
npm run preview      # serve production build locally
```

`vite.config.ts` sets `base: '/dashboard/'` and `publicDir: 'static'` so locale and CSS files copy into `public/` on build.

If `dependencies` change, run `npm run licenses` and commit [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) when the notice file differs.

## Locales and legal notice

| File | Role |
|------|------|
| `static/locales/en.json`, `ru.json` | Authoritative UI strings |
| `src/i18n/fallback.ts` | English fallback when fetch fails |
| `src/hooks/useLocale.ts` | Loads `/dashboard/locales/{code}.json` |

When adding or renaming keys:

1. Update **both** `en.json` and `ru.json` with identical key sets.
2. Add matching keys to `fallback.ts` when the UI must work offline or before locale fetch.
3. Run `npm test` (locale parity; legal strings when `legal*` keys are present).
4. Run `npm run build` and sync `public/` into the server repo (below).

## Skins and appearance

Provider skins (optional): `src/hooks/useTheme.ts`, `src/components/SkinIcons.tsx`, `static/skins.css`. Language/scheme controls: `AppearanceControls.tsx`.

## Tests and CI

```bash
npm test             # scripts/test-i18n.mjs
```

GitHub Actions (`.github/workflows/ci.yml`) on **`test`** and **`main`**: `npm ci`, `npm test`, `npm run build`, `npm audit --audit-level=high`.

## Embed into chat-export-server

```bash
npm run build
rsync -a --delete public/ ../chat-export-server/dashboard/public/
```

The server serves these files under `/dashboard/`. Commit updated assets in the server tree (submodule or copy) when releasing.

## Docker (split stack)

See `Dockerfile` and `nginx.conf.template` for nginx-only hosting in front of the Node server.

## PR hygiene

- On failed CI or MR review, maintainer workspace rule `.cursor/rules/chat-export-mr-review-after-tests.mdc` defines the required four-part report (what/why/impact/fix).
- Keep locale key parity at 100% across EN/RU
- No API secrets in the frontend bundle
- Coordinate MCP/dashboard API shape changes with `chat-export-server` PRs

Questions: [GitHub Issues](https://github.com/svergio/chat-export-dashboard/issues).
