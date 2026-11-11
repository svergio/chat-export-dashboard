# chat-export-dashboard

Admin UI for [chat-export-server](https://github.com/svergio/chat-export-server), consumed as a git submodule at `dashboard/`.

React 19 + TypeScript + Vite. Production build writes static assets into `public/` for server mount at `/dashboard/*`.

## Build

```bash
npm ci
npm run build
```

Output: `public/index.html`, `public/assets/*`, plus `public/locales/`, `public/styles.css`, `public/skins.css` (from `static/`).

## Develop

```bash
npm run dev
```

Vite proxies `/dashboard/api` to `http://127.0.0.1:3847` (adjust `vite.config.ts` if your server port differs). Run chat-export-server with dashboard enabled for live API.

## Features

Same contract as the legacy vanilla UI: session cookie `ce_dash_sid`, overview / browsers / jobs / cache / logs / MCP token APIs, RU/EN locales, five provider skins (light / dark / auto).

This repository’s `main` branch stays free of `test/` suites; use branch `test` when tests are added.
