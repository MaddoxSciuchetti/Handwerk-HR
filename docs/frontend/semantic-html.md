# Semantic HTML and accessibility

Project standard for markup in `client/`: use real HTML roles and labels, and make custom click targets keyboard-reachable.

## Landmarks and shared UI

| Pattern | Where |
| --- | --- |
| Page landmarks | `Layout` — `<header>` + `<main>`; side panels — `<aside>` (`SidebarAside`) |
| Navigation | Breadcrumb — `<nav aria-label="breadcrumb">` with `<ol>` / `<li>` |
| Icon-only controls | `aria-label` + `sr-only` text (sidebar toggle, Sheet/Dialog close) |
| Mobile sheet title | Sidebar sheet keeps `SheetTitle` / `SheetDescription` in `sr-only` |
| Forms | `Label` / `<label>` paired with `htmlFor` / `id` (`FormFields`, questionnaire) |
| Loaders | `role="status"` + `sr-only` (table / PDF skeletons) |
| Dialogs / menus | Radix Dialog, Sheet, Dropdown (focus trap, Escape, labelled titles) |

Questionnaire UI follows the same habits (`section` + `aria-label`, `aria-invalid`, `aria-pressed`).

## Clickable table rows (everywhere)

A row that opens something on click is also focusable and activatable with the keyboard. Shared helper: `client/src/lib/accessible-table-row.ts`.

On every such `TableRow`:

- `tabIndex={0}`
- `aria-label="… öffnen"` (or equivalent)
- `onKeyDown` → `activateTableRowOnKeyDown(event, openFn)`
- Nested controls stay real `<button>` / Checkbox / links; row click ignores those via `closest(...)` or `stopPropagation`

Applied on: tasks (`TaskItem`), workers (`ProjectItem`), employees (`EmployeeItem`), documents (`DocumentMasterRow`), bestand (`BestandRow`), templates (`TemplateItem`, `TemplateTaskItem`, `MailTemplateRow`).

Open targets that are not rows use a real control: e.g. personnel files use `<a href … target="_blank">` (not a `div` with `role="link"`), so drag on the card still works without a nested button.

## Styling note

Tailwind and Radix / shadcn-style primitives style the UI. Semantics come from the HTML we choose on top of that, not from CSS alone.
