# Observability Deep Dive — PRs #225 and #226

API: Render web service (Express + Prisma)  
PRs: [#225](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/225), [#226](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/226)

SE_46 evidence for the observability side of Performance, Scaling, and Observability. Runbook: [`ops/observability.md`](../ops/observability.md).

---

## Purpose

#225 and #226 add structured logging, request correlation, OpenTelemetry, and Sentry so production failures are searchable in Render and grouped in Sentry. UptimeRobot still covers host reachability.

What I would do differently next time:

1. Decide earlier that Sentry owns tracing when the DSN is set, instead of discovering dual-OTEL confusion later.
2. Exercise a real OTLP destination in staging, or lean fully on Sentry Performance.
3. Run the load probe (`ops/loadtest`) on staging and paste concurrent-user numbers here.

---

## PR #225 — Structured logging and OpenTelemetry

### What we did

- Request id middleware assigns or reuses `X-Request-Id`, binds AsyncLocalStorage, and sets `http.request_id` on the active span.
- Access log middleware writes one `http.access` line per finished request (`durationMs`, status, path). Health/root stay quiet at debug when healthy.
- Shared pino logger merges `requestId` / `traceId` / `spanId` / optional `userId` / `orgId`, and redacts secrets.
- OpenTelemetry boots before Express; spans go to stdout and optionally to `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Hot paths (Stripe, Microsoft Graph, mention mail, cron) use the same `event` + `outcome` shape.
- Error handler logs `http.error` and returns `requestId` on 500 JSON.
- SIGTERM/SIGINT flush traces and logs; process error handlers log unhandled failures.
- Docs: `ops/observability.md`, `server/README.md`.

### Effect

Copy `requestId` from a 500 body or response header, search it in Render, and you get the access line, error line, and related domain events for that request — plus per-request timing.

### Learning

`requestId` on the response plus structured access/error logs mattered more than the OTEL exporter for day-one ops. Quiet health checks keep deploy noise out of the info stream.

---

## PR #226 — Sentry error monitoring

### What we did

- Server `instrument.ts` initializes `@sentry/node` from `SENTRY_DSN` before the rest of the app.
- When Sentry is enabled, our OTEL NodeSDK is skipped.
- Express `setupExpressErrorHandler` plus our JSON error formatter; 500s become Sentry issues.
- Client `instrument.ts` initializes `@sentry/react` with router tracing and session replay (`VITE_SENTRY_DSN` at build time).
- Optional Vite source-map upload when `SENTRY_AUTH_TOKEN` is set.
- Access logs also emit Sentry metrics `http.server.duration` and `http.server.5xx`; scope tags include `request_id` / `org_id` / user.

### Effect

Render logs stay useful for searching by `requestId`. Sentry groups exceptions and can alert on slow or erroring routes while the host is still up.

### Learning

Pick one tracing owner per process. Client DSN is a frontend build env (`VITE_*`); server DSN is an API runtime env.

---

## How to prove it works (manual)

1. Hit an API route → response has `X-Request-Id`.
2. Force a 500 → body includes `requestId`.
3. Render → API logs → search that id → `http.access` / `http.error`.
4. With DSNs set, trigger a test exception once → confirm in Hadox `handwerk-hr-server` / `handwerk-hr-frontend`, then resolve.

Unit coverage: redact helper, request-id middleware, cron log bridge.

---

## Using Sentry for alerts (alongside UptimeRobot)

UptimeRobot: host reachable.  
Sentry: erroring or slow while still up.

In `handwerk-hr-server` → Alerts / Monitors:

- Spike in `http.server.5xx` or failure rate.
- p95 of `http.server.duration` (e.g. `/tasks`) above a budget such as 2000 ms.

---

## Load probe (concurrent users)

Separate from #225/#226. Script: [`ops/loadtest/run.mjs`](../ops/loadtest/run.mjs).

- baseline: fixed concurrent clients → p50/p95/error%.
- ramp: raise concurrency until error rate or p95 blows a budget.

Prefer local/staging. Non-local needs `LOADTEST_ALLOW_NON_LOCAL=1`.

---

## Still interesting

- Caching hot org-scoped reads (`/tasks`, templates, license status).
- Paste first load-probe ramp results into this doc.
- Propagate `X-Request-Id` from the Vite `apiClient` end-to-end.
- Cron Sentry check-ins for anniversary / deactivation jobs.

---

## Env vars

| Variable | Where | Role |
|----------|-------|------|
| `LOG_LEVEL` | API runtime | pino level |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | API runtime | OTLP export when our NodeSDK runs |
| `SENTRY_DSN` | API runtime | `@sentry/node` (skips our NodeSDK tracing) |
| `VITE_SENTRY_DSN` | Frontend build | `@sentry/react` |
| `SENTRY_AUTH_TOKEN` | Frontend CI/build | Optional source maps |
