# Structured logging (pino)

Sentry / Crons / alerts: [observability.md](./observability.md). Searching Render: [find-failed-requests.md](./find-failed-requests.md).

## Replace `console.log` with `logger`

Same place as `catch (error) { console.log(error) }` — still catch, still log — but use `logger` from `@/observability/logger`.

Real example (`server/src/controllers/stripeWebhook.controller.ts`):

```ts
import { logger, serializeError } from "@/observability/logger";

try {
    const event = parseStripeEvent(req);
    logger.info("Stripe webhook received", {
        event: "stripe.webhook",
        outcome: "received",
        stripeEventId: event.id,
        stripeEventType: event.type,
    });
    await dispatchStripeWebhookEvent(event);
    logger.info("Stripe webhook handled", {
        event: "stripe.webhook",
        outcome: "ok",
        stripeEventId: event.id,
        stripeEventType: event.type,
    });
    res.json({ received: true });
} catch (err) {
    logger.error("Stripe webhook failed", {
        event: "stripe.webhook",
        outcome: "error",
        stripeEventType: eventType,
        error: serializeError(err),
    });
    next(err);
}
```


`serializeError` turns an `Error` into `{ name, message, stack }` so the stack is a JSON field.

Another real failure branch (`server/src/services/tasks.service.ts`) — no `try/catch`, just an `if` when mail fails:

```ts
import { logger } from "@/observability/logger";

if (sent.error) {
    logger.error("Mention mail failed", {
        event: "task.mention_mail",
        outcome: "error",
        issueId: issue.id,
        recipientUserId: person.id,
        message: sent.error.message,
    });
    mailFailed = true;
}
```

Those lines only run when that code path runs. Output goes to stdout → Render (see below).

## How an error shows up in Render

On the host, each `logger.error` is one JSON line in the web service Logs tab. Example shape after a Stripe webhook failure (fields from the real call above; values illustrative):

```json
{
    "level": 50,
    "time": "2026-11-19T10:15:42.123Z",
    "service": "handwerk-hr-server",
    "msg": "Stripe webhook failed",
    "event": "stripe.webhook",
    "outcome": "error",
    "stripeEventType": "customer.subscription.updated",
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "error": {
        "name": "Error",
        "message": "Missing stripe-signature header",
        "stack": "Error: Missing stripe-signature header\n    at parseStripeEvent ..."
    }
}
```

Field meanings:

| Field | Where it comes from | What it is for |
| --- | --- | --- |
| `level` | pino | Severity number (`50` = error, `40` = warn, `30` = info) |
| `time` | pino | When the line was written (ISO UTC) |
| `service` | `logger.ts` `base` | Always `handwerk-hr-server` so you know which app |
| `msg` | first argument to `logger.error(...)` | Short human sentence |
| `event` | your fields object | Stable search key for this feature (`stripe.webhook`) |
| `outcome` | your fields object | How it ended (`error`, `ok`, `received`, …) |
| `stripeEventType` | your fields object | Extra id for this feature (other logs use `issueId`, etc.) |
| `requestId` | request context (middleware) | Ties this line to the HTTP request; search key in Render |
| `error.name` / `message` / `stack` | `serializeError(err)` | What threw, why, and where in code |

The same `requestId` also appears on the response (`X-Request-Id` / 500 body) and on the access line when the request finishes (`event: "http.access"`, often with `statusCode` 500).

### What to do

1. Copy `requestId` from the client 500 body, or search Render Logs for the `event` name (e.g. `stripe.webhook` or `task.mention_mail`).
2. Paste that id into Render → API service → Logs search. You should see the feature error line and the matching `http.access` / `http.error` lines for the same request.
3. Read `error.message` / `stack` (or `message` on mention-mail failures) and the `time` field for when it happened.
4. Fix the cause in code or config; redeploy as usual. For a longer chase checklist see [find-failed-requests.md](./find-failed-requests.md).

## Why not `console.log`?

| `console.log(error)` | `logger.error("…", { … })` |
| --- | --- |
| Free-form text in Render | One JSON line you can search |
| No request id | `requestId` attached automatically |
| Easy to leak passwords/tokens | Known secret fields redacted |
| Hard to filter by feature | Stable `event` / `outcome` fields |

Locally: `pino-pretty`. On Render: JSON. Some older paths still use `console.error`; new code should use `logger`.

## Shared logger

All feature code should use `logger` from `@/observability/logger`, not `console.*`. The wrapper is pino under the hood. It merges request context (`requestId`, optional `userId` / `orgId`) and redacts secrets (`password`, `token`, cookies, and similar).

From `server/src/observability/logger.ts`:

```ts
export const rootLogger = pino({
    level: isTest ? "silent" : level,
    base: { service: "handwerk-hr-server" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            "password",
            "passwd",
            "secret",
            "token",
            "authorization",
            "cookie",
            "accessToken",
            "refreshToken",
            "apiKey",
            "req.headers.authorization",
            "req.headers.cookie",
        ],
        censor: "[Redacted]",
    },
    transport:
        !isProduction && !isTest
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
});

export const logger = {
    info(message: string, fields: LogFields = {}) {
        rootLogger.info(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
    warn(message: string, fields: LogFields = {}) {
        rootLogger.warn(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
    error(message: string, fields: LogFields = {}) {
        rootLogger.error(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
    debug(message: string, fields: LogFields = {}) {
        rootLogger.debug(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
};
```

Locally, `pino-pretty` keeps lines readable. On Render, output is JSON. In tests, the level is silent. `LOG_LEVEL` controls verbosity at runtime.

## Assigning request ids

Middleware runs first on every request. It reuses an incoming `X-Request-Id` or creates a UUID, puts it on `req`, echoes it on the response, and binds async context so later `logger` calls include it automatically.

From `server/src/middleware/requestId.middleware.ts`:

```ts
const requestId = readIncomingRequestId(req) ?? randomUUID();
req.requestId = requestId;
res.setHeader("X-Request-Id", requestId);

bindRequestContext({
    requestId,
    ...(spanContext?.traceId ? { traceId: spanContext.traceId } : {}),
    ...(spanContext?.spanId ? { spanId: spanContext.spanId } : {}),
});
```

On finish, `accessLogMiddleware` writes one `http.access` line with method, path, status, `durationMs`, and that same `requestId`. Quiet paths like `GET /` stay at debug when they succeed. A 500 body also includes `requestId` from `errorHandler`.

## How it is wired (one request)

```
HTTP request
  → requestIdMiddleware
  → your route / controller / service (logger.info / .warn / .error)
  → accessLogMiddleware (on finish)
  → errorHandler (on thrown 500)
```

You do not pass `requestId` into every log call. Middleware stores it; `logger` merges it.

| Piece | Path |
| --- | --- |
| pino + `logger` / `serializeError` | `server/src/observability/logger.ts` |
| request id + context | `server/src/middleware/requestId.middleware.ts` |
| one access line per request | `server/src/middleware/accessLog.middleware.ts` |
| 500 body includes `requestId` | `server/src/middleware/errorHandler.ts` |

Mounted early in `server/src/server.ts`.

## Env

`LOG_LEVEL` sets verbosity. Tests silence the logger. No DSN required for logging — that is only for Sentry.
