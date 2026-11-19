# Information about CI/CD pipeline

CI runs in GitHub Actions. CD is not a GitHub Actions deploy job — Render auto-deploys from the git branches you wire up in the Render Dashboard (typically staging and production). There is no `deploy.yml` in this repo.

For a joiner: merge (or push) to a branch that a Render service tracks → Render builds and ships that service. Schema changes land safely because Prisma migrate runs once as a Render pre-deploy step after the build succeeds and before the new app process starts.

## End-to-end picture

```
PR opened
  └─ GitHub Actions: PR checks (client, then server)

PR merged into a Render-tracked branch (e.g. main / staging)
  └─ Render auto-deploy for that service
       1. Build the new release
       2. Pre-deploy: prisma migrate deploy  (apply pending migrations)
       3. Start the new process
```

GitHub Actions never deploys to Render staging or production. Nightly E2E also stays on the Actions runner (local Postgres + API), not on Render URLs.

## What CI runs today

| Workflow | File | When | What |
|----------|------|------|------|
| PR checks | `.github/workflows/pr-checks.yml` | Every pull request (+ `merge_group` for merge queue) | Client lint / typecheck / unit; then server typecheck / unit |
| Nightly unit tests | `.github/workflows/nightly-unit.yml` | Daily 03:05 UTC + manual | Same client + server unit checks on `main` tip |
| E2E nightly | `.github/workflows/e2e-nightly.yml` | Daily 03:20 UTC + manual | Postgres + API + Playwright on the GitHub runner (not production, not Render staging) |

Public repos: GitHub disables scheduled workflows after 60 days without repo activity. They stay off until someone re-enables the workflow in the Actions UI, or a write-access commit changes the `cron` on the default branch (that reactivates the schedule). Prefer a manual Run workflow after restore to prove green immediately — do not wait for the next cron alone.

## What is enabled on `protect-main`

Ruleset: `protect-main` (targets `refs/heads/main`). CI workflow: [`.github/workflows/pr-checks.yml`](../../.github/workflows/pr-checks.yml).

`main` deploys via Render auto-deploy on the branches configured there. The GitHub ruleset and PR checks keep broken or unchecked code off the tip that production follows.

### Restrict deletions

Nobody can delete the `main` branch (unless they are on a bypass list, which is empty). That stops an accidental or malicious `git push origin --delete main`.

### Require a pull request before merging

Commits cannot land on `main` by direct push. Every change goes through a pull request first, so there is a visible diff, discussion, and CI run before the tip moves.

### Require status checks to pass

GitHub will not update `main` until the required check has succeeded on that PR head. Today the required check is:

- Client lint, typecheck & unit tests

That job lives in `pr-checks.yml`. The server job also runs on every PR, but it is not yet listed as a required check in the ruleset. Prefer also requiring Server typecheck & unit tests once it stays stable.

### Block force pushes

History on `main` cannot be rewritten with `git push --force`. That keeps the deploy history honest and prevents silently dropping commits that already ran in production.

### What the CI pipeline does on every pull request

On every `pull_request` (and on `merge_group` if a merge queue is ever enabled), GitHub Actions runs `.github/workflows/pr-checks.yml`:

1. Client — `npm run lint:src`, then typecheck, then unit tests.
2. Server — typecheck, then unit tests (after the client job succeeds).

The client linter runs on every pull request. It is not optional for merging into `main`, because that client job is the required status check. Server lint is not in this workflow yet; the server gate is TypeScript + Jest unit tests.

There is also a scheduled nightly unit workflow that re-runs the same style of client and server unit checks against the tip of `main`. That is regression coverage, not a merge gate.

### Agents and review bots

Cursor Bugbot, Copilot review, and similar agents are not part of `protect-main`, and they are not defined in `.github/workflows/`. Nothing in this repository’s ruleset or Actions YAML requires an agent to review or approve a PR.

### What is intentionally off (for now)

- Restrict creations / Restrict updates
- Require linear history
- Require deployments to succeed
- Require signed commits
- Require code scanning / code quality / coverage thresholds
- Automatically request Copilot code review
- Merge queue — `pr-checks.yml` already listens for `merge_group`, but the queue feature is not offered on this ruleset/account yet

### How to verify branch protection

1. Open Settings → Rules → `protect-main` and confirm the four enabled rules above.
2. Open any open PR → Checks: you should see Client lint, typecheck & unit tests (required) and Server typecheck & unit tests.
3. Try to push straight to `main` or force-push: GitHub should reject it.
4. Read `.github/workflows/pr-checks.yml` for the exact lint / typecheck / test commands.

## Deploy (Render auto-deploy + Prisma migrate)

Render owns shipping. In the Dashboard, each web service has auto-deploy enabled for its tracked branch. When that branch updates, Render starts a deploy — you do not click “deploy” from GitHub Actions.

Order on each API deploy (important for schema PRs) — Render’s lifecycle is build → optional pre-deploy → start ([Render deploys](https://render.com/docs/deploys#pre-deploy-command)):

1. Build (`npm run build`) produces the new release. If the build fails, pre-deploy never runs (no migration attempt).
2. Pre-deploy command runs against the service’s `DATABASE_URL` and applies pending migrations with Prisma (`npm run migrate:deploy` from `server/`, which wraps `prisma migrate deploy`). This happens once per successful build, after build and before the new process is started.
3. Start (`npm start`) brings up the new app process against the already-migrated database.

So: merge a migration on a tracked branch → Render auto-deploy → build → migrate → start. Do not expect GitHub Actions to run production migrations. Commit migration folders under `server/src/prisma/migrations/` with the app change; Render’s pre-deploy applies them.

Local / first-time DB setup still uses the same `prisma migrate deploy` command manually — see the root README (“First-time setup” and “Production / Render”). Ops runbooks that say “pre-deploy Prisma migrate as usual” mean this same step (e.g. [`ops/anniversary-reminders.md`](../../ops/anniversary-reminders.md)).

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

Smoke-test: Actions → E2E nightly → Run workflow.

## Merge queue

The PR checks workflow already listens for `merge_group` (GitHub Merge Queue). The queue itself is not enabled on this repo yet (`mergeQueue` is null).

To turn it on (repo admin):

1. GitHub → Settings → General → Pull Requests → enable Merge queue (if offered).
2. Settings → Rules → `protect-main` → require status checks (at least the Client check; ideally Server too). If Require merge queue is not in the rules list for this account, use Allow auto-merge plus required checks instead.
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
