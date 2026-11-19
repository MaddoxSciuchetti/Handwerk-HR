# Client

React + Vite SPA for Handwerk-HR. The frontend docs entry is [`docs/frontend/Intro.md`](../docs/frontend/Intro.md).

## Commands (from `client/`)

| Command                             | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `npm run dev`                       | Vite dev server (`http://localhost:5173`) |
| `npm run format`                    | Prettier write                            |
| `npm run lint` / `npm run lint:src` | ESLint                                    |
| `npm run typecheck`                 | `tsc --noEmit`                            |
| `npm run test:unit`                 | Vitest unit tests                         |
| `npm run test:coverage`             | Unit tests + coverage                     |
| `npm run build`                     | Production build                          |
| `npm run analyze`                   | Bundle analyze (`ANALYZE=1`)              |

Optional local API override in `.env`:

```
VITE_API_URL=http://localhost:3000
```

## Recurring review checks

Before merge, re-check routes, mentions, and leftover modules. The living checklist and findings log:

→ [`docs/review.md`](../docs/review.md)

## Styling

Shared color / surface / status tokens are CSS variables in [`src/App.css`](./src/App.css) (Tailwind + shadcn primitives). There is no separate design-token frame doc.

## Related

- Project decisions (fuller): [`docs/clean-code-testing/decisions.md`](../docs/clean-code-testing/decisions.md)
- Frontend-only extras: [`decisions.md`](./decisions.md)
- Architecture / folder rules: [`docs/clean-code-testing/style-guide.md`](../docs/clean-code-testing/style-guide.md)
- Performance / web-vitals: [`docs/frontend/optimization.md`](../docs/frontend/optimization.md)
- Root setup and env: [`README.md`](../README.md)
