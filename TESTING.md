# TESTING

## Backend test stack

- Unit tests: `vitest`
- Type check/build: `tsc`

## Команды

```bash
cd backend
npm run build
npm test
```

## Текущий набор unit-тестов

- `health.service`:
  - liveness response
  - readiness success
  - readiness db-failure
- `kpi.service`:
  - расчет KPI по весам с учетом неотвеченных вопросов

## Manual smoke (Telegram)

1. Сотрудник отправляет `/start` и регистрируется как `ФИО | Отдел`.
2. Руководитель отправляет `/start_kpi`.
3. Сотрудник отвечает на 5 вопросов кнопками.
4. Руководитель отправляет `/close_kpi`.
5. Руководитель отправляет `/generate_reports` и получает `.xlsx` файлы.

## Что не покрыто автотестами пока

- e2e сценарий с реальным Telegram API
- генерация Excel-файлов в интеграционном тесте
- отказоустойчивость при недоступности Telegram
