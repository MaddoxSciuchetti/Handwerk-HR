# fixies

Onboarding / offboarding workflow tool. Express + Prisma + PostgreSQL on the backend, React + Vite on the frontend.

## Repository layout

> 💡 **Tip — read this before you push**
>
> When having push access to this repository,thoroughly read through the entire codebase. To get a better high-level view, start with these two folders:
>
> - `database/`
> - `clean-code-testing/`



The folder `database/` gives you the current implementation overview regarding how we store the data that we collect. It also contains detailed information on how we test performance and how we approach database maintenance when this project starts to grow.

The folder `clean-code-testing/` provides you with information on how to write code in this project. This includes how this project approaches testing but also the kind of syntax we write and the folder organization this project follows. If you decide to use an Agent, please include this folder in the context.

When opening a pull request please use the following checklist inside pullreqest-guidelines.md

```
client/    React + Vite frontend
server/    Express + Prisma backend
database/  Schema notes
clean-code-testing/
pgbench/   Benchmark queries
```

## Prerequisites

- Node.js 20+
- npm
- A PostgreSQL database (local or hosted, e.g. Neon)
- `psql` if you want to inspect the DB directly

## Environment variables

Create a `.env` file in `server/` with at minimum:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
APP_ORIGIN=http://localhost:5173
JWT_SECRET=<random string>
JWT_REFRESH_SECRET=<random string>
EMAIL_SENDER=no-reply@example.com
RESEND_API_KEY=<your Resend key, or any non-empty value for local>
```

Optional in `client/.env` if the API isn't on `localhost:3000`:

```
VITE_API_URL=http://localhost:3000
```

## First-time setup

```bash
# from repo root
cd server && npm install
npx prisma migrate deploy --schema=src/prisma/schema.prisma
npx prisma generate --schema=src/prisma/schema.prisma

cd ../client && npm install
```

`migrate deploy` applies every migration in `server/src/prisma/migrations/` to the database pointed at by `DATABASE_URL`. Use `migrate dev` instead while developing schema changes.

## Run locally

Two terminals.

```bash
# terminal 1 — backend on :3000
cd server
npm run dev
```

```bash
# terminal 2 — frontend on :5173
cd client
npm run dev
```

Open `http://localhost:5173`.

## Common scripts

Backend (`server/`):


| Command                                | Purpose                                           |
| -------------------------------------- | ------------------------------------------------- |
| `npm run dev`                          | Run the API with tsx in watch mode                |
| `npm run build`                        | Bundle to `dist/index.js` with esbuild            |
| `npm start`                            | Run the built bundle                              |
| `npm run prisma:generate`              | Regenerate the Prisma client after schema changes |
| `npx prisma migrate dev --name <desc>` | Create + apply a new migration                    |
| `npx prisma migrate deploy`            | Apply pending migrations (CI / production)        |
| `npm test`                             | Jest unit tests                                   |


Frontend (`client/`):


| Command             | Purpose                     |
| ------------------- | --------------------------- |
| `npm run dev`       | Vite dev server             |
| `npm run build`     | Production build            |
| `npm run preview`   | Serve the production build  |
| `npm run test:unit` | Vitest unit tests           |
| `npm run test:e2e`  | Playwright end-to-end tests |


## Database changes

1. Edit `server/src/prisma/schema.prisma`.
2. `npx prisma migrate dev --name describe_the_change` — generates and applies a migration.
3. Commit the new folder under `server/src/prisma/migrations/`.

For raw SQL changes (triggers, check constraints, anything Prisma can't express in the schema), use `--create-only` to scaffold an empty migration, then write the SQL by hand and run `npx prisma migrate dev` to apply it.

## Production / Render

The backend builds with `npm run build` and starts with `npm start`. Migrations are applied with `npx prisma migrate deploy`. Set the same environment variables listed above in the Render service config.