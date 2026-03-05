# START HERE

Минимальный путь, чтобы поднять KPI-бот и локальный dashboard результатов.

## 1. Подготовка

Требуется:

- Node.js 20+
- Docker
- Telegram bot token (создан через BotFather)
- Telegram ID руководителя

## 2. Backend

```bash
cd backend
npm install
```

## 3. PostgreSQL

```bash
npm run db:up
```

Команда использует `backend/docker-compose.yml` (PostgreSQL + persistent volume).

Проверка логов при необходимости:

```bash
npm run db:logs
```

## 4. Environment

```bash
cp .env.example .env
```

Заполните в `.env`:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `LEAD_TELEGRAM_ID`
- `CRM_SUPERVISOR_EMAIL`
- `CRM_SUPERVISOR_USERNAME`
- `CRM_SUPERVISOR_PASSWORD`
- `CRM_SUPERVISOR_NAME` (опционально)
- `REPORT_OUTPUT_DIR` (опционально, по умолчанию `reports`)
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

## 5. Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## 6. Старт backend

```bash
npm run start:dev
```

## 7. Frontend dashboard

```bash
cd ../frontend
npm install
npm run dev
```

Откройте: `http://localhost:5173/login`
Локальные дефолтные креды (если не переопределяли env):
- `identifier`: `dev_supervisor`
- `password`: `dev_password_change_me`

После входа откроется `http://localhost:5173/results`.
Для динамики по месяцам используйте период на этой же странице (бэкенд `GET /results/statistics`).

## 8. Проверка

1. Откройте бота в Telegram и выполните `/start`.
2. Незарегистрированный сотрудник видит кнопку `Регистрация`, проходит шаги (ФИО, затем отдел), после чего доступны кнопки `Заполнить KPI` и `Редактировать профиль`.
3. Откройте `http://localhost:5173/login` и войдите как SUPERVISOR.
4. Перейдите в `http://localhost:5173/results`.
5. В блоке "Действия руководителя" выберите месяц KPI (`YYYY-MM`) и нажмите `Старт KPI`.
6. Сотрудники отвечают на 5 вопросов в Telegram через кнопки.
   - после выбора оценки кнопки текущего вопроса скрываются, затем приходит следующий вопрос.
7. В Telegram для оценки `0` отображается вариант `60 or less`.
8. При необходимости сотрудник может нажать кнопку `Редактировать профиль` и обновить ФИО/отдел.
9. После завершения анкеты в Telegram появляется кнопка `Перезаполнить анкету` на 10 минут.
   - после нажатия кнопка скрывается и анкета стартует заново.
10. В блоке "Действия":
   - при необходимости закройте кампанию кнопкой `Закрыть KPI`,
   - выгрузите файлы кнопкой `Экспорт в Excel`.

Сгенерированные `.xlsx` файлы лежат в `backend/reports/<campaign_id>/`.

## 9. Ежемесячный режим

Рекомендуемый ритм:
1. 1 раз в месяц запускать новую кампанию кнопкой `Старт KPI` в CRM.
2. После завершения месяца закрывать кампанию кнопкой `Закрыть KPI`.
3. Следить за трендом KPI на `/results` через блок "Статистика по месяцам".
