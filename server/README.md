# Server

Package notes for the Express API in `server/`.

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
