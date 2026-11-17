# Security and CI on `main`

Repo: Handwerk-HR  
App stable version: **2.0.0** (`client/` and `server/` `package.json`)  
Ruleset: `protect-main` (targets `refs/heads/main`)  
CI workflow: [`.github/workflows/pr-checks.yml`](../../.github/workflows/pr-checks.yml)

This note lives under backend docs because the API holds secrets, auth, and most of the attack surface. It explains the branch protection on `main`, the versions we treat as current/stable, how we handle vulnerabilities, and what stops environment variables from being pushed into Git.

Companion CI overview: [`docs/clean-code-testing/ci.cd.md`](../clean-code-testing/ci.cd.md). Vulnerability scanning product: [Aikido Security](https://help.aikido.dev/).

---

## Current stable versions

These are the versions we run and document as the current stable stack. CI pins Node to the same major as local prerequisites.

| Piece | Stable version | Where it is pinned |
| --- | --- | --- |
| Application (client + server) | **2.0.0** | `client/package.json`, `server/package.json` |
| Node.js | **20** (20+ locally; CI uses `"20"`) | README prerequisites; `.github/workflows/*` `setup-node` |
| Express | **^5.1.0** | `server/package.json` |
| Prisma Client | **^7.3.0** | `server/package.json` |
| React | **^19.2.0** | `client/package.json` |
| Sentry (API) | **^11.12.0** | `server/package.json` (`@sentry/node`) |

When you report a finding or open a PR, assume this table unless the PR itself bumps a version.

---

## Environment variables and secret push detection

Real secrets never belong in Git. Detection and prevention work in layers:

1. **`.env` is gitignored** at the repo root, in `client/`, and in `server/`. A normal `git add` will not stage those files.
2. **GitHub secret scanning / push protection** watches pushes to this repository. If a commit tries to introduce known secret patterns (API keys, tokens, private keys, and similar credential shapes that often appear in `.env` files), the push can be blocked or an alert is raised so the secret can be revoked and removed from history.
3. **Aikido** also scans the codebase for leaked credentials and dependency issues, so a secret that slipped past a local mistake still shows up in the security backlog.

Operational rule: configure values under the host (Render env, GitHub Actions secrets/variables), never paste them into READMEs, issues, or committed sample files.

---

## When a security vulnerability is found

What we do depends on how it was found (Aikido, GitHub secret alert, dependabot-style advisory, or a human report):

1. **Triage** — Confirm it is real, note severity (critical / high / medium / low), and check whether production or staging is exposed.
2. **Contain** — If a secret was leaked: revoke/rotate it immediately, remove it from the repo (and history if needed), and update Render / GitHub secrets. If a dependency is vulnerable: upgrade or patch on a branch, or temporarily disable the affected path if there is no safe upgrade yet.
3. **Fix** — Land the remediation through a normal pull request into `main` (required checks still apply). Prefer the smallest change that removes the risk.
4. **Verify** — Re-run Aikido / the relevant scan, confirm CI green, and deploy via the usual Render path for the branch that tracks production.
5. **Close the loop** — Mark the finding resolved in Aikido (or the GitHub alert), and reply to the reporter with what changed.

We do not silently ignore open critical/high findings on the stable `2.0.0` line.

---

## How fast we get back to you

If you report a vulnerability (email, GitHub Security advisory/issue, or Aikido-linked report):

- **Acknowledgement:** we aim to reply within **1–2 business days**.
- **Critical / high (especially leaked secrets or auth bypass):** we start containment the same day we confirm it, and target a fix on `main` as soon as a safe patch is ready.
- **Medium / low:** scheduled into the next normal fix cycle; you still get the acknowledgement above with an expected follow-up window.

Please include the affected version (see the stable table), steps to reproduce, and whether any secret may already have been exposed.

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

There is also a scheduled nightly unit workflow that re-runs the same style of client and server unit checks against the tip of `main`. That is regression coverage, not a merge gate.

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
5. Confirm `.env` is ignored and that secret scanning / Aikido still flag a deliberate test secret in a throwaway branch (revoke immediately after).
