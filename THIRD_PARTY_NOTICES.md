# Third-party notices

chat-export-dashboard is licensed under the [MIT License](./LICENSE).

Production UI is static files built into `public/` (React runtime + scheduler). Build tooling (Vite, TypeScript) is dev-only and not shipped in the nginx image except as compiled assets.

Regenerate: `npm run licenses` (`npx license-checker`; not a committed dependency).

## Direct runtime dependencies

| Package | License | Notes |
| --- | --- | --- |
| `react` | MIT | npm runtime |
| `react-dom` | MIT | npm runtime |

## How this repo fits the product

Served at `/dashboard/` by [chat-export-server](https://github.com/svergio/chat-export-server) (embedded submodule) or via the optional [Dockerfile](./Dockerfile) (**nginx:alpine** + built static assets). Talks to the server over same-origin `/dashboard/api`; the [Chat Export extension](https://github.com/svergio/chat-export-extension) bridge is unrelated to npm deps here.

## Optional integrations (not dependencies)

Cursor, Open WebUI, BibLLMsteak, Bonsai-27B, and NodeRed maintainer trees are not npm or runtime dependencies.

---

_Generated for chat-export-dashboard@1.0.1. Product license: MIT._
