# Load testing results — staging `GET /tasks`

All runs used the seed admin login, baseline mode, fifteen seconds per VU level, and one hundred seeded tasks unless noted. Latencies are milliseconds.

**CPU / memory:** Taken from Render metrics for the staging Starter instance (0.5 CPU, 512 MB RAM) during each ladder. Values are the **peak** in that window (not a per-VU sample — each VU step is only 15 seconds, while metrics are ~30–60 second buckets). CPU % is share of the half-core; memory % is of 512 MB.

## 1 — Clean baseline (100 tasks, no optimizations)

Full task list with no Prisma join strategy, no pagination, and no gzip.

Peak during this ladder: **CPU ~99%**, **memory ~400 MB (~78% of 512 MB)**.

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 266 | 0.0% | 1126 | 1902 | 2771 |
| 50 | 353 | 0.0% | 2305 | 2908 | 3618 |
| 100 | 485 | 0.0% | 3606 | 4339 | 5063 |
| 150 | 520 | 0.0% | 5798 | 7384 | 7914 |
| 200 | 589 | 0.0% | 7224 | 8030 | 8944 |
| 500 | 790 | 0.0% | 17160 | 23071 | 24842 |
| 1000 | 1461 | 15.1% | 31557 | 49187 | 53322 |

## 2 — Prisma `relationLoadStrategy: "join"` + cursor pagination

Same ladder after join strategy and cursor pagination on `/tasks` (same measured latency numbers as table 1 in this record).

Peak during this ladder: **CPU ~99%**, **memory ~400 MB (~78% of 512 MB)** (same Render window as table 1).

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 266 | 0.0% | 1126 | 1902 | 2771 |
| 50 | 353 | 0.0% | 2305 | 2908 | 3618 |
| 100 | 485 | 0.0% | 3606 | 4339 | 5063 |
| 150 | 520 | 0.0% | 5798 | 7384 | 7914 |
| 200 | 589 | 0.0% | 7224 | 8030 | 8944 |
| 500 | 790 | 0.0% | 17160 | 23071 | 24842 |
| 1000 | 1461 | 15.1% | 31557 | 49187 | 53322 |

## 3 — Gzip on top of join + pagination

Express `compression()` enabled while join and pagination were still active.

Peak during this ladder: **CPU ~92%**, **memory ~501 MB (~98% of 512 MB)**.

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 400 | 0.0% | 715 | 1440 | 2547 |
| 50 | 494 | 0.0% | 1500 | 2605 | 5289 |
| 100 | 532 | 0.0% | 3196 | 4550 | 5360 |
| 150 | 543 | 0.0% | 4895 | 6638 | 40207 |
| 200 | 580 | 0.0% | 6754 | 7725 | 8666 |
| 500 | 826 | 0.0% | 15713 | 20473 | 23579 |
| 1000 | 2747 | 52.3% | 33176 | 44847 | 55263 |

## 4 — Gzip only (join and pagination reverted)

Gzip kept; join strategy and pagination removed. Zero errors through 500 VUs; about 89% errors at 1000 VUs.

Peak during this ladder: **CPU 100%**, **memory ~429 MB (~84% of 512 MB)**.

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 231 | 0.0% | 1396 | 2502 | 3862 |
| 50 | 225 | 0.0% | 3091 | 9264 | 10174 |
| 100 | 237 | 0.0% | 4942 | 16597 | 16982 |
| 150 | 319 | 0.0% | 12579 | 15071 | 15417 |
| 200 | 309 | 0.0% | 19101 | 23990 | 40632 |
| 500 | 647 | 0.0% | 28720 | 51604 | 58228 |
| 1000 | 6721 | 89.2% | 38170 | 58597 | 61136 |

## 5 — Postgres pool max 20

Same gzip-only stack with the Prisma/`pg` pool raised to max 20 and a 10s connection timeout. Zero errors through 500 VUs; about 87% errors at 1000 VUs.

Peak during this ladder: **CPU 100%**, **memory ~470 MB (~92% of 512 MB)**.

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 198 | 0.0% | 1681 | 3607 | 4359 |
| 50 | 210 | 0.0% | 3661 | 8120 | 9325 |
| 100 | 308 | 0.0% | 5869 | 11687 | 13345 |
| 150 | 338 | 0.0% | 9759 | 16714 | 18914 |
| 200 | 345 | 0.0% | 10598 | 22914 | 23988 |
| 500 | 653 | 0.0% | 24803 | 43326 | 46806 |
| 1000 | 6525 | 87.0% | 34097 | 53200 | 57783 |

## 6 — Issue indexes added

Indexes on `assigneeOnly`, `(createdAt, id)`, `(organizationId, createdAt)`, and `(workerEngagementId, createdAt)` on top of the pool-tuned gzip-only stack.

Peak during this ladder: **CPU 100%**, **memory ~484 MB (~95% of 512 MB)**.

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 207 | 0.0% | 1501 | 2899 | 3996 |
| 50 | 241 | 0.0% | 3368 | 7866 | 9041 |
| 100 | 262 | 0.0% | 7720 | 11302 | 13579 |
| 150 | 303 | 0.0% | 8774 | 20536 | 22740 |
| 200 | 351 | 0.0% | 17399 | 26099 | 29370 |
| 500 | 639 | 0.0% | 29652 | 50660 | 51971 |
| 1000 | 7308 | 89.3% | 32382 | 56124 | 59093 |

## Resource peaks (summary)

| Run | Peak CPU | Peak memory |
|-----|---------:|------------:|
| 1 — Clean baseline | ~99% | ~400 MB (78%) |
| 2 — Join + pagination | ~99% | ~400 MB (78%) |
| 3 — Gzip + join + pagination | ~92% | ~501 MB (98%) |
| 4 — Gzip only | 100% | ~429 MB (84%) |
| 5 — Pool max 20 | 100% | ~470 MB (92%) |
| 6 — Issue indexes | 100% | ~484 MB (95%) |

## Conclusion

**Plain version:** We tried several backend tweaks (query changes, gzip, bigger DB pool, indexes). None of them stopped failures at 1000 concurrent users. Staging runs on **one** small Render Starter box (0.5 CPU, 512 MB). Under that load, CPU hits roughly 90–100% and memory climbs into the high hundreds of MB (up to ~98%). So the machine itself is full — that is why requests fail. The next move is to run **two** Starter instances so traffic can be split between them.
