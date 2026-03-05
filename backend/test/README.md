# Backend Tests

Текущий набор тестов ориентирован на ядро KPI-бота.

## Запуск

```bash
npm test
```

## Структура

- `test/unit/health` — проверки liveness/readiness.
- `test/unit/kpi` — расчет KPI по весовой модели.
- `test/unit/evaluation` — поведение анкеты:
  - окно перезаполнения 10 минут после completion
  - reset ответов при перезаполнении
  - запрет прямого изменения completed-анкеты без перезаполнения
  - защита callback flow от некорректных повторных изменений ответов
- `test/unit/results` — агрегированная выдача таблицы результатов (`GET /results`).
  - monthly-статистика и тренды (`GET /results/statistics`).
  - action-сценарии для UI-кнопок:
    - `/results/actions/start-campaign` (включая работу с месяцем кампании `assessmentMonth`)
    - `/results/actions/close-campaign`
    - `/results/actions/export-excel`
- `test/helpers` — моки для Prisma.

## Примечание

Auth/users runtime возвращен для CRM-login и роли SUPERVISOR, но unit-тесты для этих контроллеров пока не добавлены.
