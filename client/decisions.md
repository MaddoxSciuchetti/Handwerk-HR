# Client decisions

Frontend-only choices that are not covered in [`docs/clean-code-testing/decisions.md`](../docs/clean-code-testing/decisions.md). Broader stack choices (TanStack Router, feature folders, RHF in the tools table) live there / in the frontend intro.

## Modal state via React context

**Decision:** Employee modal open/close and related modal state use React context (`EmployeeModalContext` / `ModalProvider`), not a global store.

**Reason:** The state is shared across related components in the employee-overview feature, not across unrelated app areas.

**Alternatives considered:** Zustand, Redux.

## Forms via React Hook Form

**Decision:** Forms use React Hook Form (+ Zod resolvers where needed).

**Reason:** Familiar API and flexible field binding; prefer not binding UI components the way TanStack Form encourages.

**Alternatives considered:** `@tanstack/react-form` (present in dependencies historically; RHF is the pattern in feature forms).

## Client-side pagination for small lists

**Decision:** Paginate small task/template lists in the client instead of server-side page APIs.

**Reason:** Typical fetches are on the order of ~10–20 items; server pagination adds complexity without a clear win at that size.

**Alternatives considered:** Server-side pagination.
