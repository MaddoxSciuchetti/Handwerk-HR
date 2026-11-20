# Frontend documentation

This folder holds everything related to the React + Vite SPA in `client/`. Topics follow the same grouping as SE_45 Web Frontend Technologies.

The app is a typed SPA: React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind / shadcn-style UI. Day-to-day commands live in `client/package.json` (`npm run dev`, `lint`, `typecheck`, `test:unit`). Full local setup and env vars are in the repository root README.

Feel free to propose improvements to the pages below so this project stays maintainable.

## Modern JavaScript, toolkit, and frameworks

- Information on why we chose TypeScript, React, Vite, npm, TanStack Router, and component-based UI can be found [here](./architecture.md).
- Information on how features, components, hooks, imports, and env access are organized can be found [here](../clean-code-testing/style-guide.md).
- Information on feature folders and related code-shape decisions can be found [here](../clean-code-testing/decisions.md).
- Information on frontend-only extras (modal context, React Hook Form, client pagination) can be found [here](../../client/decisions.md).
- Information on client commands and joiner notes can be found [here](../../client/README.md).

## State management and client-side data

- Information on how client state is split (TanStack Query, URL search params, Context, localStorage, auth cookies) can be found [here](./client-side-data.md).
- Information on narrow Context and modal state decisions can be found [here](../../client/decisions.md).
- Information on Query defaults and prefetch/hover behavior can be found [here](./optimization.md).

## Modern HTML and CSS

- Information on semantic HTML and accessibility habits (landmarks, labels, `sr-only`, Radix dialogs) can be found [here](./semantic-html.md).

## APIs and asynchronous programming

- Information on how the SPA talks to the Express API (Axios `withCredentials`, TanStack Query) can be found [here](./client-side-data.md) and in `client/src/config/apiClient.ts`.
- Information on hover/intent work (route preload, worker-row prefetch) can be found [here](./optimization.md).

## Authentication, authorization, and web security

- Information on JWT cookies, refresh rotation, and the client 401 interceptor can be found [here](../backend/authentication.md).
- Information on where access and refresh tokens live on the client can be found [here](./client-side-data.md).
- Information on client error monitoring with Sentry can be found [here](../../client/src/instrument.ts).

## Testing and clean code

- Information on client unit tests and coverage commands can be found [here](../clean-code-testing/tests.md).
- Information on clean-code principles with examples can be found [here](../clean-code-testing/principles.md).
- Information on pull request expectations can be found [here](../clean-code-testing/review-checklist.md).
- Information on recurring review checks (routes, mentions, cleanup) can be found [here](../review.md).

## Deployment and optimization

- Information on how the frontend is hosted and shipped (Render / CI) can be found [here](../backend/ci.cd.md) and in the root README.
- Information on measured Web Vitals (baselines, PR rounds, numbers) can be found [here](./web-vitals.md).
- Information on optimizations (what we shipped, plus the asset/CDN/Brotli/CSS Decision checklist) can be found [here](./optimization.md).
- Information on service workers, offline support, and installable PWA (not built yet; when a future React build would need them) can be found [here](./pwa-offline.md).

Commands joiners use most often (from `client/`):

```bash
npm run format
npm run lint
npm run typecheck
npm run test:unit
```
