# Load probe

This page explains the concurrent-user load probe for the Express API: what it measures, how to run it, and the staging numbers that were recorded. The script lives at `ops/loadtest/run.mjs`. The probe was added in PR #228. A short empty-list baseline landed on `main` via PR #255. The fuller ladder with one hundred seeded tasks (six tables plus CPU/memory peaks) was written on `staging` as `docs/load-testing-results.md` but was never merged to `main` — those results are restored here.

## What it measures

The probe hits one API path with N concurrent virtual users (VU) and prints request count, error rate, p50, p95, and max latency. There are two modes:

- baseline — fixed concurrency for a fixed duration
- ramp — raise concurrency in steps until the error rate or p95 budget is blown

## How to run

```bash
# Public root
LOADTEST_VUS=20 LOADTEST_DURATION_MS=15000 node ops/loadtest/run.mjs

# Authenticated /tasks
LOADTEST_EMAIL='you@example.com' \
LOADTEST_PASSWORD='…' \
LOADTEST_PATH=/tasks \
LOADTEST_VUS=20 \
LOADTEST_DURATION_MS=15000 \
node ops/loadtest/run.mjs

# Ramp until it hurts
LOADTEST_MODE=ramp \
LOADTEST_STEP_VUS=10 \
LOADTEST_MAX_VUS=80 \
LOADTEST_DURATION_MS=10000 \
LOADTEST_EMAIL='you@example.com' \
LOADTEST_PASSWORD='…' \
LOADTEST_PATH=/tasks \
node ops/loadtest/run.mjs
```

## Staging results overview

All ladders below used seed admin login, baseline mode, fifteen seconds per VU level, against staging `GET /tasks`. Latencies are milliseconds. CPU and memory peaks are from Render metrics for the staging Starter instance (0.5 CPU, 512 MB RAM) during each ladder — peaks in that window, not a per-VU sample.

## Empty task list (PR #255)

Unchanged `/tasks` with an empty org task list (no 100-task seed). This is the table that reached `main` first.

| VUs  | Requests | Error rate | p50      | p95      | max      |
| ---- | -------- | ---------- | -------- | -------- | -------- |
| 20   | 721      | 0%         | 395 ms   | 778 ms   | 40087 ms |
| 50   | 709      | 0%         | 1049 ms  | 1591 ms  | 2026 ms  |
| 100  | 695      | 0%         | 2266 ms  | 3070 ms  | 3868 ms  |
| 150  | 751      | 0%         | 3502 ms  | 4210 ms  | 5388 ms  |
| 200  | 712      | 0%         | 4816 ms  | 6642 ms  | 7740 ms  |
| 500  | 1007     | 0%         | 10174 ms | 13987 ms | 40389 ms |
| 1000 | 1409     | 7.6%       | 23317 ms | 31286 ms | 32270 ms |

First errors at 1000 VUs. Max outliers at 20/500 are not typical of the p95.

## Ladder with 100 seeded tasks

Unless noted, each run below used one hundred seeded tasks. These six tables lived on `staging` and were missing from `main` until restored into this page.

### 1 — Clean baseline (100 tasks, no optimizations)

Full task list with no Prisma join strategy, no pagination, and no gzip (`Accept-Encoding: identity`). Confirmed 100 tasks (~116 KB). Ran 2026-11-19 on staging. Staging still had pool max 20.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 117      | 0.0%       | 2156  | 7060  | 8272  |
| 50   | 222      | 0.0%       | 4088  | 7140  | 10459 |
| 100  | 261      | 0.4%       | 6621  | 14585 | 16322 |
| 150  | 325      | 0.0%       | 8475  | 17987 | 18931 |
| 200  | 372      | 0.0%       | 13468 | 22057 | 23379 |
| 500  | 653      | 0.0%       | 27306 | 46868 | 49581 |
| 1000 | 4017     | 77.9%      | 36599 | 61590 | 70408 |

Observation: Full-list payload is heavy. Errors explode at 1000 VUs (77.9%).

### 2 — Prisma relationLoadStrategy join + cursor pagination

Change: Join strategy and cursor pagination on `/tasks` (page 50 / max 100; probe hits first page only). Source: staging `docs/performance.md` (`74ede853`). Earlier docs wrongly reused this table as “clean baseline.”

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 266      | 0.0%       | 1126  | 1902  | 2771  |
| 50   | 353      | 0.0%       | 2305  | 2908  | 3618  |
| 100  | 485      | 0.0%       | 3606  | 4339  | 5063  |
| 150  | 520      | 0.0%       | 5798  | 7384  | 7914  |
| 200  | 589      | 0.0%       | 7224  | 8030  | 8944  |
| 500  | 790      | 0.0%       | 17160 | 23071 | 24842 |
| 1000 | 1461     | 15.1%      | 31557 | 49187 | 53322 |

