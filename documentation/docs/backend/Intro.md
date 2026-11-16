# Backend documentation

This folder is the entry for the Express + Prisma API (`server/`). Use the links below to find the right readme.

## Where to go

- How the HTTP layers are organized (route → controller → service), env access, and naming: [Style guide — Server](../../clean-code-testing/docs/style-guide.md)
- Why those choices were made: [Decisions](../../clean-code-testing/docs/decisions.md)
- Structured logs, OpenTelemetry, and how to log in a new feature: [server/README.md](../../../server/README.md)
- Finding a failed request in Render logs: [ops/observability.md](../../../ops/observability.md)
- Local setup, env vars, scripts, Prisma migrate, and Render deploy notes: [root README](../../../README.md)
- Local Prisma migrate / generate after schema pulls: [AGENTS.md](../../../AGENTS.md)
- Database model, performance, backups, and scaling: [Database Intro](../database/Intro.md)
- Server tests and coverage commands: [Tests](../../clean-code-testing/docs/tests.md)
- GitHub Actions notes: [CI/CD](../../clean-code-testing/docs/ci.cd.md)

## Related (historical)

- One-time production schema cutover runbook (completed; Postgres is on Render now): [server/src/prisma/cutover/README.md](../../../server/src/prisma/cutover/README.md)
