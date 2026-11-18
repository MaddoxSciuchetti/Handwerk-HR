# Performance — staging `GET /tasks` load probe

Probe: [`ops/loadtest/run.mjs`](../ops/loadtest/run.mjs) against staging, seed admin + cookie reuse, baseline mode, 15 s per VU level. Units for latency are milliseconds.

## 1 — Baseline (empty task list)

Unchanged `/tasks` (full `findMany`, no pagination, no gzip). Org had **0** tasks.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 721 | 0% | 395 | 778 | 40087 |
| 50 | 709 | 0% | 1049 | 1591 | 2026 |
| 100 | 695 | 0% | 2266 | 3070 | 3868 |
| 150 | 751 | 0% | 3502 | 4210 | 5388 |
| 200 | 712 | 0% | 4816 | 6642 | 7740 |
| 500 | 1007 | 0% | 10174 | 13987 | 40389 |
| 1000 | 1409 | 7.6% | 23317 | 31286 | 32270 |

Latency scales with concurrency; first errors at 1000 VUs. Max outliers at 20/500 are not typical of the p95.

## 2 — After Prisma `relationJoins` + cursor pagination

`relationLoadStrategy: "join"`, default page **50** / max **100**, response `{ tasks, nextCursor }` (~49 KB first page). **100** seeded tasks; probe hits the first page only.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 266 | 0% | 1126 | 1902 | 2771 |
| 50 | 353 | 0% | 2305 | 2908 | 3618 |
| 100 | 485 | 0% | 3606 | 4339 | 5063 |
| 150 | 520 | 0% | 5798 | 7384 | 7914 |
| 200 | 589 | 0% | 7224 | 8030 | 8944 |
| 500 | 790 | 0% | 17160 | 23071 | 24842 |
| 1000 | 1461 | 15.1% | 31557 | 49187 | 53322 |

Bounded payload helps structure, but a single Starter still saturates; 1000 VU error rate rises vs empty-list baseline.

## 3 — After gzip compression

Express `compression()` middleware on top of join + pagination (same 100 seeded tasks / first page).

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 400 | 0% | 715 | 1440 | 2547 |
| 50 | 494 | 0% | 1500 | 2605 | 5289 |
| 100 | 532 | 0% | 3196 | 4550 | 5360 |
| 150 | 543 | 0% | 4895 | 6638 | 40207 |
| 200 | 580 | 0% | 6754 | 7725 | 8666 |
| 500 | 826 | 0% | 15713 | 20473 | 23579 |
| 1000 | 2747 | 52.3% | 33176 | 44847 | 55263 |

Low/mid VUs roughly match post-join; 1000 VUs is worse. Next step is **horizontal scaling** — add a second Starter instance on Render so the platform load-balances, because single-instance CPU/memory is the blocker.
