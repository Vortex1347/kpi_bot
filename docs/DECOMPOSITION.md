# DECOMPOSITION

## Backend scope (`backend/`)

### 1. Bot layer

- `src/modules/bot`
- Ответственность:
  - Telegram lifecycle
  - команды `/start`, `/fill_kpi`, `/start_kpi`, `/close_kpi`, `/generate_reports`
  - обработка callback-кнопок KPI

### 2. Employee layer

- `src/modules/employee`
- Ответственность:
  - регистрация/обновление сотрудника по Telegram ID
  - выдача списка сотрудников для кампании и отчетов

### 3. Survey layer

- `src/modules/survey`
- Ответственность:
  - запуск/закрытие кампании
  - контроль статусов `CREATED/ACTIVE/CLOSED/REPORT_GENERATED`
  - фиксация участников кампании

### 4. Evaluation layer

- `src/modules/evaluation`
- Ответственность:
  - хранение KPI-вопросов
  - сохранение ответов (upsert)
  - получение следующего неотвеченного вопроса

### 5. KPI calculation layer

- `src/modules/kpi`
- Ответственность:
  - расчет KPI% с учетом весов
  - section breakdown (`SECTION_1`, `SECTION_2`)

### 6. Reporting layer

- `src/modules/report`
- Ответственность:
  - генерация `kpi_summary.xlsx`
  - генерация файла на каждого сотрудника

### 7. Storage layer

- `src/prisma`
- PrismaClient + подключение к PostgreSQL

## Сценарий выполнения

1. Регистрация сотрудников.
2. Запуск кампании руководителем.
3. Сбор ответов в БД.
4. Закрытие кампании руководителем.
5. Генерация Excel-отчетов.
