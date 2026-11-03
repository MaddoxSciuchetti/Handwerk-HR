# Style guide

Read this before you push work so layout, naming, and architeecture stay consistent across the repository.

# Note

If in any case you see code that violates the below principles, open a new branch and adjust the code to match the below styles. This ensures that overtime the codebase closely follows the above rules and stays more maintanable.


## 1. Client (`client/`)

### 1.1 Exported components use `export function`

To create your first React component (a screen or ui component), write `export function MyComponent(...)` at the top of the file—not `export const MyComponent = () => { ... }`.

Good:

```tsx
export function TaskSidebar(props: TaskSidebarProps) {
  …
}
```

Bad:

```tsx
export const TaskSidebar = (props: TaskSidebarProps) => {
  …
};
```


### 1.2 One component, one responsibility

Follow reacts single responsibility principle — one component should be responsible for only one thing.

Good:

```tsx
export function PaymentRedirectMessage({ message }: { message: string }) {
    return <p>{message}</p>;
}
```

Bad:

```tsx
export function MegaSettingsScreen() {
    // profile card + stripe checkout + invite table + sidebar in one giant return …
}
```


### 1.3 Exported hooks use `export function`

To export a custom hook (`useSomething`), also use `export function useSomething(...)` at the top—not `export const useSomething = () => { ... }`. Ensure that one hook has one responsibility. Hooks should not become bloated with code serving different purposes.

Good:

```ts
export function useBillingSubscription() {
  return useQuery(…);
}
```

Bad:

```ts
export const useBillingSubscription = () => useQuery(…);
```


### 1.4 Inside a component or hook, use `const` + arrow helpers

Use `const handleX = () => { ... }` for helpers inside a component body—for local handlers and small closures (same pattern inside hook bodies).

Good:

```tsx
export function Form() {
    const onSubmit = () => doSave();
}

export function useForm() {
    const reset = () => set("");
}
```

Bad:

```tsx
export function Form() {
    function onSubmit() {
        doSave();
    }
}
```


### 1.5 Create types for each component above the function definition

Good:

```tsx
type ExampleProps = {
    example: string;
};

function Example({ example }: ExampleProps) {}
```

Bad:

```tsx
import type ExampleProps from example.types

function Example ({example}: ExampleProps) {

}
```

### 1.5 Import from `@/` instead of long relative imports

For imports from your own tree, prefer the `@/` alias wherever `tsconfig` maps it instead of chaining long `../../../../` paths.

Good:

```ts
import API from "@/config/apiClient";
```

Bad:

```ts
import API from "../../../../config/apiClient";
```


### 1.6 Type-only imports use `import type`

To import types, write `import type { … }` so bindings drop at compile time and never drag runtime imports by mistake.

Good:

```ts
import type { BillingSubscription } from "./billing.types";
```

Bad:

```ts
import { BillingSubscription } from "./billing.types";
```


### 1.7 Client: one env module, import constants from it

The client app has one env module: `client/src/config/env.ts`. Dotenv / Vite loads `.env`; that file is where **`getEnv`** runs and exported constants are defined i.e `API_URL`. Everywhere else, import those constants from `@/config/env`. Do not read `import.meta.env.…` from feature code.

Tooling and build config (for example `vite.config.js`) sometimes read `process.env` or Vite’s `loadEnv` because the tool runs outside the `src/` tree. Application code under `client/src/` should not do that; use the exports from `@/config/env` explained above.

Good:

```ts
import { API_URL } from "@/config/env";
```

Bad:

```ts
const url = import.meta.env.VITE_API_URL;
```

```ts
const url = import.meta.env.DATABASE_URL;
```

Server uses the same idea in `server/src/constants/env.ts` — see §2.1.


### 1.8 Unused bindings follow ESLint intentional-prefix rules

Silence identifiers on purpose (callback parameters you skip) using the ESLint pattern (often `^_something`). Otherwise remove them so TypeScript and ESLint rules stay strict.

