# Backend clean code — layers & map

Shared clean-code principles live in [`docs/clean-code-testing/principles.md`](../clean-code-testing/principles.md). That file is useful, but most of its live examples are client-side. This page is the **server counterpart**: how Express code is layered, which helpers to reuse, and where routes / controllers / services live today.

Naming and folder rules: [`style-guide.md` §2 + §6.2](../clean-code-testing/style-guide.md). Why this split: [`decisions.md`](../clean-code-testing/decisions.md).

## Layer contract

Every authenticated HTTP feature should read top-down like this:

```
server.ts
  → routes/*.route.ts          mount path + middleware only
    → controllers/*.controller.ts   parse req, call service, shape res
      → services/*.service.ts       Prisma, branching, side effects
```

| Layer | File suffix | Owns | Must not |
| --- | --- | --- | --- |
| Mount | `server.ts` | Global middleware, `/path` prefixes, webhooks/cron | Domain logic |
| Route | `.route.ts` | HTTP verb + relative path → controller | Prisma, business `if` trees |
| Controller | `.controller.ts` | Params/body, `catchErrors`, status + JSON | DB queries, Stripe/mail orchestration |
| Service | `.service.ts` (preferred) | Transactions, branching, integrations | `res.status` / Express types |
| Schema | `.schemas.ts` | Zod input shapes | Side effects |
| Helper | `utils/`, `middleware/`, `lib/` | Cross-cutting reuse | Feature-specific product flow |

Canonical thin stack (tasks):

- Route: [`server/src/routes/tasks.route.ts`](../../server/src/routes/tasks.route.ts)
- Controller: [`server/src/controllers/task.controller.ts`](../../server/src/controllers/task.controller.ts)
- Service: [`server/src/services/tasks.service.ts`](../../server/src/services/tasks.service.ts)

```ts
// tasks.route.ts — paths only
taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);
taskRoutes.patch("/:id", updateTask);
```

```ts
// task.controller.ts — thin adapter
export const createTask = catchErrors(async (req, res) => {
    const result = await createTaskInOrg(req.orgId, req.userId, req.body);
    return res.status(CREATED).json(result);
});
```

Larger domains (for example worker) still follow the same split; the controller stays the HTTP edge and services hold Prisma + branching even when several services are called from one controller.

## Where helpers live

### `server/src/utils/` — shared helpers

Use these instead of re-implementing the same patterns in a new feature.

| Helper | Role |
| --- | --- |
| [`catchErrors.ts`](../../server/src/utils/catchErrors.ts) | Wrap async controllers; forward thrown errors to Express `next` |
| [`AppError.ts`](../../server/src/utils/AppError.ts) | Typed HTTP error with optional app error code |
| [`appAssert.ts`](../../server/src/utils/appAssert.ts) | Assert a condition or throw `AppError` |
| [`assertOrgOwner.ts`](../../server/src/utils/assertOrgOwner.ts) | Org admin / owner checks |
| [`withTxRetry.ts`](../../server/src/utils/withTxRetry.ts) | Prisma `$transaction` with retry on conflict (`P2034`) |
| [`jwt.ts`](../../server/src/utils/jwt.ts) | Sign / verify access & refresh tokens |
| [`bcrypt.ts`](../../server/src/utils/bcrypt.ts) | Hash / compare secrets |
| [`cookies.ts`](../../server/src/utils/cookies.ts) | Auth cookie options, set / clear |
| [`sendMail.ts`](../../server/src/utils/sendMail.ts) | Outbound mail send |
| [`emailTemplates.ts`](../../server/src/utils/emailTemplates.ts) | HTML/text templates for product mails |
| [`date.ts`](../../server/src/utils/date.ts) / [`dateParser.ts`](../../server/src/utils/dateParser.ts) / [`datevalidation.ts`](../../server/src/utils/datevalidation.ts) | Relative dates, German parse, validation |
| [`cronLog.ts`](../../server/src/utils/cronLog.ts) | Structured logs for cron jobs |
| [`subscriptionAccess.ts`](../../server/src/utils/subscriptionAccess.ts) | Whether an org subscription unlocks the app |
| [`mapBillingInvoice.ts`](../../server/src/utils/mapBillingInvoice.ts) / [`mapInvoiceStatus.ts`](../../server/src/utils/mapInvoiceStatus.ts) / [`stripeSubscriptionWebhook.ts`](../../server/src/utils/stripeSubscriptionWebhook.ts) / [`extractStripeSubid.ts`](../../server/src/utils/extractStripeSubid.ts) | Stripe → app field mapping |
| [`resolverOwner.ts`](../../server/src/utils/resolverOwner.ts) | Resolve org owner context |
| [`lifecycleStatistics.ts`](../../server/src/utils/lifecycleStatistics.ts) | Summarize worker/issue stats for the cockpit |
| [`testEmailOutbox.ts`](../../server/src/utils/testEmailOutbox.ts) | In-memory sent-mail capture for tests |
| [`utils/v2/tokenV2.ts`](../../server/src/utils/v2/tokenV2.ts) | Raw token generate / hash |

