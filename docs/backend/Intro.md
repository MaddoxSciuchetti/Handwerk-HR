# Backend documentation

This folder holds everything related to the Express + Prisma API in `server/`. Below is a quick guide so you know where to look. Topics follow the same grouping as SE_46 Web Backend Technologies.

The API runs on Express and TypeScript with Zod validation. Day-to-day scripts live in `server/package.json` (`npm run dev`, `typecheck`, `test:unit`, `migrate:deploy`). Full local setup and env vars are in the repository root README. After a schema pull, sync local Postgres and regenerate Prisma Client before restarting the API — steps are in `AGENTS.md` and `.cursor/skills/local-prisma-sync/SKILL.md`.

Feel free to propose improvements to the pages below so this project stays maintainable.

## Databases and API design

- Information on how the Express HTTP API is designed (mounts, REST habits, JSON, Zod, errors) can be found [here](./api-design.md).
- Information regarding the database model, performance, backups, and scaling can be found [here](../database/Intro.md).

## Architecture and hosting

- Information on CI (GitHub Actions) and CD (Render auto-deploy; build → Prisma migrate pre-deploy → start) can be found [here](./ci.cd.md).

## Code design patterns

- Information on how HTTP work is split across route, controller, and service files can be found [here](./layers.md).
- Information on clean-code principles with backend examples can be found [here](./principles.md).
- Information on naming, env access, and folder rules for the server can be found [here](../clean-code-testing/style-guide.md).
- Notes on why those architecture choices were made can be found [here](../clean-code-testing/decisions.md).

## Testing

- Information on server tests and coverage commands can be found [here](../clean-code-testing/tests.md).

## Authentication and authorization

- Information on JWT cookies, refresh rotation, and the client 401 interceptor can be found [here](./authentication.md).

## Security

- Information on stable versions, secret push detection, and vulnerability response can be found [here](./security.md).

## Performance, scaling, and observability

### Performance & Scaling

- Information on the concurrent-user load probe (how to run it and staging results) can be found [here](./load-probe.md).
- Information on the database analysis scripts we ran (`EXPLAIN ANALYZE` before and after indexing) can be found [here](../database/performance.md).

### Observability

- Information on Sentry tracing, error grouping, and alerts alongside UptimeRobot can be found [here](../observability-deep-dive.md).
- Information on pino structured JSON logging and how to log in a new feature can be found [here](./observability.md).
- Information on finding a failed request in Render logs can be found [here](../../ops/observability.md).
