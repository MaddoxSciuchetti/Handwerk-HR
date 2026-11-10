# Observability runbook (Render)

How to find **exactly when** something failed in Handwerk-HR.

## What you will see

Each meaningful HTTP request emits a structured access log:

```json
{
  "level": 30,
  "time": "2026-11-10T19:00:00.000Z",
  "msg": "HTTP access",
  "event": "http.access",
  "outcome": "ok",
  "method": "POST",
  "path": "/tasks",
  "statusCode": 200,
  "durationMs": 42,
  "requestId": "…",
  "traceId": "…"
}
```

Failures add `event: "http.error"` (or domain events like `stripe.webhook`, cron `job` fields) with a serialized `error`.

OpenTelemetry also prints span summaries to stdout (and to OTLP if `OTEL_EXPORTER_OTLP_ENDPOINT` is set).

## Find a failed request

1. If the client shows a 500 body, copy `requestId`.
2. In Render → your web service → **Logs**, search that `requestId`.
3. You should see the access line, the error line, and related hot-path events for the same id / `traceId`.
4. Use the ISO `time` field as the exact moment of the failure; `durationMs` shows how long the request ran.

### Cron jobs

Search the job name (first habit from before), e.g. `anniversary-reminder` or `scheduled-deactivation`. Fields still include `event` / `outcome` / issue ids. If the cron hit the HTTP API, also search `requestId` from that run’s access log.

### Stripe webhooks

Search `stripe.webhook` or the Stripe event id (`stripeEventId`). Do not expect raw body dumps (redacted / not logged).

## Before vs after

| Before | After |
|---|---|
| Scattered `console.*`, hard to correlate | JSON logs with `requestId` / `traceId` |
| No access timing | Every request: method, path, status, `durationMs` |
| Cron structured, API mostly not | Shared logger; cron bridged |
| Guess when a 500 happened | Timestamp + request id from response / logs |

## Env vars

| Variable | Notes |
|---|---|
| `LOG_LEVEL` | Optional; defaults by `NODE_ENV` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional OTLP HTTP endpoint for a vendor UI |

On deploy, Render sends `SIGTERM`; the process flushes pending spans/logs before exit.
