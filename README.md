Onboarding / offboarding workflow tool. Express + Prisma + PostgreSQL on the backend, React + Vite on the frontend.

## Repository layout

> 💡 **Tip — read this before you push**
>
> When having push access to this repository,thoroughly read through the entire codebase. To get a better high-level view, start with these two folders:
>
> - `database/` [intro](/Users/maddoxsciuchetti/fixies-branch/database/Intro.md)
> - `clean-code-testing/`[intro](/Users/maddoxsciuchetti/fixies-branch/clean-code-testing/docs/intro.md)

The folder `database/` gives you the current implementation overview regarding how we store the data that we collect. It also contains detailed information on how we test performance and how we approach database maintenance when this project starts to grow.

The folder `clean-code-testing/` provides you with information on how to write code in this project. This includes how this project approaches testing but also the kind of syntax we write and the folder organization this project follows. If you decide to use an Agent, please include this folder in the context.

High level folder architecture

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

Create a `.env` file in `server/`.

`npm install` in `server/` runs `prisma generate`, which only needs **`DATABASE_URL`** in `.env` (via `prisma.config.ts`).

To run the API (`npm run dev`), set all of the following (see `server/src/constants/env.ts`):

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
APP_ORIGIN=http://localhost:5173
JWT_SECRET=<random string>
JWT_REFRESH_SECRET=<random string>
EMAIL_SENDER=no-reply@example.com
RESEND_API_KEY=<your Resend key; a placeholder only works if you do not send email>
STRIPE_SECRET_KEY=<Stripe secret key, or sk_test_ placeholder for local if unused>
STRIPE_WEBHOOK_SECRET=<Stripe webhook signing secret, or whsec_ placeholder for local>
```

If any of these are unset at runtime, the server throws a generic `Missing environment variable` error (the key name is not repeated in the message).

### Sending real emails locally

Email delivery is available in development, staging and production. The shared
sender is `server/src/utils/sendMail.ts`; it does not restrict delivery by
`NODE_ENV`.

For local Resend delivery, configure `server/.env`:

```dotenv
NODE_ENV=development
USE_MICROSOFT_MAIL=false
QUESTIONNAIRE_MOCK_RESPONSES=false
RESEND_API_KEY=<your real Resend API key>
EMAIL_SENDER=<sender address authorized for your Resend account>
```

Restart the API after changing these settings. A placeholder API key or example
sender address is sufficient for starting the server, but cannot deliver email.
`QUESTIONNAIRE_MOCK_RESPONSES=true` skips questionnaire email delivery and submits
sample answers instead, regardless of environment (see below). With
`USE_MICROSOFT_MAIL=true`, the shared sender uses Microsoft Graph instead of Resend.

Questionnaire links use `FRONTEND_URL`. With a localhost URL, open those links on
the same computer running the frontend.

### Integrations and automations locally

Integration settings and automation selection are available locally. Configure
these backend settings in `server/.env`, then restart the API:

```dotenv
INTEGRATION_SECRET_KEY=<persistent random secret used to encrypt integration credentials>
INTEGRATIONS_LIVE=true
```

Generate the encryption key once, for example with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Keep that value stable and outside Git: changing it makes saved credentials
unreadable. When using an existing database with encrypted integration credentials,
use its existing encryption key.

As an organization administrator, open **Einstellungen → Integrationen**, enter
the provider credentials, activate the integration and save. Automation selection
requires the relevant integration to be active. Execution also requires complete
credentials and `INTEGRATIONS_LIVE=true`; this flag is independent of `NODE_ENV`
and permits real provider actions, including account changes and messages.
Microsoft Teams additionally requires the employee's Microsoft connection.

### Microsoft mail token renewal

For automatic Microsoft Graph mail authentication, configure these on the backend:

```env
USE_MICROSOFT_MAIL=true
MICROSOFT_365_TENANT_ID=<Microsoft tenant ID>
MICROSOFT_365_CLIENT_ID=<application client ID>
MICROSOFT_365_CLIENT_SECRET=<client secret value>
# Optional fallback when no sender is selected for the operation:
MICROSOFT_GRAPH_MAILBOX=<sender mailbox address>
```

The mail service obtains an application token, caches it in memory, and renews it
on the next mail operation starting one minute before expiry. Concurrent operations
share token acquisition. A Graph 401 triggers one renewal and one retry of the
rejected request; timeouts, permission failures and other errors are not retried.
No periodic timer or user sign-in is needed. Client secrets still need rotation
before their own expiration.

Grant the Entra application Microsoft Graph **application** permissions
`Mail.ReadWrite` and `Mail.Send` with administrator consent, and access to the
sender mailbox. This service creates a draft before sending to retain conversation
tracking. A questionnaire's selected sender overrides `MICROSOFT_GRAPH_MAILBOX`.
Application authentication requires an explicit mailbox and cannot use `/me`.

These credentials must be backend environment variables; the organization credentials
saved under Settings → Integrations serve the separate account/workflow integration.
When all three application credential variables are absent, the legacy
`MICROSOFT_GRAPH_TOKEN` remains supported but cannot renew itself. Application
credentials take precedence over that static token; incomplete credentials fail
rather than silently falling back. Restart/redeploy after changing the environment.

### Integration credentials and staging tests

The API requires `INTEGRATION_SECRET_KEY` to encrypt saved Microsoft client secrets
and Crewmeister tokens, including dummy credentials on staging. Generate a random
key (for example, `openssl rand -hex 32`), set it in the backend service's runtime
environment, and restart the API. Keep the key stable across deployments; changing
it makes existing saved secrets unreadable. Use a separate key for each environment.

Saving only checks that required fields are filled; it does not authenticate with
Microsoft or Crewmeister. Placeholder values can test saving and reloading settings.
They cannot test a real provider connection.

`INTEGRATIONS_LIVE` defaults to off. Credentials can still be saved, but sequences
are blocked rather than simulated. To test actual provider operations on staging,
use valid credentials for dedicated test accounts/tenants and explicitly set
`INTEGRATIONS_LIVE=true` on that API service. This enables real provider requests,
including account changes and emails, for all organizations using that service.

For Microsoft workflow tests without real credentials, set this on the staging
**backend** and restart/redeploy the API:

```env
MICROSOFT_SIMULATION=true
INTEGRATIONS_LIVE=false
```

Enable Microsoft under Integrationen and save; credential fields may be left
empty in simulation. If you enter a secret, storing it still requires
`INTEGRATION_SECRET_KEY`. Configure mail templates with a test sender such as
`admin@staging.example.test`, select one of the sample teams, and save the subject
and message. Microsoft account creation/deactivation and onboarding/offboarding
team emails can then be run through their normal task sequences.

The UI shows Testmodus. Accounts use `staging.example.test` and simulated external
IDs. Microsoft requests and account password emails are not sent. Sequences still
update staging employee data, sent markers, task completion, and audit history;
use disposable staging records. This does not simulate other providers or document
delivery through Resend. Crewmeister remains subject to `INTEGRATIONS_LIVE`.
Simulation takes precedence over live Microsoft execution even if
`INTEGRATIONS_LIVE=true`. Unknown simulated Graph operations fail without network
access. Remove `MICROSOFT_SIMULATION` or set it to `false` and restart to return to
normal Microsoft behavior. Keep simulation off in production.

### Simulated questionnaire replies

Set `QUESTIONNAIRE_MOCK_RESPONSES=true` in `server/.env` (or your staging API's
runtime environment), then restart the API. The default is off.

Create onboarding with an email, then click **Senden** in the questionnaire dialog.
The dialog shows **Testmodus**. No questionnaire email is sent: sample answers are
submitted immediately through the normal validation/completion handler. This
updates worker information, fills matching contract fields and creates the normal
contract print task. Continue reviewing and preparing the contract as usual.

The mock uses the actual sent form, respects prefilled values and supports custom
questions. Names are derived from the email; address, birthday and other values
are synthetic. Required file questions receive a generated test PDF through the
normal upload path, so they require the usual working storage configuration.
Contract templates and PDF preparation still use their usual configuration.

Set the flag to `false` or remove it and restart the API to restore real email
delivery. Test records remain ordinary saved onboarding records. This server-wide
flag affects all questionnaire sends in that API environment; leave it off in
production.

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

For document previews and **Drucken**, start Docker Desktop and use
`npm run dev:documents` instead of `npm run dev` in the backend terminal. This
starts the local PDF renderer on port 3001 before starting the API. If the API is
already running, start just the renderer from the repository root:

```bash
docker compose -f compose.documents.yml up -d
```

See `docs/styled-documents.md` for the required font and storage configuration.

## Common scripts

Backend (`server/`):

| Command                                | Purpose                                           |
| -------------------------------------- | ------------------------------------------------- |
| `npm run dev`                          | Run the API with tsx in watch mode                |
| `npm run dev:documents`                | Start the local PDF renderer and run the API      |
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

### Local template integration simulation

Set `INTEGRATIONS_MOCK=true` in `server/.env` and restart the local API
(`cd server && npm run dev`). This mode requires `NODE_ENV=development`;
production and tests ignore the flag. Set it to `false` and restart to use the
normal integrations again.

Select a template and click **Automatisierung starten**. Demo Microsoft mailboxes,
groups, and Teams channels are available without credentials. Choose a sender
and recipients/channels for mail and Teams tasks as usual. Automated tasks stay
in progress for about ten seconds, then receive simulated successful results.
The popup shows elapsed time and progress; task statuses and the application
receipt are saved through the normal database flow. Manual tasks remain
open. No Microsoft or Crewmeister API is called by the template application in
this mode. This flag mocks template applications and their selection lookups;
other integration actions retain their usual behavior.

For repeated local demos, `VITE_INTEGRATIONS_MOCK=true` in `client/.env` keeps the
bottom template picker available after completion. Each fresh selection creates
another task batch for that employee, including when switching templates. This
requires the server mock above; normal deployments keep the one-application
restriction. Existing demo tasks are retained.

### Questionnaire and password mail

With `USE_MICROSOFT_MAIL=true`, the questionnaire and the new Microsoft account
password mail are sent through Microsoft Graph. Both use the signed-in user's
email address as the sender, including on staging. The signed-in address has to
be an active organization mailbox.
