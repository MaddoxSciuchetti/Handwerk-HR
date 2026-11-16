# Frontend performance — PRs #223 and #224

Live production measurements on https://frontendv2-x54r.onrender.com with a read-only demo login.

PRs:
- #223 — https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223
- #224 — https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224

How the comparisons work:
- Round 1: production before #223 vs production after #223
- Round 2: production after #223 vs production after #224

So Round 2 “before” is already after Round 1. An early local-build “after” was discarded; only live production numbers are kept here.

Routes checked: /worker-lifycycle, /cockpit, /bestand, /settings/documents, /user/…

---

## Metrics (what each name means)

TTFB: time until the first byte of the HTML arrives. Mostly network/server for that request.

FCP: first contentful paint — when anything first shows on screen.

LCP: largest contentful paint — when the main content has painted.

CLS: cumulative layout shift — how much the page jumps around while loading (lower is better).

INP: interaction to next paint — how long after a click/keypress until the page responds visually. Needs a real click; Round 1/2 left this as n/a.

Nav: wall-clock time for the scripted page load to settle. Easy to move with network noise.

JS bytes: how much JavaScript was downloaded for that visit.

/tasks polls in 16s: how many times the background task API was called in 16 seconds after load.

Important caveats:
- TTFB / FCP / LCP / nav can jump up or down from cold CDN or network variance. That is not automatically a code regression.
- Round 1 “before” often had LCP/CLS as n/a (short idle). “After” waited longer, so those values show up mainly on the after side.
- INP was only measured later on current production. There is no pre-PR INP baseline.

---

## About the /cockpit TTFB jump (24 → 197)

That number means: on that one after visit, the HTML’s first byte took longer to arrive (~197 ms instead of ~24 ms).

It does not mean the React changes in #223 made the server eight times slower for cockpit. TTFB is the document/network hop. The same Round 1 after-pass also shows higher TTFB on several other routes, while /worker-lifycycle got slightly better (27 → 17). That mixed pattern fits CDN/network variance more than a cockpit-specific code bug.

Treat poller counts and JS bytes as the reliable proof of the PRs. Treat single-run TTFB swings as noise unless they repeat.

---

## PR #223 — Round 1

### What changed

Caching defaults: queries stay fresh 30s and stay in memory 5 minutes, so the app refetches less often for no reason.

Task polling: background /tasks went from every 5s always to every 15s, and only while the tab is visible. Result: fewer API calls when idle or when the tab is hidden.

Lazy TipTap: the document editor chunk loads only when you open an editor, not on the documents list. Result: the list page stays lighter.

Web Vitals logging: the app records TTFB/LCP/CLS/INP in the console and as performance marks. Result: you can measure in the browser; it does not change page speed by itself.

Bundle analyzer: npm run analyze writes a visual chunk report. Result: easier to see what is large in the build.

Removed unused @react-pdf/renderer: dropped a dependency the client never imported. Result: smaller install graph.

### Before → after (live production)

Core vitals (ms; CLS unitless):

| Route | Before TTFB | After TTFB | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
|-------|------------:|-----------:|-----------:|----------:|-----------:|----------:|-----------:|----------:|
| /worker-lifycycle | 27 | 17 | 192 | 176 | n/a | 176 | n/a | 0.000 |
| /cockpit | 24 | 197 | 224 | 672 | n/a | 820 | n/a | 0.001 |
| /bestand | 28 | 165 | 188 | 444 | n/a | 444 | n/a | 0.006 |
| /settings/documents | 31 | 201 | 228 | 520 | n/a | 520 | n/a | 0.001 |
| /user/… | 25 | 182 | 308 | 700 | n/a | 1216 | n/a | 0.000 |

Task poller (clearest Round 1 win):

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
| TipTap-heavy shared chunk | documentMaster.keys ~556.5 KB | TipTap moved to async editor ~532 KB (only when editor opens) |
| documentMaster.keys | 556.5 KB | ~24.9 KB |
| Entry index | ~963 KB | ~970 KB (web-vitals added) |

Round 1 takeaway: the solid wins are fewer /tasks polls and TipTap off the documents list. Paint and nav on Render were mixed; single-run TTFB jumps (like cockpit 24 → 197) are noise, not the story of the PR.

---

## PR #224 — Round 2

### What changed

Vendor chunks: React and TanStack ship in separate files. Result: better caching when app code changes.

Lazy worker UI: heavy worker tabs/dialogs and jszip load when needed. Result: opening /user/… downloads less up front.

Document fonts: font styles mount with the shared editor, not on every app boot. Result: boot stays lighter; fonts still work for editor and contract review.

Table skeletons: lifecycle loading placeholders match real row sizes. Result: less layout jump while the table loads.

Materials upload queue: file-picker intent waits until the lazy tab is mounted. Result: upload does not get lost during Suspense.

### Before → after (live production)

Here before = after #223. After = after #224.

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

Task poller in 16s: still 1 on lifecycle and cockpit.

Local analyze note: entry ~659 KB (was ~970); /user/$Id chunk ~216 KB (was ~441).

Round 2 takeaway: clearest win is /user/… JS down about 40% (648254 → 388850), with LCP 1216 → 1076 on that route. Other list routes stayed roughly flat. Cockpit nav/FCP/LCP looked better this run too.

---

## INP (later pass — after both PRs only)

Measured 2026-11-16 with one non-mutating click per route. No before-PR INP exists.

| Route | INP (ms) |
|-------|---------:|
| /worker-lifycycle | 40 |
| /cockpit | 24 |
| /bestand | 24 |
| /settings/documents | 32 |
| /user/… | 16 |

Lab samples only (not field p75). All under the usual “good” threshold of 200 ms.

---

## Short summary

```text
original production
        |
        |  PR #223
        v
 after Round 1   — /tasks 3→1; TipTap deferred; query defaults; web-vitals
        |
        |  PR #224
        v
 after Round 2   — vendor chunks; lazy worker UI; /user JS −40%
```

Best proof the work helped:
1. Background /tasks traffic dropped (~3× less while the tab is open).
2. Documents list no longer downloads TipTap up front.
3. Worker detail downloads much less JS after Round 2.

Prefer those signals over one-off TTFB/FCP swings on Render.
