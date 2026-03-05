# DEPLOYMENT DOMAINS

## Назначение

Документ описывает deployment для KPI Telegram бота и локального web dashboard результатов.

## Сервисы

- `kpi-bot-backend` (NestJS)
- `postgres` (PostgreSQL)
- `kpi-results-frontend` (Vite/React CRM-only dashboard для KPI-операций и аналитики)

## Окружения

### Local

- API: `http://localhost:3000`
- Frontend CRM login: `http://localhost:5173/login`
- PostgreSQL: `localhost:666`

### Production (пример)

- API: `https://kpi-bot.internal.company`
- Frontend: `https://kpi-results.internal.company`
- PostgreSQL: managed/private instance

## Обязательные env

- `API_PORT`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `LEAD_TELEGRAM_ID`
- `CRM_SUPERVISOR_EMAIL`
- `CRM_SUPERVISOR_USERNAME`
- `CRM_SUPERVISOR_PASSWORD`
- `CRM_SUPERVISOR_NAME`
- `REPORT_OUTPUT_DIR`
- `NODE_ENV`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

## Примечания

- Telegram webhook/polling: текущая реализация использует polling через `telegraf.launch()`.
- Управляющие команды принимаются только от `LEAD_TELEGRAM_ID`.
- Сгенерированные отчеты сохраняются локально в `REPORT_OUTPUT_DIR` и отправляются руководителю в Telegram.
- Локальная БД поднимается через `backend/docker-compose.yml`.
- API включает CORS (`origin: true`, `credentials: true`) для локального запуска frontend на отдельном порту.
- CRM авторизация:
  - `POST /auth/login`
  - `POST /auth/refresh` (через httpOnly cookie)
  - `POST /auth/logout`
  - `GET /users/me` (Bearer token)
- Frontend env:
  - `VITE_API_BASE_URL` (обязательный)
- Для web dashboard доступны endpoints данных:
  - `GET /results`
  - `GET /results/statistics?months=12`
- Для кнопок на dashboard доступны action endpoints (SUPERVISOR-only):
  - `POST /results/actions/start-campaign`
  - `POST /results/actions/close-campaign`
  - `POST /results/actions/export-excel`
