# KPI Telegram Bot (NestJS)

Внутренний инструмент для KPI-оценки сотрудников через Telegram.

## Что реализовано

- Backend на NestJS + TypeScript.
- Telegram Bot API (через `telegraf`).
- Регистрация сотрудника в боте: `/start` + `ФИО | Отдел`.
- Жизненный цикл KPI-кампании:
  - `/start_kpi`
  - `/close_kpi`
  - `/generate_reports`
- KPI-анкета из 5 вопросов с вариантами оценки: `100 / 90 / 80 / 70 / 0`.
- Весовая модель KPI:
  - Раздел 1 = 70% (внутри 70/30)
  - Раздел 2 = 30% (внутри 60/20/20)
- Сохранение в PostgreSQL через Prisma.
- Генерация Excel-отчетов:
  - `kpi_summary.xlsx`
  - отдельный `.xlsx` на каждого сотрудника.

## Структура

- `backend/` — основной backend-сервис (NestJS + Prisma + Telegram bot).
- `docs/` — проектная документация, декомпозиция, OpenAPI, ADR.

## Быстрый запуск

1. Перейдите в backend:

```bash
cd backend
```

2. Установите зависимости:

```bash
npm install
```

3. Поднимите PostgreSQL:

```bash
npm run db:up
```

Используется файл `backend/docker-compose.yml` и постоянный volume `kpi_bot_postgres_data`.

4. Создайте `.env` из примера и заполните:

```bash
copy .env.example .env
```

Обязательные переменные:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `LEAD_TELEGRAM_ID`

Для docker-compose также заполните:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

5. Примените миграции и заполните вопросы KPI:

```bash
npm run prisma:migrate
npm run db:seed
```

6. Запустите backend:

```bash
npm run start:dev
```

## Команды бота

Для сотрудника:

- `/start` — регистрация в формате `ФИО | Отдел`.
- `/fill_kpi` — начать/продолжить текущий активный опрос.

Для руководителя (`LEAD_TELEGRAM_ID`):

- `/start_kpi` — запустить кампанию и отправить формы сотрудникам.
- `/close_kpi` — закрыть активную кампанию.
- `/generate_reports` — сгенерировать и отправить Excel-отчеты.

## Ограничения текущей версии

- Напоминания отключены (по вашему решению).
- Бонус KPI не рассчитывается (в отчете поле `KPI Bonus = 0`).
- Редактирование ответов руководителем только после выгрузки в Excel.
