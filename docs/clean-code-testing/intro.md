# Clean code & testing — start here

The aim of this project is to ensure that the user has the highest quality software product. How we approach this problem can best be seen by two core implementations for frontend and backend:

- Frontend — performance as a product requirement (Web Vitals, measured optimizations): [Frontend intro](../frontend/Intro.md)
- Backend — observability as a product requirement (structured logs, tracing, Sentry): [Backend intro](../backend/Intro.md)

Each of those pages also lists the core tools used in that half of the stack.

If you want to add code to this project, improve the README, or change architecture: clone the repo, create a feature branch, then follow this path before your first PR.

### How to contribute (read in order)

1. Read the clean code principles and style guide — write new code to match them. Lint and Prettier do not enforce DRY / KISS / YAGNI; those stay a human responsibility.
2. Code on a feature branch — keep following the principles and style guide while you work.
3. Run Prettier and ESLint (client) before you open a PR when you touched client code:
   - `npm --prefix client run format`
   - `npm --prefix client run lint` (or `npm run lint:src` from `client/`)
   - Details: [Style guide §3.4 / §7.3](style-guide.md). Server has no `lint` / `format` scripts yet — use `npm --prefix server run typecheck` and the tests below.
4. Open a pull request and fill the [PR template](../../.github/pull_request_template.md) — PRs without the template will not be reviewed or merged.
5. CI runs on the PR (lint / typecheck / unit tests) — see [workflow](ci.cd.md). After review, the PR can be merged. Shipping is **Render auto-deploy** from the tracked branch; API deploys run **build → Prisma migrate (pre-deploy) → start** (same doc).

### Context docs

- Frontend quality focus + tools: [Frontend intro](../frontend/Intro.md)
- Backend quality focus + tools: [Backend intro](../backend/Intro.md)
- High level style guide that will help you quickly write your first lines in this project [Style guide](style-guide.md)
- Clean code principles and how they are applied in the codebase. Ensure to follow these! [Principles](principles.md)
- Decisions made in this project [Decisions](decisions.md)
- Handling tests in this project [Tests](tests.md)
- CI/CD of this project [workflow](ci.cd.md)
- Before push / review: [Review checklist](review-checklist.md)

### What is this project about?

This database manages the lifecycle of a handyman that is responsible for repairing heating, ventilation and air-conditioning systems at a hvac company. Due to turnover being high in the trades industry, companies frequently have to onboard and offboard their workers, each event taking a series of tasks (preparing contract, ordering car) that an office worker has to coordinate. This database tracks the workers, the lifecycle they are in and the tasks within each event.

The typical scale consists of 1-10 office workers, 5-50 trades people working with about 5 active engagements. A user may belong to multiple organizations as the organization has the possibility to hire a HR consultant that works on those tasks. There is overall a low concurrency OLTP workload during business hours which is also the only time when the OLTP workload is measurable.

### Implemented use cases

| Use case                                                                  | Implemented? |
| ------------------------------------------------------------------------- | ------------ |
| Users can register, verify email, and log in with persistent sessions     | Yes          |
| Users can reset their password via a one-time reset link                  | Yes          |
| A user can create an organization and becomes its first admin             | Yes          |
| A user can invite others to an organization with a role (admin or worker) | Yes          |
| A user can belong to multiple organizations                               | Yes          |
| New members default to worker unless the invite specifies admin           | Yes          |
| Each organization has one subscription                                    | Yes          |
| The organization’s billing payment method stays in sync with Stripe       | Yes          |
| The app stores invoices consistent with Stripe                            | Yes          |
| A user can add workers to their organization                              | Yes          |
| A user can create engagements (onboarding, transfer, offboarding)         | Yes          |
| A worker can have multiple engagements over time                          | Yes          |
| Each engagement has a status and a responsible user                       | Yes          |
| A user can create issues on an engagement                                 | Yes          |
| Every issue has a required creator and an optional assignee               | Yes          |
| Users can comment on issues                                               | Yes          |
| Changes to issues are recorded in an audit trail                          | Yes          |
| Users get notified when assigned to an issue or when issue status changes | No           |
