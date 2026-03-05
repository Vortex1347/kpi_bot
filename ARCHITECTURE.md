# ARCHITECTURE

## Общая схема

Проект реализован как NestJS backend + Vite frontend с feature-based структурой.

## Модули

- `bot`
  - Подключение к Telegram Bot API.
  - Кнопочное меню сотрудника с логикой по `telegramId`:
    - `Регистрация` для незарегистрированного пользователя,
    - `Заполнить KPI` и `Редактировать профиль` после успешной регистрации.
  - Callback-кнопки ответов KPI.
  - После завершения анкеты: inline-кнопка `Перезаполнить анкету` доступна 10 минут.
  - Anti-double-click в callback flow: после клика inline-кнопки скрываются, повторные клики блокируются lock-механизмом.
  - Оркестрация сценария прохождения KPI-опроса.
  - Запуск Telegram не блокирует bootstrap API.
- `auth`
  - CRM login/register/refresh/logout.
  - In-memory access/refresh token sessions.
- `users`
  - Endpoint `/users/me` для auth-профиля.
  - CRUD пользователей CRM с ограничением роли SUPERVISOR.
- `employee`
  - Регистрация сотрудников (`/start`).
  - Хранение профиля: Telegram ID, ФИО, отдел, роль.
- `survey`
  - Жизненный цикл кампании KPI.
  - Статусы: `CREATED`, `ACTIVE`, `CLOSED`, `REPORT_GENERATED`.
  - Фиксация месяца оценки (`assessmentMonth`) при старте кампании.
- `evaluation`
  - Управление KPI-вопросами и ответами.
  - Сохранение ответов в реальном времени (`upsert`).
  - Ограничение перезаполнения: 10 минут после completion.
- `kpi`
  - Расчет итогового KPI по весам.
- `report`
  - Генерация Excel-отчетов (summary + персональные).
- `results`
  - API для web dashboard.
  - Требует Bearer access token.
  - Сбор ответов сотрудников в табличную модель (`GET /results`).
  - Помесячная статистика и тренды (`GET /results/statistics`).
  - Web actions для UI-кнопок:
    - старт кампании (`POST /results/actions/start-campaign`)
    - закрытие кампании (`POST /results/actions/close-campaign`)
    - экспорт Excel (`POST /results/actions/export-excel`)
- `prisma`
  - Единая точка доступа к PostgreSQL.

## Frontend модуль

- Frontend работает как единое CRM-приложение (landing-ветка удалена).
- `frontend/src/modules/results`
  - `api/resultsApi.ts` — клиент для `GET /results` и `GET /results/statistics` с `Authorization`.
  - `model/useResultsDashboard.ts` — загрузка/фильтры + обработка action-кнопок.
  - `ui/ResultsTableSection.tsx` — таблица ответов и KPI.
  - `ui/MonthlyStatisticsSection.tsx` — история KPI по месяцам и тренд сотрудников.
  - `pages/ResultsPage.tsx` — локальная страница `/results`.

## Данные

База: PostgreSQL + Prisma.

Ключевые сущности:

- `Employee`
- `Campaign`
- `CampaignParticipant`
- `KpiQuestion`
- `EvaluationResponse`

## Поток данных

1. Сотрудник регистрируется: `/start`.
2. SUPERVISOR входит в CRM (`/login` -> `/results`).
3. Руководитель запускает кампанию из CRM (`POST /results/actions/start-campaign`) и выбирает месяц KPI (`YYYY-MM`).
4. Бот отправляет сотрудникам 5 вопросов с кнопками `100/90/80/70/60 or less` (в БД `60 or less` хранится как `0`).
5. Каждый ответ сохраняется сразу в БД.
6. После completion сотрудник может нажать `Перезаполнить анкету` в течение 10 минут, ответы очищаются и опрос начинается заново.
7. Локальный web dashboard (`/results`) читает агрегированные результаты из API.
8. Dashboard показывает monthly-статистику (`/results/statistics`) по последним N месяцам.
9. Руководитель закрывает кампанию из CRM (`POST /results/actions/close-campaign`).
10. Руководитель генерирует отчеты из CRM (`POST /results/actions/export-excel`).

## Веса KPI (согласовано)

- Раздел 1: 70%
  - Q1: 49%
  - Q2: 21%
- Раздел 2: 30%
  - Q3: 18%
  - Q4: 6%
  - Q5: 6%

Итоговый KPI% = сумма `score * weight / 100` по всем 5 вопросам.

## Безопасность и доступ

- Управляющие команды доступны только `LEAD_TELEGRAM_ID` из `.env`.
- Web dashboard требует CRM-auth (Bearer access token).
- Action endpoints `/results/actions/*` доступны только `SUPERVISOR`.
- Сотрудники видят только свою переписку с ботом.
- Руководитель получает сводный и персональные отчеты.
- Web dashboard позволяет запускать/закрывать кампанию и запускать Excel-экспорт.
- Редактирование отдельных ответов через web интерфейс не поддерживается.

## Ежемесячный сбор KPI

- Название кампании при старте формируется с month-tag (`KPI Campaign YYYY-MM HH:mm`).
- Месяц кампании фиксируется в поле `assessmentMonth` из выбора в CRM (или из `/start_kpi YYYY-MM`), без выбора используется предыдущий месяц.
- Для статистики за месяц выбирается последняя кампания этого месяца.
- История в dashboard строится за настраиваемый период `1..36` месяцев.
