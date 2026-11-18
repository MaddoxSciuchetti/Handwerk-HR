# Load testing results — staging `GET /tasks`

All runs used the seed admin login, baseline mode, fifteen seconds per VU level, and one hundred seeded tasks unless noted. Latencies are milliseconds.

## 1 — Clean baseline (100 tasks, no optimizations)

Full task list with no Prisma join strategy, no pagination, and no gzip.

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

Same ladder after join strategy and cursor pagination on `/tasks` (same measured numbers as table 1 in this record).

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

| VUs | Requests | Error rate | p50 | p95 | max |
|----:|---------:|-----------:|----:|----:|----:|
| 20 | 207 | 0.0% | 1501 | 2899 | 3996 |
| 50 | 241 | 0.0% | 3368 | 7866 | 9041 |
| 100 | 262 | 0.0% | 7720 | 11302 | 13579 |
| 150 | 303 | 0.0% | 8774 | 20536 | 22740 |
| 200 | 351 | 0.0% | 17399 | 26099 | 29370 |
| 500 | 639 | 0.0% | 29652 | 50660 | 51971 |
| 1000 | 7308 | 89.3% | 32382 | 56124 | 59093 |

## Conclusion

Across these runs, query shape, gzip, pool size, and indexes did not remove the cliff at 1000 virtual users on a single Render Starter instance. The bottleneck is single-instance CPU and memory. Next step is horizontal scaling — add a second Starter instance so load can be balanced.
