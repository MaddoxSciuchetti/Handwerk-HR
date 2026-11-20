# Optimization Deep Dive — PRs #223, #224, and follow-ups #248–#252

Production: https://frontendv2-x54r.onrender.com

Staging (Round 3 lab): https://bsb-onboarding-frontend-staging.onrender.com

PRs: [#223](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223), [#224](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224), [#248](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/248), [#249](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/249), [#250](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/250), [#251](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/251), [#252](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/252)

Round 1 = before my #223 vs after my #223.

Round 2 = after my #223 vs after my #224.

Round 3 = after my #224 vs after follow-ups #248–#252 (see [Follow-up optimizations](#follow-up-optimizations)).

Routes: /worker-lifycycle, /cockpit, /bestand, /settings/documents, /user/…

---

## Purpose

The purpose of the below attempts to improve performance is because I want to offer my customers the highest quality in software. I have seen many softwares that have significant first page load times, overall long request response cycles, large layout shifts and much more. To ensure this high quality, my first approach was testing with Google's web vitals LCP, INP and CLS. The difficulty in doing this was first finding out how I can create a baseline and from there on measure if any changes I implemented have an actual effect. I also ensured to avoid pitfalls such as testing the vitals on my localhost.

Once I created the baseline using the Google web vitals library which sends me the vitals from the current page and using Puppeteer to hit the routes I had the right setup to collect all necessary information. Once this baseline was collected I implemented my changes which are described below. I repeated this process for round 2.

Improvements I would have made:

1. Collect an average of baseline values and an average of values once the changes have been implemented. As can be seen some vitals turned out to be some ms slower than before the optimizations I made. One answer could be that I made a bad change. The other could be that there was network noise that caused this result. By creating an average through many tests I would have the better overall picture.
2. Implement changes step by step. This means e.g. not including the removal of the 3 Minute polling to the changes that should only focus on e.g. LCP. This would have made the PRs cleaner.

---

## What we implemented that also keeps the frontend light

### SPA + API + TanStack Router

Change: The UI is a single-page React app (`client/`). The API is Express (`server/`). Each page can download as its own file. Server data is loaded and cached with TanStack Query ([`client/src/config/query.client.ts`](../../client/src/config/query.client.ts)).

Observation: After the first load, moving between pages stays in the browser. Caching and polling work from Round 1 lives in Query.

### Context kept narrow

Change: Server data is not stored in React Context. Context is only for theme, local modal UI, document-editor values, and small UI helpers — e.g. [`ThemeProvider.tsx`](../../client/src/context/theme-provider/ThemeProvider.tsx), [`themecontext.ts`](../../client/src/context/theme-provider/themecontext.ts), [`ModalProvider.tsx`](../../client/src/features/employee-overview/context/ModalProvider.tsx) ([`client/decisions.md`](../../client/decisions.md)).

Observation: Changing theme or opening a modal does not force unrelated parts of the app to re-render.

### Vendor chunks (Round 2)

Change: Put React and TanStack into their own build files (`react-vendor`, `tanstack-vendor` in `client/vite.config.js`).

Observation: Those library files can stay cached across deploys. When only app code changes, the browser does not need to re-download the whole library set.

### Lazy TipTap / lazy loading (Rounds 1–2)

Change: Heavy pieces load only when needed. The document editor loads on open ([`LazyDocumentMasterEditor.tsx`](../../client/src/features/settings/documents/LazyDocumentMasterEditor.tsx)). Heavy worker tabs/dialogs and the zip helper also load only when used on `/user/…`.

Observation: The documents list stays lighter; `/user/…` JavaScript dropped about 40% after Round 2.

### Lazy cockpit sections

Change: Templates, documents, questionnaire, and bestand sections on `/cockpit` load only when you open them ([`cockpitSections.tsx`](../../client/src/features/worker-lifecycle/components/cockpitSections.tsx)).

Observation: Opening `/cockpit` no longer downloads all four feature areas up front; the compact drawer only downloads the section you open.

### Follow-up optimizations

These continue the same “keep the frontend light” work after the measured rounds above. Entry from the frontend docs: [Intro.md](./Intro.md).

#### Sidebar route preload

Change: When you hover or focus a left-sidebar link, start downloading that page’s code a moment before the click (~50 ms delay).

Observation: Without this, the download starts only after click, so the user waits after they already decided to go. Preload on hover/focus makes navigation feel ready sooner, without preloading every link in the app.

#### Worker-row prefetch

Change: When you hover a worker row on the lifecycle list, start loading that worker’s detail data in the background.

Observation: Opening a worker always needs that detail request. Starting it only after click leaves a blank wait. Prefetch on hover uses the time while the user decides, so the next screen can show data sooner.

#### SharePoint search debounce

Change: Wait 300 ms after typing stops before searching SharePoint (was 120 ms). Empty input does not search.

Observation: Searching on every keystroke wastes API quota and can make the UI stutter. Waiting until typing pauses keeps typing snappy and cuts unnecessary searches.

#### Shared debounce hook

Change: One shared “wait until typing pauses” helper ([`client/src/hooks/useDebounce.ts`](../../client/src/hooks/useDebounce.ts)) for Teams channel filter and docs local search (300 ms). SharePoint still uses its own timer for now.

Observation: Teams and docs needed the same behavior. Copy-pasted timers drift and forget cleanup. One helper keeps one timing rule and cancels pending work when the value changes or the screen unmounts.

#### Theme context split

Change: Split theme into (1) CSS on the document (colors, dark class, saved preference) and (2) React state only for the few toggle controls.

Observation: If theme lived only as React state high in the tree, every toggle could re-render large logged-in screens just to change colors. Updating CSS on the document changes paint without that fan-out. Document-level dark mode also covers login and other pages that never mount the main layout.

#### Narrow SidebarContext (planned / documented)

Change: Plan to wrap only the sidebar and real consumers (for example the profile menu) with sidebar state — not the whole logged-in page content.

Observation: Almost all sidebar state use is inside the sidebar itself. Wrapping the whole shell means open/collapse can notify page content that does not care. Narrowing keeps that cost on the sidebar only. Recorded here as intent; ship as a follow-up when ready.

#### Font audit

Change: No code change. Custom fonts already tell the browser to show fallback text immediately (`font-display: swap`).

Observation: Without that, custom fonts can hide text until the font file loads, which feels like a slow paint and can shift layout. Writing the audit down avoids re-checking the same question when the files already handle it.

## Interesting

Lazy loading in this app has two layers:

| Layer | Tool | What waits |
| --- | --- | --- |
| Between pages | TanStack Router (each route can be its own file) | Whole page code by URL — open `/cockpit` without downloading every settings/editor module |
| Within a page | Load heavy pieces only when opened | Heavy tabs, dialogs, editors on the same screen |

Router = between pages. Within-page lazy load = tabs and dialogs on one screen.

### Example: Materials upload on `/user/…`

The worker header (including “upload materials”) is always on the page. Only the Materials tab content loads later — so a header click can happen while that tab code is still downloading.

Browsers only open a file picker in the same user-click moment. If the hidden file input lived inside the still-loading tab, the click would fail silently.

What I did:

1. Keep the hidden file input outside the late-loading tab in [`WorkerTaskManagement.tsx`](../../client/src/features/worker-task-management/components/tasks/WorkerTaskManagement.tsx).
2. Open it right away from the header click.
3. Hand the chosen file to the Materials tab once it is ready; clear pending state when the worker changes.

That keeps the JavaScript win from lazy Materials without breaking upload.

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

Change: Keep fetched data fresh for 30 seconds and in memory for 5 minutes.

Observation: The app refetches less often for no reason.

Change: Background `/tasks` refresh every 15 seconds instead of every 5, and only while the tab is visible.

Observation: Fewer API calls when idle or when the tab is hidden.

Change: Load the document editor only when you open an editor, not on the documents list (see [What we implemented](#what-we-implemented-that-also-keeps-the-frontend-light)).

Observation: The list page stays lighter.

Change: Log TTFB/LCP/CLS/INP in the console and as performance marks.

Observation: I can measure in the browser; this does not speed the page up by itself.

Change: Add `npm run analyze` so the build writes a visual report of which files are large.

Observation: Easier to see what is heavy in the build.

Change: Remove unused `@react-pdf/renderer` (the client never imported it).

Observation: Smaller install graph.

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

Change: Split React and TanStack into separate files (see [What we implemented](#what-we-implemented-that-also-keeps-the-frontend-light)).

Observation: Better caching when app code changes.

Change: Load heavy worker tabs/dialogs and the zip helper only when needed (see [What we implemented](#what-we-implemented-that-also-keeps-the-frontend-light)).

Observation: Opening `/user/…` downloads less up front.

Change: Move font styles onto the shared editor instead of every app boot.

Observation: Boot stays lighter; fonts still work for editor and contract review.

Change: Align lifecycle loading placeholders with real row sizes.

Observation: Less layout jump while the table loads.

Change: Queue the file picker until the late-loading Materials tab is ready (see [Interesting](#interesting)).

Observation: Upload does not get lost while that tab is still downloading.

### Description

In Round 2 I focused on splitting vendor code and lazy-loading the heavy worker detail UI so /user/… ships less JavaScript on first open.

### Learning

Lazy-loading the worker detail surface cut /user/… JS by about 40% (648254 → 388850) and improved LCP on that route (1216 → 1076). List routes stayed roughly flat; the Round 1 poller change still held at 1 poll in 16s.

---

## INP (after both PRs)

Measured with one click per route on production. No before-PR INP.

| Route               | INP (ms) |
| ------------------- | -------: |
| /worker-lifycycle   |       40 |
| /cockpit            |       24 |
| /bestand            |       24 |
| /settings/documents |       32 |
| /user/…             |       16 |

### Changes

Change: Re-run production with a real click after each load so INP could be recorded.

Observation: This pass only fills the missing INP column on current production after both PRs. INP needs a real interaction; load-only runs leave it empty. These lab clicks all stayed under 200 ms.

---

## Follow-ups #248–#252 — Round 3

Change: Re-measure after the follow-up items in [Follow-up optimizations](#follow-up-optimizations) (sidebar preload on hover, worker-row prefetch, SharePoint/shared search wait-after-typing, theme split). Before = after Round 2 (INP from the [INP pass](#inp-after-both-prs) on production, single lab run). After = staging lab average of 3 full page loads per route.

Core vitals (ms; CLS unitless):

| Route               | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
| ------------------- | ---------: | --------: | ---------: | --------: | ---------: | --------: |
| /worker-lifycycle   |        180 |       377 |        180 |       377 |      0.000 |     0.000 |
| /cockpit            |        528 |       323 |        692 |       475 |      0.001 |     0.001 |
| /bestand            |        464 |       429 |        464 |       429 |      0.002 |     0.003 |
| /settings/documents |        504 |       329 |        504 |       329 |      0.001 |     0.006 |
| /user/…             |        720 |       500 |       1076 |      1115 |      0.000 |     0.000 |

INP (ms):

| Route               | Before | After |
| ------------------- | -----: | ----: |
| /worker-lifycycle   |     40 |    53 |
| /cockpit            |     24 |    45 |
| /bestand            |     24 |    32 |
| /settings/documents |     32 |    43 |
| /user/…             |     16 |    43 |

JS transferred (encoded bytes):

| Route               | Before |  After |
| ------------------- | -----: | -----: |
| /worker-lifycycle   | 340168 | 357605 |
| /cockpit            | 361582 | 295583 |
| /bestand            | 301439 | 313197 |
| /settings/documents | 307016 | 321595 |
| /user/…             | 388850 | 409499 |

Task poller in 16s: 1 → 1 on /worker-lifycycle and /cockpit.

Observation: `/cockpit` and `/settings/documents` show clear first-paint and main-content gains in this average (main content about 217 ms and 175 ms faster). `/cockpit` JavaScript transferred dropped about 18%. `/bestand` stayed roughly flat. On `/user/…`, later runs painted the main content around 818 ms (better than Round 2’s 1076); the 3-run average stayed near baseline because the first run was a slow cold start (1708 ms). `/worker-lifycycle` painted slower here than Round 2’s single production run — treat that as lab/host noise unless it repeats. Layout shift stayed in the good band on every route; click delay stayed good (all under 200 ms). The Round 1 poller change still held at 1 poll in 16s. Full page-load numbers understate preload, prefetch, and wait-after-typing; those help navigation and typing more than a cold first paint.
