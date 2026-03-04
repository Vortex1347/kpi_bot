# 0002 — JWT Access + Refresh Cookie

- Status: accepted
- Date: 2026-02-26
- Updated: 2026-02-27

## Context
Нужно безопасное и удобное API-авторизованное взаимодействие для SPA с поддержкой auto-refresh сессии.

## Decision
- Access token передается через `Authorization: Bearer`.
- Refresh token хранится в `httpOnly` cookie (`refresh_token`, path `/auth`).
- Эндпоинты: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`.

## Consequences
Плюсы:
- снижает риск кражи refresh-токена из JS runtime;
- удобно делать silent refresh.

Риски:
- нужно корректно настраивать CORS/credentials/cookie policy;
- обязательно разделять и ротацировать секреты в production.
