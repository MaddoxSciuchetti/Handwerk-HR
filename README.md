## Repository layout

> 💡 **Tip — read this before you push**
>
> When having push access to this repository, thoroughly read through the entire codebase. Start with the documentation meta entry, then open the area you need:
>
> - Meta entry [docs/docs.md](./docs/docs.md)
> - Clean code & testing [intro](./docs/clean-code-testing/intro.md)
> - Database [intro](./docs/database/Intro.md)
> - Backend [intro](./docs/backend/Intro.md)
> - Frontend [intro](./docs/frontend/Intro.md)

The folder `docs/` holds contributor documentation. [`docs/docs.md`](./docs/docs.md) is the single entry into clean code, database, backend, and frontend. Each intro page links on to the detailed files for that area. If you use an agent, include `docs/` in the context.

```
client/              React + Vite frontend
server/              Express + Prisma backend
docker-compose.yml   Local Postgres for Quick start
docs/
  docs.md            Meta entry
  database/          Database intro + pages
  backend/           Backend intro + pages
  frontend/          Frontend intro + pages
  clean-code-testing/ Clean code intro + pages
```

## Quick start (local)

Install these before you begin:

| Requirement | Why |
| ----------- | --- |
| Node.js 20+ and npm | Run the API and the React client |
| Docker Desktop | Runs the local Postgres database via `docker compose` |

You do **not** need `psql`, Resend, Stripe, or a `client/.env` file for this setup.

Do these four steps in order from a clean clone. Do not skip steps. Do not substitute hosts.

**Host rule (required):** always open the app and call the API as `localhost`. Do **not** use `127.0.0.1`. The login cookie is `SameSite=Lax`; `localhost` and `127.0.0.1` are different sites, so mixing them makes login fail after the first request.

### 1. Start Postgres

From the **repository root**:

```bash
docker compose up -d
```

Wait a few seconds so Postgres accepts connections (the compose file has no healthcheck). This creates Postgres at `localhost:5432` with:

| Setting  | Value         |
| -------- | ------------- |
| User     | `handwerk`    |
| Password | `handwerk`    |
| Database | `handwerk_hr` |

### 2. Create the API env file

There is **no** `server/.env` in the repository (it is gitignored). The Quick start uses `server/.env.example`, which already contains every variable the API requires to boot locally. Copy it once; do **not** edit the values for the standard setup.

```bash
cp server/.env.example server/.env
```

**Required:** `server/.env` (created by the command above). Without it the API will not start.

These are the values you get (they match `docker-compose.yml`):

| Variable | Value | Purpose |
| -------- | ----- | ------- |
| `DATABASE_URL` | `postgresql://handwerk:handwerk@localhost:5432/handwerk_hr` | Local Postgres from step 1 |
| `PORT` | `3000` | API listen port |
| `NODE_ENV` | `development` | Local mode |
| `FRONTEND_URL` | `http://localhost:5173` | Client origin (CORS / redirects) |
| `APP_ORIGIN` | `http://localhost:5173` | Cookie / origin checks |
| `JWT_SECRET` | `local-dev-jwt-secret-change-me` | Access-token signing (local only) |
| `JWT_REFRESH_SECRET` | `local-dev-jwt-refresh-secret-change-me` | Refresh-token signing (local only) |
| `EMAIL_SENDER` | `no-reply@example.com` | From-address placeholder |
| `RESEND_API_KEY` | `re_placeholder` | Placeholder so the API boots without real email |
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` | Placeholder so the API boots without real Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` | Placeholder so the API boots without real webhooks |

Optional extras (`REDIS_URL`, Microsoft, AWS, Sentry, …) are **not** required for this Quick start. Leave them unset.

**Do not create** `client/.env` for this Quick start. The client already defaults to `http://localhost:3000`. Only use `client/.env.example` if the API runs on a different host or port.
### 3. Install dependencies, apply migrations, seed the admin user

```bash
cd server
npm install
npx prisma migrate deploy --schema=src/prisma/schema.prisma
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma db seed
cd ../client
npm install
```

| Command | Purpose |
| ------- | ------- |
| `npm install` (server) | Installs API packages and generates the Prisma client |
| `prisma migrate deploy` | Creates all application tables in Postgres |
| `prisma generate` | Ensures the Prisma client matches the schema |
| `prisma db seed` | Creates the demo organization and admin user in the database |
| `npm install` (client) | Installs frontend packages |

Seed only writes the user into Postgres. You cannot log in yet — that happens after step 4, when the API and client are running.

### 4. Start API and client, then log in

Open **two new terminals**. In each one, `cd` to the **repository root** first (`Handwerk-HR`), then run the commands below. Both processes must stay running before you open the browser.

**Terminal 1 — API (port 3000):**

```bash
cd server
npm run dev
```

**Terminal 2 — client (port 5173):**

```bash
cd client
npm run dev
```

Then open this URL only:

`http://localhost:5173`

Sign in with exactly these credentials (created by the seed in step 3):

| Field    | Value               |
| -------- | ------------------- |
| Email    | `admin@example.com` |
| Password | `Admin123!`         |

In-app documentation: `http://localhost:5173/docs`, or **Dokumentation** in the sidebar.
