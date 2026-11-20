# Server

Package notes for the Express API in `server/`.

Stack and “why not” choices (HTTP vs WebSockets, no Docker/K8s, no Redis, and the rest) live in [`docs/backend/architecture.md`](../docs/backend/architecture.md). Rate limiting is documented in [`docs/backend/security.md`](../docs/backend/security.md).

## Scripts you use most

From `server/`:

```bash
npm run dev
npm run typecheck
npm run test:unit
npm run migrate:deploy
npm run loadtest
```

Prisma schema: `src/prisma/schema.prisma`. Prefer `*.service.ts` for new domain work under `src/services/`.
