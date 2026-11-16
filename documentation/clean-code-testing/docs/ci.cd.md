# Information about CI/CD pipeline

Currently we are using GitHub Actions for the checks in this repository.

The main PR workflow is [`.github/workflows/pr-checks.yml`](../../../.github/workflows/pr-checks.yml). On every pull request it runs:

1. **Client lint, typecheck & unit tests** — `lint:src`, `typecheck`, `test:unit` in `client/`
2. **Server typecheck & unit tests** — `typecheck`, then `jest --testPathPatterns=test-unit` in `server/` (after client succeeds)

There is no separate E2E nightly workflow in `.github/workflows/` right now. Local PDF visual/layout scripts on the server (`test:pdf-visual`, `test:pdf-layout`) are optional and not part of that PR job.

## Checklist: adding a new GitHub Actions workflow

- Add a new file under `.github/workflows/<name>.yml` and set the workflow `name:` in the YAML.
- Define `on:` (e.g. `push`, `pull_request`, `schedule`, `workflow_dispatch`) to set when the workflow should run
- Do not commit secrets to the repo; configure them under GitHub Settings → Secrets and variables → Actions, and reference them as `${{ secrets.NAME }}` or `${{ vars.NAME }}` in the YAML. Adding secrets into the yaml will not let you push the changes.
- Pin actions to a version (e.g. `actions/checkout@v4`, `actions/setup-node@v4`).
- In a monorepo, use `working-directory:` for `server` / `client` or set paths explicitly.
- If tests need a database or other services, add `services:` or setup steps; align env vars with what you use locally (Stripe, AWS, JWT, etc.).
- Do Smoke-test: Actions tab → select workflow → Run workflow; only then optionally add branch protection or required checks.
