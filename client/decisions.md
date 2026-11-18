# Client decisions

Start with the project decisions doc — it has the fuller write-up (repo split, TanStack Router, feature folders, naming, tooling):

→ [`docs/clean-code-testing/decisions.md`](../docs/clean-code-testing/decisions.md)

This page only adds frontend-only choices that are not covered there.

## Modal state via React context

**Decision:** Employee modal open/close and related modal state use React context (`EmployeeModalContext` / `ModalProvider`), not a global store.

**Reason:** The state is shared across related components in the employee-overview feature, not across unrelated app areas.

**Alternatives considered:** Zustand, Redux.

## Keep React Context narrow; server state in TanStack Query

**Decision:** Keep React Context narrow (theme, local UI). Put server/API state in TanStack Query, not in a large app-wide Context.

**Reason:** Context re-renders its consumers when the value changes. A large app-wide Context would cause avoidable work. Theme and small feature UI stay in Context; API data stays in Query. Example theme provider: `client/src/context/theme-provider/ThemeProvider.tsx`. Performance write-up: `docs/optimization-deep-dive.md` (Architecture choices that also optimize).

**Alternatives considered:** Zustand or Redux for fine-grained client state if a feature outgrows Context.

## Forms via React Hook Form

**Decision:** Forms use React Hook Form (+ Zod resolvers where needed).

**Reason:** Familiar API and flexible field binding; prefer not binding UI components the way TanStack Form encourages.

**Alternatives considered:** `@tanstack/react-form` (present in dependencies historically; RHF is the pattern in feature forms).

## Client-side pagination for small lists

**Decision:** Paginate small task/template lists in the client instead of server-side page APIs.

**Reason:** Typical fetches are on the order of ~10–20 items; server pagination adds complexity without a clear win at that size.

**Alternatives considered:** Server-side pagination.
