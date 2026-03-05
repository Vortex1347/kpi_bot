# KPI Bot Design System

## 1. Design Principles
- `Clarity over decoration`: интерфейсы читаются за 1-2 секунды, без визуального шума.
- `Industrial consistency`: одинаковые правила в admin, CRM, SaaS и landing.
- `Comfortable density`: приоритет читабельности, воздуха и снижения когнитивной нагрузки.
- `State-driven UI`: каждое действие и статус явно видимы (loading, success, error, empty).
- `Scalable by tokens`: любое визуальное решение задается токенами, а не ручными стилями.
- `Accessible by default`: контраст, фокус, клавиатура и ARIA закладываются в базовые компоненты.

## 2. Brand Direction
KPI Bot визуально позиционируется как технологичный и надежный B2B/edu-партнер: спокойная индустриальная база, темный интерфейс по умолчанию, teal-акценты для действий и статусов прогресса, минимум декоративности, максимум структурной ясности.

## 3. Color System
### Primary (Teal)
- `primary-50: #E8FCF8`
- `primary-100: #CCF8F0`
- `primary-200: #99F0E1`
- `primary-300: #66E8D2`
- `primary-400: #33DCC2`
- `primary-500: #12C7AE` (base action)
- `primary-600: #0FA892` (hover)
- `primary-700: #0C8775` (active)
- `primary-800: #0A6659`
- `primary-900: #07473F`

### Neutral Palette (Dark-first)
- `neutral-0: #FFFFFF`
- `neutral-50: #F5F7F8`
- `neutral-100: #E8ECEE`
- `neutral-200: #D0D8DC`
- `neutral-300: #A8B4BC`
- `neutral-400: #7E8C97`
- `neutral-500: #5C6974`
- `neutral-600: #444F59`
- `neutral-700: #2F3740`
- `neutral-800: #1F252C`
- `neutral-900: #14191F`
- `neutral-950: #0D1116` (app background default)

### Semantic
- `success: #22C55E`
- `warning: #F59E0B`
- `error: #EF4444`
- `info: #38BDF8`

### Usage Rules
- Primary используется только для `CTA`, активных состояний, выбранных элементов навигации и прогресса.
- Neutral-палитра формирует 80-90% интерфейса.
- Semantic-цвета только для статусов, validation и alerts.
- Не использовать одновременно >2 акцентных цветов в одном блоке.

### Light/Dark
- Основной режим: `dark`.
- Light поддерживается через те же semantic tokens (`--bg`, `--surface`, `--text`, `--border`, `--primary`).
- Компоненты не хардкодят hex; только semantic CSS vars.

## 4. Typography
### Fonts (open-source)
- `UI/Brand`: `Manrope`
- `Data/Long text fallback`: `Inter` (fallback only)
- `Monospace`: `JetBrains Mono`

### Type Scale
- `display-1`: 48/56, 700
- `display-2`: 40/48, 700
- `h1`: 32/40, 700
- `h2`: 28/36, 700
- `h3`: 24/32, 600
- `h4`: 20/28, 600
- `body-lg`: 18/28, 400
- `body-md`: 16/24, 400
- `body-sm`: 14/20, 400
- `caption`: 12/16, 500

### Hierarchy Rules
- Одна страница: максимум 1 `h1`, 2 уровня заголовков по умолчанию.
- Таблицы и формы используют `body-sm/body-md`.
- Landing допускает `display-*`, CRM/dashboard нет.

