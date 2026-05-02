# Database Performance Review

In order to test the performance of this database a seed script has been created that seeds all 20 tables with data. Below is a table that shows how many rows for each table have been created. The amount of data represents a realistic yet very ambitious database scenario and would be reached when the company accumulates 1000 active Organizations. The seed script ensured that the data of each table is in proportion to the other tables — i.e. comments on issues were scaled up accordingly and there cannot be more issues than comments.

The realistic yet ambitious scenario was taken to test performance on a large database while still keeping the goal attainable.

## What is being tested in this Performance Review

- Individual queries on tables
- Concurrent queries on tables
- [Overall performance of the database](./database-performance.md)
- [Performance of indexes](./index-performance.md)

## High-level approach

1. Show a query that the production system currently uses.
2. Show the output when running `EXPLAIN ANALYZE` (without any manually added indexes).
3. Add the indexes required.
4. Re-run `EXPLAIN ANALYZE`.
5. Compare results from both queries inside a table.
6. Written explanation.

## Overview of rows created with seed script

_(row counts per table to be filled in here)_

---

## Query 1 — Engagement overview with issues per organization

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    we.id AS engagement_id,
    we.type,
    we.start_date,
    we.end_date,
    we.organization_id,
    w.id AS worker_id,
    w.first_name AS worker_first_name,
    w.last_name AS worker_last_name,
    w.email AS worker_email,
    es.name AS engagement_status_name,
    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,
    i.id AS issue_id,
    i.title AS issue_title,
    i.priority,
    ist.name AS issue_status_name,
    a.first_name AS assignee_first_name,
    a.last_name AS assignee_last_name
FROM worker_engagements we
JOIN workers w ON w.id = we.worker_id
LEFT JOIN engagement_statuses es ON es.id = we.status_id
LEFT JOIN users ru ON ru.id = we.responsible_user_id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
LEFT JOIN issue_statuses ist ON ist.id = i.status_id
LEFT JOIN users a ON a.id = i.assignee_user_id
WHERE we.organization_id = 'YOUR_ORG_ID_HERE'
ORDER BY we.created_at ASC, i.created_at DESC;
```

### Result (without indexes)

**Overall**

| Metric         | Value                        |
| -------------- | ---------------------------- |
| Planning time  | 1.380 ms                     |
| Execution time | 36.289 ms                    |
| Total buffers  | shared hit = 5 353 (all RAM) |
| Sort           | quicksort, 65 kB (in-memory) |
| Result rows    | 180                          |

**Per-table access**

| Table                 | Access method               | Rows read | Rows kept | Time (ms) | Notes                                            |
| --------------------- | --------------------------- | --------- | --------- | --------- | ------------------------------------------------ |
| `issues`              | **Seq Scan**                | 180 000   | 180       | 19.83     | full scan, no index on `worker_engagement_id`    |
| `worker_engagements`  | **Seq Scan** + filter       | 15 000    | 15        | 1.61      | 14 985 rows discarded (no `organization_id` idx) |
| `workers`             | Index Scan (`workers_pkey`) | 15        | 15        | ~0.20     | memoized, 165/180 cache hits                     |
| `engagement_statuses` | Index Scan (`pkey`)         | 1         | 1         | ~0.03     | memoized                                         |
| `users` (responsible) | Index Scan (`users_pkey`)   | 1         | 1         | ~0.06     | memoized                                         |
| `issue_statuses`      | Index Scan (`pkey`) × 180   | 180       | 180       | ~0.18     | one lookup per issue                             |
| `users` (assignee)    | Index Scan (`users_pkey`)   | 1         | 1         | ~0.04     | memoized                                         |

### Key observations

> **Note:** The query processes far more data than is actually necessary due to missing indexes. The speed may appear fast but by no means does it indicate that it would continue to be fast when the database further scales. The solution is proper indexing.

### Indexes added

```sql
CREATE INDEX worker_engagements_org_created_idx
ON worker_engagements (organization_id, created_at);

