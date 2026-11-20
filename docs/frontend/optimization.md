# Frontend optimizations

What we shipped to keep the SPA light. Measured numbers live in [web-vitals.md](./web-vitals.md) (PRs [#223](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223), [#224](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224)).

All notes below are Optimizations: first what we changed in the product, then the usual asset checklist. File links point at where it lives if you want to open the code later.

## Optimizations — what we implemented

### SPA + API + routing

Decision: UI is a React app in the browser. API is a separate Express server. Pages can load as separate downloads; server data is cached in the client.

Reason: After the first load you stay in the app when you navigate. You do not download the whole product again for every click. Lists and details reuse cached API data instead of refetching every time.

What happens: Open cockpit → that page’s code loads. Open workers again → data often comes from cache.

Where: [client/vite.config.js](../../client/vite.config.js), [client/src/config/query.client.ts](../../client/src/config/query.client.ts).

### Context kept narrow

Decision: API data is not stored in React Context. Context is only for small UI things (theme, open/close modal).

Reason: Context updates can re-render large parts of the screen. Changing theme or opening a modal must not refresh the whole worker table. Server lists stay in the query cache.

What happens: Open “create employee” → only the modal layer updates. Worker rows keep their cached data.

Where: [ModalProvider.tsx](../../client/src/features/employee-overview/context/ModalProvider.tsx), [ThemeProvider.tsx](../../client/src/context/theme-provider/ThemeProvider.tsx), [client/decisions.md](../../client/decisions.md).

### Vendor chunks (Round 2)

Decision: Put React and TanStack into their own build files, separate from our feature code.

Reason: Libraries change less often than our screens. The browser can keep those library files and only re-download our app pieces after a deploy.

What happens: You ship a small feature fix → users often keep the React file cached and only fetch the changed app file.

Where: [client/vite.config.js](../../client/vite.config.js).

### Lazy document editor and worker UI (Rounds 1–2)

Decision: Do not download the heavy document editor or worker tabs until the user opens them.

Reason: List pages stay smaller. Worker detail used to pull a lot of JavaScript up front; after Round 2 that first download dropped by about 40%.

What happens: Documents list loads without the editor. Open an editor → editor code downloads then. Same idea for materials and other heavy worker tabs.

Where: [LazyDocumentMasterEditor.tsx](../../client/src/features/settings/documents/LazyDocumentMasterEditor.tsx), [WorkerTaskManagement.tsx](../../client/src/features/worker-task-management/components/tasks/WorkerTaskManagement.tsx).

### Lazy cockpit sections

Decision: On cockpit, load Templates, Documents, Questionnaire, and Bestand only when that section is used.

Reason: Opening cockpit should not download all four areas at once.

What happens: Cockpit shell appears first. Open Templates → that section’s code loads. The others wait.

Where: [cockpitSections.tsx](../../client/src/features/worker-lifecycle/components/cockpitSections.tsx).

### Sidebar route preload

Decision: Hover or focus a main sidebar link → start loading that page a short moment before the click.

Reason: If loading starts only on click, the user waits after they already decided to go. A short head start feels faster without preloading the whole app.

What happens: Hover “Cockpit” → cockpit code starts loading → click → screen is closer to ready.

Where: [sidebar-menu-item.tsx](../../client/src/components/ui/sidebar/sidebar-menu-item.tsx), [AppSidebar.tsx](../../client/src/components/ui/sidebar/AppSidebar.tsx).

### Worker-row prefetch

Decision: Rest the pointer on a worker row → start fetching that worker’s detail in the background.

Reason: Opening a worker always needs that request. Starting it only after click leaves a blank pause.

What happens: Hover a row → detail request runs quietly → click → next screen often already has the data.

Where: [ProjectItem.tsx](../../client/src/features/worker-lifecycle/components/ProjectItem.tsx).

### SharePoint search debounce

Decision: Wait about 300 ms after typing stops before searching SharePoint.

Reason: Searching on every keystroke spams the external API and makes typing feel heavy. Waiting until the pause cuts noise.

What happens: Type “vertrag” quickly → one search after you stop, not one search per letter. Empty box → no search.

Where: [SharePointFilePicker.tsx](../../client/src/features/settings/documents/components/SharePointFilePicker.tsx).

### Shared debounce for other search boxes

Decision: Same “wait ~300 ms after typing” rule for Teams channel filter and docs search, via one shared helper.

Reason: The same need showed up in more than one place. Separate timers drift and forget cleanup.

What happens: Filter Teams channels or search docs → results update after a short pause, same timing everywhere.

Where: [useDebounce.ts](../../client/src/hooks/useDebounce.ts), [TeamsSendAction.tsx](../../client/src/features/microsoft-teams/TeamsSendAction.tsx), [DocumentationPage.tsx](../../client/src/features/documentation/DocumentationPage.tsx).

### Theme context split

Decision: Apply light/dark on the document (colours / dark class) separately from the small React state that drives the toggle button.

Reason: If theme were only React state high in the tree, every toggle could re-render large screens just to change colours. Document CSS updates paint without that.

What happens: Toggle light/dark → page colours change; the worker table does not need a full React re-render pass for theme alone. Login still follows the same document theme.

Where: [ThemeProvider.tsx](../../client/src/context/theme-provider/ThemeProvider.tsx).

### Font display

Decision: Custom fonts use “swap”: show text immediately in a fallback, then switch to the real font.

Reason: Without that, text can stay invisible until the font file arrives.

What happens: Contract preview text appears at once → branded font replaces it when loaded.

Where: [DocumentFontStyles.tsx](../../client/src/features/settings/documents/DocumentFontStyles.tsx).

## Optimizations — asset and delivery checklist

Usual “make the frontend fast” bullets. We went through them on purpose.

### 1. Optimize images, videos, and other static files

Decision: Profile photos get a simple crop and small JPEG. No full image/video pipeline.

Reason: Almost all media is uploads or a profile picture. A big pipeline is overload.

What happens: Save avatar → resized square JPEG uploads. Full PDF contracts → stored as uploaded, not recompressed by us.

Where: [preprocessAvatar.ts](../../client/src/lib/preprocessAvatar.ts).

### 2. Remove inefficient / dead code

Decision: No separate “dead code removal” project as a performance feature.

Reason: Clean code, lint, review, and occasional bundle reports already catch this.

What happens: Unused variables fail lint. Unused libraries get dropped when we notice them (for example an unused PDF package in the past). Day to day we do not run a special purge campaign.

Where: [eslint.config.js](../../client/eslint.config.js), [package.json](../../client/package.json) (`analyze`), [principles.md](../clean-code-testing/principles.md).

### 3. Uglify / minify CSS and JS

Decision: Production build minifies CSS and JavaScript.

Reason: Normal for Vite; no second minifier.

What happens: `npm run build` in `client/` → smaller hashed files in `dist/`.

Where: [package.json](../../client/package.json), [vite.config.js](../../client/vite.config.js).

### 4. Compress the SPA bundle (Brotli / gzip) — not user document files

Decision: Compress the built app files at the host (Render Static Site: Brotli, and gzip when the browser asks). Do not gzip PDFs, photos, or other uploads in object storage. Do not add a compression plugin inside the React app.

Reason: Text assets shrink a lot on the wire; the edge should do that. Render already does. PDFs and JPEGs are already compressed; gzipping them again rarely helps. API JSON gzip for the task list was only a load-probe trial; we keep join + pagination there, not gzip on files.

What happens: Browser downloads a compressed JS/CSS chunk from Render. Personnel PDF goes to S3 as the original file bytes.

Where: [hosting.md](../backend/hosting.md), [aws.ts](../../server/src/config/aws.ts), [load-probe.md](../backend/load-probe.md).

### 5. Use a CDN to serve assets

Decision: Do not add a second CDN in front of the SPA.

Reason: Render Static Sites already use Render’s CDN. We have little extra marketing weight. Product files are in object storage. Another CDN is more moving parts for little gain.

What happens: Users hit the Render frontend URL; we do not put Cloudflare/CloudFront in front ourselves.

Where: [hosting.md](../backend/hosting.md), [web-vitals.md](./web-vitals.md).

### 6. Caching rules on static files

Decision: No custom cache-policy layer beyond build + host defaults.

Reason: A full policy needs long cache for fingerprinted files, short cache for HTML, and often a CDN. The build already hashes JS/CSS names. HTML and many authenticated downloads must stay fresh. Not worth a hand-written matrix here.

What happens: A file like `index-abc123.js` can be cached hard because the name changes when content changes. The HTML entry must stay up to date.

Where: [index.html](../../client/index.html), [vite.config.js](../../client/vite.config.js).

### 7. Reduce / remove third-party scripts

Decision: No Hotjar, tag manager, ads, or cookie-banner scripts. Sentry stays for errors.

Reason: Extra tags slow the UI and add privacy cost. Monitoring is the exception.

What happens: HTML shell has no marketing snippets. Sentry starts only when a DSN is set.

Where: [index.html](../../client/index.html), [instrument.ts](../../client/src/instrument.ts).

### 8. Reduce libraries / pick smaller versions

Decision: Load heavy UI only when needed and split large library files, instead of rewriting the whole stack to tiny libraries.

Reason: React + TanStack + Radix-style UI is the product toolkit. Cutting weight on worker detail mattered more than swapping everything.

What happens: TipTap and heavy tabs stay out of the first download; React still ships as a shared vendor file.

Where: [LazyDocumentMasterEditor.tsx](../../client/src/features/settings/documents/LazyDocumentMasterEditor.tsx), [cockpitSections.tsx](../../client/src/features/worker-lifecycle/components/cockpitSections.tsx), [vite.config.js](../../client/vite.config.js).

### 9. Tree shaking / only import what you use

Decision: Import only the icons and modules we use; Tailwind keeps only the CSS classes we use.

Reason: The build already drops unused library code. Tailwind already drops unused CSS.

What happens: A template row pulls pencil and trash icons only, not the whole icon library.

Where: [TemplateItem.tsx](../../client/src/features/template-tasks/components/TemplateItem.tsx), [vite.config.js](../../client/vite.config.js).

### 10. Code-splitting

Decision: Split by route; load heavy tabs and editors only when opened.

Reason: Users download what they need for the screen they are on. Measured in the Web Vitals rounds.

What happens: Visit cockpit → no document editor download. Open an editor → that code loads then.

Where: [vite.config.js](../../client/vite.config.js), [cockpitSections.tsx](../../client/src/features/worker-lifecycle/components/cockpitSections.tsx).

### 11. Defer non-critical CSS

Decision: Do not build a separate “critical CSS” file.

Reason: Tailwind already outputs one stylesheet of the utilities we use. Critical/deferred CSS is for huge hand-written CSS. It does not fit here.

What happens: Styling goes through the normal Tailwind + Vite build. No extra critical-CSS step.

Where: [vite.config.js](../../client/vite.config.js) — intentional non-implementation.

## Interesting

Two kinds of “load later”:

- Between pages: each URL can have its own chunk (open cockpit without every settings/editor module).
- Within a page: heavy tabs load when you open them.

### Materials upload on the worker screen

The header (including upload) is always there. The Materials tab body loads later. The file picker must stay outside that late piece, or the browser ignores the click.

What happens: Click upload in the header → file dialog opens immediately → chosen file is handed to Materials once that tab is ready. Change worker → clear any pending file.

Where: [WorkerTaskManagement.tsx](../../client/src/features/worker-task-management/components/tasks/WorkerTaskManagement.tsx).
