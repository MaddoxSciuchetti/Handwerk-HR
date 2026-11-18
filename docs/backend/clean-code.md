# Backend clean code — layers & principles

Shared clean-code principles live in [`docs/clean-code-testing/principles.md`](../clean-code-testing/principles.md). That file is useful, but most of its live examples are client-side. This page is the **server counterpart**: the HTTP layer split, helpers to reuse, and the same principles shown with backend code.

Naming and folder rules: [`style-guide.md` §2 + §6.2](../clean-code-testing/style-guide.md). Why this split: [`decisions.md`](../clean-code-testing/decisions.md).

## Layer contract

```
server.ts
  → routes/*.route.ts               mount path + middleware only
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

Folders: [`routes/`](../../server/src/routes/), [`controllers/`](../../server/src/controllers/), [`services/`](../../server/src/services/), [`schemas/`](../../server/src/schemas/), [`utils/`](../../server/src/utils/), [`middleware/`](../../server/src/middleware/). Prefer `*.service.ts` for new domain work.

Helpers you will hit most often: [`catchErrors`](../../server/src/utils/catchErrors.ts), [`AppError`](../../server/src/utils/AppError.ts) / [`appAssert`](../../server/src/utils/appAssert.ts), [`withTxRetry`](../../server/src/utils/withTxRetry.ts), [`jwt`](../../server/src/utils/jwt.ts) / [`cookies`](../../server/src/utils/cookies.ts), [`authenticate`](../../server/src/middleware/authenticate.ts) / [`requireSubscriptionAccess`](../../server/src/middleware/requireSubscriptionAccess.ts), [`errorHandler`](../../server/src/middleware/errorHandler.ts), [`lib/prisma`](../../server/src/lib/prisma.ts), [`constants/env`](../../server/src/constants/env.ts).

---

## Principles (backend examples)

Same principles as the frontend doc — shown here with server files.

### DRY

One wrapper for every async controller instead of repeating `try/catch` + `next(error)`.

[`server/src/utils/catchErrors.ts`](../../server/src/utils/catchErrors.ts)

```ts
const catchErrors =
    (controller: AsyncController): AsyncController =>
    async (req, res, next) => {
        try {
            await controller(req, res, next);
        } catch (error) {
            next(error);
        }
    };
```

Usage: [`task.controller.ts`](../../server/src/controllers/task.controller.ts) — `export const createTask = catchErrors(async (req, res) => { … })`.

Same idea for mail copy: [`emailTemplates.ts`](../../server/src/utils/emailTemplates.ts) builds subject/text/html once; callers only pass the URL / org name.

### KISS

Routes only mount paths onto controllers — no Prisma, no branching.

[`server/src/routes/tasks.route.ts`](../../server/src/routes/tasks.route.ts)

```ts
taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);
taskRoutes.get("/:id/history", fetchTaskHistory);
taskRoutes.patch("/:id", updateTask);
```

Controllers stay thin adapters: parse auth context, call a service, return JSON.

[`server/src/controllers/task.controller.ts`](../../server/src/controllers/task.controller.ts)

```ts
export const createTask = catchErrors(async (req, res) => {
    const result = await createTaskInOrg(req.orgId, req.userId, req.body);
    return res.status(CREATED).json(result);
});
```

### YAGNI

Validate only what the endpoint needs today.

[`server/src/schemas/billing.schemas.ts`](../../server/src/schemas/billing.schemas.ts)

```ts
export const createCheckoutSessionSchema = z.object({
    price: z.string().min(1),
});
```

Named HTTP statuses that the API actually returns — extend when a new status appears, not before.

[`server/src/constants/http.ts`](../../server/src/constants/http.ts)

```ts
export const OK = 200;
export const CREATED = 201;
export const UNAUTHORIZED = 401;
export const FORBIDDEN = 403;
```

### Error handling

Throw typed errors at the boundary; let middleware format the response.

[`server/src/utils/appAssert.ts`](../../server/src/utils/appAssert.ts) + usage in [`billing.controller.ts`](../../server/src/controllers/billing.controller.ts)

```ts
appAssert(organizationId && userId, UNAUTHORIZED, "Missing auth context");
assertOrgAdmin(req.membershipRole);

const { price } = createCheckoutSessionSchema.parse(req.body);
const url = await createCheckoutSessionUrl(price, { organizationId, userId });
return res.status(OK).json({ url });
```

Failed asserts become `AppError` → [`errorHandler`](../../server/src/middleware/errorHandler.ts). Controllers do not hand-roll status/`catch` blocks for expected failures.

### Encapsulate boundary conditions

Auth and subscription gates live in middleware once — routes do not re-check cookies or Stripe status.

[`server/src/middleware/requireSubscriptionAccess.ts`](../../server/src/middleware/requireSubscriptionAccess.ts)

```ts
appAssert(
    hasSubscriptionAppAccess(row),
    FORBIDDEN,
    "Kein Zugriff — bitte Abrechnung unter Einstellungen › Zahlungen abschließen oder Zahlung aktualisieren.",
    AppErrorCode.SubscriptionAccessDenied,
);
```

Env reads go through [`constants/env.ts`](../../server/src/constants/env.ts) so missing vars fail in one place.

### Names — descriptive verbs, one job

Does this org unlock the app? One function, one answer.

[`server/src/utils/subscriptionAccess.ts`](../../server/src/utils/subscriptionAccess.ts)

```ts
export function hasSubscriptionAppAccess(
    row: SubscriptionAccessFields | null,
): boolean {
    if (!row) return true;
    if (row.status === "cancelled") return false;
    if (row.status === "past_due") return false;
    if (row.status === "active") return true;
    // …
}
```

Map Stripe → Prisma without leaking Stripe types into callers.

[`server/src/utils/mapInvoiceStatus.ts`](../../server/src/utils/mapInvoiceStatus.ts)

```ts
export function mapInvoiceStatus(
    status: Stripe.Invoice.Status | null | undefined,
): InvoiceStatus {
    if (!status) return "draft";
    switch (status) {
        case "paid":
            return "paid";
        // …
        default:
            return "open";
    }
}
```

Service functions named for the action: `createTaskInOrg`, `deleteTasksInOrg`, `createCheckoutSessionUrl`.

### Prefer fewer arguments / clear objects

Pass a small params object instead of a long positional list when several IDs travel together.

[`server/src/controllers/billing.controller.ts`](../../server/src/controllers/billing.controller.ts)

```ts
const url = await createCheckoutSessionUrl(price, {
    organizationId,
    userId,
});
```

### Source code structure

Separate concepts vertically: route file ≠ controller file ≠ service file. Related code stays dense inside the service (one module owns the transaction + branching for that use case).

Retryable transactions live in one helper so callers stay short — see [`withTxRetry`](../../server/src/utils/withTxRetry.ts) and [transactions.md](../database/transactions.md):

```ts
return withTxRetry(async (tx) => {
    // use tx, not prisma, inside the callback
});
```

### Comments — explain intent, not noise

Prefer a short “why” when the next reader would otherwise guess wrong (for example cascade deletes inside a worker bulk delete). Do not narrate what the next line already says.

---

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
