# Agent instructions

## Pull requests

When creating or updating a GitHub PR, fill `.github/pull_request_template.md` as the body (do not invent a different layout). Always fill **Testing**, **Risk**, and **How to revert** with concrete content for the change—not placeholders. Agents may draft those sections; the author owns the sign-off. Delete optional sections that do not apply.

## Ship staging

When the user says `ship staging` (or clearly the same intent in few words):

1. Commit only the relevant files for the current work (exclude unrelated dirty files and secrets).
2. Push the current branch to `origin`.
3. Merge that branch into `staging`. If `staging` is checked out in another worktree, run the merge there.
4. Push `staging` to `origin`.
5. Reply with the commit hash and the staging merge result.

Follow normal git safety rules: no force-push, no config changes, no skipping hooks unless explicitly asked.

## Local Prisma sync

Before starting/restarting the local API (or after pull/merge that touches `server/src/prisma/**`), sync local Postgres + Prisma Client so enum/column drift does not surface as app 500s:

1. Confirm `DATABASE_URL` is local (`127.0.0.1` / `localhost`) — never migrate prod/staging here.
2. From `server/`: `npx prisma migrate status --schema=src/prisma/schema.prisma`
3. If pending: `npx prisma migrate deploy --schema=src/prisma/schema.prisma` then `npx prisma generate --schema=src/prisma/schema.prisma`
4. Restart the API after regenerate (`tsx watch` may not reload Client).

Full playbook: `.cursor/skills/local-prisma-sync/SKILL.md`. Classic symptom: `PrismaClientValidationError` / `Expected IntegrationSequence` on `/automation/issues/.../sequence`.