CREATE INDEX issues_engagement_created_idx
ON issues (worker_engagement_id, created_at DESC);
```

The adding of the above indexes changed the execution plan from sequential scans and hash joins to index scans and nested loops. This resulted in the query being 30× faster, jumping from an execution time of 36.289 ms → 1.197 ms, as Postgres no longer scans the full `worker_engagements` and `issues` tables directly.

### Single-query performance comparison

| Metric            | Before indexes       | After indexes        |
| ----------------- | -------------------- | -------------------- |
| Execution time    | 36.289 ms            | 1.197 ms             |
| Speedup           | —                    | ~30× faster          |
| Buffers touched   | 5353                 | 878                  |
| Engagement access | Seq Scan (15k rows)  | Index Scan (15 rows) |
| Issues access     | Seq Scan (180k rows) | Bitmap Index Scan    |
| Join type         | Hash Join            | Nested Loop          |
| Sort              | Full Sort            | Incremental Sort     |

### Concurrent benchmark (pgbench, 50 clients, 60 s)

I also tested the same query using pgbench. PgBench is a simple command-line benchmarking tool for PostgresSQL databases. It is used to measure the performance of a database under load. Key indicators are TPS (transactions per second) , Latency (how long transactions take) and how performance changes when adding more clients. This example used only 50 clients. For further testing it is recommended to test performance with a different number of clients.

| Metric                 | Before indexes | After indexes |
| ---------------------- | -------------- | ------------- |
| Clients                | 50             | 50            |
| Duration               | 60 s           | 60 s          |
| Transactions processed | 46 087         | 334 613       |
| Failed transactions    | 0              | 0             |
| Avg latency            | 64.865 ms      | 8.930 ms      |
| TPS                    | 770.83         | 5 599.10      |

The concurrent benchmark shows that the added indexes significantly improved Query 1 under load. With 50 concurrent clients, the database processed 46 087 transactions before indexing and 334 613 after indexing. Average latency dropped from 64.865 ms to 8.930 ms, while throughput increased from 770.83 TPS to 5 599.10 TPS. This means the indexed version handled roughly 7.3× more concurrent query executions per second while also responding much faster. The fact that both tests had 0 failed transactions shows that the database remained stable in both cases, but the indexed version used its resources far more efficiently.

### Optimized query shape

The above query has also further been optimized regarding its shape. Below is an example of the optimized shape.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    we.id AS engagement_id,
    we.type,
    we.start_date,
    we.end_date,
    we.organization_id,

    w.id AS worker_id,
    w.first_name AS worker_first_name,
    w.last_name AS worker_last_name,
    w.email AS worker_email,

    es.name AS engagement_status_name,

    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,

    COALESCE(
      json_agg(
        json_build_object(
          'issue_id', i.id,
          'title', i.title,
          'priority', i.priority,
          'issue_status', ist.name,
          'assignee_first_name', a.first_name,
          'assignee_last_name', a.last_name
        )
        ORDER BY i.created_at DESC
      ) FILTER (WHERE i.id IS NOT NULL),
      '[]'
    ) AS issues
FROM worker_engagements we
JOIN workers w ON w.id = we.worker_id
LEFT JOIN engagement_statuses es ON es.id = we.status_id
LEFT JOIN users ru ON ru.id = we.responsible_user_id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
LEFT JOIN issue_statuses ist ON ist.id = i.status_id
LEFT JOIN users a ON a.id = i.assignee_user_id
WHERE we.organization_id = 'YOUR_ORG_ID_HERE'
GROUP BY
    we.id,
    we.type,
    we.start_date,
    we.end_date,
    we.organization_id,
    we.created_at,
    w.id,
    w.first_name,
    w.last_name,
    w.email,
    es.name,
    ru.first_name,
    ru.last_name
ORDER BY we.created_at ASC;
```

After adding the correct indexes:

```sql
CREATE INDEX worker_engagements_org_created_idx
ON worker_engagements (organization_id, created_at);

CREATE INDEX issues_engagement_created_idx
ON issues (worker_engagement_id, created_at DESC);

ANALYZE;
```

The query performed almost identically to the query before. The difference is that the latest one only returns 15 rows with all the issues inside a JSON object for each engagement. This can prove to be more efficient once it is being sent over the network.

---

## Query 2 — Issues for an organization, ordered by created date

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT i.*
FROM issues i
JOIN worker_engagements we
  ON we.id = i.worker_engagement_id
