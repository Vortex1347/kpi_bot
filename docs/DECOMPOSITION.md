# DECOMPOSITION

## Backend scope (`backend/`)

### 1. Bot layer

- `src/modules/bot`
- Ответственность:
  - Telegram lifecycle
  - команда `/start` + кнопочное меню сотрудника по `telegramId`:
    - `Регистрация` для незарегистрированного,
    - `Заполнить KPI` и `Редактировать профиль` для зарегистрированного
  - inline-кнопка `Перезаполнить анкету` на 10 минут после completion
  - anti-double-click для callback-кнопок (скрытие клавиатуры + lock на повторный клик)
  - команды лидера остаются как fallback (`/start_kpi`, `/close_kpi`, `/generate_reports`)
  - обработка callback-кнопок KPI
  - запуск Telegram non-blocking для стабильного старта API

### 2. Auth layer

- `src/modules/auth`
- Ответственность:
  - login/register/refresh/logout для CRM
  - выдача access token + refresh cookie
  - проверка Bearer token и роли SUPERVISOR

### 3. Users layer

- `src/modules/users`
- Ответственность:
  - endpoint `/users/me`
  - CRUD пользователей CRM (SUPERVISOR-only)

### 4. Employee layer

- `src/modules/employee`
- Ответственность:
  - регистрация/обновление сотрудника по Telegram ID
  - выдача списка сотрудников для кампании и отчетов

### 5. Survey layer

- `src/modules/survey`
- Ответственность:
  - запуск/закрытие кампании
  - контроль статусов `CREATED/ACTIVE/CLOSED/REPORT_GENERATED`
  - фиксация `assessmentMonth` (период KPI) при запуске кампании
  - фиксация участников кампании

### 6. Evaluation layer

- `src/modules/evaluation`
- Ответственность:
  - хранение KPI-вопросов
  - сохранение ответов (upsert)
  - получение следующего неотвеченного вопроса
  - reset ответов при перезаполнении анкеты
  - контроль окна перезаполнения (10 минут после completion)

### 7. KPI calculation layer

- `src/modules/kpi`
- Ответственность:
  - расчет KPI% с учетом весов
  - section breakdown (`SECTION_1`, `SECTION_2`)

### 8. Reporting layer

- `src/modules/report`
- Ответственность:
  - генерация `kpi_summary.xlsx`
  - генерация файла на каждого сотрудника

### 9. Storage layer

- `src/prisma`
- PrismaClient + подключение к PostgreSQL

### 10. Results API layer

- `src/modules/results`
- Ответственность:
  - выдача ответов сотрудников в формате таблицы
  - требование Bearer access token на all endpoints
  - расчет KPI по каждой строке для web dashboard
  - выбор последней кампании или явного `campaignId` из query
  - построение monthly KPI-статистики (`/results/statistics?months=...`)
  - расчет тренда сотрудника между последними месяцами
  - web actions:
    - запуск кампании (`/results/actions/start-campaign`, optional `monthKey: YYYY-MM`)
    - закрытие кампании (`/results/actions/close-campaign`)
    - экспорт Excel (`/results/actions/export-excel`)

## Frontend scope (`frontend/`)

### 1. Results feature

- Frontend работает как CRM-only приложение (landing-ветка удалена).
- `src/modules/results`
- Ответственность:
  - загрузка данных из `GET /results`
  - фильтр по `campaignId`
  - загрузка monthly-статистики из `GET /results/statistics`
  - фильтр периода истории (`1..36` месяцев)
  - фильтр таблицы по месяцу
  - кнопки лидера в CRM: старт/закрытие кампании и экспорт Excel (только SUPERVISOR)
  - выбор месяца KPI (`type="month"`) перед стартом кампании
  - отображение таблицы: сотрудник, отдел, Q1..Q5, KPI%
  - отображение таблиц: статистика по месяцам + динамика сотрудников

## Сценарий выполнения

1. SUPERVISOR входит в CRM.
2. Регистрация сотрудников в Telegram.
3. Запуск кампании руководителем.
4. Сбор ответов в БД.
5. Локальный просмотр результатов в web dashboard (`/results`).
6. Локальный просмотр monthly-динамики KPI (`/results/statistics`).
7. Закрытие кампании руководителем.
8. Генерация Excel-отчетов.
