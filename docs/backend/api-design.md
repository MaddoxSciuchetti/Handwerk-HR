# API design

This page explains how the Express HTTP API is designed for clients. The SPA talks to these routes with JSON and cookies. There is no GraphQL or gRPC surface.

## Overall style

There is one Express app in [`server/src/server.ts`](../../server/src/server.ts). Normal product routes use JSON bodies (`express.json`, limit 8mb). Paths are resource-oriented and mounted once at the app root (`/tasks`, `/worker`, `/billing`, and so on). Relative verbs live inside each router file. Prisma is the ORM behind services; clients never talk to Postgres directly.

We do not publish OpenAPI/Swagger for this app yet. The live contract is the route files, the Zod schemas, and the JSON shapes returned by controllers.

## How routes are mounted

Global middleware runs first (request id, Sentry context, access log), then body parsers and CORS. Endpoints that need a raw body (webhooks) are registered with `express.raw` instead of JSON parsing.

Public or special paths include `/contact`, `/fragebogen`, `/invites`, and document fonts. Auth lives under `/auth/...` (versioned as `/auth/v2/...`). Most product paths use `authenticate`, and many also use `requireSubscriptionAccess`. Stripe and Resend webhooks live under `/webhooks/...`. Cron jobs live under `/internal/cron/...` and use a shared secret, not cookies.

Mounts are where cross-cutting gates belong. A `.route.ts` file only binds an HTTP method and a relative path to a controller.

```ts
app.use("/tasks", authenticate, requireSubscriptionAccess, taskRoutes);
```

```ts
// tasks.route.ts
taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);
taskRoutes.get("/:id/history", fetchTaskHistory);
taskRoutes.post("/:id/comments", upsertTaskComment);
taskRoutes.patch("/:id", updateTask);
taskRoutes.delete("/", deleteTasks);
```

## REST habits

- Collections use noun paths such as `/tasks` or `/document-masters`.
- `GET` lists or reads, `POST` creates, `PATCH` updates partly, and `DELETE` removes.
- Ids sit in the path (`/:id`), sometimes with nested reads like `/:id/history`.
- Controllers answer with `res.status(...).json(...)` using named status constants from [`server/src/constants/http.ts`](../../server/src/constants/http.ts).

Versioning is rare. Auth uses an explicit `/v2/` segment so cookie flows could evolve without renaming the whole mount. New product areas usually get a new prefix rather than a global `/api/v1` wrapper.

## Validation

Bodies and params that need a contract go through Zod schemas in `server/src/schemas/`. Controllers parse at the edge, then call services with typed data. Invalid input becomes a 400 JSON body with field paths via [`errorHandler`](../../server/src/middleware/errorHandler.ts).

## Error responses

Typed failures use `AppError` / `appAssert` and return a message plus an optional `errorCode`. Unexpected failures return 500 with a message and `requestId` so the client can correlate with logs. Zod failures return 400 with a message and an `errors` list of path and message pairs.

```json
{ "message": "…", "errorCode": "…" }
```

## CORS and cookies

CORS allows origins from `APP_ORIGIN` (comma-separated) with credentials enabled, and exposes `X-Request-Id`. Session auth is cookie-based, so the browser must send cookies on API calls.

## Adding a new resource

Choose a clear collection prefix and mount it in `server.ts` with the right middleware. Add a route file with verbs only. Validate with Zod when the body or params matter. Keep status codes consistent with `http.ts`. Prefer plural collection nouns and `PATCH` for partial updates unless a neighboring resource already uses a different pattern — match neighbors.