Controller error-handling pattern:

```ts
import catchErrors from "@/utils/catchErrors";

export const createTemplate = catchErrors(async (req, res) => {
    // throw AppError / appAssert → errorHandler middleware
});
```

Transaction retry pattern (see also [`docs/database/transactions.md`](../database/transactions.md)):

```ts
import { withTxRetry } from "@/utils/withTxRetry";

await withTxRetry(async (tx) => {
    // use tx, not prisma, inside the callback
});
```

### `server/src/middleware/` — request pipeline

| Middleware | Role |
| --- | --- |
| [`requestId.middleware.ts`](../../server/src/middleware/requestId.middleware.ts) | Correlate logs / responses with `X-Request-Id` |
| [`sentryContext.middleware.ts`](../../server/src/middleware/sentryContext.middleware.ts) | Attach request context to Sentry |
| [`accessLog.middleware.ts`](../../server/src/middleware/accessLog.middleware.ts) | Structured access logging |
| [`authenticate.ts`](../../server/src/middleware/authenticate.ts) | JWT / session → `req.userId`, `req.orgId` |
| [`requireSubscriptionAccess.ts`](../../server/src/middleware/requireSubscriptionAccess.ts) | Block locked orgs from product routes |
| [`requireCronSecret.ts`](../../server/src/middleware/requireCronSecret.ts) | Protect internal cron endpoints |
| [`fileparser.ts`](../../server/src/middleware/fileparser.ts) | Multer upload helpers |
| [`errorHandler.ts`](../../server/src/middleware/errorHandler.ts) | Final JSON error formatter |

### `server/src/lib/` + constants

| Module | Role |
| --- | --- |
| [`lib/prisma.ts`](../../server/src/lib/prisma.ts) | Shared Prisma client |
| [`constants/env.ts`](../../server/src/constants/env.ts) | Only place normal code should read env (via exports) |
| [`constants/http.ts`](../../server/src/constants/http.ts) | HTTP status constants (`OK`, `CREATED`, …) |

## Route map (`server.ts` mounts)

Mounted in [`server/src/server.ts`](../../server/src/server.ts). Product routes that need a logged-in org typically chain `authenticate` + `requireSubscriptionAccess`.

