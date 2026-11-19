# Backend clean-code principles

This page shows how common clean-code ideas appear in the Express API. Each section names the idea, explains it briefly, and points at a live example.

## DRY

One wrapper handles every async controller instead of repeating `try/catch` and `next(error)`.

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

Usage looks like `export const createTask = catchErrors(async (req, res) => { … })` in [`task.controller.ts`](../../server/src/controllers/task.controller.ts). Mail copy follows the same idea in [`emailTemplates.ts`](../../server/src/utils/emailTemplates.ts): build subject, text, and html once; callers only pass the URL or org name.

## KISS

Routes only mount paths onto controllers. They do not call Prisma and they do not branch.

[`server/src/routes/tasks.route.ts`](../../server/src/routes/tasks.route.ts)

```ts
taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);
taskRoutes.get("/:id/history", fetchTaskHistory);
taskRoutes.patch("/:id", updateTask);
```

Controllers stay thin: read auth context, call a service, return JSON.

```ts
export const createTask = catchErrors(async (req, res) => {
    const result = await createTaskInOrg(req.orgId, req.userId, req.body);
    return res.status(CREATED).json(result);
});
```

## YAGNI

Validate only what the endpoint needs today.

```ts
export const createCheckoutSessionSchema = z.object({
    price: z.string().min(1),
});
```

Named HTTP statuses in [`http.ts`](../../server/src/constants/http.ts) list only statuses the API actually returns. Extend the list when a new status appears, not before.

## Error handling

Typed errors are thrown at the boundary. Middleware formats the response. That keeps a clear single responsibility.

```ts
appAssert(organizationId && userId, UNAUTHORIZED, "Missing auth context");
assertOrgAdmin(req.membershipRole);

const { price } = createCheckoutSessionSchema.parse(req.body);
const url = await createCheckoutSessionUrl(price, { organizationId, userId });
return res.status(OK).json({ url });
```

Failed asserts become `AppError` and land in [`errorHandler`](../../server/src/middleware/errorHandler.ts). Controllers do not hand-roll status or catch blocks for expected failures.

## Encapsulate boundary conditions

Auth and subscription gates live in middleware once. Routes do not re-check cookies or Stripe status. Env reads go through [`constants/env.ts`](../../server/src/constants/env.ts) so missing vars fail in one place.

## Names

Prefer descriptive verbs and one job per function. `hasSubscriptionAppAccess` answers one question. `mapInvoiceStatus` maps Stripe to Prisma without leaking Stripe types. Service functions are named for the action (`createTaskInOrg`, `createCheckoutSessionUrl`).

## Prefer clear objects

Pass a small params object instead of a long positional list when several ids travel together.

```ts
const url = await createCheckoutSessionUrl(price, {
    organizationId,
    userId,
});
```

## Source code structure

Keep concepts in separate files: route ≠ controller ≠ service. Related branching stays dense inside the service. Retryable transactions use one helper so callers stay short.

```ts
return withTxRetry(async (tx) => {
    // use tx, not prisma, inside the callback
});
```

## Comments

Prefer a short “why” when the next reader would otherwise guess wrong. Do not narrate what the next line already says.
