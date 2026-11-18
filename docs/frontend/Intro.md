# Frontend documentation

This folder is the entry for the React + Vite SPA (`client/`). Quality for users shows up here as fast, stable pages — not just features that work once.

## Software quality focus (SE frontend)

We treat frontend performance as a product requirement: slow first paint, layout shift, and heavy polling hurt trust the same way a bug does. The core implementation that shows how seriously we take this is measuring Web Vitals (LCP, INP, CLS, and related signals), setting a baseline outside localhost, then shipping optimizations and re-measuring.

Read the evidence and approach: [Frontend optimization deep dive](../optimization-deep-dive.md).

Users also work on phones and large monitors, leave mid-flow, and may rely on assistive tech. To keep UX high in that context we persist drafts and prefs on device (`localStorage`), use responsive layouts from touch-sized mobile forms to wide desktop shells, and ship semantic HTML with ARIA. Examples: [questionnaire answer drafts](../../client/src/features/questionnaire/questionnaireAnswerDraft.ts), [responsive questionnaire rows](../../client/src/features/questionnaire/QuestionnaireTableRows.tsx) / [mobile CSS](../../client/src/features/questionnaire/questionnaire-mobile.css), [sidebar ARIA / `sr-only`](../../client/src/components/ui/sidebar.tsx).

## Core tools

| Area | Tools | Why they matter for quality |
| --- | --- | --- |
| App runtime | React 19, TypeScript, Vite | Typed SPA with a fast local/prod build path |
| Routing & data | TanStack Router, TanStack Query, Axios | Predictable navigation and server-state fetching |
| UI | Tailwind CSS, Radix / shadcn-style primitives | Shared layout and interaction patterns |
| Forms & validation | React Hook Form, Zod | Consistent client validation |
| Quality gates | ESLint, Prettier, `tsc` typecheck | Mechanical correctness and format before review |
| Tests | Vitest, Testing Library | Unit/UI behaviour coverage (`npm run test:unit`) |
| Performance | `web-vitals`, Vite bundle analyze, Puppeteer-based route checks (see deep dive) | Prove load/interaction quality with numbers |
| Errors in prod | Sentry (`@sentry/react`) | Group client exceptions and session context |

Commands joiners use most often (from `client/`):

```bash
npm run format
npm run lint
npm run typecheck
npm run test:unit
```

## Where to go

- How features, components, hooks, imports, and env access are organized: [Style guide — Client](../clean-code-testing/style-guide.md)
- Clean-code principles with live file examples: [Principles](../clean-code-testing/principles.md)
- Why the stack and folder layout look this way (fuller write-up): [Decisions](../clean-code-testing/decisions.md)
- Frontend-only extras (modal context, RHF, client pagination): [client/decisions.md](../../client/decisions.md)
- Client commands and joiner notes: [client/README.md](../../client/README.md)
- Recurring review checks (routes, mentions, cleanup): [docs/review.md](../review.md)
- Frontend performance work and web-vitals notes: [optimization-deep-dive.md](../optimization-deep-dive.md)
- Local setup, env vars, and common scripts: [root README](../../README.md)
- Client unit tests and coverage (`npm run test:unit`, `test:coverage`): [Tests](../clean-code-testing/tests.md)
- Pull request expectations: [review checklist](../clean-code-testing/review-checklist.md)
