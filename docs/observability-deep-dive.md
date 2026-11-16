# Observability Deep Dive — PRs #225 and #226

API: Render web service (Express + Prisma)  
PRs: [#225](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/225), [#226](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/226)

Round 1 (#225) = structured logs + request correlation + OpenTelemetry.  
Round 2 (#226) = Sentry error monitoring on API and React client.

Companion frontend evidence: [`optimization-deep-dive.md`](./optimization-deep-dive.md) (PRs #223 / #224).  
Day-to-day runbook: [`ops/observability.md`](../ops/observability.md).  
Code map for newcomers: [`server/README.md`](../server/README.md).

This write-up is SE_46 evidence for Performance, Scaling, and Observability — focused on the observability half we shipped (logging, tracing, error monitoring). The scaling/performance half (caching, Redis, load testing, horizontal scale) is called out under What we have vs what is still interesting.

---

## Purpose

On the frontend I measured quality with Web Vitals. On the backend the equivalent quality problem is different: when something fails in production, I need to know *exactly which request*, *when*, and *what failed* — without grepping scattered `console.log` lines or guessing from a vague 500.

Before this work, the API mixed ad-hoc `console.*` with a few structured cron helpers. There was no shared request id, no access timing line, no trace export, and no exception product for the Express process. That made incident search on Render slow and incomplete.

The approach:

1. Give every HTTP request a stable `requestId` and put that id on the response, logs, and (when present) the active OpenTelemetry span.
2. Emit one structured access log per finished request (`method`, `path`, `statusCode`, `durationMs`, `requestId`, `traceId`).
3. Instrument hot paths (auth context, Stripe webhooks, Microsoft Graph, mention mail, cron) with the same logger shape (`event` + `outcome`).
4. Bootstrap OpenTelemetry before Express so HTTP auto-instrumentation can patch, and optionally export spans via OTLP.
5. Add Sentry so 500s and uncaught client errors land in a product UI, not only in log text.

Improvements I would have made:

1. Land Sentry and OTEL in a clearer order of ownership earlier — today Sentry owns tracing when `SENTRY_DSN` is set, and our NodeSDK is skipped to avoid dual OpenTelemetry. Documenting that trade-off up front would have saved a round of “why aren’t console spans showing?”.
2. Wire a real OTLP destination (Grafana Cloud / Honeycomb / etc.) in the same PR as the exporter env var, so “optional OTLP” is exercised in staging instead of only ConsoleSpanExporter.
3. Add a small load / latency baseline (p50/p95 on a few hot routes under realistic concurrency) *before* calling the section “Performance and Observability” — right now the measurable wins are operational (find a failure), not latency under load. Uptime is already covered by UptimeRobot.

---

## Definitions

requestId: UUID (or inbound `X-Request-Id`) assigned per HTTP request, echoed on the response, merged into every log line for that request.

traceId / spanId: OpenTelemetry identifiers for the distributed trace and the current span. Present on logs when a span is active.

Access log: One structured line when the response finishes — method, path, status, `durationMs`, correlation ids.

event + outcome: Convention for searchable log fields (`http.access`, `stripe.webhook`, `microsoft365.user_create`, …) with `ok` / `error` / `rejected` / similar.

pino: JSON logger used in production; pretty-printed locally. Redacts common secret keys.

AsyncLocalStorage (ALS): Node API that carries request context across async work so handlers do not pass `requestId` by hand.

OpenTelemetry (OTEL): Vendor-neutral tracing SDK. We auto-instrument HTTP/Express (and related libs), print spans to stdout, and optionally push via `OTEL_EXPORTER_OTLP_ENDPOINT`.

Sentry: Error (and sampled performance) product. Server: `@sentry/node` with `SENTRY_DSN`. Client: `@sentry/react` with `VITE_SENTRY_DSN`, session replay, TanStack Router tracing.

Redaction: Strip passwords, tokens, cookies, Stripe signatures, etc. from structured fields before they hit stdout.

SIGTERM flush: On Render deploy, flush pending spans/logs before exit so the last requests of a release are not lost.

---

## PR #225 — Structured logging and OpenTelemetry

### Before / after

| Signal | Before | After |
|--------|--------|-------|
| Correlation | Mostly none on API paths | `requestId` (+ `traceId` when traced) on access/error logs |
| Client → log map | Guess from time/path | 500 JSON body includes `requestId`; search that in Render |
| Access timing | Not consistent | Every finished request: `durationMs`, status, path |
| Logger | Scattered `console.*` | Shared pino logger; cron bridged via `cronLog` |
| Secrets in logs | Easy to leak via console dumps | pino redact paths + `redactFields` helper |
| Traces | None | OTEL NodeSDK; console exporter; optional OTLP |
| Shutdown | Abrupt | SIGTERM/SIGINT flush of traces + logger |
| Auth on spans | — | `enduser.id`, `organization.id`, `http.request_id` attributes |

### Changes

Request id middleware: Assign or reuse `X-Request-Id`, bind ALS context, set span attribute `http.request_id`. What happened: any log or 500 body can be searched as one incident.

Access log middleware: On `res.finish`, emit `http.access` with timing; health/root stay debug-level when healthy. What happened: every real request has a duration and status line.

pino logger: Service name `handwerk-hr-server`, ISO timestamps, context merge (`requestId`, `traceId`, `spanId`, `userId`, `orgId`), secret redaction. What happened: Render logs are JSON and greppable by field.

OpenTelemetry bootstrap: `startTracing()` runs from `index.ts` before Express import; auto-instrumentations on (fs/dns off); production uses batch span processor. What happened: HTTP work shows as spans; OTLP is one env var away.

Hot-path instrumentation: Stripe webhook, Microsoft Graph/token/license/group/password-mail, mention mail, cron helpers. What happened: domain failures share the same `event`/`outcome` shape as HTTP.

Error handler: Structured `http.error` logs; 500 responses return `requestId`. What happened: support can copy an id from the client and find the stack in Render.

Shutdown + process handlers: Flush on SIGTERM/SIGINT; log unhandledRejection / uncaughtException. What happened: deploy cutovers and process crashes leave a trail.

Docs: `ops/observability.md` (how to search), `server/README.md` (file map + how to log).

### Description

Round 1 turned the API from “print statements and hope” into a correlated observability layer: every request gets an id, every access gets a duration, hot integrations log in one schema, and traces exist even if we only look at stdout today.

### Learning

The highest-leverage piece was requestId on the 500 body + access logs, not the OTEL exporter. Tracing is useful for “how long did children take,” but day-one incident work on Render is still log search. Keeping health checks quiet at info level mattered too — otherwise deploy noise buries real failures.

---

## PR #226 — Sentry error monitoring

### Before / after

| Signal | Before (#225 only) | After (#226) |
|--------|--------------------|--------------|
| API exceptions | Structured logs in Render | Same logs and Sentry issues when `SENTRY_DSN` is set |
| Client exceptions | Browser console / guesswork | `@sentry/react` + replay (sampled) |
| Tracing ownership | Our OTEL NodeSDK always | If Sentry DSN set → Sentry owns traces; NodeSDK skipped (no dual SDK) |
| Source maps | — | Optional Vite upload when `SENTRY_AUTH_TOKEN` is set |
| Sample rates | — | Prod traces ~10%; local 100% for verification |

### Changes

Server `instrument.ts`: Init `@sentry/node` from `SENTRY_DSN` before the rest of the app. What happened: Express 500 path can `Sentry.captureException`.

Skip dual OTEL: `index.ts` only calls `startTracing()` when Sentry is off. What happened: one tracing pipeline, not two fighting exporters.

Error handler: Capture on status ≥ 500. What happened: unexpected failures become Sentry issues with stack + request context from logs via `requestId`.

Client `instrument.ts`: Init with TanStack Router browser tracing + session replay; `VITE_SENTRY_DSN` at build time. What happened: UI crashes and sampled traces land in the frontend Sentry project.

Vite plugin: Source-map upload only when auth token present. What happened: production stacks stay readable without uploading on every local build.

### Description

Round 2 adds a product UI for errors on top of the log/trace foundation. Logs remain the system of record for “search this id on Render”; Sentry is the system of record for “group, assign, and alert on exceptions.”

### Learning

Sentry and a hand-rolled OTEL SDK both want to own OpenTelemetry. Picking one owner per process (Sentry when DSN is set) is simpler than running both. Also: client DSN must be present at frontend build time (`VITE_*`), while server DSN is a runtime env on the API service — easy to misconfigure across two Render services.

---

## How to prove it works (manual)

1. Hit any authenticated API route; response headers include `X-Request-Id`.
2. Force a 500 (or use a known failing path in staging); body includes `requestId`.
3. In Render → API service → Logs, search that id — expect `http.access` and `http.error` (and domain events if on a hot path).
4. With `SENTRY_DSN` / `VITE_SENTRY_DSN` set, trigger a test exception once; confirm the issue in Hadox projects `handwerk-hr-server` / `handwerk-hr-frontend`, then resolve it.
5. Optional: set `OTEL_EXPORTER_OTLP_ENDPOINT` when Sentry is unset, restart, confirm spans leave the process.

Unit coverage already in tree: redact helper, request-id middleware, cron log bridge (`server/test-unit/…`, `cronLog` tests).

---

## What we have vs what is still interesting

Mapped to SE_46 Performance, Scaling, and Observability learning goals.

### Learning Goal 2 — Logging and Monitoring (mostly done)

| Topic | Status in Handwerk-HR |
|-------|------------------------|
| Structured application logging | Done — pino + `event`/`outcome` |
| Request / debug correlation | Done — `requestId` / ALS / 500 body |
| Error monitoring | Done — Sentry client + server |
| Process / deploy flush | Done — SIGTERM handlers |
| Trace export | Partial — OTEL SDK + console; OTLP optional and unused in prod if Sentry owns tracing |
| Metrics time series | Done via Sentry — sampled transactions (`tracesSampleRate`) + custom `http.server.duration` / `http.server.5xx` metrics |
| Alerting (page on error rate / latency) | Configure in Sentry UI (see below); UptimeRobot covers reachability |
| Log aggregation UI beyond Render | Not yet — Render search is enough for now |
| Uptime / synthetic checks | Done outside these PRs — UptimeRobot pings the API periodically |

### Learning Goal 1 — Performance and Scaling

| Topic | Status | Notes |
|-------|--------|-------|
| Caching | Not yet | Still useful for hot read paths; see below |
| Redis | Not introduced | Only needed if multiple API instances share cache/locks |
| Load testing | Script added — `ops/loadtest/` | Run baseline + ramp locally/staging; paste numbers here when you have them |
| Bottleneck finding | Informal + load probe | Pair `durationMs` / Sentry p95 with Prisma notes in `documentation/docs/database/` |
| Horizontal vs vertical scaling | Docs under database scaling; app layer not exercised | Multi-instance story still open |
| Connection pooling / DB pool sizing | Prisma defaults | Tune after the first ramp run shows DB wait |

### How Sentry covers latency and alerts (use what we already have)

With `SENTRY_DSN` set, our NodeSDK tracing is skipped and Sentry owns performance:

1. `tracesSampleRate` (10% prod / 100% local) sends HTTP transactions → Sentry → Performance.
2. `Sentry.setupExpressErrorHandler` links 500s to the active transaction.
3. Access logs also emit `http.server.duration` (distribution) and `http.server.5xx` (count) with low-cardinality `route` / `method` / `status_class`.
4. `request_id` and `org_id` tags + `Sentry.setUser` make Issues searchable the same way as Render logs.

Create the alerts in the Sentry project `handwerk-hr-server` (Alerts / Monitors — UI, not code):

- Failure rate or count of `http.server.5xx` above a threshold for 5 minutes.
- p95 of `http.server.duration` (filter `route:/tasks` if available) above e.g. 2000 ms.
- Optional: spike in new Issues / regression of a resolved issue.
- Keep UptimeRobot for “host down”; Sentry for “up but slow or erroring.”

### Load tests (how many concurrent users?)

Script: [`ops/loadtest/run.mjs`](../ops/loadtest/run.mjs) (readme next to it).

- baseline: fixed VUs (e.g. 20) for 15s → p50/p95/error%.
- ramp: raise concurrency until error rate > 5% or p95 > 2s → that step is your practical ceiling for that path.

Example:

```bash
# Local /tasks with a real user
LOADTEST_EMAIL='…' LOADTEST_PASSWORD='…' LOADTEST_MODE=ramp \
  LOADTEST_PATH=/tasks LOADTEST_MAX_VUS=80 node ops/loadtest/run.mjs
```

Do not point this at production without `LOADTEST_ALLOW_NON_LOCAL=1` and a clear reason — prefer staging. Numbers from a run belong in this doc once collected.

### Caching (still optional)

Frontend already uses React Query `staleTime` / slower polling. Backend caching helps when many tabs re-read the same org-scoped data (`/tasks`, templates, license status). Start with a short in-process TTL before Redis.

### Other adjacent ideas

- Propagate `X-Request-Id` from the Vite `apiClient` so browser → API → Render/Sentry share one id.
- Cron Sentry check-ins for anniversary / deactivation jobs.
- Sampling policy under traffic growth (lower `tracesSampleRate` if volume climbs).

---

## Env vars (quick reference)

| Variable | Where | Role |
|----------|-------|------|
| `LOG_LEVEL` | API runtime | pino level (default debug local / info prod) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | API runtime | Extra OTLP HTTP export when our NodeSDK runs |
| `SENTRY_DSN` | API runtime | Enables `@sentry/node` (and skips our NodeSDK tracing) |
| `VITE_SENTRY_DSN` | Frontend build | Enables `@sentry/react` |
| `SENTRY_AUTH_TOKEN` | Frontend CI/build | Optional source-map upload |

---

## File map (one job each)

```
server/src/instrument.ts                 # Sentry init (first import)
server/src/index.ts                      # Sentry vs OTEL ownership, shutdown hooks
server/src/observability/logger.ts       # pino + serializeError
server/src/observability/requestContext.ts
server/src/observability/tracing.ts      # NodeSDK start/stop
server/src/observability/redact.ts
server/src/observability/shutdown.ts
server/src/middleware/requestId.middleware.ts
server/src/middleware/sentryContext.middleware.ts
server/src/middleware/accessLog.middleware.ts  # + Sentry duration/5xx metrics
server/src/middleware/errorHandler.ts
client/src/instrument.ts                 # Sentry browser + replay
ops/observability.md                     # Render search runbook
ops/loadtest/run.mjs                     # concurrent-user probe
```
