# Client decisions

Start with the frontend toolkit decisions (React, Vite, npm, TanStack Router):

→ [`docs/frontend/architecture.md`](../docs/frontend/architecture.md)

Then the project decisions doc for repo split, feature folders, and naming:

→ [`docs/clean-code-testing/decisions.md`](../docs/clean-code-testing/decisions.md)

This page only adds frontend-only choices that are not covered there.

## Modal state via React context

Decision: Employee modal open/close and related modal state use React context (`EmployeeModalContext` / `ModalProvider`), not a global store.

Reason: The state is shared across related components in the employee-overview feature, not across unrelated app areas.

Alternatives considered: Zustand, Redux.

## Keep React Context narrow; server state in TanStack Query

Decision: Keep React Context narrow (theme, local UI). Put server/API state in TanStack Query, not in a large app-wide Context.

Reason: Context re-renders its consumers when the value changes. A large app-wide Context would cause avoidable work. Theme and small feature UI stay in Context; API data stays in Query. Example theme provider: `client/src/context/theme-provider/ThemeProvider.tsx`. Performance write-up: `docs/frontend/optimization.md` (What we implemented that also keeps the frontend light).

Alternatives considered: Zustand or Redux for fine-grained client state if a feature outgrows Context.

## Forms via React Hook Form

Decision: Forms use React Hook Form (+ Zod resolvers where needed).

Reason: Familiar API and flexible field binding; prefer not binding UI components the way TanStack Form encourages.

Alternatives considered: `@tanstack/react-form` (present in dependencies historically; RHF is the pattern in feature forms).

## Client-side pagination for small lists

Decision: Paginate small task/template lists in the client instead of server-side page APIs.

Reason: Typical fetches are on the order of ~10–20 items; server pagination adds complexity without a clear win at that size.

Alternatives considered: Server-side pagination.

## Questionnaire drafts in localStorage

Decision: Persist unfinished questionnaire answers in `localStorage` keyed by invite token (`fragebogen-answers:v1:<token>`).

Reason: Users leave mid-flow on phones; losing the form hurts trust. The draft is device-local until submit. Helpers: `questionnaireAnswerDraft.ts`. Short write-up: [`docs/frontend/client-side-data.md`](../docs/frontend/client-side-data.md).
