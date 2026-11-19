# Finding failed requests (Render)

How to find exactly when something failed in Handwerk-HR using Render logs.

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

## Steps

1. If the client shows a 500 body, copy `requestId`.
2. In Render → your web service → Logs, search that `requestId`.
3. You should see the access line, the error line, and related hot-path events for the same id / `traceId`.
4. Use the ISO `time` field as the exact moment of the failure; `durationMs` shows how long the request ran.

### Cron jobs

Search the job name (first habit from before), e.g. `anniversary-reminder` or `scheduled-deactivation`. Fields still include `event` / `outcome` / issue ids. If the cron hit the HTTP API, also search `requestId` from that run’s access log.

When `SENTRY_DSN` is set, each cron run also reports to Sentry Crons (`anniversary-reminders`, `scheduled-deactivations`). Use Sentry → Crons for missed or failed schedules; use Render logs for the per-run detail.

### Slow API alert

Staging metric alert `API p95 latency too high` fires when `p95` of `http.server` spans stays above 1500 ms (warning) or 2000 ms (critical) for 10 minutes. Find it under Alerts → Monitor Type → Metric, or [rule 2705868](https://hadox.sentry.io/alerts/rules/details/2705868/).

### Stripe webhooks

Search `stripe.webhook` or the Stripe event id (`stripeEventId`).

## Before vs after

| Before                                   | After                                             |
| ---------------------------------------- | ------------------------------------------------- |
| Scattered `console.*`, hard to correlate | JSON logs with `requestId` / `traceId`            |
| No access timing                         | Every request: method, path, status, `durationMs` |
| Cron structured, API mostly not          | Shared logger; cron bridged                       |
| Guess when a 500 happened                | Timestamp + request id from response / logs       |
