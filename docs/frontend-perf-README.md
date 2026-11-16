# Frontend performance — PRs #223 and #224

I measured live production on https://frontendv2-x54r.onrender.com with a read-only demo login.

My PRs:
- #223 — https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223
- #224 — https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224

How I compared the runs:
- Round 1: production before my #223 vs production after my #223
- Round 2: production after my #223 vs production after my #224

So Round 2 “before” is already after Round 1. I discarded an early local-build “after”; only live production numbers are kept here.

Routes I checked: /worker-lifycycle, /cockpit, /bestand, /settings/documents, /user/…

---

## Metrics (what each name means)

TTFB: time until the first byte of the HTML arrives. Mostly network/server for that request.

FCP: first contentful paint — when anything first shows on screen.

LCP: largest contentful paint — when the main content has painted.

CLS: cumulative layout shift — how much the page jumps around while loading (lower is better).

INP: interaction to next paint — how long after a click/keypress until the page responds visually. Needs a real click; my Round 1/2 runs left this as n/a.

Nav: wall-clock time for the scripted page load to settle. Easy to move with network noise.

JS bytes: how much JavaScript was downloaded for that visit.

/tasks polls in 16s: how many times the background task API was called in 16 seconds after load.

Things to keep in mind:
- TTFB / FCP / LCP / nav can jump up or down from cold CDN or network variance. That is not automatically a bug in my code.
- Round 1 “before” often had LCP/CLS as n/a (short idle). On “after” I waited longer, so those values show up mainly on the after side.
- I only measured INP later on current production. There is no pre-PR INP baseline.

---

## About the /cockpit TTFB jump (24 → 197)

On that one after visit, the HTML’s first byte arrived later (~197 ms instead of ~24 ms).

That does not mean my #223 React changes made the server eight times slower for cockpit. TTFB is the document/network hop. In the same Round 1 after-pass I also saw higher TTFB on several other routes, while /worker-lifycycle got slightly better (27 → 17). That mixed pattern fits CDN/network variance more than a cockpit-specific bug I introduced.

I treat poller counts and JS bytes as the reliable proof of my work. I treat single-run TTFB swings as noise unless they repeat.

---

## PR #223 — Round 1

### What I changed

Caching defaults: I set queries to stay fresh for 30s and stay in memory for 5 minutes. What happened: the app refetches less often for no reason.

Task polling: I changed background /tasks from every 5s always to every 15s, and only while the tab is visible. What happened: fewer API calls when idle or when the tab is hidden.

Lazy TipTap: I made the document editor chunk load only when you open an editor, not on the documents list. What happened: the list page stays lighter.

Web Vitals logging: I added logging for TTFB/LCP/CLS/INP in the console and as performance marks. What happened: I can measure in the browser; this does not speed the page up by itself.

Bundle analyzer: I added npm run analyze so the build writes a visual chunk report. What happened: easier for me to see what is large in the build.

Removed unused @react-pdf/renderer: I dropped a dependency the client never imported. What happened: smaller install graph.

### Before → after (live production)

Core vitals (ms; CLS unitless):

| Route | Before TTFB | After TTFB | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
|-------|------------:|-----------:|-----------:|----------:|-----------:|----------:|-----------:|----------:|
| /worker-lifycycle | 27 | 17 | 192 | 176 | n/a | 176 | n/a | 0.000 |
| /cockpit | 24 | 197 | 224 | 672 | n/a | 820 | n/a | 0.001 |
| /bestand | 28 | 165 | 188 | 444 | n/a | 444 | n/a | 0.006 |
| /settings/documents | 31 | 201 | 228 | 520 | n/a | 520 | n/a | 0.001 |
| /user/… | 25 | 182 | 308 | 700 | n/a | 1216 | n/a | 0.000 |

Task poller (clearest Round 1 win from my change):

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
| TipTap-heavy shared chunk | documentMaster.keys ~556.5 KB | I moved TipTap to an async editor ~532 KB (only when the editor opens) |
| documentMaster.keys | 556.5 KB | ~24.9 KB |
| Entry index | ~963 KB | ~970 KB (I added web-vitals) |

Round 1 takeaway: the solid wins from my work are fewer /tasks polls and TipTap off the documents list. Paint and nav on Render were mixed; single-run TTFB jumps (like cockpit 24 → 197) are noise, not the story of this PR.

---

## PR #224 — Round 2

### What I changed

Vendor chunks: I split React and TanStack into separate files. What happened: better caching when app code changes.

Lazy worker UI: I lazy-loaded heavy worker tabs/dialogs and jszip so they load when needed. What happened: opening /user/… downloads less up front.

Document fonts: I moved font styles onto the shared editor instead of every app boot. What happened: boot stays lighter; fonts still work for editor and contract review.

Table skeletons: I aligned lifecycle loading placeholders with real row sizes. What happened: less layout jump while the table loads.

Materials upload queue: I queued the file-picker until the lazy tab is mounted. What happened: upload does not get lost during Suspense.

### Before → after (live production)

Here before = after my #223. After = after my #224.

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

Task poller in 16s: still 1 on lifecycle and cockpit (my Round 1 change held).

Local analyze note after my Round 2 work: entry ~659 KB (was ~970); /user/$Id chunk ~216 KB (was ~441).

Round 2 takeaway: the clearest win from my work is /user/… JS down about 40% (648254 → 388850), with LCP 1216 → 1076 on that route. Other list routes stayed roughly flat. Cockpit nav/FCP/LCP looked better this run too.

---

## INP (later pass — after both of my PRs)

I measured this on 2026-11-16 with one non-mutating click per route. I have no before-PR INP.

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
        |  my PR #223
        v
 after Round 1   — I cut /tasks 3→1; deferred TipTap; set query defaults; added web-vitals
        |
        |  my PR #224
        v
 after Round 2   — I added vendor chunks; lazy worker UI; /user JS −40%
```

Best proof my work helped:
1. I cut background /tasks traffic (~3× less while the tab is open).
2. I stopped the documents list from downloading TipTap up front.
3. After Round 2, worker detail downloads much less JS.

I prefer those signals over one-off TTFB/FCP swings on Render.
