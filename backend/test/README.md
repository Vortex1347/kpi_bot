# Backend Tests

Текущий набор тестов ориентирован на ядро KPI-бота.

## Запуск

```bash
npm test
```

## Структура

- `test/unit/health` — проверки liveness/readiness.
- `test/unit/kpi` — расчет KPI по весовой модели.
- `test/helpers` — моки для Prisma.

## Примечание

Старые auth/users тесты из каркаса удалены, так как проект переориентирован на Telegram KPI bot.
