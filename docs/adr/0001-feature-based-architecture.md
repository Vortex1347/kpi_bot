# 0001 — Feature-Based Architecture

- Status: accepted
- Date: 2026-02-26

## Context
Проект — каркас для разных продуктов (CRM, micro-SaaS, landing), где критичны масштабируемость и быстрый онбординг новых разработчиков/AI-агентов.

## Decision
Использовать feature-based подход:
- backend: доменные модули в `backend/src/modules/*`;
- frontend: доменные модули в `frontend/src/modules/*`;
- общий код только в `shared` (frontend) или инфраструктурных слоях (backend).

## Consequences
Плюсы:
- легче добавлять новые фичи без каскадных изменений;
- проще тестировать и ревьюить изменения по домену.

Минусы:
- нужны дисциплина границ модулей и регулярный рефакторинг shared-слоя.
