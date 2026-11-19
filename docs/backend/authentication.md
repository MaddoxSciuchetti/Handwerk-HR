# Authentication and authorization

This page explains how users sign in and how protected routes know who they are. Auth is cookie-based JWT. The API does not use `Authorization: Bearer` headers, and the SPA does not store tokens in `localStorage`.

## Cookies

Login and register set two `httpOnly` cookies. Protected routes read `accessToken` from the cookie on every call (`withCredentials`).

The access cookie lasts 15 minutes and carries `userId` plus `tokenId`. The refresh cookie lasts 30 days and points at a database `refreshToken` row. It is only used to mint a new access token.

Secrets live in [`src/constants/env.ts`](../../server/src/constants/env.ts) as `JWT_SECRET` and `JWT_REFRESH_SECRET`. Signing helpers are in [`src/utils/jwt.ts`](../../server/src/utils/jwt.ts). Cookie options are in [`src/utils/cookies.ts`](../../server/src/utils/cookies.ts).

## Auth routes

Routes are mounted from [`src/routes/auth.route.ts`](../../server/src/routes/auth.route.ts) under `/auth/v2/...`.

`POST /auth/v2/login` verifies credentials, creates a refresh-token row, and sets both cookies. `POST /auth/v2/register` creates a user and cookies. `GET /auth/v2/refresh` rotates the refresh token and sets a new access cookie. `GET /auth/v2/logout` revokes the database row and clears cookies.

## Login on the server

```ts
const { accessToken, refreshToken } = await loginUser(request);
return setAuthCookies({ res, accessToken, refreshToken })
  .status(OK)
  .json({ message: "Login successful" });
```

`setAuthCookies` writes both cookies as `httpOnly` with `sameSite: "lax"` (and `secure` outside development).

## Staging skip-login

For demo staging only, the SPA skips the login form and lands on the main shell.
**Shared entry URL:** `/login` (root `/` redirects there when the flag is on).

| Side | Env | Value |
| --- | --- | --- |
| API | `APP_ENV` | `staging` (never `production`) |
| API | `STAGING_SKIP_LOGIN` | `true` |
| API | `STAGING_SKIP_LOGIN_EMAIL` | optional, default `admin@example.com` |
| Frontend build | `VITE_STAGING_SKIP_LOGIN` | `true` |

The client on `/login` calls `POST /auth/v2/staging-session` (no password in the bundle). The flag is ignored when `APP_ENV=production`. Same-origin `/api` rewrite is still required on Render so the session cookies stick.

## Same-origin API on Render

`onrender.com` is on the [Public Suffix List](https://publicsuffix.org/), so the staging frontend (`bsb-onboarding-frontend-staging.onrender.com`) and API (`bsb-onboarding-backend-staging.onrender.com`) are **different sites**. A `SameSite=Lax` cookie set by the API host is not sent on XHR from the frontend host, so login appears to succeed then the next authenticated call fails.

Production already avoids this: the static site rewrites `/api/*` to the API service and the SPA is built with `VITE_API_URL=/api` (same origin). Staging must match that:

1. Static site rewrite: source `/api/*` → destination `https://bsb-onboarding-backend-staging.onrender.com/*` (before any SPA `/*` → `/index.html` fallback).
2. Build env: `VITE_API_URL=/api`.
3. Confirm `GET https://bsb-onboarding-frontend-staging.onrender.com/api/` returns the API body `here`.

Ops helper: [`ops/fix-staging-api-proxy.py`](../../ops/fix-staging-api-proxy.py) (`RENDER_API_KEY` required). The client also remaps a misconfigured absolute `*.onrender.com` API URL to `/api` at runtime ([`alignHostedApiUrl`](../../client/src/config/env.ts)).

## Protecting a route

```ts
import authenticate from "@/middleware/authenticate";

router.get("/something", authenticate, controller);
```

[`authenticate`](../../server/src/middleware/authenticate.ts) reads `req.cookies.accessToken`, verifies the JWT, loads an active org membership, then sets `req.userId` and `req.orgId`. Missing or expired access tokens return 401 with `errorCode: "InvalidAccessToken"`. That code is what the client interceptor keys off.

When a route also needs a paid organization, mount [`requireSubscriptionAccess`](../../server/src/middleware/requireSubscriptionAccess.ts) after authenticate.

## Refresh on the server

```ts
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

`refreshUserAccessToken` verifies the refresh JWT, checks the database row is not revoked or expired, always rotates the stored token hash, and returns a new access and refresh pair.

## Refresh on the client

The SPA half lives in [`client/src/config/apiClient.ts`](../../client/src/config/apiClient.ts). Axios sends cookies with `withCredentials: true`. On 401 with `InvalidAccessToken`, a separate axios client calls `/auth/v2/refresh`, then retries the original request. The second client avoids the response interceptor calling itself in a loop.

```ts
const options = { baseURL: API_URL, withCredentials: true };

const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

const handleTokenRefresh = async (config: AxiosRequestConfig) => {
  try {
    await TokenRefreshClient.get("/auth/v2/refresh");
    return TokenRefreshClient(config);
  } catch {
    queryClient.clear();
    window.location.href = "/login";
  }
};
```

When an access cookie expires mid-session: the app hits a protected API, the server returns 401 `InvalidAccessToken`, the interceptor refreshes cookies, the original request is retried, and if refresh fails the client clears cache and redirects to `/login`.

## Where the code lives

Server pieces: `routes/auth.route.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `middleware/authenticate.ts`, `utils/jwt.ts`, `utils/cookies.ts`. Client piece: `client/src/config/apiClient.ts`.