WHERE we.organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'
ORDER BY i.created_at DESC;
```

### Result (without indexes)

**Overall**

| Metric         | Value                                      |
| -------------- | ------------------------------------------ |
| Planning time  | 0.315 ms                                   |
| Execution time | 22.415 ms                                  |
| Total buffers  | shared hit = 5 293 (all RAM)               |
| Parallelism    | Gather Merge, 2 workers planned & launched |
| Sort           | quicksort, 42 kB (per worker, in-memory)   |
| Result rows    | 180                                        |

**Per-table access**

| Table                | Access method         | Rows read | Rows kept | Time (ms) | Notes                                                                           |
| -------------------- | --------------------- | --------- | --------- | --------- | ------------------------------------------------------------------------------- |
| `issues`             | **Parallel Seq Scan** | 180 000   | 180       | ~5.95     | full scan across 3 workers, no index on `worker_engagement_id`                  |
| `worker_engagements` | **Seq Scan** + filter | 15 000    | 15        | ~1.85     | 14 985 rows discarded (no `organization_id` idx), repeated per worker (loops=3) |

### Indexes added

```sql
CREATE INDEX worker_engagements_org_created_idx
ON worker_engagements (organization_id, created_at);

CREATE INDEX issues_engagement_created_idx
ON issues (worker_engagement_id, created_at DESC);
```

### Key observations

### Single-query performance comparison

| Metric            | Before indexes                | After indexes            |
| ----------------- | ----------------------------- | ------------------------ |
| Execution time    | 22.415 ms                     | 0.623 ms                 |
| Speedup           | —                             | ~36× faster              |
| Buffers touched   | 5293                          | 242                      |
| Engagement access | Seq Scan (15k rows)           | Bitmap Index Scan        |
| Issues access     | Parallel Seq Scan (180k rows) | Bitmap Index Scan        |
| Join type         | Hash Join                     | Nested Loop              |
| Sort              | Full Sort                     | Full Sort (still needed) |

### Concurrent benchmark (pgbench)

| Metric       | Before indexes | After indexes |
| ------------ | -------------- | ------------- |
| Transactions | 37 103         | 741 890       |
| Avg latency  | 80.572 ms      | 4.027 ms      |
| TPS          | 620.56         | 12 417.52     |
| Failed       | 0              | 0             |

Indexing dramatically improved Query 2 under concurrency. The database went from scanning large portions of the `issues` table to directly accessing relevant rows via indexes. This reduced latency from ~80 ms to ~4 ms and increased throughput by ~20×, showing that the original bottleneck was full table scans on a large dataset.

---

## Query 3 — Workers with their latest engagement (LATERAL)

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    w.id,
    w.first_name,
    w.last_name,
    w.email,
    w.status,
    w.organization_id,
    w.created_at,
    we.id AS engagement_id,
    we.start_date,
    we.end_date,
    we.type,
    es.name AS engagement_status_name,
    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,
    ru.email AS responsible_email,
    cb.first_name AS created_by_first_name,
    cb.last_name AS created_by_last_name,
    cb.email AS created_by_email
FROM workers w
LEFT JOIN LATERAL (
    SELECT we_inner.*
    FROM worker_engagements we_inner
    WHERE we_inner.worker_id = w.id
    ORDER BY we_inner.start_date DESC NULLS LAST
    LIMIT 1
) we ON true
LEFT JOIN engagement_statuses es ON es.id = we.status_id
LEFT JOIN users ru ON ru.id = we.responsible_user_id
LEFT JOIN users cb ON cb.id = w.created_by_user_id
WHERE w.organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'
ORDER BY w.created_at DESC;
```

### Result (without indexes)

**Overall**

| Metric         | Value                        |
| -------------- | ---------------------------- |
| Planning time  | 2.614 ms                     |
| Execution time | 19.352 ms                    |
| Total buffers  | shared hit = 4 268 (all RAM) |
| Sort           | quicksort, 28 kB (in-memory) |
| Result rows    | 15                           |

**Per-table access**

