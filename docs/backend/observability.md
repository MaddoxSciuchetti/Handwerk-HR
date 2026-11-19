# Observability

This page explains how the API logs and traces requests so you can find when something failed and how long it took. The stack uses pino for structured logs and OpenTelemetry for traces.

## Logs and traces

Logs are discrete events (`event`, `outcome`, errors, access lines). They answer what happened and are searchable in Render. Traces are timed spans for a request. They answer how long each step took. Both share `requestId` and `traceId` when a request is in flight.

## Assigning request ids

Middleware assigns `X-Request-Id` (or reuses the inbound header) and echoes it on the response. Request context carries `requestId`, `traceId`, and optional `userId` / `orgId`. Logger calls merge that context automatically. HTTP 500 JSON bodies include `requestId` so a client report maps to a Render search.

## Local versus production

Locally, logs are pretty-printed and spans use a simple processor. On Render, logs are JSON and spans are batched. In tests the logger is silent and tracing is not started.

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