Good:

```ts
useEffect((_e) => { … });
```

Bad:

```ts
useEffect((event) => { … }); // unused `event` triggers lint
```


## 2. Server (`server/`)

### 2.1 Server: one env module, import constants from it

The server app has one env module: `server/src/constants/env.ts`. Dotenv / the host still set `process.env`; that file is where `getEnv` reads them and exported constants are defined (for example `POSTGRES_URI`, `STRIPE_SECRET_KEY`). Controllers, services, and routes import from `@/constants/env` only — do not scatter `process.env[…]` through the codebase.

Rare setup code (for example Prisma’s client module) may read `process.env` at the edge where the library is initialized. Normal server code should import from `@/constants/env` instead of using `process.env` everywhere as explained above.

Good:

```ts
import { STRIPE_SECRET_KEY } from "@/constants/env";
const stripe = new Stripe(STRIPE_SECRET_KEY);
```

Bad:

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
```

Client uses the same idea in `client/src/config/env.ts` — see §1.7.


### 2.2 Keep HTTP layers split: `.route.ts` → `.controller.ts` → `.service.ts`

Mount routes inside `something.route.ts`, keep adapters thin inside `something.controller.ts`, and put database plus branching inside `something.service.ts` under `server/src/` so reviewers follow one layer per file.

Good:

```
task.route.ts  → delegates → task.controller.ts → calls → tasks.service.ts
```

Bad:

```ts
// task.route.ts mixes Prisma + JSON shaping + branching in hundreds of lines
```


### 2.3 Server tests named `*.test.ts` grouped under `server/tests/`

To add automated tests, save `<testname>.test.ts` inside `server/tests/`

Good:

```
server/tests/stripeWebhook.controller.test.ts
```

Bad:

```
server/manual-check-stripe.ts //
```


## 3. Shared naming (`client/` + `server/`)

### 3.1 PascalCase vs camelCase vs SCREAMING_SNAKE_CASE

Use PascalCase for component/type names (`UserCard`), camelCase for functions/vars (`loadUsers`), and `SCREAMING_SNAKE_CASE` for rarely changing shared codes (`UNAUTHORIZED`).

Good:

```ts
export type UserCard = { … };
export function loadUsers() { … };
export const UNAUTHORIZED = 401;
```

Bad:

```ts
export type user_card = unknown;
export const LoadUsers = () => {};
export const unauthorizedHttp = 401;
```


### 3.2 Prefer `type` aliases over interfaces

Create shared objects with type aliases—not interface declarations—for ensuring consistency

Good:

```ts
export type BillingSubscription = { id: string; status: SubscriptionStatus };
```

Bad:

```ts
export interface BillingSubscription {
  …
}
```


### 3.3 Name verbs after what happens (`saveTaskComment`, `getTasks`)

Prefer verbs describing actions (`saveTaskComment`, `getTasks`) instead of exporting functions named i.e fetch that have no meaning

Good:

```ts
export async function saveTaskComment(params: SaveTaskCommentParams) {}
```

Bad:

```ts
export async function fetch() {}
```


### 3.4 ESLint + Prettier (client)

Prettier shapes the text (spacing, wraps). ESLint flags problems (unused code, Hooks, TS). In `client/` that split is configured — you only need to run the repo’s commands once in a while to check if the code follows all rules

What to do (client PRs):

```
npm --prefix client run lint
npm --prefix client run format
```

(use `lint`/`format` when you touched client code materially; formatting-only sometimes just `format` is enough.)

Server: There is no `lint`/`format` script in `server/package.json` yet — this subsection is about client until that exists.

Avoid: Only using your editor’s built-in formatter with no `.prettierrc`, or piling ESLint “style” rules on top of Prettier without `eslint-config-prettier`-style disables.


### 3.5 Do not stash secrets inside readmes or other files where they should not belong

Avoid leaking credentials—Stripe secrets, JWTs, production URLs with embedded passwords belong in vaults/host env UIs—not committed docs.

Good:

```
# .env.example
STRIPE_SECRET_KEY=
```

Bad:

```
STRIPE_SECRET_KEY=sk_live_12345 pasted in README
```


## 4. Repository layout

### 4.1 Split SPA vs backend trees

SPA work lands in `client/` (Vite + React + TanStack Router + Query). Persistent HTTP + Stripe + Prisma work lands in `server/`. Do not edit generated files from Prisma.


## 5. `client/src/` folders

### 5.1 Add new product work inside `features/<name>/`

Create one folder per product slice (`features/all-tasks/`, `features/settings/payments/`, …); add subfolders (`api/`, `components/`, `hooks/`, …) only when needed so that reviews alway see one cohesive directory

Good:

```
client/src/features/all-tasks/api/tasks.api.ts
```

Bad:

```
client/src/random-top-level/TaskThing.tsx duplicated across unrelated modules
```

### 5.2 Shared infra lives in configured roots (`apis/`, `config/`, `constants/`, `lib/`, …)

- Cross-feature REST helpers inside `apis/`.
- App-wide wiring in `config/` (for example `env.ts`, `apiClient.ts`, `query.client.ts`).
- Stable lookup tables (`LAYOUTITEMS`, HTTP statuses) belong in `constants/`.
- Micro utilities (`cn`, tiny parsers) use `lib/`.
- Optionally park shared React Query factories in `query-options/`.

Good:

```
client/src/constants/layout.consts.ts
client/src/config/apiClient.ts
```

Bad:

```tsx
<TaskSidebar
    sidebarItems={
        [
            /* 30 inline objects duplicated */
        ]
    }
