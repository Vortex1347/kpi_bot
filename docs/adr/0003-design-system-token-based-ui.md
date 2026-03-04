# 0003 — Token-Based UI Design System

- Status: accepted
- Date: 2026-02-26

## Context
Нужен единый визуальный язык для landing + CRM + SaaS dashboard без хаотичных UI-решений.

## Decision
- Ввести токены и semantic-классы (цвета, spacing, radius, shadows).
- Использовать переиспользуемые shared-компоненты (`Button`, `Input`, `Card`, `Table`, `EmptyState`, `ErrorState`, `LoadingState`).
- Документация: `DESIGN_SYSTEM.md` + `UI_GUIDELINES.md`.

## Consequences
Плюсы:
- визуальная консистентность;
- ускорение разработки новых экранов.

Минусы:
- любые изменения токенов требуют регрессионного визуального контроля.