| Mount | Route module | Notes |
| --- | --- | --- |
| `/auth` | [`auth.route.ts`](../../server/src/routes/auth.route.ts) | Register, login, refresh, password; Microsoft OAuth bridge |
| `/user` | [`user.route.ts`](../../server/src/routes/user.route.ts) | Profile / photo |
| `/billing` | [`billing.route.ts`](../../server/src/routes/billing.route.ts) | Subscription, invoices, Checkout, portal |
| `/worker` | [`worker.route.ts`](../../server/src/routes/worker.route.ts) | Workers, engagements, issues, contracts, documents, clothing/material |
| `/tasks` | [`tasks.route.ts`](../../server/src/routes/tasks.route.ts) | Cross-engagement issue inbox |
| `/template` | [`template.route.ts`](../../server/src/routes/template.route.ts) | Onboarding/offboarding templates + template tasks |
| `/document-masters` | [`documentMaster.route.ts`](../../server/src/routes/documentMaster.route.ts) | Styled document masters + description sentences |
| `/automation` | [`automation.route.ts`](../../server/src/routes/automation.route.ts) | M365, Teams, mail templates, sequences, deactivation schedule |
| `/employee` | [`employee.route.ts`](../../server/src/routes/employee.route.ts) | Employee/absence views |
| `/org` | [`org.route.ts`](../../server/src/routes/org.route.ts) | Invites create + org engagements list |
| `/invites` | [`invite.route.ts`](../../server/src/routes/invite.route.ts) | Public invite accept |
| `/fragebogen` | [`questionnaire.route.ts`](../../server/src/routes/questionnaire.route.ts) | Token-based worker questionnaire |
| `/clothing-stock` | [`clothingStock.route.ts`](../../server/src/routes/clothingStock.route.ts) | Org clothing inventory |
| `/contact` | [`contact.route.ts`](../../server/src/routes/contact.route.ts) | Public contact inquiry |
| `/index` | [`index.route.ts`](../../server/src/routes/index.route.ts) | Reminder / feature-request helpers |
| `/test` | [`test.route.ts`](../../server/src/routes/test.route.ts) | Test email outbox (non-prod) |

Also registered directly on `app` (not via a `*.route.ts`):

| Path | Controller |
| --- | --- |
| `POST /webhooks/stripe` | [`stripeWebhook.controller.ts`](../../server/src/controllers/stripeWebhook.controller.ts) |
| `POST /webhooks/resend` | [`resendInbound.controller.ts`](../../server/src/controllers/resendInbound.controller.ts) |
| `POST /internal/cron/scheduled-deactivations` | [`scheduledDeactivations.controller.ts`](../../server/src/controllers/scheduledDeactivations.controller.ts) |
| `POST /internal/cron/anniversary-reminders` | [`anniversaryReminders.controller.ts`](../../server/src/controllers/anniversaryReminders.controller.ts) |
| `GET /document-fonts/:filename` | [`documentMaster.controller.ts`](../../server/src/controllers/documentMaster.controller.ts) |

Webhook handlers that switch on event type keep specialized folders under `services/` (for example Stripe under `services/stripe-webhook/`) — see [decisions.md](../clean-code-testing/decisions.md).

## Controllers (`server/src/controllers/`)

One file per HTTP domain. Prefer wrapping handlers with `catchErrors`. Filename shows the layer: `something.controller.ts`.

| Controller | Typical partners |
| --- | --- |
| `auth.controller.ts` | `auth.service.ts`, `utils/jwt`, cookies |
| `user.controller.ts` | `user.service.ts` |
| `billing.controller.ts` | `billing.service.ts` |
| `worker.controller.ts` | `worker.service.ts` + engagement/questionnaire/contract services |
| `task.controller.ts` | `tasks.service.ts` |
| `template.controller.ts` | `template.service.ts` |
| `documentMaster.controller.ts` | `documentMaster.service.ts`, PDF helpers |
| `automation.controller.ts` | welcome/departure mail, M365, sequences, arbeitszeugnis |
| `microsoftTeams.controller.ts` | `services/microsoftTeams/` |
| `mailTemplate.controller.ts` | `mailTemplate.ts` |
| `employee.controller.ts` | `employee.service.ts` |
| `invite.controller.ts` / `orgEngagement.controller.ts` | `invite.service.ts`, `orgEngagement.service.ts` |
| `questionnaire.controller.ts` | `questionnaire.service.ts` (+ related questionnaire modules) |
| `clothingStock.controller.ts` | `clothingStock.service.ts` |
| `engagementClothing.controller.ts` / `engagementMaterial.controller.ts` / `engagementTemplateDocument.controller.ts` / `personnelDocument.controller.ts` | Matching `*.service.ts` (mounted under worker routes) |
| `contact.controller.ts` | `contactInquiry.service.ts` |
| `contractPrint.controller.ts` | employment contract print path |
| `descriptionSentences.controller.ts` | `descriptionSentences.service.ts` |
| `index.controller.ts` | `index.service.ts` |
| `test.controller.ts` | `testEmailOutbox` |
| Cron / webhook controllers above | Matching service modules |