## 5. Spacing System
- База: `4px`
- Основной ритм: `8px`
- Шкала: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`
- Для комфортной плотности:
- поля формы: `12-16px`
- card padding: `16-24px`
- секции страницы: `24-40px`

## 6. Radius, Shadow, Elevation
- `radius-xs: 4px`
- `radius-sm: 8px`
- `radius-md: 12px` (default components)
- `radius-lg: 16px`
- `radius-xl: 24px`
- `shadow-0`: none
- `shadow-1`: `0 1px 2px rgba(0,0,0,0.24)`
- `shadow-2`: `0 8px 24px rgba(0,0,0,0.28)`
- `shadow-3`: `0 16px 40px rgba(0,0,0,0.32)`
- Elevation:
- base surfaces: `shadow-0`
- dropdown/popover: `shadow-2`
- modal/drawer: `shadow-3`

## 7. Layout System
### Containers
- `landing`: max `1200px`
- `dashboard/crm`: max `1440px`
- `form pages`: max `720px`

### Grid
- Desktop: 12 columns, gutter 24
- Tablet: 8 columns, gutter 16
- Mobile: 4 columns, gutter 12

### Page Structures
- Dashboard: `topbar + sidebar + content + utility panel(optional)`
- Form page: `header + section cards + sticky actions`
- Table page: `filters + table + pagination + side details(optional)`
- Landing: `hero + value blocks + proof + CTA`

## 8. Component System
### Core Components
- `Button`: variants `primary/secondary/ghost/danger`, sizes `sm/md/lg`, icon-left/right.
- `Input`: label, hint, helper/error text, prefix/suffix, clear action.
- `Select`: searchable/non-searchable, single/multi.
- `Table`: sticky header, sortable cols, row actions, bulk select.
- `Card`: title/meta/actions/content/footer slots.
- `Modal/Drawer`: destructive-safe pattern, explicit close actions.
- `Toast`: success/error/info/warning, auto-dismiss + manual dismiss.
- `Navigation`: sidebar (module-level), topbar (global actions + profile).
- `Empty State`: icon/title/text/CTA.
- `Loading State`: skeleton for cards/tables/forms.
- `Error State`: inline and page-level recoverable errors.

## 9. Component State Rules
- `hover`: subtle contrast shift (+6-8%).
- `active`: darker surface or pressed elevation.
- `disabled`: reduced contrast + no shadow + `not-allowed`.
- `loading`: interaction locked, progress visible.
- `focus`: always visible ring (`2px`, primary-400), WCAG-compliant.

## 10. UX Patterns
- Forms:
- label всегда сверху
- обязательность через текст, не только цвет
- inline validation + summary для больших форм
- Tables:
- фильтры сверху
- пагинация и размер страницы всегда внизу справа
- row actions grouped in kebab for dense contexts
- CRUD:
- create/edit in drawer for speed
- full-page only for complex multi-step forms
- Delete:
- всегда подтверждение
- для критичных действий требовать ввод имени объекта
- Notifications:
- success toast до 4 сек
- error toast + action “повторить”

## 11. Accessibility
- Контраст: минимум WCAG AA (`4.5:1` для обычного текста, `3:1` для крупного).
- Полная клавиатурная навигация для всех интерактивных элементов.
- ARIA-подход:
- `aria-invalid`, `aria-describedby` для форм
- `role="dialog"` + trap focus для modal
- `aria-live="polite"` для toast/feedback
- Не полагаться только на цвет для состояния.

## 12. Scaling Rules
- Новые компоненты добавляются только после проверки:
- есть ли composition из текущих
- есть ли повторяемый use-case минимум в 2 продуктах
- Naming convention:
- tokens: `--ks-{category}-{name}-{step}`
- components: `Ks{Component}`
- variants: `variant`, `size`, `state`
- Versioning:
- `design-system@major.minor.patch`
- breaking changes только в major.

## 13. Design Tokens
### CSS Variables (base)
```css
:root {
  --ks-color-bg: #0d1116;
  --ks-color-surface: #14191f;
  --ks-color-surface-2: #1f252c;
  --ks-color-border: #2f3740;
  --ks-color-text: #e8ecee;
  --ks-color-text-muted: #a8b4bc;
  --ks-color-primary: #12c7ae;
  --ks-color-primary-hover: #0fa892;
  --ks-color-primary-active: #0c8775;
  --ks-color-success: #22c55e;
  --ks-color-warning: #f59e0b;
  --ks-color-error: #ef4444;
  --ks-color-info: #38bdf8;

  --ks-space-1: 4px;
  --ks-space-2: 8px;
  --ks-space-3: 12px;
  --ks-space-4: 16px;
  --ks-space-5: 20px;
  --ks-space-6: 24px;
  --ks-space-8: 32px;
  --ks-space-10: 40px;

  --ks-font-family-ui: "Manrope", "Inter", sans-serif;
  --ks-font-family-mono: "JetBrains Mono", monospace;
  --ks-font-size-body-md: 16px;
  --ks-line-height-body-md: 24px;
  --ks-font-size-body-sm: 14px;
  --ks-line-height-body-sm: 20px;
  --ks-font-size-h3: 24px;
  --ks-line-height-h3: 32px;

  --ks-radius-sm: 8px;
  --ks-radius-md: 12px;
  --ks-radius-lg: 16px;
}
```

### Tailwind Mapping (example)
```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      bg: "var(--ks-color-bg)",
      surface: "var(--ks-color-surface)",
      border: "var(--ks-color-border)",
      text: "var(--ks-color-text)",
      primary: "var(--ks-color-primary)",
      success: "var(--ks-color-success)",
      warning: "var(--ks-color-warning)",
      error: "var(--ks-color-error)",
      info: "var(--ks-color-info)"
    },
    borderRadius: {
      sm: "var(--ks-radius-sm)",
      md: "var(--ks-radius-md)",
      lg: "var(--ks-radius-lg)"
    },
    fontFamily: {
      sans: ["var(--ks-font-family-ui)"],
      mono: ["var(--ks-font-family-mono)"]
    }
  }
}
```

## 14. UI Manifest
KPI Bot — это строгая, технологичная и спокойная система интерфейсов, где визуальная дисциплина повышает скорость работы команд, доверие B2B-клиентов и предсказуемость продукта: каждый экран выглядит современно, работает одинаково в любых модулях и масштабируется без визуального хаоса.
