# Backend documentation

This folder is the entry for the Express + Prisma API (`server/`).

## Core tools this backend uses

| Area           | Tools                                                      | Why they matter for quality                       |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| App runtime    | Express, TypeScript, `tsx` (dev), esbuild (prod bundle)    | Typed API with a clear local → deploy path        |
| Data           | Prisma, PostgreSQL (`pg`)                                  | Schema migrations and type-safe DB access         |
| Validation     | Zod                                                        | Shared request/payload boundaries                 |
| Observability  | pino, Sentry (`@sentry/node`)                              | Correlate requests, see latency, group exceptions |
| Auth & billing | JWT / sessions, Stripe                                     | Secure access and subscription integrity          |
| Integrations   | Resend, AWS S3, Microsoft Graph / Google APIs (as used)    | External side effects stay explicit and loggable  |
| Quality gates  | `tsc` typecheck (no ESLint/Prettier scripts on server yet) | Catch type breaks before merge                    |
| Tests          | Jest, Supertest                                            | Unit/API behaviour coverage (`npm run test:unit`) |
| Ops probes     | `ops/loadtest`                                             | Concurrent-user pressure checks on staging        |

## Where to go

- JWT cookies, refresh rotation, and the client 401 interceptor: [server/README.md — Authentication](../../server/README.md#authentication-jwt-cookies)
- Backend clean-code map (helpers, routes, controllers, services): [clean-code.md](./clean-code.md)
- How the HTTP layers are organized (route → controller → service), env access, and naming: [Style guide — Server](../clean-code-testing/style-guide.md)
- Shared clean-code principles (examples lean frontend; use the map above for server): [Principles](../clean-code-testing/principles.md)
- Why those choices were made: [Decisions](../clean-code-testing/decisions.md)
- Structured logs, OpenTelemetry, and how to log in a new feature: [server/README.md](../../server/README.md)
- Finding a failed request in Render logs: [ops/observability.md](../../ops/observability.md)
- SE observability write-up: [docs/observability-deep-dive.md](../observability-deep-dive.md)
- Local setup, env vars, scripts, Prisma migrate, and Render deploy notes: [root README](../../README.md)
- Local Prisma migrate / generate after schema pulls: [AGENTS.md](../../AGENTS.md)
- Database model, performance, backups, and scaling: [Database Intro](../database/Intro.md)
- Server tests and coverage commands: [Tests](../clean-code-testing/tests.md)
- Security on `main` (stable versions, secret push detection, vulnerability response): [security.md](./security.md)
- CI (GitHub Actions) and CD (Render auto-deploy; build → Prisma migrate pre-deploy → start): [CI/CD](../clean-code-testing/ci.cd.md)

Read the evidence and approach: [Observability deep dive](../observability-deep-dive.md). Day-to-day logging habits: [server/README.md](../../server/README.md). Render search runbook: [ops/observability.md](../../ops/observability.md).

## Related (historical)

- One-time production schema cutover runbook (completed; Postgres is on Render now): [server/src/prisma/cutover/README.md](../../server/src/prisma/cutover/README.md)
