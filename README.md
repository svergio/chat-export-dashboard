# chat-export-dashboard

Admin UI for [chat-export-server](https://github.com/svergio/chat-export-server), consumed as a git submodule at `dashboard/`.

Static admin UI in `public/` (vanilla JS/CSS): overview, browsers, queues, cache, logs. RU/EN via `public/locales/*.json` (served at `/dashboard/locales/`). Five provider skins in `public/skins.css` (`data-skin` × `data-scheme` light/dark/auto).

This repository’s `main` branch stays free of `test/` suites; use branch `test` when tests are added.
