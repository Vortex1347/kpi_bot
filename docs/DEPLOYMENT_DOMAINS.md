# DEPLOYMENT DOMAINS

## Назначение

Документ описывает deployment для backend-сервиса KPI Telegram бота.

## Сервисы

- `kpi-bot-backend` (NestJS)
- `postgres` (PostgreSQL)

## Окружения

### Local

- API: `http://localhost:3000`
- PostgreSQL: `localhost:666`

### Production (пример)

- API: `https://kpi-bot.internal.company`
- PostgreSQL: managed/private instance

## Обязательные env

- `API_PORT`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `LEAD_TELEGRAM_ID`
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