/>
```


## 6. File naming and most important reminders before pushing

### 6.1 Client screens/widgets use PascalCase + `.tsx`

Add screen as `TaskSidebar.tsx`, primitives under `components/ui/` remain lowercase (`button.tsx`). Hook files camelCase-with-`use` prefix (`useSaveTaskComment.ts`). Generated router output stays `routeTree.gen.ts` (regenerate).

Good:

```
client/src/features/all-tasks/components/TaskSidebar.tsx
client/src/features/all-tasks/hooks/useSaveTaskComment.ts
```

Bad:

```
taskSidebar.tsx
UseSaveThing.ts // wrong capitalization / casing
```

### 6.2 Server routers/controllers/services/schemas naming

Name files with `.route.ts`, `.controller.ts`, `.service.ts`, `.schemas.ts` / `.schema.ts` so the layer shows in the filename.

Good:

```
server/src/routes/billing.route.ts
server/src/controllers/billing.controller.ts
server/src/services/billing.service.ts
```

Bad:

```
server/src/billingStuff.ts // unclear layer
```


## 7. Imports & tooling (both packages)

### 7.1 Prefer `@/` in each package’s tsconfig universe

Prefer `@/` for both apps whenever aliases exist—rather than rewinding back up the tree manually.

Good:

```ts
import { prisma } from "@/lib/prisma";
```

Bad:

```ts
import { prisma } from "../../../../lib/prisma";
```


### 7.2 Client ESLint = TS recommended + Hooks

Satisfy TypeScript recommendations plus React Hooks rules. Do not disable eslint on specific lines. Ensure that you fix the issue.

Good:

```
// eslint knows hooks ordering + exhaustive deps presets
```

Bad:

```
Disabling Hooks plugin locally to shortcut dependency arrays repeatedly
```


### 7.3 Run scripted `lint` / `format` before review

Kick off whichever checks that package actually exposes (for client: `npm --prefix client run lint` after sizable edits; use `npm --prefix client run format` when you touched formatting).

Good:

```
lint passes locally before PR
```

Bad:

```
hundres of prettier differences that were not there before your changes
```
