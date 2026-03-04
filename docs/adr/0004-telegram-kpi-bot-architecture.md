# ADR 0004: Telegram-first KPI Backend

- Status: accepted
- Date: 2026-03-04

## Context

Исходный каркас содержал web-auth (JWT, refresh cookie), users CRM и frontend.
Требуемый продукт: внутренний Telegram-бот для KPI оценки сотрудников с PostgreSQL, ручным закрытием кампаний и генерацией Excel отчетов.

## Decision

1. Основной интерфейс системы — Telegram Bot API (`telegraf`), а не web UI.
2. Backend остается на NestJS, но удаляются модули `auth/users` из runtime.
3. Модель данных перестраивается под KPI-домен:
   - `Employee`
   - `Campaign`
   - `CampaignParticipant`
   - `KpiQuestion`
   - `EvaluationResponse`
4. Управляющие команды ограничиваются одним `LEAD_TELEGRAM_ID`.
5. Выгрузка отчетов — только `.xlsx` на текущем этапе.

## Consequences

Плюсы:

- Быстрый целевой delivery без лишнего web-слоя.
- Простая эксплуатация: бот + Postgres.
- Прозрачный домен KPI без legacy auth-обвязки.

Минусы:

- Нет web-интерфейса редактирования; правки делаются в выгруженном Excel.
- Нет webhook-режима (используется polling).
