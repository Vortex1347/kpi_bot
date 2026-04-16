# KPI Telegram Bot (NestJS)

Внутренний инструмент для KPI-оценки сотрудников через Telegram.

## Что реализовано

- Backend на NestJS + TypeScript.
- Telegram Bot API (через `telegraf`).
- Пошаговая регистрация сотрудника в боте: `/start` -> ФИО -> Отдел.
- Жизненный цикл KPI-кампании:
  - `/start_kpi`
  - `/close_kpi`
  - `/generate_reports`
- KPI-анкета из 5 вопросов с вариантами оценки: `100 / 90 / 80 / 70 / 60 or less` (внутреннее значение `0`).
- Весовая модель KPI:
  - Раздел 1 = 70% (внутри 70/30)
  - Раздел 2 = 30% (внутри 60/20/20)
- Сохранение в PostgreSQL через Prisma.
- CRM-auth для вебки (`/auth/login`, `/auth/refresh`, `/users/me`) с ролью `SUPERVISOR`.
- Frontend работает в CRM-only режиме (без отдельного landing-приложения).
- Генерация Excel-отчетов:
  - `kpi_summary.xlsx`
  - отдельный `.xlsx` на каждого сотрудника.
- Локальный web dashboard (`/results`) для просмотра ответов сотрудников, фильтрации по месяцам и действий руководителя.
- Помесячная статистика KPI (`/results/statistics`) с динамикой по сотрудникам.

## Структура

- `backend/` — основной backend-сервис (NestJS + Prisma + Telegram bot).
- `frontend/` — web-экран для локального просмотра результатов (`/results`).
- `docs/` — проектная документация, декомпозиция, OpenAPI, ADR.

## Быстрый запуск

1. Установите backend-зависимости:

```bash
cd backend
npm install
```

2. Поднимите PostgreSQL:

```bash
npm run db:up
```

Используется файл `backend/docker-compose.yml`, отдельный compose-проект `kpi-bot-backend` и постоянный volume `kpi_bot_postgres_data`.

Если на `POSTGRES_PORT` уже висит Postgres из другого репозитория, сначала освободите порт или поменяйте `POSTGRES_PORT` в `backend/.env`. Если текущий volume этого проекта был создан со старыми `POSTGRES_*`, пересоздайте только его:

```bash
docker compose -p kpi-bot-backend down -v
npm run db:up
```

3. Создайте `.env` из примера и заполните:

```bash
cp .env.example .env
```

Обязательные переменные:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `LEAD_TELEGRAM_ID`
- `CRM_SUPERVISOR_EMAIL`
- `CRM_SUPERVISOR_USERNAME`
- `CRM_SUPERVISOR_PASSWORD`

Для docker-compose также заполните:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

4. Примените миграции и заполните вопросы KPI:

```bash
npm run prisma:migrate
npm run db:seed
```

5. Запустите backend:

```bash
npm run start:dev
```

Если видите ошибку Prisma вида `role "kpi_user" does not exist` или `provided database credentials ... are not valid`, это почти всегда означает, что backend подключился не к той локальной базе или к старому volume с другой инициализацией.

6. Установите frontend-зависимости:

```bash
cd ../frontend
npm install
```

7. Запустите frontend:

```bash
npm run dev
```

8. Откройте CRM login:

- `http://localhost:5173/login`
- После входа откроется `/results`.

## Команды бота

Для сотрудника:

- `/start` — открыть меню и пройти пошаговую регистрацию.
- Кнопка `Регистрация` показывается только незарегистрированному пользователю (по `telegramId`).
- После успешной регистрации доступны кнопки `Заполнить KPI` и `Редактировать профиль`.
- Кнопка `Редактировать профиль` позволяет сотруднику обновить ФИО и отдел прямо в Telegram.
- После завершения анкеты появляется кнопка `Перезаполнить анкету` на 10 минут (с очисткой ответов и повторным прохождением).
- После выбора ответа inline-кнопки текущего вопроса сразу скрываются, и бот отправляет следующий вопрос.
- После нажатия `Перезаполнить анкету` кнопка также скрывается, чтобы избежать повторного запуска.
- `/fill_kpi` — поддерживается как резервная команда.

Для руководителя (`LEAD_TELEGRAM_ID`):

- Предпочтительный путь: CRM-кнопки `Старт KPI`, `Закрыть KPI`, `Экспорт в Excel`.
- При старте KPI в CRM выбирается месяц периода (`YYYY-MM`), и результаты фиксируются за выбранный месяц.
- Команды `/start_kpi`, `/close_kpi`, `/generate_reports` остаются как fallback.
- Для fallback-команды можно указать месяц: `/start_kpi 2026-02`.

## Web dashboard

- Бот остается опросником: сотрудники отвечают только в Telegram.
- Вебка используется для локального контроля результатов и запуска/закрытия KPI цикла.
- Доступ к `/results` только после CRM-входа.
- Старт/закрытие/экспорт доступны только пользователю с ролью `SUPERVISOR`.
- API для таблицы: `GET /results` (последняя кампания) или `GET /results?campaignId=<uuid>`.
- API для статистики: `GET /results/statistics?months=12` (1..36 месяцев, по умолчанию 12).
- API для action-кнопок:
  - `POST /results/actions/start-campaign` — запуск KPI-кампании из CRM.
  - `POST /results/actions/close-campaign` — закрытие активной KPI-кампании из CRM.
  - `POST /results/actions/export-excel` — генерация Excel-отчетов из CRM.
- CRM auth endpoints:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /users/me`

### Дефолтный локальный SUPERVISOR

- `identifier`: `dev_supervisor`
- `password`: `dev_password_change_me`

## Кнопки на фронте

На странице `/results` есть блок "Действия":
- Кнопки руководителя:
  - `Старт KPI`
  - `Закрыть KPI`
  - `Экспорт в Excel`

## Ежемесячный KPI цикл

1. В начале месяца руководитель запускает новую кампанию кнопкой `Старт KPI` в CRM.
2. Сотрудники проходят опрос в Telegram.
3. Веб-дашборд показывает текущие ответы (`/results`) и историю по месяцам (`/results/statistics`).
4. После закрытия (кнопка `Закрыть KPI` в CRM) месяц фиксируется в истории KPI.

## Ограничения текущей версии

- Напоминания отключены (по вашему решению).
- Бонус KPI не рассчитывается (в отчете поле `KPI Bonus = 0`).
- Редактирование ответов руководителем только после выгрузки в Excel.
