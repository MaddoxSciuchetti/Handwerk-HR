# Information about CI/CD pipeline

This repository uses GitHub Actions for checks. Deploy to Render is still driven by Render’s auto-deploy from the branches you configure there (not by a custom deploy workflow in this repo).

## What runs today

| Workflow | File | When | What |
|----------|------|------|------|
| PR checks | `.github/workflows/pr-checks.yml` | Every pull request (+ `merge_group` for merge queue) | Client lint / typecheck / unit; then server typecheck / unit |
| Nightly unit tests | `.github/workflows/nightly-unit.yml` | Daily 03:00 UTC + manual | Same client + server unit checks on `main` tip |

`protect-main` ruleset on `main` requires a PR and the status check **Client lint, typecheck & unit tests**. Prefer also requiring **Server typecheck & unit tests** in the ruleset UI once you confirm it is stable.

## Merge queue

The PR checks workflow already listens for `merge_group` (GitHub Merge Queue). The queue itself is **not** enabled on this repo yet (`mergeQueue` is null).

To turn it on (repo admin):

1. GitHub → Settings → General → Pull Requests → enable **Merge queue**.
2. Settings → Rules → `protect-main` (or branch protection) → require status checks that must pass in the queue (at least the Client check; ideally Server too).
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
