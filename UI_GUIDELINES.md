# UI Guidelines (Keysoft Junior)

## Scope
- This guide is for `frontend` implementation of the design system in `DESIGN_SYSTEM.md`.
- Base mode is dark; light mode is optional via `[data-theme="light"]`.
- All new UI should use semantic tokens and shared components, not ad-hoc colors.

## Source Of Truth
- Tailwind semantic mapping: `frontend/tailwind.config.js`
- CSS variables: `frontend/src/styles/tailwind.css`
- Shared tokens/classes: `frontend/src/shared/design/tokens.ts`
- Base UI components: `frontend/src/shared/ui/*`

## Mandatory Rules
- Use semantic classes: `bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`.
- Use component states explicitly: `hover`, `active`, `disabled`, `loading`, `focus-visible`.
- Focus ring is required on all interactive controls (`ksClasses.focusRing`).
- Alerts and validation use semantic colors only: `success`, `warning`, `error`, `info`.
- Do not hardcode hex/rgb values inside React components.

## Layout Patterns
- App shell: `ksClasses.page` + `ksClasses.appContainer`.
- Auth pages: `ksClasses.page` + `ksClasses.authContainer`.
- Panel/card blocks: `ksClasses.card`.
- Error feedback: `ksClasses.errorAlert`.

## Components Usage
- `Button`: variants `primary|secondary|ghost|danger`, sizes `sm|md|lg`, `isLoading` for async actions.
- `Input`/`Select`: use with `FormField` (label + hint + error context).
- `Card`: reusable surface wrapper (`as` supports `div|form|article`).
- `Table`: use `TableContainer` + `DataTable*` primitives for CRM lists.
- `ErrorState`: inline alert with semantic error styling.
- `LoadingState`: non-blocking loading text with `role="status"`.
- `EmptyState`: title/description/action pattern for empty data sets.
- `Layout`: global topbar/profile/footer shell.
- `AuthLayout`: auth-only screen container.

## CRUD UX Pattern
- Form labels are always visible (not placeholder-only).
- Deletion requires confirmation.
- Table empty state is explicit text + optional CTA.
- Server errors should be shown inline near action context.

## Accessibility Checklist
- Text contrast must meet WCAG AA.
- Keyboard reachable controls with visible focus.
- Form controls should expose `aria-invalid` and `aria-describedby` when error text exists.
- Toasts/alerts should use `aria-live="polite"` for non-blocking updates.

## Naming Convention
- CSS vars: `--ks-{category}-{name}-{step}`
- Shared constants: `ksTokens` and `ksClasses`
- New components: `frontend/src/shared/ui/{Component}.tsx`
- Component variants: `variant`, `size`, `state`, `isLoading`

## Change Process
1. Add or update tokens in CSS variables + Tailwind mapping.
2. Reuse existing shared component where possible.
3. Add/extend component variants only for repeated use-cases.
4. Run `npm run lint` and `npm run build` in `frontend`.
