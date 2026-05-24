# Information about CI/CD pipeline

Currently we are using Github Actions to create workflows for our tests. There is one E2E nightly job running all the end to end tests in this application. The reason for this is that the end to end test cover major parts of this application and are testing important code.

## Checklist: adding a new GitHub Actions workflow

- Add a new file under `.github/workflows/<name>.yml` and set the workflow `name:` in the YAML.
- Define `on:` (e.g. `push`, `pull_request`, `schedule`, `workflow_dispatch`) to set when the workflow should run
- Do not commit secrets to the repo; configure them under GitHub Settings → Secrets and variables → Actions, and reference them as `${{ secrets.NAME }}` or `${{ vars.NAME }}` in the YAML. Adding secrets into the yaml will not let you push the changes.
- Pin actions to a version (e.g. `actions/checkout@v4`, `actions/setup-node@v4`).
- In a monorepo, use `working-directory:` for `server` / `client` or set paths explicitly.
- If tests need a database or other services, add `services:` or setup steps; align env vars with what you use locally (Stripe, AWS, JWT, etc.).
- Do Smoke-test: Actions tab → select workflow → Run workflow; only then optionally add branch protection or required checks.
