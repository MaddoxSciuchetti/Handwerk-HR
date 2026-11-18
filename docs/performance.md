# Performance — staging `GET /tasks`

Load tests against staging. Same login each time. Fifteen seconds per level. Times in milliseconds.

## 1 — Empty list

No code changes yet. The org had no tasks.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 721 | 0% | 395 | 778 | 40087 |
| 50 | 709 | 0% | 1049 | 1591 | 2026 |
| 100 | 695 | 0% | 2266 | 3070 | 3868 |
| 150 | 751 | 0% | 3502 | 4210 | 5388 |
| 200 | 712 | 0% | 4816 | 6642 | 7740 |
| 500 | 1007 | 0% | 10174 | 13987 | 40389 |
| 1000 | 1409 | 7.6% | 23317 | 31286 | 32270 |

More users made the API slower. Errors started at 1000 users.

## 2 — Faster query and page size limit

We load related data in one database query and return fifty tasks per page (up to one hundred). One hundred tasks were seeded; the test only asks for the first page.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 266 | 0% | 1126 | 1902 | 2771 |
| 50 | 353 | 0% | 2305 | 2908 | 3618 |
| 100 | 485 | 0% | 3606 | 4339 | 5063 |
| 150 | 520 | 0% | 5798 | 7384 | 7914 |
| 200 | 589 | 0% | 7224 | 8030 | 8944 |
| 500 | 790 | 0% | 17160 | 23071 | 24842 |
| 1000 | 1461 | 15.1% | 31557 | 49187 | 53322 |

Smaller responses help, but one server still struggles at high load. Errors at 1000 users went up.

## 3 — Gzip

Responses are now compressed before they leave the server.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 400 | 0% | 715 | 1440 | 2547 |
| 50 | 494 | 0% | 1500 | 2605 | 5289 |
| 100 | 532 | 0% | 3196 | 4550 | 5360 |
| 150 | 543 | 0% | 4895 | 6638 | 40207 |
| 200 | 580 | 0% | 6754 | 7725 | 8666 |
| 500 | 826 | 0% | 15713 | 20473 | 23579 |
| 1000 | 2747 | 52.3% | 33176 | 44847 | 55263 |

Normal load looks similar. At 1000 users, errors got worse. Compression does not fix a single overloaded server.

**Next step:** Add a second Starter instance on Render so traffic is shared across two servers.
