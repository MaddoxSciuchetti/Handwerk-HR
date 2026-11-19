# Backend layers

This page explains how HTTP work is split in `server/`. Each layer has one job so a new endpoint stays easy to follow.

## How a request moves

```
server.ts
  → routes/*.route.ts               path + middleware only
    → controllers/*.controller.ts   parse req, call service, shape res
      → services/*.service.ts       Prisma, branching, side effects
```

`server.ts` mounts prefixes and global middleware. A route file only maps an HTTP verb and relative path to a controller. The controller reads params or body, calls a service, and returns JSON. The service owns database work, branching, and integrations. Zod schemas describe input shapes. Shared helpers live in `utils/`, `middleware/`, and `lib/`.

Folders: [`routes/`](../../server/src/routes/), [`controllers/`](../../server/src/controllers/), [`services/`](../../server/src/services/), [`schemas/`](../../server/src/schemas/), [`utils/`](../../server/src/utils/), [`middleware/`](../../server/src/middleware/).

## What each layer owns

- A route must not run Prisma or business `if` trees.
- A controller must not run database queries or orchestrate Stripe/mail.
- A service must not set `res.status` or depend on Express types.
- A schema must not cause side effects.
- A helper must stay cross-cutting and not own one product flow.

## Helpers you will hit often

Common pieces include:

- [`catchErrors`](../../server/src/utils/catchErrors.ts)
- [`AppError`](../../server/src/utils/AppError.ts) / [`appAssert`](../../server/src/utils/appAssert.ts)
- [`withTxRetry`](../../server/src/utils/withTxRetry.ts)
- [`jwt`](../../server/src/utils/jwt.ts) / [`cookies`](../../server/src/utils/cookies.ts)
- [`authenticate`](../../server/src/middleware/authenticate.ts) / [`requireSubscriptionAccess`](../../server/src/middleware/requireSubscriptionAccess.ts)
- [`errorHandler`](../../server/src/middleware/errorHandler.ts)
- [`lib/prisma`](../../server/src/lib/prisma.ts)
- [`constants/env`](../../server/src/constants/env.ts)

## Adding a new endpoint

1. Add or extend a schema if the body or params need validation.
2. Put database work and branching in a service.
3. Add a thin `catchErrors` handler in a controller.
4. Wire the path only in a route file.
5. Mount the router in `server.ts` if it is a new top-level prefix, with the right auth or subscription middleware.
6. Reuse helpers instead of copying catch, cookie, or transaction-retry logic.
7. Import env from `@/constants/env` and Prisma from [`server/src/lib/prisma.ts`](../../server/src/lib/prisma.ts).
