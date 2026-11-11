# Security Policy

React dashboard served by `chat-export-server` under `/dashboard`.

## Supported versions

Only the latest release on the `main` branch receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Use GitHub private vulnerability reporting:
https://github.com/svergio/chat-export-dashboard/security/advisories/new

Include affected version or commit, reproduction steps, and impact. You can expect an acknowledgement within 7 days and a fix or mitigation plan within 30 days for confirmed issues.

## Scope and hardening notes

- The dashboard uses an HttpOnly session cookie; no tokens are kept in `localStorage`.
- Change the server's default dashboard password before exposing anything beyond loopback.

## Secrets

Never commit bearer tokens (`cem_...`, `ceb_...`, legacy `cek_...`), `mcp.json` files that contain them, or `~/.chat-export` contents. If a token leaks, rotate it immediately and report the exposure through the channel above.
