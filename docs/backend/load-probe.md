# Load probe

The purose of the following probe is to find out the limits of the current backend setup with the route that is being hit by most users and contains the most data on a request.

## What it measures

The probe hits one API path with N concurrent virtual users (VU) and prints request count, error rate, p50, p95, and max latency. There are two modes:

## Staging results overview

All ladders below used seed admin login, baseline mode, fifteen seconds per VU level, against staging `GET /tasks`. Latencies are milliseconds. CPU and memory peaks are from Render metrics for the staging Starter instance (0.5 CPU, 512 MB RAM) during each ladder — peaks in that window, not a per-VU sample.

## High-level approach

1. Letting concurrent virtual users send requests to our /tasks backend route
2. Show the output this produced
3. Make a certain change that my reasoning thought will speed up the process
4. Re-run and show the result
5. Compare results and check if any speed gain occured

## Empty task list

Change: Called `/tasks` with no seeded tasks (empty list for that organisation). This is the first table that reached `main`.

| VUs  | Requests | Error rate | p50      | p95      | max      |
| ---- | -------- | ---------- | -------- | -------- | -------- |
| 20   | 721      | 0%         | 395 ms   | 778 ms   | 40087 ms |
| 50   | 709      | 0%         | 1049 ms  | 1591 ms  | 2026 ms  |
| 100  | 695      | 0%         | 2266 ms  | 3070 ms  | 3868 ms  |
| 150  | 751      | 0%         | 3502 ms  | 4210 ms  | 5388 ms  |
| 200  | 712      | 0%         | 4816 ms  | 6642 ms  | 7740 ms  |
| 500  | 1007     | 0%         | 10174 ms | 13987 ms | 40389 ms |
| 1000 | 1409     | 7.6%       | 23317 ms | 31286 ms | 32270 ms |

Reasoning: First errors appear at 1000 users. A few max times (at 20 and 500 users) are outliers and do not match the p95.

## 100 seeded tasks

Unless noted, each run below used one hundred seeded tasks. These tables lived on `staging` and were missing from `main` until restored into this page.

### 1 — Clean baseline (100 tasks, no optimizations)

Change: Full task list with no special query joins, no pagination, and responses sent without gzip compression. Confirmed 100 tasks (~116 KB response). Database connection pool was still max 20.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 117      | 0.0%       | 2156  | 7060  | 8272  |
| 50   | 222      | 0.0%       | 4088  | 7140  | 10459 |
| 100  | 261      | 0.4%       | 6621  | 14585 | 16322 |
| 150  | 325      | 0.0%       | 8475  | 17987 | 18931 |
| 200  | 372      | 0.0%       | 13468 | 22057 | 23379 |
| 500  | 653      | 0.0%       | 27306 | 46868 | 49581 |
| 1000 | 4017     | 77.9%      | 36599 | 61590 | 70408 |

Reasoning: Returning the full task list is heavy. At 1000 users most requests fail (77.9%).

### 2 — Faster related-data loading + pagination

Change: Load related task data with a single SQL join, and return tasks in pages (50 per page, max 100). The probe only hits the first page.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 266      | 0.0%       | 1126  | 1902  | 2771  |
| 50   | 353      | 0.0%       | 2305  | 2908  | 3618  |
| 100  | 485      | 0.0%       | 3606  | 4339  | 5063  |
| 150  | 520      | 0.0%       | 5798  | 7384  | 7914  |
| 200  | 589      | 0.0%       | 7224  | 8030  | 8944  |
| 500  | 790      | 0.0%       | 17160 | 23071 | 24842 |
| 1000 | 1461     | 15.1%      | 31557 | 49187 | 53322 |

Reasoning: Peak during this ladder: CPU ~99%, memory ~400 MB (~78% of 512 MB). Better than the true clean baseline at middle load; at 1000 users 15.1% of requests still fail.

### 3 — Gzip on top of join + pagination

Change: Compress API responses (gzip) while the join and pagination from ladder 2 were still active.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 400      | 0.0%       | 715   | 1440  | 2547  |
| 50   | 494      | 0.0%       | 1500  | 2605  | 5289  |
| 100  | 532      | 0.0%       | 3196  | 4550  | 5360  |
| 150  | 543      | 0.0%       | 4895  | 6638  | 40207 |
| 200  | 580      | 0.0%       | 6754  | 7725  | 8666  |
| 500  | 826      | 0.0%       | 15713 | 20473 | 23579 |
| 1000 | 2747     | 52.3%      | 33176 | 44847 | 55263 |

Reasoning: Peak during this ladder: CPU ~92%, memory ~501 MB (~98% of 512 MB).

### 4 — Gzip only (join and pagination reverted)

