# Frontend performance — PRs #223 and #224

Production: https://frontendv2-x54r.onrender.com  
PRs: [#223](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223), [#224](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224)

Round 1 = before my #223 vs after my #223.  
Round 2 = after my #223 vs after my #224.

Routes: /worker-lifycycle, /cockpit, /bestand, /settings/documents, /user/…

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

| Route | Before TTFB | After TTFB | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
|-------|------------:|-----------:|-----------:|----------:|-----------:|----------:|-----------:|----------:|
| /worker-lifycycle | 27 | 17 | 192 | 176 | n/a | 176 | n/a | 0.000 |
| /cockpit | 24 | 197 | 224 | 672 | n/a | 820 | n/a | 0.001 |
| /bestand | 28 | 165 | 188 | 444 | n/a | 444 | n/a | 0.006 |
| /settings/documents | 31 | 201 | 228 | 520 | n/a | 520 | n/a | 0.001 |
| /user/… | 25 | 182 | 308 | 700 | n/a | 1216 | n/a | 0.000 |

Task poller:

| Route | Before /tasks polls in 16s | After |
|-------|---------------------------:|------:|
| /worker-lifycycle | 3 (~5s) | 1 (~15s) |
| /cockpit | 3 (~5s) | 1 (~15s) |

Nav (ms):

| Route | Before | After |
|-------|-------:|------:|
| /worker-lifycycle | 1037 | 1028 |
| /cockpit | 1094 | 2006 |
| /bestand | 1100 | 1229 |
| /settings/documents | 1099 | 1276 |
| /user/… | 1568 | 2005 |

Bundle (local production builds):

| Signal | Before | After |
|--------|--------|-------|
| TipTap-heavy shared chunk | documentMaster.keys ~556.5 KB | async editor ~532 KB (on editor open) |
| documentMaster.keys | 556.5 KB | ~24.9 KB |
| Entry index | ~963 KB | ~970 KB |

### Changes

Caching defaults: I set queries to stay fresh for 30s and stay in memory for 5 minutes. What happened: the app refetches less often for no reason.

Task polling: I changed background /tasks from every 5s always to every 15s, and only while the tab is visible. What happened: fewer API calls when idle or when the tab is hidden.

Lazy TipTap: I made the document editor chunk load only when you open an editor, not on the documents list. What happened: the list page stays lighter.

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

| Route | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
|-------|-----------:|----------:|-----------:|----------:|-----------:|----------:|
| /worker-lifycycle | 176 | 180 | 176 | 180 | 0.000 | 0.000 |
| /cockpit | 672 | 528 | 820 | 692 | 0.001 | 0.001 |
| /bestand | 444 | 464 | 444 | 464 | 0.006 | 0.002 |
| /settings/documents | 520 | 504 | 520 | 504 | 0.001 | 0.001 |
| /user/… | 700 | 720 | 1216 | 1076 | 0.000 | 0.000 |

Nav (ms):

| Route | Before | After |
|-------|-------:|------:|
| /worker-lifycycle | 1028 | 1030 |
| /cockpit | 2006 | 1237 |
| /bestand | 1229 | 1245 |
| /settings/documents | 1276 | 1281 |
| /user/… | 2005 | 2293 |

JS transferred (encoded bytes):

| Route | Before | After |
|-------|-------:|------:|
| /worker-lifycycle | 338216 | 340168 |
| /cockpit | 359382 | 361582 |
| /bestand | 301122 | 301439 |
| /settings/documents | 306205 | 307016 |
| /user/… | 648254 | 388850 |

Task poller in 16s: 1 → 1 on /worker-lifycycle and /cockpit.

Local analyze: entry ~659 KB (was ~970); /user/$Id chunk ~216 KB (was ~441).

### Changes

Vendor chunks: I split React and TanStack into separate files. What happened: better caching when app code changes.

Lazy worker UI: I lazy-loaded heavy worker tabs/dialogs and jszip so they load when needed. What happened: opening /user/… downloads less up front.

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

| Route | INP (ms) |
|-------|---------:|
| /worker-lifycycle | 40 |
| /cockpit | 24 |
| /bestand | 24 |
| /settings/documents | 32 |
| /user/… | 16 |

### Changes

I re-ran production with a real click after each load so INP could be recorded.

### Description

This pass only fills the missing INP column on current production after both PRs.

### Learning

INP needs a real interaction; load-only benches leave it as n/a. These lab clicks all stayed under 200 ms on current production.
