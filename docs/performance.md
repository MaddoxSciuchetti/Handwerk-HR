# Performance — staging `GET /tasks`

These are load-test results for the staging `/tasks` endpoint. Each run used the same login, lasted fifteen seconds per concurrency level, and records latency in milliseconds.

## 1 — Empty list

This first run was a baseline before any performance changes. The organization had no tasks in the database yet.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 721 | 0% | 395 | 778 | 40087 |
| 50 | 709 | 0% | 1049 | 1591 | 2026 |
| 100 | 695 | 0% | 2266 | 3070 | 3868 |
| 150 | 751 | 0% | 3502 | 4210 | 5388 |
| 200 | 712 | 0% | 4816 | 6642 | 7740 |
| 500 | 1007 | 0% | 10174 | 13987 | 40389 |
| 1000 | 1409 | 7.6% | 23317 | 31286 | 32270 |

As more concurrent users hit the API, response times went up. Errors first appeared when we reached one thousand users.

## 2 — Faster query and page size limit

For this run we changed the task list so related data is loaded in one database query, and responses are limited to fifty tasks per page (with a maximum of one hundred). We seeded one hundred tasks, and the probe only requested the first page.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 266 | 0% | 1126 | 1902 | 2771 |
| 50 | 353 | 0% | 2305 | 2908 | 3618 |
| 100 | 485 | 0% | 3606 | 4339 | 5063 |
| 150 | 520 | 0% | 5798 | 7384 | 7914 |
| 200 | 589 | 0% | 7224 | 8030 | 8944 |
| 500 | 790 | 0% | 17160 | 23071 | 24842 |
| 1000 | 1461 | 15.1% | 31557 | 49187 | 53322 |

Smaller pages help keep the response size under control, but a single server still slows down under heavy concurrency. The error rate at one thousand users was higher than in the empty-list baseline.

## 3 — Gzip

On top of the query and pagination changes, we enabled gzip so responses are compressed before they are sent to the client.

| VUs | Requests | Error rate | p50 | p95 | max |
|-----|----------|------------|-----|-----|-----|
| 20 | 400 | 0% | 715 | 1440 | 2547 |
| 50 | 494 | 0% | 1500 | 2605 | 5289 |
| 100 | 532 | 0% | 3196 | 4550 | 5360 |
| 150 | 543 | 0% | 4895 | 6638 | 40207 |
| 200 | 580 | 0% | 6754 | 7725 | 8666 |
| 500 | 826 | 0% | 15713 | 20473 | 23579 |
| 1000 | 2747 | 52.3% | 33176 | 44847 | 55263 |

At moderate load the numbers look similar to the previous run, but at one thousand users the error rate got worse. Compression alone does not fix an overloaded single server.

**Next step:** Add a second Starter instance on Render so traffic can be shared across two servers.
