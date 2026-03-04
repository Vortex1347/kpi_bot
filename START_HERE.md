# START HERE

Минимальный путь, чтобы поднять KPI-бот локально.

## 1. Подготовка

Требуется:

- Node.js 20+
- Docker
- Telegram bot token (создан через BotFather)
- Telegram ID руководителя

## 2. Backend

```bash
cd backend
npm install
```

## 3. PostgreSQL

```bash
npm run db:up
```

Команда использует `backend/docker-compose.yml` (PostgreSQL + persistent volume).

Проверка логов при необходимости:

```bash
npm run db:logs
```

## 4. Environment

```bash
copy .env.example .env
```

Заполните в `.env`:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `LEAD_TELEGRAM_ID`
- `REPORT_OUTPUT_DIR` (опционально, по умолчанию `reports`)
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

## 5. Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## 6. Старт

```bash
npm run start:dev
```

## 7. Проверка

- Откройте бота в Telegram и выполните `/start`.
- Как руководитель: `/start_kpi`.
- Завершите кампанию: `/close_kpi`.
- Сгенерируйте отчеты: `/generate_reports`.

Сгенерированные файлы лежат в `backend/reports/<campaign_id>/`.
