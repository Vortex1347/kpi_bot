# ADR 0004: Telegram-first KPI Backend

- Status: accepted
- Date: 2026-03-04

## Context

Исходный каркас содержал web-auth (JWT, refresh cookie), users CRM и frontend.
Требуемый продукт: внутренний Telegram-бот для KPI оценки сотрудников с PostgreSQL, ручным закрытием кампаний и генерацией Excel отчетов.

## Decision

1. Основной интерфейс ввода данных — Telegram Bot API (`telegraf`).
2. Для наблюдения и управления KPI-циклом добавляется отдельный web dashboard (`/results`) без редактирования ответов сотрудников.
3. Для долгосрочного мониторинга добавляется monthly-статистика (`/results/statistics`) по последним N месяцам.
4. Backend остается на NestJS; для CRM включаются модули `auth/users` в runtime.
5. Модель данных перестраивается под KPI-домен:
   - `Employee`
   - `Campaign`
   - `CampaignParticipant`
   - `KpiQuestion`
   - `EvaluationResponse`
6. Управляющие команды ограничиваются одним `LEAD_TELEGRAM_ID`.
7. Выгрузка отчетов — `.xlsx`, плюс web таблица и monthly dashboard для локального контроля.
8. Для локальной оркестрации добавляются dashboard actions:
   - запуск KPI-кампании;
   - закрытие KPI-кампании;
   - генерация Excel-отчетов.

## Consequences

Плюсы:

- Быстрый целевой delivery: Telegram для ввода + легкий CRM web-layer для управления.
- Бот остается единственным каналом заполнения опроса.
- Руководитель/наблюдатель может смотреть результаты локально через вебку без роли лидера в Telegram.
- Доступна ретроспектива KPI по месяцам и тренд по сотрудникам.
- Простая эксплуатация: бот + Postgres.
- Прозрачный домен KPI без legacy auth-обвязки.
- Управление KPI-действиями в CRM ограничено SUPERVISOR авторизацией.

Минусы:

- Web dashboard не поддерживает редактирование; правки делаются в выгруженном Excel.
- Нет webhook-режима (используется polling).