Change: Keep response compression; remove the join strategy and pagination so `/tasks` returns the full list again.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 231      | 0.0%       | 1396  | 2502  | 3862  |
| 50   | 225      | 0.0%       | 3091  | 9264  | 10174 |
| 100  | 237      | 0.0%       | 4942  | 16597 | 16982 |
| 150  | 319      | 0.0%       | 12579 | 15071 | 15417 |
| 200  | 309      | 0.0%       | 19101 | 23990 | 40632 |
| 500  | 647      | 0.0%       | 28720 | 51604 | 58228 |
| 1000 | 6721     | 89.2%      | 38170 | 58597 | 61136 |

Reasoning: Peak during this ladder: CPU 100%, memory ~429 MB (~84% of 512 MB). Zero errors through 500 users; about 89% errors at 1000 users.

### 5 — More database connections (pool max 20)

Change: Same gzip-only setup as ladder 4, but allow up to 20 Postgres connections with a 10 second connection timeout.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 198      | 0.0%       | 1681  | 3607  | 4359  |
| 50   | 210      | 0.0%       | 3661  | 8120  | 9325  |
| 100  | 308      | 0.0%       | 5869  | 11687 | 13345 |
| 150  | 338      | 0.0%       | 9759  | 16714 | 18914 |
| 200  | 345      | 0.0%       | 10598 | 22914 | 23988 |
| 500  | 653      | 0.0%       | 24803 | 43326 | 46806 |
| 1000 | 6525     | 87.0%      | 34097 | 53200 | 57783 |

Reasoning: Peak during this ladder: CPU 100%, memory ~470 MB (~92% of 512 MB). Zero errors through 500 users; about 87% errors at 1000 users.

### 6 — Issue indexes added

Change: Add database indexes that help the task list query (including filters and sort by creation time), on top of the pool-tuned gzip-only stack from ladder 5.

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 207      | 0.0%       | 1501  | 2899  | 3996  |
| 50   | 241      | 0.0%       | 3368  | 7866  | 9041  |
| 100  | 262      | 0.0%       | 7720  | 11302 | 13579 |
| 150  | 303      | 0.0%       | 8774  | 20536 | 22740 |
| 200  | 351      | 0.0%       | 17399 | 26099 | 29370 |
| 500  | 639      | 0.0%       | 29652 | 50660 | 51971 |
| 1000 | 7308     | 89.3%      | 32382 | 56124 | 59093 |

Reasoning: Peak during this ladder: CPU 100%, memory ~484 MB (~95% of 512 MB).

### 7 — Redis cache on `GET /tasks`

Change: Staging now keeps a short-lived copy of each organisation’s task list in Redis (kept for 15 seconds, cleared when a task is created, updated, or deleted). Mention badges for the current user are still loaded from Postgres after that. Same probe settings as ladder 6 (100 seeded tasks, seed admin, baseline, 15s per user level).

| VUs  | Requests | Error rate | p50   | p95   | max   |
| ---- | -------- | ---------- | ----- | ----- | ----- |
| 20   | 206      | 0.0%       | 1484  | 3325  | 4179  |
| 50   | 252      | 0.0%       | 2840  | 6842  | 40777 |
| 100  | 289      | 0.0%       | 4879  | 13400 | 15008 |
| 150  | 352      | 0.0%       | 7850  | 17707 | 19289 |
| 200  | 370      | 0.0%       | 13615 | 21791 | 24774 |
| 500  | 711      | 0.0%       | 22161 | 39414 | 41986 |
| 1000 | 8088     | 89.7%      | 30667 | 46104 | 54200 |

Reasoning: Compared with ladder 6, middle load is faster and finishes more requests (for example at 100 users the median went from 7720 ms to 4879 ms; at 500 users requests went from 639 to 711). At 1000 users about 90% of requests still fail — login and subscription checks still run on every request, and the small staging machine is still the limit. Redis only speeds up the task-list database work, not everything else. CPU and memory peaks for this run were not recorded here.

## Resource peaks (summary)

| Run                          | Peak CPU | Peak memory   |
| ---------------------------- | -------- | ------------- |
| 1 — Clean baseline           | n/a      | n/a           |
| 2 — Join + pagination        | ~99%     | ~400 MB (78%) |
| 3 — Gzip + join + pagination | ~92%     | ~501 MB (98%) |
| 4 — Gzip only                | 100%     | ~429 MB (84%) |
| 5 — Pool max 20              | 100%     | ~470 MB (92%) |
| 6 — Issue indexes            | 100%     | ~484 MB (95%) |
| 7 — Redis `/tasks` cache     | not recorded | not recorded |

## Conclusion

- Several backend tweaks were tried (query changes, gzip, bigger DB pool, indexes, Redis list cache).
- None of them stopped failures at 1000 concurrent users.
- Current backend status: Staging runs on one small Render Starter box (0.5 CPU, 512 MB). Under that load, CPU hits 90–100% and memory climbs into the high hundreds of MB (up to ~98%).
- Conclusion: The machine itself is saturated which is why when there is high concurrency requests fail start failing.
- Next moves forward: Do horizontal scaling would would mean adding more machines to the current setup or vertical scaling which would mean upgrading the plan so that the machine i am currentluy using has more Cores and Memory.