| Table                          | Access method                         | Rows read | Rows kept | Time (ms) | Notes                                                    |
| ------------------------------ | ------------------------------------- | --------- | --------- | --------- | -------------------------------------------------------- |
| `workers`                      | **Seq Scan** + filter                 | 15 000    | 15        | ~2.74     | 14 985 rows discarded (no `organization_id` idx)         |
| `worker_engagements` (LATERAL) | **Seq Scan** + filter, sort + LIMIT 1 | 225 000   | 15        | ~16.0     | 15 000 scanned per worker × 15 loops, no `worker_id` idx |
| `engagement_statuses`          | Index Scan (`pkey`)                   | 1         | 1         | ~0.04     | memoized, 14/15 cache hits                               |
| `users` (responsible)          | Index Scan (`users_pkey`)             | 1         | 1         | ~0.03     | memoized                                                 |
| `users` (created_by)           | Index Scan (`users_pkey`)             | 1         | 1         | ~0.02     | memoized                                                 |

### Indexes added

```sql
CREATE INDEX workers_org_created_idx
ON workers (organization_id, created_at DESC);

CREATE INDEX worker_engagements_worker_start_idx
ON worker_engagements (worker_id, start_date DESC);

ANALYZE;
```

### Single-query performance comparison

| Metric            | Before indexes                      | After indexes           |
| ----------------- | ----------------------------------- | ----------------------- |
| Execution time    | 19.352 ms                           | 0.424 ms                |
| Speedup           | —                                   | ~46× faster             |
| Buffers touched   | 4268                                | 71                      |
| Worker access     | Seq Scan                            | Bitmap Index Scan       |
| Engagement access | Repeated Seq Scan                   | Index Scan              |
| Main bottleneck   | LATERAL scanned all engagements 15× | Direct lookup by worker |

### Concurrent benchmark (pgbench)

| Metric       | Before indexes | After indexes |
| ------------ | -------------- | ------------- |
| Transactions | 65 732         | 1 224 414     |
| Avg latency  | 45.449 ms      | 2.439 ms      |
| TPS          | 1 100.13       | 20 496.30     |
| Failed       | 0              | 0             |

The performance gain comes mainly from eliminating repeated scans inside the `LATERAL` subquery. Before indexing, the database scanned `worker_engagements` multiple times per worker. After indexing, it directly retrieves the latest engagement using an index, reducing both CPU work and memory usage, leading to a ~18× improvement.

---

## Query 4 — Issue statuses with count of issues per status

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    ist.*,
    (
      SELECT COUNT(*)::int
      FROM issues i
      WHERE i.status_id = ist.id
    ) AS issues_using_status
FROM issue_statuses ist
WHERE ist.organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'
ORDER BY ist.order_index ASC;
```

### Result (without indexes)

**Overall**

| Metric         | Value                         |
| -------------- | ----------------------------- |
| Planning time  | 0.529 ms                      |
| Execution time | 47.408 ms                     |
| Total buffers  | shared hit = 13 504, read = 1 |
| Sort           | quicksort, 25 kB (in-memory)  |
| Result rows    | 3                             |

**Per-table access**

| Table              | Access method                                                        | Rows read | Rows kept | Time (ms) | Notes                                                                        |
| ------------------ | -------------------------------------------------------------------- | --------- | --------- | --------- | ---------------------------------------------------------------------------- |
| `issue_statuses`   | Bitmap Index Scan (`issue_statuses_organization_id_name_key`) → Heap | 3         | 3         | ~0.30     | uses existing unique index                                                   |
| `issues` (subplan) | **Seq Scan** + filter, repeated per status                           | 540 000   | 180       | ~46.9     | 180 000 rows × 3 loops, 179 940 discarded each loop, no index on `status_id` |

### Indexes added

```sql
CREATE INDEX issues_status_id_idx
ON issues(status_id);

CREATE INDEX issue_statuses_org_order_idx
ON issue_statuses(organization_id, order_index);

