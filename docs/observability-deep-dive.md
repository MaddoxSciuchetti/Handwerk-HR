# Observability Deep Dive — PRs #225 and #226

API: Render web service (Express + Prisma)  
PRs: [#225](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/225), [#226](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/226)

Companion frontend evidence (Web Vitals / bundle work): [`optimization-deep-dive.md`](./optimization-deep-dive.md).  
Day-to-day runbook: [`ops/observability.md`](../ops/observability.md).  
Code map: [`server/README.md`](../server/README.md).

This is SE_46 evidence for the observability side of Performance, Scaling, and Observability. These PRs did not change page-load or throughput numbers the way #223/#224 did on the frontend — they changed how we see and debug the backend when something goes wrong.

---

## Purpose

On the frontend I improved quality by measuring Web Vitals and cutting unnecessary work. On the backend the quality problem I cared about was different: when a user hits a 500 or a cron/webhook fails, I need to find *that* failure in Render (or Sentry) in seconds — not by guessing from timestamps and `console.log` noise.

So #225 and #226 built a correlated observability stack: every request gets an id, every access gets a duration line, hot integrations share one log shape, traces exist when we want them, and exceptions land in Sentry (with UptimeRobot still watching “is the host up?”).

What I would do differently next time:

1. Decide earlier that Sentry owns tracing when the DSN is set (and document that), instead of discovering dual-OTEL confusion later.
2. Exercise a real OTLP destination in staging, or lean fully on Sentry Performance and keep the optional NodeSDK path clearly “off when Sentry is on.”
3. Run the load probe (`ops/loadtest`) on staging once credentials are ready and paste the concurrent-user numbers here — that is the scaling half of the module, separate from this logging work.

---

## Definitions

requestId: UUID (or inbound `X-Request-Id`) per HTTP request; echoed on the response and merged into logs.

traceId / spanId: OpenTelemetry ids for the distributed trace and current span.

Access log: One structured line when the response finishes — method, path, status, `durationMs`, correlation ids.

event + outcome: Searchable log fields (`http.access`, `stripe.webhook`, …) with `ok` / `error` / similar.

pino: JSON logger in production (pretty locally), with secret redaction.

AsyncLocalStorage: Carries request context across async work so handlers do not pass `requestId` by hand.

OpenTelemetry: Vendor-neutral tracing; we auto-instrument HTTP and can export via OTLP when our NodeSDK runs.

Sentry: Error + sampled performance product (`SENTRY_DSN` / `VITE_SENTRY_DSN`). When the server DSN is set, Sentry owns tracing and our NodeSDK stays off.

---

## PR #225 — Structured logging and OpenTelemetry

### What we did

We replaced ad-hoc `console.*` on the hot path with a shared pino logger and request correlation:

- Request id middleware assigns or reuses `X-Request-Id`, binds AsyncLocalStorage, and sets `http.request_id` on the active span.
- Access log middleware writes one `http.access` line per finished request (`durationMs`, status, path). Health/root stay quiet at debug when healthy.
- Logger always merges `requestId` / `traceId` / `spanId` / optional `userId` / `orgId`, and redacts passwords, tokens, cookies, etc.
- OpenTelemetry boots in `index.ts` before Express so auto-instrumentation can patch HTTP; spans go to stdout and optionally to `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Hot paths (Stripe webhooks, Microsoft Graph/token/license/mail, mention mail, cron via `cronLog`) use the same `event` + `outcome` shape.
- The error handler logs `http.error` and returns `requestId` on 500 JSON so a client report maps straight to Render search.
- SIGTERM/SIGINT flush traces and logs; unhandledRejection / uncaughtException are logged before exit.
- Docs: `ops/observability.md` (how to search) and `server/README.md` (how to log in a new feature).

### Effect

Incidents became searchable. Copy `requestId` from a 500 body (or response header), paste it into Render logs, and you get the access line, the error line, and related domain events for that request. You also get per-request timing without attaching a debugger. Tracing is there for “what was slow inside the request,” but day-one ops still start with log search.

### Learning

The highest-leverage piece was `requestId` on the response + structured access/error logs — not the OTEL exporter. Keeping health checks off the info stream mattered so deploy noise does not bury real failures.

---

## PR #226 — Sentry error monitoring

### What we did

We put a product UI on top of the log foundation:

- Server `instrument.ts` initializes `@sentry/node` from `SENTRY_DSN` before the rest of the app.
- When Sentry is enabled, our OTEL NodeSDK is skipped so two tracing SDKs do not fight.
- Express `setupExpressErrorHandler` plus our JSON error formatter: 500s become Sentry issues linked to the request; we still log structurally for Render.
- Client `instrument.ts` initializes `@sentry/react` with TanStack Router tracing and session replay (`VITE_SENTRY_DSN` at build time).
- Optional Vite source-map upload when `SENTRY_AUTH_TOKEN` is set.
- Follow-up on this branch: access logs also emit Sentry metrics `http.server.duration` and `http.server.5xx`, and we tag `request_id` / `org_id` / user on the Sentry scope so Issues match Render search.

### Effect

Logs remain the system of record for “search this id on Render.” Sentry is the system of record for “group, assign, and alert on exceptions,” and (with Performance + those metrics) for “this route got slow or started returning 5xx” — which UptimeRobot will not catch if the host is still pingable.

### Learning

Pick one tracing owner per process. Also: client DSN is a frontend *build* env (`VITE_*`); server DSN is an API *runtime* env — easy to misconfigure across two Render services.

---

## How to prove it works (manual)

1. Hit an API route → response has `X-Request-Id`.
2. Force a 500 → body includes `requestId`.
3. Render → API logs → search that id → `http.access` / `http.error` (and domain events on hot paths).
4. With DSNs set, trigger a test exception once → confirm in Hadox `handwerk-hr-server` / `handwerk-hr-frontend`, then resolve.
5. Optional: with Sentry unset and `OTEL_EXPORTER_OTLP_ENDPOINT` set, confirm spans leave the process.

Unit coverage: redact helper, request-id middleware, cron log bridge.

---

## Using Sentry for alerts (alongside UptimeRobot)

UptimeRobot: “is the API reachable?”  
Sentry: “is it erroring or slow while still up?”

In project `handwerk-hr-server` → Alerts / Monitors:

- Spike in `http.server.5xx` or failure rate for a few minutes.
- p95 of `http.server.duration` (e.g. filter route `/tasks`) above a budget such as 2000 ms.
- Optional: new Issues / regression of a resolved issue.

Sampled transactions (`tracesSampleRate`: 10% prod / 100% local) feed Performance; the custom metrics give you something concrete to hang monitors on.

---

## Load probe (concurrent users) — separate from #225/#226

These observability PRs did not measure capacity. For that, use [`ops/loadtest/run.mjs`](../ops/loadtest/run.mjs):

- baseline: fixed concurrent clients → p50/p95/error%.
- ramp: raise concurrency until error rate or p95 blows a budget → practical ceiling for that path.

Prefer local/staging. Non-local needs `LOADTEST_ALLOW_NON_LOCAL=1`. Paste real numbers here after a staging run.

---

## Still interesting (not claimed done by #225/#226)

- Caching hot org-scoped reads (`/tasks`, templates, license status) — frontend already uses React Query staleTime; backend TTL/Redis is optional next.
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

---

## File map

```
server/src/instrument.ts
server/src/index.ts
server/src/observability/*          # logger, ALS, OTEL, redact, shutdown
server/src/middleware/requestId.middleware.ts
server/src/middleware/sentryContext.middleware.ts
server/src/middleware/accessLog.middleware.ts
server/src/middleware/errorHandler.ts
client/src/instrument.ts
ops/observability.md
ops/loadtest/run.mjs
```
