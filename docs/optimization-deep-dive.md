# Optimization Deep Dive — PRs #223 and #224

Production: https://frontendv2-x54r.onrender.com

PRs: [#223](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223), [#224](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224)

Round 1 = before my #223 vs after my #223.

Round 2 = after my #223 vs after my #224.

Routes: /worker-lifycycle, /cockpit, /bestand, /settings/documents, /user/…

---

## Purpose

The purpose of the below attempts to improve performance is because I want to offer my customers the highest quality in software. I have seen many softwares that have significant first page load times, overall long request response cycles, large layout shifts and much more. To ensure this high quality, my first approach was testing with Google's web vitals LCP, INP and CLS. The difficulty in doing this was first finding out how I can create a baseline and from there on measure if any changes I implemented have an actual effect. I also ensured to avoid pitfalls such as testing the vitals on my localhost.

Once I created the baseline using the Google web vitals library which sends me the vitals from the current page and using Puppeteer to hit the routes I had the right setup to collect all necessary information. Once this baseline was collected I implemented my changes which are described below. I repeated this process for round 2.

Improvements I would have made:

1. Collect an average of baseline values and an average of values once the changes have been implemented. As can be seen some vitals turned out to be some ms slower than before the optimizations I made. One answer could be that I made a bad change. The other could be that there was network noise that caused this result. By creating an average through many tests I would have the better overall picture.
2. Implement changes step by step. This means e.g. not including the removal of the 3 Minute polling to the changes that should only focus on e.g. LCP. This would have made the PRs cleaner.

---

## Architecture choices that also optimize

Not every performance win is a one-off PR tweak. Some of it is how the app is shaped. The sections below are the high-level choices I want people to see next to the measured Round 1 / Round 2 work.

### React SPA + Express API + TanStack Router

The frontend is a React single-page application built with Vite (`client/`). The backend is a separate Express API (`server/`). After the first HTML/JS load, navigation stays in the browser and data comes from the API — we do not re-download a full page document for every click inside the authenticated app.

I chose TanStack Router on purpose. It gives typed routes and typed search params, and it is opinionated at the route level without locking the whole product into a full-stack meta-framework. In `client/vite.config.js` the TanStack Router plugin runs with `autoCodeSplitting: true`, so each route can ship as its own chunk instead of one giant bundle for every screen. That fits an HR product where most of the heavy UI lives behind login (cockpit, tasks, settings, worker detail). Frameworks such as Next.js can help public SEO pages with server-rendered HTML, but they do not remove the JavaScript cost of interactive dashboards — and they add another runtime surface on top. For this app the SPA + API split keeps responsibility clear and keeps the optimization work focused on what users actually download and re-render.

Server state (employees, tasks, documents, …) goes through TanStack Query, not through a global client store. Caching defaults live in [`client/src/config/query.client.ts`](../client/src/config/query.client.ts). That is why Round 1 could cut unnecessary refetches without introducing Redux or Zustand.

### Not overusing React Context

A common fear is that `useContext` re-renders the entire tree and that Redux or Zustand would always be safer. Context does re-render every consumer of that context when the value changes. It does **not** mean every component in the app re-renders — only the ones that subscribe. The real problem starts when one app-wide Context holds lots of unrelated, frequently changing state and many screens subscribe to it.

I deliberately did **not** put server data or large feature state into Context. Context stays narrow:

- Theme (light/dark) — see [`client/src/context/theme-provider/ThemeProvider.tsx`](../client/src/context/theme-provider/ThemeProvider.tsx) and [`client/src/context/theme-provider/themecontext.ts`](../client/src/context/theme-provider/themecontext.ts)
- Employee modal open/close state for related UI in one feature — see [`client/decisions.md`](../client/decisions.md) and [`client/src/features/employee-overview/context/ModalProvider.tsx`](../client/src/features/employee-overview/context/ModalProvider.tsx)
- Local document-editor values and small UI primitives (sidebar, drawer stack, toggle group)

That restraint is an optimization decision: fewer broad subscriptions means fewer accidental re-renders while typing, toggling theme, or opening a modal. If a future feature needs fine-grained selectors over large chatty client state, Zustand or Redux can still be introduced for that slice — but we are not paying that cost today for problems we do not have.

### What “vendor chunks” means

In Round 2 I told Vite/Rollup to put React and TanStack packages into their own output files (`react-vendor`, `tanstack-vendor` in `client/vite.config.js`). Those are the **vendor chunks**.

Without that split, library code and app code often land in the same large file. Every time I change a feature, the browser may have to download that whole file again. With vendor chunks, the React/TanStack files stay cacheable in the browser while only the smaller app chunks change. That does not shrink the first visit by itself; it makes **repeat visits and deploys** cheaper because stable dependencies are not invalidated every release.

### What “lazy TipTap” and lazy loading mean

Lazy loading means: do not download and parse a heavy module until the user actually needs it.

TipTap (the rich-text document editor) is large. On the documents list I do not need the editor at all. So the editor is wrapped in `React.lazy` + `Suspense` in [`client/src/features/settings/documents/LazyDocumentMasterEditor.tsx`](../client/src/features/settings/documents/LazyDocumentMasterEditor.tsx). The list stays light; the TipTap chunk loads when someone opens an editor. That is what “lazy TipTap” refers to in Round 1.

We also use lazy loading elsewhere. Round 2 lazy-loaded heavy worker tabs/dialogs (and jszip) on `/user/…`, which cut transferred JS on that route by about 40%. Route-level splitting from TanStack Router is the same idea at the navigation layer: open `/cockpit` without paying for every settings or editor module up front.

Could more lazy loading help? Yes, selectively — any remaining first-load heavy screens (large editors, PDF tooling, rare dialogs) are candidates. Blindly lazy-loading everything can hurt too (extra waterfalls, spinners on every click). The rule I follow is: measure with `npm run analyze` and Web Vitals, then split the modules that actually dominate a route’s JS.

---

## Definitions

TTFB: time until the first byte of the HTML arrives.

FCP: first contentful paint — when anything first shows on screen.

LCP: largest contentful paint — when the main content has painted.

CLS: cumulative layout shift — how much the page jumps while loading (lower is better).

INP: interaction to next paint — delay after a click/keypress until the next paint.

Nav: wall-clock time for the scripted page load to settle.

JS bytes: JavaScript downloaded for that visit.

/tasks polls in 16s: how many times /tasks was fetched in 16 seconds after load.

---

## PR #223 — Round 1

### Numbers

Core vitals (ms; CLS unitless):

| Route               | Before TTFB | After TTFB | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
| ------------------- | ----------: | ---------: | ---------: | --------: | ---------: | --------: | ---------: | --------: |
| /worker-lifycycle   |          27 |         17 |        192 |       176 |        n/a |       176 |        n/a |     0.000 |
| /cockpit            |          24 |        197 |        224 |       672 |        n/a |       820 |        n/a |     0.001 |
| /bestand            |          28 |        165 |        188 |       444 |        n/a |       444 |        n/a |     0.006 |
| /settings/documents |          31 |        201 |        228 |       520 |        n/a |       520 |        n/a |     0.001 |
| /user/…             |          25 |        182 |        308 |       700 |        n/a |      1216 |        n/a |     0.000 |

Task poller:

| Route             | Before /tasks polls in 16s |    After |
| ----------------- | -------------------------: | -------: |
| /worker-lifycycle |                    3 (~5s) | 1 (~15s) |
| /cockpit          |                    3 (~5s) | 1 (~15s) |

Nav (ms):

| Route               | Before | After |
| ------------------- | -----: | ----: |
| /worker-lifycycle   |   1037 |  1028 |
| /cockpit            |   1094 |  2006 |
| /bestand            |   1100 |  1229 |
| /settings/documents |   1099 |  1276 |
| /user/…             |   1568 |  2005 |

Bundle (local production builds):

| Signal                    | Before                        | After                                 |
| ------------------------- | ----------------------------- | ------------------------------------- |
| TipTap-heavy shared chunk | documentMaster.keys ~556.5 KB | async editor ~532 KB (on editor open) |
| documentMaster.keys       | 556.5 KB                      | ~24.9 KB                              |
| Entry index               | ~963 KB                       | ~970 KB                               |

### Changes

Caching defaults: I set queries to stay fresh for 30s and stay in memory for 5 minutes. What happened: the app refetches less often for no reason.

Task polling: I changed background /tasks from every 5s always to every 15s, and only while the tab is visible. What happened: fewer API calls when idle or when the tab is hidden.

Lazy TipTap: I made the document editor chunk load only when you open an editor, not on the documents list (see [What “lazy TipTap” and lazy loading mean](#what-lazy-tiptap-and-lazy-loading-mean)). What happened: the list page stays lighter.

Web Vitals logging: I added logging for TTFB/LCP/CLS/INP in the console and as performance marks. What happened: I can measure in the browser; this does not speed the page up by itself.

Bundle analyzer: I added npm run analyze so the build writes a visual chunk report. What happened: easier for me to see what is large in the build.

Removed unused @react-pdf/renderer: I dropped a dependency the client never imported. What happened: smaller install graph.

### Description

In Round 1 I focused on caching, slowing the task poller, and keeping TipTap off the documents list so the first authenticated pages stay lighter and quieter on the network.

### Learning

Cutting the task poller (3 → 1 in 16s) and moving TipTap off the documents list are clear, measurable wins. Paint and nav times on a single live CDN run do not by themselves prove or disprove those changes.

---

## PR #224 — Round 2

### Numbers

Before = after my #223. After = after my #224.

Core vitals (ms; CLS unitless):

| Route               | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
| ------------------- | ---------: | --------: | ---------: | --------: | ---------: | --------: |
| /worker-lifycycle   |        176 |       180 |        176 |       180 |      0.000 |     0.000 |
| /cockpit            |        672 |       528 |        820 |       692 |      0.001 |     0.001 |
| /bestand            |        444 |       464 |        444 |       464 |      0.006 |     0.002 |
| /settings/documents |        520 |       504 |        520 |       504 |      0.001 |     0.001 |
| /user/…             |        700 |       720 |       1216 |      1076 |      0.000 |     0.000 |

Nav (ms):

| Route               | Before | After |
| ------------------- | -----: | ----: |
| /worker-lifycycle   |   1028 |  1030 |
| /cockpit            |   2006 |  1237 |
| /bestand            |   1229 |  1245 |
| /settings/documents |   1276 |  1281 |
| /user/…             |   2005 |  2293 |

JS transferred (encoded bytes):

| Route               | Before |  After |
| ------------------- | -----: | -----: |
| /worker-lifycycle   | 338216 | 340168 |
| /cockpit            | 359382 | 361582 |
| /bestand            | 301122 | 301439 |
| /settings/documents | 306205 | 307016 |
| /user/…             | 648254 | 388850 |

Task poller in 16s: 1 → 1 on /worker-lifycycle and /cockpit.

Local analyze: entry ~659 KB (was ~970); /user/$Id chunk ~216 KB (was ~441).

### Changes

Vendor chunks: I split React and TanStack into separate files (see [What “vendor chunks” means](#what-vendor-chunks-means)). What happened: better caching when app code changes.

Lazy worker UI: I lazy-loaded heavy worker tabs/dialogs and jszip so they load when needed (same idea as lazy TipTap — see [lazy loading](#what-lazy-tiptap-and-lazy-loading-mean)). What happened: opening /user/… downloads less up front.

Document fonts: I moved font styles onto the shared editor instead of every app boot. What happened: boot stays lighter; fonts still work for editor and contract review.

Table skeletons: I aligned lifecycle loading placeholders with real row sizes. What happened: less layout jump while the table loads.

Materials upload queue: I queued the file-picker until the lazy tab is mounted. What happened: upload does not get lost during Suspense.

### Description

In Round 2 I focused on splitting vendor code and lazy-loading the heavy worker detail UI so /user/… ships less JavaScript on first open.

### Learning

Lazy-loading the worker detail surface cut /user/… JS by about 40% (648254 → 388850) and improved LCP on that route (1216 → 1076). List routes stayed roughly flat; the Round 1 poller change still held at 1 poll in 16s.

---

## INP (after both PRs)

Measured 2026-11-16 with one click per route. No before-PR INP.

| Route               | INP (ms) |
| ------------------- | -------: |
| /worker-lifycycle   |       40 |
| /cockpit            |       24 |
| /bestand            |       24 |
| /settings/documents |       32 |
| /user/…             |       16 |

### Changes

I re-ran production with a real click after each load so INP could be recorded.

### Description

This pass only fills the missing INP column on current production after both PRs.

### Learning

INP needs a real interaction; load-only benches leave it as n/a. These lab clicks all stayed under 200 ms on current production.