Observation: Peak during this ladder: CPU ~99%, memory ~400 MB (~78% of 512 MB). Better than the true clean baseline at mid load; 1000 VU errors still 15.1%.

### 3 — Gzip on top of join + pagination

Express `compression()` enabled while join and pagination were still active.

Peak during this ladder: CPU ~92%, memory ~501 MB (~98% of 512 MB).

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 400      | 0.0%       | 715   | 1440  | 2547  |
| 50   | 494      | 0.0%       | 1500  | 2605  | 5289  |
| 100  | 532      | 0.0%       | 3196  | 4550  | 5360  |
| 150  | 543      | 0.0%       | 4895  | 6638  | 40207 |
| 200  | 580      | 0.0%       | 6754  | 7725  | 8666  |
| 500  | 826      | 0.0%       | 15713 | 20473 | 23579 |
| 1000 | 2747     | 52.3%      | 33176 | 44847 | 55263 |

### 4 — Gzip only (join and pagination reverted)

Gzip kept; join strategy and pagination removed. Zero errors through 500 VUs; about 89% errors at 1000 VUs.

Peak during this ladder: CPU 100%, memory ~429 MB (~84% of 512 MB).

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 231      | 0.0%       | 1396  | 2502  | 3862  |
| 50   | 225      | 0.0%       | 3091  | 9264  | 10174 |
| 100  | 237      | 0.0%       | 4942  | 16597 | 16982 |
| 150  | 319      | 0.0%       | 12579 | 15071 | 15417 |
| 200  | 309      | 0.0%       | 19101 | 23990 | 40632 |
| 500  | 647      | 0.0%       | 28720 | 51604 | 58228 |
| 1000 | 6721     | 89.2%      | 38170 | 58597 | 61136 |

### 5 — Postgres pool max 20

Same gzip-only stack with the Prisma/`pg` pool raised to max 20 and a 10s connection timeout. Zero errors through 500 VUs; about 87% errors at 1000 VUs.

Peak during this ladder: CPU 100%, memory ~470 MB (~92% of 512 MB).

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 198      | 0.0%       | 1681  | 3607  | 4359  |
| 50   | 210      | 0.0%       | 3661  | 8120  | 9325  |
| 100  | 308      | 0.0%       | 5869  | 11687 | 13345 |
| 150  | 338      | 0.0%       | 9759  | 16714 | 18914 |
| 200  | 345      | 0.0%       | 10598 | 22914 | 23988 |
| 500  | 653      | 0.0%       | 24803 | 43326 | 46806 |
| 1000 | 6525     | 87.0%      | 34097 | 53200 | 57783 |

### 6 — Issue indexes added

Indexes on `assigneeOnly`, `(createdAt, id)`, `(organizationId, createdAt)`, and `(workerEngagementId, createdAt)` on top of the pool-tuned gzip-only stack.

Peak during this ladder: CPU 100%, memory ~484 MB (~95% of 512 MB).

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 207      | 0.0%       | 1501  | 2899  | 3996  |
| 50   | 241      | 0.0%       | 3368  | 7866  | 9041  |
| 100  | 262      | 0.0%       | 7720  | 11302 | 13579 |
| 150  | 303      | 0.0%       | 8774  | 20536 | 22740 |
| 200  | 351      | 0.0%       | 17399 | 26099 | 29370 |
| 500  | 639      | 0.0%       | 29652 | 50660 | 51971 |
| 1000 | 7308     | 89.3%      | 32382 | 56124 | 59093 |

## Resource peaks (summary)

| Run                          | Peak CPU | Peak memory   |
| ---------------------------- | -------- | ------------- |
| 1 — Clean baseline           | not captured this run | not captured this run |
| 2 — Join + pagination        | ~99%     | ~400 MB (78%) |
| 3 — Gzip + join + pagination | ~92%     | ~501 MB (98%) |
| 4 — Gzip only                | 100%     | ~429 MB (84%) |
| 5 — Pool max 20              | 100%     | ~470 MB (92%) |
| 6 — Issue indexes            | 100%     | ~484 MB (95%) |

## Conclusion

Several backend tweaks were tried (query changes, gzip, bigger DB pool, indexes). None of them stopped failures at 1000 concurrent users. Staging runs on one small Render Starter box (0.5 CPU, 512 MB). Under that load, CPU hits roughly 90–100% and memory climbs into the high hundreds of MB (up to ~98%). The machine itself is saturated — that is why requests fail. The next move is to run two Starter instances so traffic can be split between them.
