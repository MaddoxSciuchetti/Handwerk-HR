# Server

Day-to-day notes for the Express API in `server/`. Local setup, env vars, and deploy live in the [root README](../README.md). Backend map: [docs/backend/Intro.md](../docs/backend/Intro.md).

## Authentication (JWT cookies)

Auth is **cookie-based JWT**, not `Authorization: Bearer` headers. Login/register set two `httpOnly` cookies; protected routes read `accessToken` from the cookie. The SPA never stores tokens in `localStorage`.

| Cookie | Lifetime | Purpose |
|---|---|---|
| `accessToken` | 15 minutes | Short-lived JWT (`userId` + `tokenId`). Sent on every API call via `withCredentials`. |
| `refreshToken` | 30 days | Longer-lived JWT that points at a DB `refreshToken` row. Used only to mint a new access token. |

Secrets: `JWT_SECRET` / `JWT_REFRESH_SECRET` in `src/constants/env.ts`. Signing helpers: `src/utils/jwt.ts`. Cookie options: `src/utils/cookies.ts`.

### Routes (`/auth/v2/...`)

Mounted from `src/routes/auth.route.ts`:

| Method | Path | What it does |
|---|---|---|
| `POST` | `/auth/v2/login` | Verify credentials → create refresh-token row → set both cookies |
| `POST` | `/auth/v2/register` | Create user + cookies |
| `GET` | `/auth/v2/refresh` | Rotate refresh token, set a new `accessToken` cookie |
| `GET` | `/auth/v2/logout` | Revoke DB refresh row, clear cookies |

### Login → cookies (server)

```ts
// src/controllers/auth.controller.ts (login)
const { accessToken, refreshToken } = await loginUser(request);
return setAuthCookies({ res, accessToken, refreshToken })
  .status(OK)
  .json({ message: "Login successful" });
```

`setAuthCookies` writes both cookies as `httpOnly` + `sameSite: "lax"` (and `secure` outside development).

### Protecting a route

```ts
import authenticate from "@/middleware/authenticate";

router.get("/something", authenticate, controller);
```

`authenticate` (`src/middleware/authenticate.ts`) reads `req.cookies.accessToken`, verifies the JWT, loads an active org membership, then sets `req.userId` / `req.orgId`. Missing or expired access tokens return **401** with `errorCode: "InvalidAccessToken"` — that code is what the client interceptor keys off.

### Refresh endpoint (server)

```ts
// src/controllers/auth.controller.ts (refresh)
const refreshToken = req.cookies.refreshToken as string | undefined;
appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

const { accessToken, newRefreshToken } =
  await refreshUserAccessToken(refreshToken);

if (newRefreshToken) {
  res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
}

return res
  .status(OK)
  .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
  .json({ message: "Access token refreshed" });
```

`refreshUserAccessToken` verifies the refresh JWT, checks the DB row is not revoked/expired, **always rotates** the stored token hash, and returns a new access + refresh pair.

### Client interceptor (refresh + retry)

The interesting half of the flow lives in the SPA: [`client/src/config/apiClient.ts`](../client/src/config/apiClient.ts). Axios uses `withCredentials: true` so cookies ride along. On **401 + `InvalidAccessToken`**, a **separate** axios client calls `/auth/v2/refresh`, then retries the original request. A second client avoids the response interceptor calling itself in a loop.

```ts
// client/src/config/apiClient.ts (simplified)

const options = { baseURL: API_URL, withCredentials: true };

// Dedicated client: refresh + retry must NOT go through API's 401 handler again.
const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

const handleTokenRefresh = async (config: AxiosRequestConfig) => {
  try {
    await TokenRefreshClient.get("/auth/v2/refresh"); // sets new cookies
    return TokenRefreshClient(config);                 // retry original request
  } catch {
    queryClient.clear();
    window.location.href = "/login";
  }
};

API.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiErrorResponse>) => {
    const { config, response } = error;
    // ...
    if (status === UNAUTHORIZED && data?.errorCode === "InvalidAccessToken") {
      return handleTokenRefresh(config);
    }
    return Promise.reject({ status, ...data });
  },
);
```

Sequence when an access cookie expires mid-session:

1. App calls a protected API → server `authenticate` returns 401 `InvalidAccessToken`.
2. Interceptor `GET /auth/v2/refresh` with the refresh cookie.
3. Server rotates tokens and sets fresh cookies.
4. Interceptor retries the original request with the new access cookie.
5. If refresh fails → clear React Query cache and redirect to `/login`.

### File map (auth)

```
server/src/
  routes/auth.route.ts          # /auth/v2/* mounts
  controllers/auth.controller.ts
  services/auth.service.ts      # login, refreshUserAccessToken, …
  middleware/authenticate.ts    # cookie JWT gate
  utils/jwt.ts                  # sign / verify
  utils/cookies.ts              # httpOnly cookie helpers
client/src/config/
  apiClient.ts                  # axios + refresh interceptor
```

---

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

## Sentry performance + alerts

When `SENTRY_DSN` is set, Sentry owns tracing (our OTEL NodeSDK stays off). Access logs also emit `http.server.duration` / `http.server.5xx` metrics. Create p95 / 5xx monitors in the Sentry UI for `handwerk-hr-server`.

## Load test

From repo root: `node ops/loadtest/run.mjs` (see `ops/loadtest/README.md`). Or `npm run loadtest` in `server/`.

## Next steps (optional)

Caching/Redis for hot reads, paste first ramp numbers into the deep dive, cron Sentry check-ins.
