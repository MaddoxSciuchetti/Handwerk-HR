# Review log

Recurring checks + short findings. Rule: `.cursor/rules/route-deep-links.mdc`. Skill: `.cursor/skills/review-log/SKILL.md`.

## Recurring

- **Routes:** Removing/renaming a route → grep and retarget every producer (emails, `navigate`, URL helpers) in the same change.
- **Mentions:** Open one → dismiss only that id; email + in-app URLs must match a live route; skip mentions without `workerId`.
- **Cleanup:** Do not leave half-deleted `src/` modules; orphans still typecheck and hide real CI failures.

## Findings

| Date | Src | Sev | Issue | Status |
| --- | --- | --- | --- | --- |
| 2026-10-31 | Codex #205 | P2 | Mention email still linked `/tasks` | Fixed → `/user/:id?taskId=` |
| 2026-10-31 | Codex #205 | P2 | MentionNotice dismissed whole batch on one open | Fixed |
| 2026-10-31 | Bugbot #205 | — | No findings (missed both above) | n/a |
| 2026-10-31 | review #205 | P1 | Client typecheck red (orphans + nullability) | Fixed |
| 2026-10-31 | review #205 | P1 | `employmentContractDraft` failed (deterministic match off) | Fixed → flag on |
| 2026-10-31 | review #205 | P2 | Mentions without `workerId` still listed | Fixed |
| 2026-10-31 | review #205 | P2 | `TaskItem` `workerEngagementId` null → string | Fixed |
| 2026-10-31 | review #205 | P2 | Mention email used `workerEngagement!` | Fixed → guard |
