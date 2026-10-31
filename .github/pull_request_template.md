## Description

What changed and why (a few bullets is fine).

- What
- Why
- Anything reviewers should watch for

## Testing

How this was verified (commands run, what you clicked, what you checked). Paste evidence when useful (test output summary, not a wall of logs).

## Risk

Pick one and say why:

- **Low** — docs, copy, internal-only, or additive behind a flag
- **Medium** — ordinary product / navigation / shared UI changes
- **High** — auth, billing, migrations, CI/release, data loss, or wide blast radius

What automated checks would miss if this went wrong:

## How to revert

Concrete undo steps (e.g. revert this PR / merge commit, flip a flag, redeploy previous staging). Keep it one or two commands when possible.

## Screenshots

Only if UI changed. Delete this section otherwise.

## Docs

Optional: short notes, links, or snippets that help the next person.

## Ready?

Check what applies. Skip the rest.

- [ ] Documented what's new (if it needs docs)
- [ ] In-code comments where the “why” isn’t obvious
- [ ] Tests for new/changed behavior (client: `npm run test:unit`, server: `npm run test:unit` / `npm test`)
- [ ] Lint / typecheck clean for touched areas (`client`: `npm run lint:src`, `npm run typecheck`; `server`: `npm run typecheck`)
