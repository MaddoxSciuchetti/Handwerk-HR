# Frontend documentation

This folder is the entry for the React + Vite SPA (`client/`). Quality for users shows up here as fast, stable pages — not just features that work once.

## Software quality focus (SE frontend)

We treat frontend performance as a product requirement: slow first paint, layout shift, and heavy polling hurt trust the same way a bug does. The core implementation that shows how seriously we take this is measuring Web Vitals (LCP, INP, CLS, and related signals), setting a baseline outside localhost, then shipping optimizations and re-measuring.

Read the evidence and approach: [Frontend optimization deep dive](../optimization-deep-dive.md).

### User context → UX we ship

Optimization is not only bundle size and Web Vitals. It is also matching how people actually use the product: phones on site, large office monitors, interrupted sessions, and assistive technology. The patterns below are concrete UX we already implement so the app stays usable and *feels* fast in that context.

| Context | What we do | Example in code |
| --- | --- | --- |
| Users leave mid-flow (tab close, call, network blip) | Persist drafts / prefs on device with `localStorage` so work is still there when they return | Questionnaire answer drafts: [`questionnaireAnswerDraft.ts`](../../client/src/features/questionnaire/questionnaireAnswerDraft.ts). Same idea for table prefs ([`useWorkerTablePrefs.ts`](../../client/src/features/worker-lifecycle/hooks/useWorkerTablePrefs.ts)) and task phase tabs ([`taskPhaseStorage.ts`](../../client/src/features/worker-task-management/taskPhaseStorage.ts)). |
| Phones *and* very large monitors | Responsive / dynamic layout: stacked mobile forms, touch-friendly targets, wide `md:max-w-8xl` shells on desktop | Mobile-first questionnaire rows + CSS vars: [`QuestionnaireTableRows.tsx`](../../client/src/features/questionnaire/QuestionnaireTableRows.tsx). Touch sizing under 40rem: [`questionnaire-mobile.css`](../../client/src/features/questionnaire/questionnaire-mobile.css). Shared token / hierarchy frame: [`client/styling-system-frame.md`](../../client/styling-system-frame.md). |
| Screen readers and keyboard users | Semantic HTML plus ARIA labels / roles / live regions so assistive tech can announce structure and state | Section / group / field labels in the same questionnaire table rows file; shared primitives such as [`sidebar.tsx`](../../client/src/components/ui/sidebar.tsx) (`aria-label`, `sr-only`) and status feedback via `role="status"` / `aria-live`. |

These UX choices reinforce frontend optimization: on-device drafts avoid redundant re-entry and round-trips, layouts that do not jump between breakpoints protect CLS, and lean semantic markup keeps interaction paths clearer for INP. Measure the vitals in the deep dive; treat this table as the product-context companion to that work.

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
- Frontend-specific implementation decisions (context, forms, pagination): [client/decisions.md](../../client/decisions.md)
- Styling system frame (tokens, hierarchy, shared UI rules): [client/styling-system-frame.md](../../client/styling-system-frame.md)
- Vite / React toolchain notes: [client/README.md](../../client/README.md)
- Frontend performance work and web-vitals notes: [optimization-deep-dive.md](../optimization-deep-dive.md)
- User context UX (device storage, responsive layouts, semantic/ARIA): [User context → UX we ship](#user-context--ux-we-ship)
- Recurring review checks (routes, mentions, cleanup): [docs/review.md](../review.md)
- Local setup, env vars, and common scripts: [root README](../../README.md)
- Client unit tests and coverage (`npm run test:unit`, `test:coverage`): [Tests](../clean-code-testing/tests.md)
- Pull request expectations: [review checklist](../clean-code-testing/review-checklist.md)
