# PROJECT_CONTEXT.md

## Project Goal

Telegram bot for KPI self-evaluation of employees with:

- anonymous/separated employee chats,
- central visibility for team lead,
- PostgreSQL storage,
- automatic Excel report generation per employee + team summary.

## Architecture

Backend is implemented in `backend` using NestJS modular architecture:

- `bot` — Telegram command/callback handlers
- `employee` — registration and employee profiles
- `survey` — KPI campaign lifecycle
- `evaluation` — questions and answers
- `kpi` — KPI calculation service
- `report` — Excel generation service
- `prisma` — database access

## Tech Stack

- NestJS 10
- TypeScript
- Telegram Bot API via `telegraf`
- PostgreSQL
- Prisma ORM
- ExcelJS for `.xlsx` reports

## Database Schema

Prisma models:

- `Employee`
  - `telegramId`, `fullName`, `department`, `role`
- `Campaign`
  - `title`, `status`, `startedAt`, `closedAt`, `createdBy`
- `CampaignParticipant`
  - campaign ↔ employee participation/completion
- `KpiQuestion`
  - configurable KPI questions with weights/order
- `EvaluationResponse`
  - employee answers per campaign/question

Enums:

- `UserRole`: `LEAD`, `EMPLOYEE`
- `CampaignStatus`: `CREATED`, `ACTIVE`, `CLOSED`, `REPORT_GENERATED`

## Bot Commands

Employee:

- `/start` — register (`ФИО | Отдел`)
- `/fill_kpi` — start/continue active survey

Lead only (`LEAD_TELEGRAM_ID`):

- `/start_kpi`
- `/close_kpi`
- `/generate_reports`

## KPI Logic

5 questions, scores: `100 / 90 / 80 / 70 / 0`.

Weights:

- Section 1 = 70%:
  - Q1 49%
  - Q2 21%
- Section 2 = 30%:
  - Q3 18%
  - Q4 6%
  - Q5 6%

Final KPI% = sum(`score * weight / 100`).

Bonus calculation: disabled for now (`0` in reports).

## Selected Decisions

- Storage: PostgreSQL + Prisma
- Report format: Excel `.xlsx`
- Reminder feature: disabled
- Survey closing: manual only via `/close_kpi`
- Lead access control: single `LEAD_TELEGRAM_ID` from `.env`

## Current Progress

Completed:

- NestJS backend adapted from provided `carcas` skeleton
- New Prisma schema + initial SQL migration
- Telegram bot command flow implemented
- KPI calculation service implemented
- Excel report generation implemented
- Unit tests updated and passing
- Project docs synced

Pending:

- Optional: in-bot editing by lead
- Optional: PDF export
- Optional: Telegram e2e automation tests

## Runbook (Local)

From `backend`:

1. `npm install`
2. `npm run db:up`
3. Create `.env` from `.env.example`
4. Fill required env:
   - `TELEGRAM_BOT_TOKEN`
   - `LEAD_TELEGRAM_ID`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `POSTGRES_PORT`
   - `DATABASE_URL`
5. `npm run prisma:generate`
6. `npm run prisma:migrate`
7. `npm run db:seed`
8. `npm run start:dev`

DB runtime note:

- PostgreSQL is managed by `backend/docker-compose.yml` with persistent volume `kpi_bot_postgres_data`.
