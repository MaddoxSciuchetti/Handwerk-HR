# Observability Deep Dive — PRs #225 and #226

API: Render web service (Express + Prisma)  
PRs: [#225](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/225), [#226](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/226)

SE_46 evidence for the observability side of Performance, Scaling, and Observability. Runbook: [`ops/observability.md`](../ops/observability.md).

---

## Purpose

One issue that reminded me of the importance of having observability and being able to search for request ids came up when I was visiting a user and she was trying out a new feature. Of course the feature failed and I did not know directly what to do. This was before me having implemented any form of request ids or tracing. What continued was a rather long search for the error instead of being able to pinpoint the issue right away. This makes me grateful for my current implementation. Whenever there now is a mistake I can pinpoint the issue much faster due to having a much better insight into my request response cycle and being able to gather more information quickly to understand what the problem is about.

That experience is why I built #225 and #226. I added structured logging, request correlation, OpenTelemetry, and Sentry so that when something fails in production I can search Render by a concrete id and see the matching access line, error line, and related domain events — and so that exceptions also show up grouped in Sentry. UptimeRobot still covers whether the host is reachable at all.

What I would do differently next time:

1. Decide earlier that Sentry owns tracing when the DSN is set, instead of discovering dual-OTEL confusion later.
2. Exercise a real OTLP destination in staging, or lean fully on Sentry Performance.
3. Run the load probe (`ops/loadtest`) on staging and paste concurrent-user numbers here — done; see [Load probe](#load-probe-concurrent-users).

---

## PR #225 — Structured logging and OpenTelemetry

### What I did

I replaced ad-hoc `console.*` on the hot path with a shared pino logger and request correlation so every meaningful request can be found again later.

I added request id middleware that assigns or reuses `X-Request-Id`, binds that id into AsyncLocalStorage for the rest of the request, and sets `http.request_id` on the active span when one exists. Access log middleware then writes one `http.access` line when the response finishes, including `durationMs`, status, and path. Health and root checks stay at debug when they succeed so they do not flood the info stream on Render.

The shared logger always merges `requestId`, `traceId`, `spanId`, and optional `userId` / `orgId` into the fields I log, and redacts secrets such as passwords, tokens, and cookies. I boot OpenTelemetry before Express is imported so HTTP auto-instrumentation can patch correctly; spans go to stdout and, if I set `OTEL_EXPORTER_OTLP_ENDPOINT`, also to that exporter.

On hot paths — Stripe webhooks, Microsoft Graph, mention mail, and cron via `cronLog` — I use the same `event` + `outcome` shape as the HTTP access logs. The error handler logs `http.error` and returns `requestId` in the 500 JSON body so I can copy that id from a failing client and search it. On SIGTERM/SIGINT I flush traces and logs; I also log unhandled rejections and uncaught exceptions before exit. I documented the search habit in `ops/observability.md` and how to log from new features in `server/README.md`.

### Effect

When something fails, I copy `requestId` from the 500 body or the `X-Request-Id` response header, paste it into Render logs, and get the access line, the error line, and related domain events for that same request, including how long it took. That is the difference from sitting with a user and not knowing where to start.

### Learning

For day-one ops, putting `requestId` on the response and writing structured access/error logs mattered more than the OTEL exporter itself. Keeping health checks quiet at info level also mattered so deploy noise does not bury real failures.

---

## PR #226 — Sentry error monitoring

### What I did

I put a product UI on top of the log foundation so I do not only rely on grepping Render.

Server `instrument.ts` initializes `@sentry/node` from `SENTRY_DSN` before the rest of the app. When that DSN is set, I skip my OTEL NodeSDK so two tracing stacks do not fight. I register Express `setupExpressErrorHandler` and keep my JSON error formatter; unexpected 500s become Sentry issues while I still write structured logs for Render.

On the client, `instrument.ts` initializes `@sentry/react` with TanStack Router tracing and session replay, using `VITE_SENTRY_DSN` at build time. If `SENTRY_AUTH_TOKEN` is present, Vite can upload source maps so production stacks stay readable. I also emit Sentry metrics `http.server.duration` and `http.server.5xx` from the access log path, and I tag the Sentry scope with `request_id`, `org_id`, and the user id so an issue lines up with what I search in Render.

### Effect

I still use Render when I already have a `requestId` and want the full log trail. Sentry is where exceptions get grouped and where I can set alerts when a route starts erroring or getting slow even though UptimeRobot still says the host is up.

### Learning

I need one tracing owner per process. The client DSN has to exist at frontend build time (`VITE_*`); the server DSN is a runtime env on the API service — easy to misconfigure across two Render services if I am not careful.

---

## How to prove it works (manual)

1. Hit an API route → response has `X-Request-Id`.
2. Force a 500 → body includes `requestId`.
3. In Render → API logs, search that id → `http.access` / `http.error`.
4. With DSNs set, trigger a test exception once → confirm in Hadox `handwerk-hr-server` / `handwerk-hr-frontend`, then resolve it.

Unit coverage: redact helper, request-id middleware, cron log bridge.

---

## Using Sentry for alerts (alongside UptimeRobot)

UptimeRobot tells me whether the host is reachable. Sentry is for when the host is up but requests are failing or slow.

In project `handwerk-hr-server` → Alerts / Monitors I can create monitors for:

- a spike in `http.server.5xx` or failure rate
- p95 of `http.server.duration` (for example on `/tasks`) above a budget such as 2000 ms

---

## Load probe (concurrent users)

This is separate from #225 and #226. The script lives at [`ops/loadtest/run.mjs`](../ops/loadtest/run.mjs).

- baseline: a fixed number of concurrent clients → p50/p95/error%
- ramp: raise concurrency until error rate or p95 blows a budget → a practical ceiling for that path

I prefer local or staging. Non-local targets need `LOADTEST_ALLOW_NON_LOCAL=1`.

### Staging baseline — `GET /tasks`

Target: `https://bsb-onboarding-backend-staging.onrender.com/tasks`  
Auth: seed admin (`admin@example.com`), one login then cookie reuse  
Mode: `baseline`, `LOADTEST_DURATION_MS=15000`, `LOADTEST_ALLOW_NON_LOCAL=1`

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 721 | 0% | 395 ms | 778 ms | 40087 ms |
| 50 | 709 | 0% | 1049 ms | 1591 ms | 2026 ms |
| 100 | 695 | 0% | 2266 ms | 3070 ms | 3868 ms |
| 150 | 751 | 0% | 3502 ms | 4210 ms | 5388 ms |
| 200 | 712 | 0% | 4816 ms | 6642 ms | 7740 ms |

Notes:

- Zero errors across all five levels; latency grows with concurrency while request count stays roughly flat (~700–750 / 15 s).
- At 20 VUs, p50/p95 are healthy but **max** includes one extreme outlier (~40 s). An earlier 20 VU run on the same host had max ≈ 1967 ms with p50 ≈ 494 ms / p95 ≈ 910 ms / 589 requests — treat the long max as a cold-start or queueing spike, not the typical tail.
- The script’s default p95 budget is 2000 ms; staging `/tasks` already exceeds that from ~100 VUs upward under this probe.

---

## Still interesting

- Caching hot org-scoped reads (`/tasks`, templates, license status)
- Run a load-probe **ramp** on staging and paste the ceiling here
- Propagate `X-Request-Id` from the Vite `apiClient` end-to-end
- Cron Sentry check-ins for anniversary / deactivation jobs

---

## Env vars

| Variable | Where | Role |
|----------|-------|------|
| `LOG_LEVEL` | API runtime | pino level |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | API runtime | OTLP export when my NodeSDK runs |
| `SENTRY_DSN` | API runtime | `@sentry/node` (skips my NodeSDK tracing) |
| `VITE_SENTRY_DSN` | Frontend build | `@sentry/react` |
| `SENTRY_AUTH_TOKEN` | Frontend CI/build | Optional source maps |
