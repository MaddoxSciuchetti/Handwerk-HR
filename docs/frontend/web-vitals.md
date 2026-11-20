# Web Vitals

| Name | Plain meaning |
| --- | --- |
| TTFB | How long until the first byte of HTML arrives |
| FCP | When anything first appears on screen |
| LCP | When the main content has painted (lower is better) |
| CLS | How much the page jumps while loading (lower is better) |
| INP | Delay after a click until the next paint (lower is better) |
| Nav | Wall-clock time until the scripted load settles |
| JS bytes | How much JavaScript that visit downloaded |
| /tasks polls in 16s | How often the app hit `/tasks` in the first 16 seconds |

Round 1 = before PR #223 → after PR #223.  
Round 2 = after PR #223 → after PR #224 (Round 2 “Before” = Round 1 “After”).  
One production run per cell (not averages).

---

## Round 1

### Core vitals (ms; CLS unitless)

| Route | Before TTFB | After TTFB | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /worker-lifycycle | 27 | 17 | 192 | 176 | n/a | 176 | n/a | 0.000 |
| /cockpit | 24 | 197 | 224 | 672 | n/a | 820 | n/a | 0.001 |
| /bestand | 28 | 165 | 188 | 444 | n/a | 444 | n/a | 0.006 |
| /settings/documents | 31 | 201 | 228 | 520 | n/a | 520 | n/a | 0.001 |
| /user/… | 25 | 182 | 308 | 700 | n/a | 1216 | n/a | 0.000 |

**Observation:** No overall improvement. TTFB/FCP improved only on `/worker-lifycycle`; the other four routes got slower. LCP and CLS cannot be judged — Before is `n/a`.

### Task poller

| Route | Before /tasks polls in 16s | After |
| --- | ---: | ---: |
| /worker-lifycycle | 3 (~5s) | 1 (~15s) |
| /cockpit | 3 (~5s) | 1 (~15s) |

**Observation:** Improvement. Poll count 3 → 1 on both routes.

### Nav (ms)

| Route | Before | After |
| --- | ---: | ---: |
| /worker-lifycycle | 1037 | 1028 |
| /cockpit | 1094 | 2006 |
| /bestand | 1100 | 1229 |
| /settings/documents | 1099 | 1276 |
| /user/… | 1568 | 2005 |

**Observation:** No improvement overall. `/worker-lifycycle` is flat (−9 ms). The other four routes got slower.

### Bundle (local production builds)

| Signal | Before | After |
| --- | --- | --- |
| TipTap-heavy shared chunk | documentMaster.keys ~556.5 KB | async editor ~532 KB (on editor open) |
| documentMaster.keys | 556.5 KB | ~24.9 KB |
| Entry index | ~963 KB | ~970 KB |

**Observation:** Improvement on the documents list path — TipTap left the list chunk (`documentMaster.keys` 556.5 KB → ~24.9 KB). Entry index: no improvement (~963 → ~970 KB).

---

## Round 2

### Core vitals (ms; CLS unitless)

| Route | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| /worker-lifycycle | 176 | 180 | 176 | 180 | 0.000 | 0.000 |
| /cockpit | 672 | 528 | 820 | 692 | 0.001 | 0.001 |
| /bestand | 444 | 464 | 444 | 464 | 0.006 | 0.002 |
| /settings/documents | 520 | 504 | 520 | 504 | 0.001 | 0.001 |
| /user/… | 700 | 720 | 1216 | 1076 | 0.000 | 0.000 |

**Observation:** Mixed — not an across-the-board improvement. FCP improved on `/cockpit` and slightly on `/settings/documents`; no FCP improvement on the other three. LCP improved on `/cockpit`, `/settings/documents`, and `/user/…`; no LCP improvement on `/worker-lifycycle` or `/bestand`. CLS improved only on `/bestand` (0.006 → 0.002); elsewhere unchanged.

### Nav (ms)

| Route | Before | After |
| --- | ---: | ---: |
| /worker-lifycycle | 1028 | 1030 |
| /cockpit | 2006 | 1237 |
| /bestand | 1229 | 1245 |
| /settings/documents | 1276 | 1281 |
| /user/… | 2005 | 2293 |

**Observation:** Mixed. Improvement on `/cockpit` (2006 → 1237). No improvement on `/user/…` (2005 → 2293). The other three are flat.

### JS transferred (encoded bytes)

| Route | Before | After |
| --- | ---: | ---: |
| /worker-lifycycle | 338216 | 340168 |
| /cockpit | 359382 | 361582 |
| /bestand | 301122 | 301439 |
| /settings/documents | 306205 | 307016 |
| /user/… | 648254 | 388850 |

**Observation:** Improvement on `/user/…` only (648254 → 388850, ~40% less). No improvement on the four list routes (flat / slightly up).

---

## INP after both PRs

Measured 2026-11-16 with one real click per route (INP needs a click; load-only runs leave it empty). No before-PR INP.

| Route | INP (ms) |
| --- | ---: |
| /worker-lifycycle | 40 |
| /cockpit | 24 |
| /bestand | 24 |
| /settings/documents | 32 |
| /user/… | 16 |

**Observation:** No before/after — cannot claim improvement. Absolute values are all under 200 ms on this lab pass.
