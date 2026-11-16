# Compliance walkthrough

Use this page when demoing that the clean-code / style rules are applied in the live codebase. Open each linked file next to the principle.

## How to present

1. Start from [intro](intro.md) → [style guide](style-guide.md) → [principles](principles.md).
2. For each row below, open the file and point at the matching pattern.
3. Optional checklist: [review-checklist](review-checklist.md).

## Style guide (client)

| Rule | Demonstrated in |
| --- | --- |
| Exported components use `export function` | [`PaymentRedirectMessage.tsx`](../../../client/src/features/settings/payments/PaymentRedirectMessage.tsx), [`FormFields.tsx`](../../../client/src/components/form/FormFields.tsx), [`WorkerForm.tsx`](../../../client/src/features/worker-lifecycle/components/lifycycle-modal-content/WorkerForm.tsx), [`AvatarCropModal.tsx`](../../../client/src/features/sidebar/profile-upload-modal/AvatarCropModal.tsx) |
| Exported hooks use `export function` | [`useGetTaskHistory.ts`](../../../client/src/features/worker-task-management/hooks/useGetTaskHistory.ts), [`useBodyScrollLock.ts`](../../../client/src/hooks/useBodyScrollLock.ts) |
| Props type above the component | Same component files above |
| Prefer `type` over `interface` | [`WorkerForm.tsx`](../../../client/src/features/worker-lifecycle/components/lifycycle-modal-content/WorkerForm.tsx) |
| `@/` imports (no deep `../../../../`) | [`StatusInformation.tsx`](../../../client/src/features/worker-task-management/components/tasks/task-sidebar/task-status-information/StatusInformation.tsx), [`FormModal.Add.tsx`](../../../client/src/features/employee-overview/components/modals/create-employee-modal/FormModal.Add.tsx) |
| Env only via `@/config/env` | [`env.ts`](../../../client/src/config/env.ts), consumers [`instrument.ts`](../../../client/src/instrument.ts), [`TeamsSendAction.tsx`](../../../client/src/features/microsoft-teams/TeamsSendAction.tsx) |
| Feature folders | [`client/src/features/all-tasks/`](../../../client/src/features/all-tasks/) |

**Allowed exceptions:** TanStack Router `export const Route = createFileRoute(...)` under `client/src/routes/`, TipTap `Node.create` exports.

## Style guide (server)

| Rule | Demonstrated in |
| --- | --- |
| Route → controller → service | [`worker.route.ts`](../../../server/src/routes/worker.route.ts) → [`worker.controller.ts`](../../../server/src/controllers/worker.controller.ts) → [`worker.service.ts`](../../../server/src/services/worker.service.ts) |
| Controllers wrapped with `catchErrors` | [`template.controller.ts`](../../../server/src/controllers/template.controller.ts) |
| Env only via `@/constants/env` | [`env.ts`](../../../server/src/constants/env.ts), [`aws.ts`](../../../server/src/config/aws.ts), [`contactInquiry.service.ts`](../../../server/src/services/contactInquiry.service.ts) |
| Tests as `*.test.ts` under `server/tests/` (plus colocated `*.test.ts` where already present) | [`server/tests/`](../../../server/tests/) |

**Allowed exceptions:** Stripe / Resend / Microsoft OAuth handlers that must shape HTTP redirects or vendor-specific error JSON instead of the generic `catchErrors` path (`stripeWebhook.controller.ts`, `resendInbound.controller.ts`, `microsoftTeams.controller.ts`). Prisma / storage bootstrap may still read `process.env` at the library edge (`prisma.ts`, `storageClientConfig.ts`).

## Clean-code principles

| Principle | Demonstrated in |
| --- | --- |
| DRY (data + map) | [`layout.consts.ts`](../../../client/src/constants/layout.consts.ts) + [`AppSidebar.tsx`](../../../client/src/components/ui/sidebar/AppSidebar.tsx) |
| DRY (reusable field) | [`FormFields.tsx`](../../../client/src/components/form/FormFields.tsx) |
| KISS (mutation object) | [`tasks.mutations.ts`](../../../client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts) |
| KISS (thin hook) | [`useGetTaskHistory.ts`](../../../client/src/features/worker-task-management/hooks/useGetTaskHistory.ts) |
| KISS (thin routes) | [`worker.route.ts`](../../../server/src/routes/worker.route.ts) |
| YAGNI | [`http.consts.ts`](../../../client/src/constants/http.consts.ts), [`query.client.ts`](../../../client/src/config/query.client.ts) |
| Error handling (client) | shared `tryCatch` helper used from API call sites |
| Error handling (server) | [`catchErrors.ts`](../../../server/src/utils/catchErrors.ts) |
| Descriptive names / fewer args | [`tasks.api.ts`](../../../client/src/features/all-tasks/api/tasks.api.ts) |
| Small pure helpers | [`trial.util.ts`](../../../client/src/features/settings/payments/util/trial.util.ts), [`subscriptionAccess.util.ts`](../../../client/src/features/settings/payments/util/subscriptionAccess.util.ts) |
| Boundary encapsulation | [`client/src/config/env.ts`](../../../client/src/config/env.ts), [`server/src/constants/env.ts`](../../../server/src/constants/env.ts) |

## Hosting facts (not Neon)

| Topic | Current source of truth |
| --- | --- |
| Postgres host | Render Managed Postgres — [backup](../../docs/database/backup.md), [scaling](../../docs/database/scaling.md) |
| App logs / incidents | [ops/observability.md](../../../ops/observability.md) |
| Historical Neon cutover only | [server/src/prisma/cutover/README.md](../../../server/src/prisma/cutover/README.md) (marked historical) |
