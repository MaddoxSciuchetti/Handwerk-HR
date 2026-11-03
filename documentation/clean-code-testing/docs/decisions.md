# Below is the documentation of the key decisions in this project. The goal of this project is to give you a understanding of why certain software patterns are implemented.

## Repository Architecture

Decision: Split the codebase into `client/` (Vite + React), `server/` (Express + Prisma + Stripe webhooks)

Reason: Two developers can work on this project independently and responsibility is more clear. The backend does not need to be express. If a new developer joins that is fluent in java he quickly has the ability to transform the backend using java. Another reason is that it is mentally much easier to understand where code needs to be implemented when a new feature is being introduced

Decision: Prefer `@/` path aliases for source imports on both apps (plus server additions like `@/lib/*`).

Reason: Imports are stable and no `../../../../` chains.

## Client application shape

Decision: Routing is handled with Tanstack Router

Reason: Ensures full type safetey on all routes including first-class search-params for managing the state of the url. Furthermore is it only opionated on the route level but not on the framework level such as Nextjs.

Decision: Domain code is grouped under `features/<kebab-case-name>/` instead of flat folders.

Reason: Kebab-case folder names avoid case issues on disk and read clearly as product areas (`all-tasks`, `settings/payments`). Also do feature foders enable better sclaing when the project grows. They ensure clarity and give you a direct starting point when you need to change code in a feature or need to add a new feature

Decision: Cross-feature `hooks/`, `lib/`, `config/`, `constants/`, and shared `components/` stay at `src/` root.

Reason: This makes it clear what is shared among all the features and what is only specific to the features.

Decision: Typical feature internals use `*.api.ts`, `hooks/use*.ts`, `components/`, `query-options/`, `schemas/`, `types/`, `consts/`.

Reason: It creates clarity and reduces the file size to a minimum. A file therefore does not consist of many different interconnected responsibilities. With the seperate folders the responsibility is more clear, files stay small and the flow of function calls can be traced much better.

Decision: `components/ui/` primitives use lowercase filenames (`sheet.tsx`) while app/feature components use PascalCase.

Reason: Distinguisches the pre built ui components from the functional components that were customly built

## Server application shape

Decision: HTTP surface is `routes/*.route.ts` → controllers → services; validation uses `schemas/*.schemas.ts`.

Reason: One place for the URL mounting; controllers stay thin; Zod schemas are reusable documentation of inputs.

Decision: Stripe webhooks live under `services/stripe-webhook/`, with `intent-handlers`.

Reason: The handlers are being called from the controller that contains the switch statement. The handlers get a seperate folder inside the service which is a prior step to than actually calling the service. This is only done with the webhook as no other controller has the switch case pattern as seen in the webhook controller

Decision: Prisma schema and migrations live under `server/src/prisma/`;

Reason: Keeps migrations next to schema for easier maintanability of migration scripts

## File naming

Decision: Hooks are named `useXxx` in `useXxx.ts` (camelCase file).

Reason: Matches React norms and ESLint tooling expectations. Clearly marks the file having a react hook

Decision: Express route modules follow `something.route.ts`; controllers `something.controller.ts`; services `something.service.ts`.

Reason: Filename encodes architectural role without opening the file. Enables faster quick search for file

Decision: Tests colocated as `*.test.ts` near the code under test.

Reason: Faster to find specs and scoped coverage runs.

## TypeScript and style

Decision: `PascalCase` for components and types; `camelCase` for values and functions; `SCREAMING_SNAKE_CASE` for exported fixed codes (especially HTTP statuses).

Reason: Readable at a glance; constants read as invariant values.

Decision: Unused parameters/variables intentionally ignored must be prefixed with `_` to satisfy ESLint.

Reason: Signals intent while keeping `no-unused-vars` strict.

Decision: Prefer `import type` for type-only imports when it improves clarity.

Reason: Avoids accidental runtime imports where only types are needed.

## Tooling and environment

Decision: ESLint owns correctness/hooks rules; Prettier disables conflicting ESLint formatting via eslint-config-prettier.

Reason: Single source of formatting; fewer “fix ESLint vs fix Prettier” loops.

Decision: On the server, configuration is read only through `server/src/constants/env.ts`. A `getEnv(key, optionalDefault)` helper wraps `process.env`; when the resolved value would still be `undefined`, it throws (e.g. `Missing environment variable`) so missing entries fail at the beginning instead of coming up later as `undefined`.

Reason: One module owns `process.env` access; call sites import stable exports (`JWT_SECRET`, `POSTGRES_URI`, etc.) instead of reading env; `getEnv` fails fast when a required variable is absent (optional defaults cover keys like `PORT` without throwing).

Decision: Real secrets are never committed; configuration is env-driven.

Reason: Security and environment parity (local, staging, production).