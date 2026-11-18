# Information about CI/CD pipeline

**CI** runs in GitHub Actions. **CD** is not a GitHub Actions deploy job — Render **auto-deploys** from the git branches you wire up in the Render Dashboard (typically staging and production). There is no `deploy.yml` in this repo.

For a joiner: merge (or push) to a branch that a Render service tracks → Render builds and ships that service. Schema changes land safely because **Prisma migrate runs once as a Render pre-deploy step before the new app process starts**.

## End-to-end picture

```
PR opened
  └─ GitHub Actions: PR checks (client, then server)

PR merged into a Render-tracked branch (e.g. main / staging)
  └─ Render auto-deploy for that service
       1. Pre-deploy: prisma migrate deploy  (apply pending migrations)
       2. Build + start the new release
```

GitHub Actions never deploys to Render staging or production. Nightly E2E also stays on the Actions runner (local Postgres + API), not on Render URLs.

## What CI runs today

| Workflow | File | When | What |
|----------|------|------|------|
| PR checks | `.github/workflows/pr-checks.yml` | Every pull request (+ `merge_group` for merge queue) | Client lint / typecheck / unit; then server typecheck / unit |
| Nightly unit tests | `.github/workflows/nightly-unit.yml` | Daily 03:05 UTC + manual | Same client + server unit checks on `main` tip |
| E2E nightly | `.github/workflows/e2e-nightly.yml` | Daily 03:20 UTC + manual | Postgres + API + Playwright on the GitHub runner (not production, not Render staging) |

Public repos: GitHub **disables scheduled workflows after 60 days without repo activity**. They stay off until someone re-enables the workflow in the Actions UI, or a write-access commit **changes the `cron`** on the default branch (that reactivates the schedule). Prefer a manual **Run workflow** after restore to prove green immediately — do not wait for the next cron alone.

`protect-main` ruleset on `main` requires a PR and the status check **Client lint, typecheck & unit tests**. Prefer also requiring **Server typecheck & unit tests** in the ruleset UI once you confirm it is stable. Full security posture (stable versions, secret/env push detection, vulnerability response): [`docs/backend/security.md`](../backend/security.md).

## Deploy (Render auto-deploy + Prisma migrate)

Render owns shipping. In the Dashboard, each web service has auto-deploy enabled for its tracked branch. When that branch updates, Render starts a deploy — you do not click “deploy” from GitHub Actions.

**Order on each API deploy (important for schema PRs):**

1. **Pre-deploy command** runs against the service’s `DATABASE_URL` and applies pending migrations with Prisma (`npm run migrate:deploy` from `server/`, which wraps `prisma migrate deploy`). This happens **once per deploy, before** the new release is started.
2. **Build** (`npm run build`) and **start** (`npm start`) bring up the new app process against the already-migrated database.

So: merge a migration on a tracked branch → Render auto-deploy → migrate first → then the new code starts. Do not expect GitHub Actions to run production migrations. Commit migration folders under `server/src/prisma/migrations/` with the app change; Render’s pre-deploy applies them.

Local / first-time DB setup still uses the same `prisma migrate deploy` command manually — see the root [README](../../README.md) (“First-time setup” and “Production / Render”). Ops runbooks that say “pre-deploy Prisma migrate as usual” mean this same step (e.g. [`ops/anniversary-reminders.md`](../../ops/anniversary-reminders.md)).

## Where E2E nightly runs

It runs entirely inside GitHub Actions (`ubuntu-latest`):

1. Starts a Postgres service container on the runner.
2. Migrates + seeds that DB, starts the API on `localhost:3000`.
3. Installs the client and runs Playwright against `localhost` (Vite / Playwright config).

It does not call your Render production or staging URLs. The git ref under test defaults to `main` (override with variable `E2E_TARGET_BRANCH` or a manual `workflow_dispatch` ref).

## E2E nightly secrets / variables

Configure under the repo: Settings → Secrets and variables → Actions (not Render env vars):

| Name | Kind | Purpose |
|------|------|---------|
| `E2E_STRIPE_SECRET_KEY` | secret | Stripe test `sk_test_…` |
| `E2E_PLAYWRIGHT_CHEF_EMAIL` | secret | Seeded admin email for authenticated journeys |
| `E2E_PLAYWRIGHT_CHEF_PASSWORD` | secret | Same password as seed |
| `E2E_AWS_ACCESS_KEY_ID` | secret | Worker file upload E2E |
| `E2E_AWS_SECRET_ACCESS_KEY` | secret | Worker file upload E2E |
| `E2E_AWS_REGION` | variable | AWS region (e.g. `eu-north-1`) |
| `E2E_AWS_S3_BUCKET` | variable | Staging/test S3 bucket for CI uploads (not production) |
| `E2E_TARGET_BRANCH` | variable (optional) | Override nightly git ref (default `main`) |

Smoke-test: Actions → **E2E nightly** → Run workflow.

## Merge queue

The PR checks workflow already listens for `merge_group` (GitHub Merge Queue). The queue itself is **not** enabled on this repo yet (`mergeQueue` is null).

To turn it on (repo admin):

1. GitHub → Settings → General → Pull Requests → enable **Merge queue** (if offered).
2. Settings → Rules → `protect-main` → require status checks (at least the Client check; ideally Server too). If **Require merge queue** is not in the rules list for this account, use **Allow auto-merge** plus required checks instead.
3. Optional: set merge method and batch size.
4. Merge a test PR via “Merge when ready” / queue to confirm `merge_group` runs PR checks.

Until that is enabled, merges are still normal PR merges against `main`.

## Checklist: adding a new GitHub Actions workflow

- Add a new file under `.github/workflows/<name>.yml` and set the workflow `name:` in the YAML.
- Define `on:` (e.g. `push`, `pull_request`, `schedule`, `workflow_dispatch`, `merge_group`) to set when the workflow should run.
- Do not commit secrets to the repo; configure them under GitHub Settings → Secrets and variables → Actions, and reference them as `${{ secrets.NAME }}` or `${{ vars.NAME }}` in the YAML.
- Pin actions to a version (e.g. `actions/checkout@v4`, `actions/setup-node@v4`).
- In a monorepo, use `working-directory:` for `server` / `client` or set paths explicitly.
- If tests need a database or other services, add `services:` or setup steps; align env vars with what you use locally (Stripe, AWS, JWT, etc.).
- Smoke-test: Actions tab → select workflow → Run workflow; only then optionally add branch protection or required checks.
