# Backend clean code — layers & map

Shared clean-code principles live in [`docs/clean-code-testing/principles.md`](../clean-code-testing/principles.md). That file is useful, but most of its live examples are client-side. This page is the **server counterpart**: how Express code is layered and which helpers to reuse.

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

Canonical thin stack: [`tasks.route.ts`](../../server/src/routes/tasks.route.ts) → [`task.controller.ts`](../../server/src/controllers/task.controller.ts) → [`tasks.service.ts`](../../server/src/services/tasks.service.ts).

```ts
// tasks.route.ts — paths only
taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);

// task.controller.ts — thin adapter
export const createTask = catchErrors(async (req, res) => {
    const result = await createTaskInOrg(req.orgId, req.userId, req.body);
    return res.status(CREATED).json(result);
});
```

Larger domains (for example worker) still follow the same split; the controller stays the HTTP edge even when it calls several services.

## Helpers to reuse

Browse `server/src/utils/`, `middleware/`, and `lib/` before adding a new shared helper. The ones you will hit most often:

| Helper | Role |
| --- | --- |
| [`catchErrors.ts`](../../server/src/utils/catchErrors.ts) | Wrap async controllers; forward errors to `next` |
| [`AppError.ts`](../../server/src/utils/AppError.ts) / [`appAssert.ts`](../../server/src/utils/appAssert.ts) | Typed HTTP errors and asserts |
| [`withTxRetry.ts`](../../server/src/utils/withTxRetry.ts) | Prisma `$transaction` with retry on conflict (`P2034`) — see also [transactions.md](../database/transactions.md) |
| [`jwt.ts`](../../server/src/utils/jwt.ts) / [`cookies.ts`](../../server/src/utils/cookies.ts) / [`bcrypt.ts`](../../server/src/utils/bcrypt.ts) | Auth tokens, cookies, password hashing |
| [`sendMail.ts`](../../server/src/utils/sendMail.ts) / [`emailTemplates.ts`](../../server/src/utils/emailTemplates.ts) | Outbound mail |
| [`authenticate.ts`](../../server/src/middleware/authenticate.ts) / [`requireSubscriptionAccess.ts`](../../server/src/middleware/requireSubscriptionAccess.ts) | Logged-in user + subscription gate |
| [`errorHandler.ts`](../../server/src/middleware/errorHandler.ts) | Final JSON error formatter |
| [`lib/prisma.ts`](../../server/src/lib/prisma.ts) / [`constants/env.ts`](../../server/src/constants/env.ts) | Shared Prisma client; only place normal code reads env |

## Where the folders are

| Kind | Folder | How to find the right file |
| --- | --- | --- |
| Mounts | [`server.ts`](../../server/src/server.ts) | Top-level `/path` prefixes and webhook/cron registration |
| Routes | [`server/src/routes/`](../../server/src/routes/) | One `*.route.ts` per mount (e.g. `worker.route.ts`, `billing.route.ts`) |
| Controllers | [`server/src/controllers/`](../../server/src/controllers/) | Matching `*.controller.ts`; wrap handlers with `catchErrors` |
| Services | [`server/src/services/`](../../server/src/services/) | Prefer `*.service.ts` for new domain work; older descriptive modules without the suffix are fine until touched |
| Schemas | [`server/src/schemas/`](../../server/src/schemas/) | Zod input shapes next to the domain |

Webhook handlers that switch on event type keep specialized folders under `services/` (for example Stripe under `services/stripe-webhook/`) — see [decisions.md](../clean-code-testing/decisions.md).

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
