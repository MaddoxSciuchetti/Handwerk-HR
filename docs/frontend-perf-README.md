# Frontend performance — PRs #223 & #224

Measured before/after for the SE_45 frontend optimization work on production
(`https://frontendv2-x54r.onrender.com`), read-only demo login.

**Source PRs**

- [#223](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/223) — caching, task polling, TipTap code-splitting (`cursor/frontend-perf-web-vitals-d47a`)
- [#224](https://github.com/MaddoxSciuchetti/Handwerk-HR/pull/224) — vendor chunks, lazy worker UI, fonts off boot (`cursor/frontend-perf-round2-d47a`)

**How to read the tables**

| Column pair | Meaning |
|-------------|---------|
| **Round 1 before → after** | Live production **before** #223 vs live production **after** #223 deployed |
| **Round 2 before → after** | Live production **after** #223 vs live production **after** #224 deployed |

Round 2 “before” is **not** the original baseline — it is already Round 1’s after.

An early local-build “after” pass was discarded; only live production comparisons below.

Routes timed (Puppeteer, cache disabled): `/worker-lifycycle`, `/cockpit`, `/bestand`, `/settings/documents`, `/user/<demo-id>`.

---

## What the metrics mean

| Metric | Plain meaning |
|--------|----------------|
| **TTFB** | Time until the first byte of the HTML document arrives (network/server for that navigation). |
| **FCP** | First Contentful Paint — when any content first appears. |
| **LCP** | Largest Contentful Paint — when the main visible content is painted. |
| **CLS** | Cumulative Layout Shift — how much the layout jumps (unitless; lower is better). |
| **INP** | Interaction to Next Paint — delay from a click/keypress until the next paint. Needs a real interaction; early benches left this as n/a. |
| **Nav (ms)** | Wall-clock time for the scripted navigation to settle (`networkidle2`). Sensitive to CDN/network noise. |
| **JS bytes** | Encoded JS transferred for that route visit. |
| **`/tasks` polls / 16s** | How many times `/tasks` was fetched in a 16s window after load (background poller). |

**Caveats (from the original measurements)**

- Some TTFB/FCP/LCP deltas move with cold CDN / network variance — do not treat every millisecond as a code regression.
- Round 1 **before** often had **LCP/CLS = n/a** (short idle). After used ~8s idle + scroll, so LCP/CLS appear mainly on the after side.
- **INP** was not captured in Round 1/2. A later lab pass (2026-11-16) measured INP with a real click on current production only — no pre-PR INP baseline exists.

---

## PR #223 — Round 1

### What changed

- Default TanStack Query `staleTime` **30s** / `gcTime` **5m** (was effectively no default stale/gc).
- Task/mention poller: **5s always** → **15s only while the tab is visible**.
- Lazy-load TipTap document editor for list/drawer opens (`LazyDocumentMasterEditor`) so the documents list does not pull the editor chunk.
- Add `web-vitals` reporter (`LCP` / `CLS` / `INP` / `TTFB` → console + `performance.mark`).
- Vite `npm run analyze` (rollup visualizer → `dist/stats.html`).
- Remove unused `@react-pdf/renderer`.

### Before → after (live production)

**Core vitals (ms; CLS unitless)**

| Route | Before TTFB | After TTFB | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
|-------|------------:|-----------:|-----------:|----------:|-----------:|----------:|-----------:|----------:|
| `/worker-lifycycle` | 27 | 17 | 192 | 176 | n/a | 176 | n/a | 0.000 |
| `/cockpit` | 24 | 197 | 224 | 672 | n/a | 820 | n/a | 0.001 |
| `/bestand` | 28 | 165 | 188 | 444 | n/a | 444 | n/a | 0.006 |
| `/settings/documents` | 31 | 201 | 228 | 520 | n/a | 520 | n/a | 0.001 |
| `/user/…` | 25 | 182 | 308 | 700 | n/a | 1216 | n/a | 0.000 |

**Task poller (clearest Round 1 win)**

| Route | Before `/tasks` polls (16s) | After |
|-------|----------------------------:|------:|
| `/worker-lifycycle` | 3 (~5s) | 1 (~15s) |
| `/cockpit` | 3 (~5s) | 1 (~15s) |

**Nav time (ms)**

| Route | Before | After (prod) |
|-------|-------:|-------------:|
| `/worker-lifycycle` | 1037 | 1028 |
| `/cockpit` | 1094 | 2006 |
| `/bestand` | 1100 | 1229 |
| `/settings/documents` | 1099 | 1276 |
| `/user/…` | 1568 (direct) | 2005 |

**Bundle (local production builds, Round 1)**

| Signal | Before | After |
|--------|--------|-------|
| TipTap-heavy shared chunk | `documentMaster.keys-*.js` ~556.5 KB | TipTap deferred to async `StyledDocumentEditor-*.js` ~532 KB (on editor open) |
| `documentMaster.keys-*.js` | 556.5 KB | ~24.9 KB |
| Entry `index-*.js` | ~963 KB | ~970 KB (+ `web-vitals`) |

### Round 1 takeaway

The reliable production win is **fewer background `/tasks` calls** and **TipTap off the documents list graph**. Paint/nav ms on live CDN were mixed/noisy; LCP/CLS before were largely uncaptured.

---

## PR #224 — Round 2

### What changed

- Vite `manualChunks` for **React** and **TanStack** vendor bundles.
- Lazy-load heavy worker detail tabs/dialogs + dynamic `jszip` export.
- Mount `DocumentFontStyles` in shared `StyledDocumentEditor` (fonts load with TipTap paths, not every app boot) — covers master editor and contract review/send.
- Align lifecycle workers table skeleton sizes (less layout jump while loading).
- Queue materials file-picker until the lazy tab mounts (upload intent survives Suspense).

### Before → after (live production)

Here **Before** = Round 1 production after (#223). **After** = Round 2 production after (#224).

**Core vitals (ms; CLS unitless)**

| Route | Before FCP | After FCP | Before LCP | After LCP | Before CLS | After CLS |
|-------|-----------:|----------:|-----------:|----------:|-----------:|----------:|
| `/worker-lifycycle` | 176 | 180 | 176 | 180 | 0.000 | 0.000 |
| `/cockpit` | 672 | 528 | 820 | 692 | 0.001 | 0.001 |
| `/bestand` | 444 | 464 | 444 | 464 | 0.006 | 0.002 |
| `/settings/documents` | 520 | 504 | 520 | 504 | 0.001 | 0.001 |
| `/user/…` | 700 | 720 | 1216 | 1076 | 0.000 | 0.000 |

**Nav time (ms)**

| Route | Before | After | Notes |
|-------|-------:|------:|-------|
| `/worker-lifycycle` | 1028 | 1030 | ~flat |
| `/cockpit` | 2006 | 1237 | −38% this run |
| `/bestand` | 1229 | 1245 | ~flat |
| `/settings/documents` | 1276 | 1281 | ~flat |
| `/user/…` | 2005 | 2293 | noisier; see JS below |

**JS transferred on route (encoded bytes)**

| Route | Before | After | Notes |
|-------|-------:|------:|-------|
| `/worker-lifycycle` | 338216 | 340168 | ~flat |
| `/cockpit` | 359382 | 361582 | ~flat |
| `/bestand` | 301122 | 301439 | ~flat |
| `/settings/documents` | 306205 | 307016 | ~flat |
| `/user/…` | 648254 | 388850 | **−40%** |

**Task poller (16s)** — still 1 on lifecycle/cockpit (unchanged from Round 1).

**Local analyze note (Round 2 PR)** — entry ~659 KB (was ~970); `/user/$Id` chunk ~216 KB (was ~441).

### Round 2 takeaway

Clearest live win: **`/user/$Id` downloads ~40% less JS**; LCP on that route **1216 → 1076 ms**. Cockpit felt faster this run (nav/FCP/LCP); other list routes stayed roughly flat. Vendor chunks confirmed on the live CDN.

---

## INP (measured later — post both PRs only)

On 2026-11-16 a follow-up lab pass clicked a non-mutating control after each load so INP could fire (Event Timing). **No pre-PR INP baseline** — these numbers describe current production only:

| Route | INP (ms) |
|-------|---------:|
| `/worker-lifycycle` | 40 |
| `/cockpit` | 24 |
| `/bestand` | 24 |
| `/settings/documents` | 32 |
| `/user/…` | 16 |

All within the “good” lab threshold (≤200 ms). Not Chrome UX Report field p75.

---

## End-to-end picture

```text
Original production
        │
        │  PR #223
        ▼
  Round 1 after  ── polls 3→1; TipTap deferred; Query defaults; web-vitals
        │
        │  PR #224
        ▼
  Round 2 after  ── vendor chunks; lazy worker UI; /user JS −40%
```

**Best evidence of improvement**

1. Background `/tasks` traffic cut (~3× less often while visible).
2. Documents list no longer eagerly downloads TipTap.
3. Worker detail route ships much less JS after Round 2.

Paint timings on Render vary by network; treat poller cadence + JS bytes as the primary proof, vitals as supporting context.
