# Frontend toolkit and framework decisions

These are the big choices for the SPA in `client/`. Folder layout and naming are in [decisions.md](../clean-code-testing/decisions.md). Smaller frontend-only habits (modals, forms, pagination) are in [client/decisions.md](../../client/decisions.md). Measured performance work is in [optimization.md](./optimization.md).

Decision: Use TypeScript (and modern JavaScript) on the client.

Reason: Same language as the API. Types catch bad props and API shapes earlier. I already had a web development head start here; learning Python, Go, or Java from zero for the UI would have slowed the project down.

Decision: Use React instead of Vue, Angular, or Svelte.

Reason: Most tutorials, job posts, and UI kits I ran into were React-first. That made it easier to learn and to hire help later. The component model fits how we build screens: small pieces you compose into pages. The ecosystem around React is large — forms, tables, overlays — so we can reuse solid building blocks instead of inventing every control. Vue or Svelte would also work; Angular felt heavier than we need for this SPA. React was the practical choice for this product and for staying consistent with common React + Vite setups.

Decision: Build the UI with reusable components (including Radix / shadcn-style primitives under `components/ui/`).

Reason: React is strongest when you split the UI into components. Shared primitives (dialog, dropdown, sidebar) keep look and behaviour consistent. Feature components stay in `features/…`; generic UI stays in `components/ui/`. That split is also in the style guide and decisions docs.

Decision: Use Vite as the bundler / dev toolchain, not Webpack.

Reason: Vite starts fast in development (native ES modules) and uses Rollup for production builds. Webpack still works, but the config and cold start felt heavier for a greenfield Vite + React app. Vite is the default path most React SPA tutorials use now, so it matched how I learned and how the repo is set up (`npm run dev` / `npm run build` in `client/`).

Decision: Use npm as the package manager (not pnpm or yarn).

Reason: npm comes with Node. One lockfile story (`package-lock.json`) for client and server keeps CI and Render installs simple (`npm ci`). pnpm or yarn can be faster or stricter with disk use; we did not need that complexity for this team size.

Decision: Use TanStack Router for page routing (not React Router alone, and not Next.js / TanStack Start as the app shell).

Reason: We need client-side routes for a SPA that talks to our Express API. TanStack Router gives typed routes and first-class search params so the URL can hold real UI state safely. It is opinionated about routing, not about the whole framework the way Next.js is — that keeps a clear split between client and backend (same idea as in the backend architecture notes). We also turn on route code splitting so each page can load as its own chunk. Intent preload on sidebar links (hover/focus) builds on that; details are in [optimization.md](./optimization.md).
