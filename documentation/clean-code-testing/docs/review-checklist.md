# Code review checklist

## Layout

- [ ] Client work under `features/<feature>/`;
- [ ] Cross-feature code lives in `apis/`, `config/`, `constants/`, `lib/`
- [ ] Server: route wires to controller only. Controller thin; DB + branching in service.
- [ ] Filename shows layer (`.route`, `.controller`, `.service`, `.schema(s)`).
- [ ] Generated Prisma was not edited

## Imports and secrets

- [ ] Write `@/` imports, not `../../..` chains.
- [ ] Types use `import type { … }`
- [ ] Set client env only via `@/config/env`
- [ ] Set server env only via `@/constants/env`
- [ ] Nosecrets pasted in README or docs

## React

- [ ] Exported components and hooks use `export function Foo`,
- [ ] Inside body: `const handler = () => …`
- [ ] Props type sits above the component in-file
- [ ] One component / one hook, one job
- [ ] PascalCase `.tsx`for screens/components, lowercase for `components/ui/`; and for hooks `useThing.ts`.

## Types

- [ ] `type` for object shapes
- [ ] PascalCase types/components
- [ ] CamelCase functions/vars;
- [ ] `SCREAMING_SNAKE` for stable codes/constants.
- [ ] Names say what is going on (`getTasks`, `saveTaskComment`)
- [ ] Similar helpers are named distinctly
- [ ] Magic numbers swapped for named constants

## Clean code

- [ ] DRY: repetitions should go into data + map and a resuable component
- [ ] KISS: wiring stays thin (routes, mutation grouping, hooks that mainly fetch + return).
- [ ] YAGNI: no, enums, HTTP codes, or query defaults that you do not need now
- [ ] Functions should be small, one responsibility

## Errors

- [ ] Client uses shared helpers (`tryCatch` etc.)
- [ ] Server async controllers use `catchErrors`

## Comments

- [ ] Names carry weight; comments only explaining why
- [ ] No dead commented-out chunks

## Structure

- [ ] Related code stays together (mutation + invalidations, helpers nearby).
- [ ] Variables declared near use.
- [ ] Props/callbacks instead of reaching into unrelated internals.
- [ ] Indentation consistent (2-space TS/TSX where we enforce it).

## Tooling before pushing

- [ ] Meaningful client edits → `npm --prefix client run lint` (+ format); no blanket eslint-disable to dodge hooks.
- [ ] Unused params/vars underscored on purpose or removed.
- [ ] New/changed server tests live as `*.test.ts` under `server/tests/`.