ANALYZE;
```

### Single-query performance comparison

| Metric             | Before indexes                     | After indexes                             |
| ------------------ | ---------------------------------- | ----------------------------------------- |
| Execution time     | 47.408 ms                          | 0.232 ms                                  |
| Speedup            | —                                  | ~204× faster                              |
| Buffers touched    | 13 505                             | 12                                        |
| Status lookup      | Bitmap index via unique constraint | Bitmap index via org/order index          |
| Issue count lookup | Seq Scan on `issues`               | Index Only Scan on `issues_status_id_idx` |
| Main bottleneck    | Scanned 180 000 issues 3 times     | Direct count via status index             |

### Concurrent benchmark (pgbench)

| Metric       | Before indexes | After indexes |
| ------------ | -------------- | ------------- |
| Transactions | 18 160         | 3 220 814     |
| Avg latency  | 164.737 ms     | 0.927 ms      |
| TPS          | 303.51         | 53 915.55     |
| Failed       | 0              | 0             |

This query had the worst baseline performance because it repeatedly scanned the entire `issues` table for each status. Indexing `issues(status_id)` transformed this into an index-only lookup, eliminating repeated full scans. This led to a massive ~177× improvement, making it the most impactful optimization among all queries.

---

## Query 5 — Worker with documents, latest engagement and issues

```sql
EXPLAIN (ANALYZE, BUFFERS)
WITH picked_worker AS (
  SELECT w.id, w.organization_id
  FROM workers w
  ORDER BY w.id
  LIMIT 1
)
SELECT
    w.*,
    wd.id AS doc_id,
    wd.name AS doc_name,
    wd.file_url,
    we.id AS eng_id,
    i.id AS issue_id,
    i.title
FROM workers w
LEFT JOIN worker_documents wd ON wd.worker_id = w.id
LEFT JOIN worker_engagements we ON we.worker_id = w.id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
WHERE w.id = (SELECT id FROM picked_worker)
  AND w.organization_id = (SELECT organization_id FROM picked_worker);
```

### Result (without indexes)

**Overall**

| Metric         | Value                        |
| -------------- | ---------------------------- |
| Planning time  | 0.762 ms                     |
| Execution time | 36.382 ms                    |
| Total buffers  | shared hit = 5 131 (all RAM) |
| Result rows    | 12                           |

**Per-table access**

| Table                | Access method                         | Rows read | Rows kept | Time (ms) | Notes                                                                                     |
| -------------------- | ------------------------------------- | --------- | --------- | --------- | ----------------------------------------------------------------------------------------- |
| `workers` (CTE pick) | Index Scan (`workers_pkey`) + LIMIT 1 | 1         | 1         | ~0.01     | picks one worker via primary key                                                          |
| `workers` (main)     | Index Scan (`workers_pkey`)           | 1         | 1         | ~0.02     | direct lookup by id                                                                       |
| `worker_documents`   | **Seq Scan** + filter                 | 15 702    | 1         | ~1.39     | 15 701 rows discarded, no index on `worker_id`                                            |
| `worker_engagements` | **Seq Scan** + filter (build hash)    | 15 000    | 1         | ~2.50     | 14 999 rows discarded, no index on `worker_id`                                            |
| `issues`             | **Seq Scan** (probe hash)             | 180 000   | 12        | ~15.46    | full table scan to join against the single engagement, no index on `worker_engagement_id` |

### Indexes added

```sql
CREATE INDEX worker_documents_worker_id_idx
ON worker_documents(worker_id);

CREATE INDEX worker_engagements_worker_id_idx
ON worker_engagements(worker_id);

CREATE INDEX issues_worker_engagement_id_idx
ON issues(worker_engagement_id);

ANALYZE;
```

### Single-query performance comparison

| Metric            | Before indexes       | After indexes     |
| ----------------- | -------------------- | ----------------- |
| Execution time    | 36.382 ms            | 1.005 ms          |
| Speedup           | —                    | ~36× faster       |
| Buffers touched   | 5131                 | 27                |
| Worker lookup     | Index Scan (PK)      | Index Scan (PK)   |
| Documents access  | Seq Scan             | Index Scan        |
| Engagement access | Seq Scan             | Index Scan        |
| Issues access     | Seq Scan (180k rows) | Bitmap Index Scan |

### Concurrent benchmark (pgbench)

| Metric       | Before indexes | After indexes |
| ------------ | -------------- | ------------- |
| Transactions | 38 246         | 920 344       |
| Avg latency  | 78.157 ms      | 3.246 ms      |
| TPS          | 639.74         | 15 404.63     |
| Failed       | 0              | 0             |

The improvement comes from indexing all foreign key relationships (`worker_documents`, `worker_engagements`, `issues`). Before indexing, each join required scanning entire tables. After indexing, all joins became direct lookups, reducing latency significantly and improving throughput by ~24×.