## Services (`server/src/services/`)

### Prefer `*.service.ts` for domain modules

New domain work should use the `.service.ts` suffix. Existing descriptive modules without the suffix are fine until touched for a real change ([style guide §2.2](../clean-code-testing/style-guide.md)).

**Domain `*.service.ts` today:**  
`auth`, `billing`, `clothingStock`, `completedQuestionnaire`, `contactInquiry`, `descriptionSentences`, `documentMaster`, `docxStyles`, `employee`, `employmentContract`, `engagementClothing`, `engagementMaterial`, `engagementTemplateDocument`, `index`, `invite`, `orgEngagement`, `pdfLigatures`, `pdfPageGeometry`, `pdfTextPaint`, `personnelDocument`, `questionnaire`, `questionnaireCorrections`, `questionnaireFiles`, `signedContractReturn`, `subscriptionAudit`, `tasks`, `template`, `user`, `worker`.

### Supporting modules (no `.service` suffix yet)

These still belong in the service layer (business / integration logic), not in controllers:

| Area | Examples |
| --- | --- |
| Mail & lifecycle automation | `welcomeMail.ts`, `departureMail.ts`, `engagementMail.ts`, `offboardingAutomation.ts`, `onboardingTemplateTasks.ts`, `anniversaryReminders.ts` |
| Questionnaire pipeline | `questionnaireDispatch.ts`, `questionnaireDefinition.ts`, `questionnaireForm.ts`, `questionnaireSender.ts`, `questionnaireTemplate.ts`, … |
| Documents / PDF | `documentPdf.ts`, `documentPdfNative.ts`, `styledDocument.ts`, `preparedDocument.ts`, `importStyledDocument.ts`, `arbeitszeugnis.ts` |
| Integrations | `integrations/`, `microsoft365/`, `microsoftTeams/`, `microsoft365Account.ts`, `graphMail.ts`, `graphMailToken.ts` |
| Tasks / visibility | `issueMentions.ts`, `issueVisibility.ts`, `templateApplication.ts`, `lifecycleStatistics.ts` |
| Stripe webhook handlers | `stripe-webhook/` |

### Schemas (`server/src/schemas/`)

Zod boundaries colocated by domain: `auth`, `billing`, `clothingStock`, `contact`, `employee`, `engagementClothing`, `invite`, `user`, `worker`. Controllers/services parse with these instead of ad-hoc `typeof` trees when a stable input shape exists.

## Checklist for a new backend endpoint

1. Add or extend `something.schemas.ts` if the body/params need validation.
2. Put DB + branching in `something.service.ts` (or an existing service module).
3. Add a thin `catchErrors` handler in `something.controller.ts`.
4. Wire the path only in `something.route.ts`.
5. Mount the router in `server.ts` if it is a new top-level prefix (with the right auth / subscription middleware).
6. Reuse helpers from `utils/` and `middleware/` — do not copy `catchErrors`, cookie, or tx-retry logic.
7. Import env from `@/constants/env`, Prisma from `@/lib/prisma`.

## Related docs

- Backend quality focus (observability): [Intro.md](./Intro.md)
- Shared principles (frontend-heavy examples): [principles.md](../clean-code-testing/principles.md)
- Style guide (server sections): [style-guide.md](../clean-code-testing/style-guide.md)
- Review checklist (route → controller → service): [review-checklist.md](../clean-code-testing/review-checklist.md)
- Transactions helper write-up: [transactions.md](../database/transactions.md)
