# Server observability

This API uses **structured logs** (pino) and **OpenTelemetry traces** so you can find exactly when a request failed and how long each step took.

## Logs vs traces

| | Logs | Traces |
|---|---|---|
| What | Discrete events (`event` + `outcome`, errors, access lines) | Timed spans for a request |
| Why | Search Render for “what happened” | See duration and parent/child work |
| Where | stdout JSON (pretty locally) | stdout span export; optional OTLP |

Both share `requestId` / `traceId` when a request is in flight.

## Correlation

1. Middleware assigns `X-Request-Id` (or reuses the inbound header) and echoes it on the response.
2. Request context (AsyncLocalStorage) carries `requestId`, `traceId`, optional `userId` / `orgId`.
3. Logger calls merge that context automatically.
4. HTTP 500 JSON bodies include `requestId` so a client report maps to Render search.

## File map (one job each)

```
src/observability/
  logger.ts           # pino + serializeError
  requestContext.ts   # AsyncLocalStorage bind/get/update
  tracing.ts          # OpenTelemetry SDK start/stop
  redact.ts           # strip secrets from structured fields
  shutdown.ts         # SIGTERM flush + process error handlers
  index.ts            # re-exports only
src/middleware/
  requestId.middleware.ts
  accessLog.middleware.ts
src/utils/cronLog.ts  # cron helpers → shared logger
```

`src/index.ts` starts tracing **before** importing Express so auto-instrumentation can patch HTTP.

## Local vs production

- **Development:** pretty logs (`pino-pretty`), simple span processor.
- **Production / Render:** JSON logs, batch span processor.
- **Test:** logger silent; tracing not started.

Env vars:

| Variable | Purpose |
|---|---|
| `LOG_LEVEL` | pino level (default `debug` locally, `info` in production) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | If set, also export traces via OTLP HTTP |

## How to log in a new feature

```ts
import { logger } from "@/observability/logger";

logger.info("Document PDF prepared", {
  event: "document.pdf_prepared",
  outcome: "ok",
  artifactId,
});

logger.error("Mention mail failed", {
  event: "task.mention_mail",
  outcome: "error",
  issueId,
  error: serializeError(err),
});
```

Prefer clear `event` + `outcome` fields. Do **not** log cookies, passwords, tokens, `Authorization`, or raw webhook bodies — `redact.ts` / pino redact cover common keys, but never put secrets in messages.

## Cron jobs

Use `cronInfo` / `cronWarn` / `cronError` from `src/utils/cronLog.ts`. The job name stays searchable in Render (same habit as before).

## Further reading

- SE_46 deep dive (what shipped + gaps): [`../docs/observability-deep-dive.md`](../docs/observability-deep-dive.md)
- Incident search on Render: [`../ops/observability.md`](../ops/observability.md)

## Next steps (not in this layer yet)

Metrics/alerts dashboards, a mandatory third-party OTLP UI (or lean fully on Sentry performance), load-test baselines, and caching/Redis for the scaling half of SE_46. Client + API Sentry landed in PR #226.
