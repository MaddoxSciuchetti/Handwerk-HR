# Security and CI on `main`

Repo: Handwerk-HR  
Ruleset: `protect-main` (targets `refs/heads/main`)  
CI workflow: [`.github/workflows/pr-checks.yml`](../.github/workflows/pr-checks.yml)

This note explains the branch protection I use on `main`, what the CI pipeline checks on every pull request, and what I deliberately do not claim as a security gate.

Companion CI overview: [`documentation/clean-code-testing/docs/ci.cd.md`](../documentation/clean-code-testing/docs/ci.cd.md).

---

## Why this exists

`main` deploys (via Render auto-deploy on the branches I configure there). I do not want random pushes, force-pushes, or untested merges onto that tip. The GitHub ruleset and PR checks are the first line that keeps broken or unchecked code off the branch that production follows.

---

## What is enabled on `protect-main`

These four rules are on today. Short meaning of each:

### Restrict deletions

Nobody can delete the `main` branch (unless they are on a bypass list, which is empty). That stops an accidental or malicious `git push origin --delete main`.

### Require a pull request before merging

Commits cannot land on `main` by direct push. Every change goes through a pull request first, so there is a visible diff, discussion, and CI run before the tip moves.

### Require status checks to pass

GitHub will not update `main` until the required check has succeeded on that PR head. Today the required check is:

- Client lint, typecheck & unit tests

That job lives in `pr-checks.yml`. The server job also runs on every PR, but it is not yet listed as a required check in the ruleset. I can add Server typecheck & unit tests once I am happy it stays stable.

### Block force pushes

History on `main` cannot be rewritten with `git push --force`. That keeps the deploy history honest and prevents silently dropping commits that already ran in production.

---

## What the CI pipeline does on every pull request

On every `pull_request` (and on `merge_group` if a merge queue is ever enabled), GitHub Actions runs `.github/workflows/pr-checks.yml`:

1. Client — `npm run lint:src`, then typecheck, then unit tests.
2. Server — typecheck, then unit tests (after the client job succeeds).

So yes: the client linter runs on every pull request. It is not optional for merging into `main`, because that client job is the required status check. Server lint is not in this workflow yet; the server gate is TypeScript + Jest unit tests.

There is also a scheduled nightly unit workflow (when merged) that re-runs the same style of client and server unit checks against the tip of `main`. That is regression coverage, not a merge gate.

Deploy itself is still Render auto-deploy from the branch I configure there — not a custom deploy workflow in this repo.

---

## Agents and review bots (what I do not claim)

Cursor Bugbot, Copilot review, and similar agents are not part of `protect-main`, and they are not defined in `.github/workflows/`. Nothing in this repository’s ruleset or Actions YAML requires an agent to review or approve a PR.

If Bugbot comments on a PR, that comes from Cursor’s product settings outside this repo. Useful as an extra pair of eyes — not a security control I can point at in code, and not something I list as “runs on every pull request” the way CI does. The ruleset option Automatically request Copilot code review is off for the same reason: I keep merge gates limited to things I own in GitHub Actions and the ruleset.

---

## What is intentionally off (for now)

From the same branch-rules list, these stay unchecked unless I decide otherwise later:

- Restrict creations / Restrict updates — would lock who can create or update matching refs; too heavy for how I work today.
- Require linear history — would ban merge commits on `main`; I still allow merge, squash, and rebase.
- Require deployments to succeed — would wait on a GitHub Environment deploy before merge; Render owns deploy outside that model.
- Require signed commits — verified GPG/SSH signatures on every commit; not enforced yet.
- Require code scanning / code quality / coverage thresholds — GitHub Advanced Security style gates; not configured as merge blockers here.
- Automatically request Copilot code review — see agents section above.
- Merge queue — `pr-checks.yml` already listens for `merge_group`, but the queue feature is not offered on this ruleset/account yet. Auto-merge plus required checks is the practical fallback.

---

## How to verify

1. Open Settings → Rules → `protect-main` and confirm the four enabled rules above.
2. Open any open PR → Checks: you should see Client lint, typecheck & unit tests (required) and Server typecheck & unit tests.
3. Try to push straight to `main` or force-push: GitHub should reject it.
4. Read `.github/workflows/pr-checks.yml` for the exact lint / typecheck / test commands.
