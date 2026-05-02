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

```text
"  Sort Key: we.created_at, i.created_at DESC"
"  Sort Method: quicksort  Memory: 65kB"
"  Buffers: shared hit=5353"
"  ->  Nested Loop Left Join  (cost=448.14..7542.22 rows=180 width=211) (actual time=1.905..35.930 rows=180.00 loops=1)"
"        Buffers: shared hit=5353"
"        ->  Nested Loop Left Join  (cost=447.85..7537.11 rows=180 width=213) (actual time=1.857..35.792 rows=180.00 loops=1)"
"              Buffers: shared hit=5350"
"              ->  Nested Loop Left Join  (cost=447.57..7483.34 rows=180 width=222) (actual time=1.832..35.510 rows=180.00 loops=1)"
"                    Buffers: shared hit=4810"
"                    ->  Nested Loop Left Join  (cost=447.27..7462.82 rows=180 width=224) (actual time=1.767..35.349 rows=180.00 loops=1)"
"                          Buffers: shared hit=4807"
"                          ->  Nested Loop  (cost=446.98..7351.72 rows=180 width=232) (actual time=1.729..35.222 rows=180.00 loops=1)"
"                                Buffers: shared hit=4804"
"                                ->  Hash Right Join  (cost=446.69..7219.32 rows=180 width=183) (actual time=1.666..34.897 rows=180.00 loops=1)"
"                                      Hash Cond: (i.worker_engagement_id = we.id)"
"                                      Buffers: shared hit=4759"
"                                      ->  Seq Scan on issues i  (cost=0.00..6300.00 rows=180000 width=99) (actual time=0.033..19.829 rows=180000.00 loops=1)"
"                                            Buffers: shared hit=4500"
"                                      ->  Hash  (cost=446.50..446.50 rows=15 width=100) (actual time=1.617..1.617 rows=15.00 loops=1)"
"                                            Buckets: 1024  Batches: 1  Memory Usage: 10kB"
"                                            Buffers: shared hit=259"
"                                            ->  Seq Scan on worker_engagements we  (cost=0.00..446.50 rows=15 width=100) (actual time=0.018..1.607 rows=15.00 loops=1)"
"                                                  Filter: (organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'::uuid)"
"                                                  Rows Removed by Filter: 14985"
"                                                  Buffers: shared hit=259"
"                                ->  Memoize  (cost=0.30..8.05 rows=1 width=65) (actual time=0.001..0.001 rows=1.00 loops=180)"
"                                      Cache Key: we.worker_id"
"                                      Cache Mode: logical"
"                                      Hits: 165  Misses: 15  Evictions: 0  Overflows: 0  Memory Usage: 3kB"
"                                      Buffers: shared hit=45"
"                                      ->  Index Scan using workers_pkey on workers w  (cost=0.29..8.04 rows=1 width=65) (actual time=0.013..0.013 rows=1.00 loops=15)"
"                                            Index Cond: (id = we.worker_id)"
"                                            Index Searches: 15"
"                                            Buffers: shared hit=45"
"                          ->  Memoize  (cost=0.29..6.71 rows=1 width=24) (actual time=0.000..0.000 rows=1.00 loops=180)"
"                                Cache Key: we.status_id"
"                                Cache Mode: logical"
"                                Hits: 179  Misses: 1  Evictions: 0  Overflows: 0  Memory Usage: 1kB"
"                                Buffers: shared hit=3"
"                                ->  Index Scan using engagement_statuses_pkey on engagement_statuses es  (cost=0.28..6.70 rows=1 width=24) (actual time=0.032..0.032 rows=1.00 loops=1)"
"                                      Index Cond: (id = we.status_id)"
"                                      Index Searches: 1"
"                                      Buffers: shared hit=3"
"                    ->  Memoize  (cost=0.30..8.05 rows=1 width=30) (actual time=0.001..0.001 rows=1.00 loops=180)"
"                          Cache Key: we.responsible_user_id"
"                          Cache Mode: logical"
"                          Hits: 179  Misses: 1  Evictions: 0  Overflows: 0  Memory Usage: 1kB"
"                          Buffers: shared hit=3"
"                          ->  Index Scan using users_pkey on users ru  (cost=0.29..8.04 rows=1 width=30) (actual time=0.060..0.060 rows=1.00 loops=1)"
"                                Index Cond: (id = we.responsible_user_id)"
"                                Index Searches: 1"
"                                Buffers: shared hit=3"
"              ->  Index Scan using issue_statuses_pkey on issue_statuses ist  (cost=0.28..0.30 rows=1 width=23) (actual time=0.001..0.001 rows=1.00 loops=180)"
"                    Index Cond: (id = i.status_id)"
"                    Index Searches: 180"
"                    Buffers: shared hit=540"
"        ->  Memoize  (cost=0.30..0.32 rows=1 width=30) (actual time=0.000..0.000 rows=1.00 loops=180)"
"              Cache Key: i.assignee_user_id"
"              Cache Mode: logical"
"              Hits: 179  Misses: 1  Evictions: 0  Overflows: 0  Memory Usage: 1kB"
"              Buffers: shared hit=3"
"              ->  Index Scan using users_pkey on users a  (cost=0.29..0.31 rows=1 width=30) (actual time=0.043..0.043 rows=1.00 loops=1)"
"                    Index Cond: (id = i.assignee_user_id)"
"                    Index Searches: 1"
"                    Buffers: shared hit=3"
"Planning:"
"  Buffers: shared hit=30"
"Planning Time: 1.380 ms"
"Execution Time: 36.289 ms"
```

### Key observations

Even without the use of indexing the query above might still appear to be fast with a total runtime of 56 msec. However, this is also due to the DB being warm and data saved in memory.

- The query does a full table scan on the large tables seen here:
  - `issues` → scans 180k rows
  - `worker_engagements` → scans 15k rows
- This is due to missing indexes.
- Only 15 workers belong to an org — this leads to 14 985 rows being scanned and then discarded.
- Postgres builds the hash table instead of relying on index lookups. The lookup is still efficient but it also still scans all rows.
- The query is heavily relying on memory usage shown by `shared hit=5300`, which is data already in RAM. This explains the fast runtime.

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

| Metric | Before indexes | After indexes |
| --- | --- | --- |
| Execution time | 36.289 ms | 1.197 ms |
| Speedup | — | ~30× faster |
| Buffers touched | 5353 | 878 |
| Engagement access | Seq Scan (15k rows) | Index Scan (15 rows) |
| Issues access | Seq Scan (180k rows) | Bitmap Index Scan |
| Join type | Hash Join | Nested Loop |
| Sort | Full Sort | Incremental Sort |

### Concurrent benchmark (pgbench, 50 clients, 60 s)

I also tested the same query using `pgbench`. As above I noted the results without the indexes and then with the indexes. The result can be seen in the table below:

| Metric | Before indexes | After indexes | Change |
| --- | --- | --- | --- |
| Clients | 50 | 50 | Same |
| Duration | 60 s | 60 s | Same |
| Transactions processed | 46 087 | 334 613 | ~7.3× more |
| Failed transactions | 0 | 0 | Stable |
| Avg latency | 64.865 ms | 8.930 ms | ~7.3× faster |
| TPS | 770.83 | 5 599.10 | ~7.3× higher |

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

```text
"Gather Merge  (cost=6895.98..6916.94 rows=180 width=169) (actual time=20.125..22.351 rows=180.00 loops=1)"
"  Workers Planned: 2"
"  Workers Launched: 2"
"  Buffers: shared hit=5293"
"  ->  Sort  (cost=5895.95..5896.14 rows=75 width=169) (actual time=14.508..14.517 rows=60.00 loops=3)"
"        Sort Key: i.created_at DESC"
"        Sort Method: quicksort  Memory: 42kB"
"        Buffers: shared hit=5293"
"        Worker 0:  Sort Method: quicksort  Memory: 32kB"
"        Worker 1:  Sort Method: quicksort  Memory: 34kB"
"        ->  Hash Join  (cost=446.69..5893.62 rows=75 width=169) (actual time=2.056..14.444 rows=60.00 loops=3)"
"              Hash Cond: (i.worker_engagement_id = we.id)"
"              Buffers: shared hit=5277"
"              ->  Parallel Seq Scan on issues i  (cost=0.00..5250.00 rows=75000 width=169) (actual time=0.009..5.953 rows=60000.00 loops=3)"
"                    Buffers: shared hit=4500"
"              ->  Hash  (cost=446.50..446.50 rows=15 width=16) (actual time=1.865..1.866 rows=15.00 loops=3)"
"                    Buckets: 1024  Batches: 1  Memory Usage: 9kB"
"                    Buffers: shared hit=777"
"                    ->  Seq Scan on worker_engagements we  (cost=0.00..446.50 rows=15 width=16) (actual time=0.080..1.853 rows=15.00 loops=3)"
"                          Filter: (organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'::uuid)"
"                          Rows Removed by Filter: 14985"
"                          Buffers: shared hit=777"
"Planning:"
"  Buffers: shared hit=6"
"Planning Time: 0.315 ms"
"Execution Time: 22.415 ms"
```

### Key observations

**Before indexes:**

- Execution Time: 22.415 ms
- Parallel Seq Scan on `issues`
- Seq Scan on `worker_engagements`
- Buffers: `shared hit=5293`

### Indexes added

```sql
CREATE INDEX worker_engagements_org_created_idx
ON worker_engagements (organization_id, created_at);

CREATE INDEX issues_engagement_created_idx
ON issues (worker_engagement_id, created_at DESC);
```

**After indexes:**

- Execution Time: 0.623 ms
- Bitmap Index Scan on `worker_engagements_org_created_idx`
- Bitmap Index Scan on `issues_engagement_created_idx`
- Buffers: `shared hit=242`

**Bottom line: 36× faster.**

### Single-query performance comparison

| Metric | Before indexes | After indexes |
| --- | --- | --- |
| Execution time | 22.415 ms | 0.623 ms |
| Speedup | — | ~36× faster |
| Buffers touched | 5293 | 242 |
| Engagement access | Seq Scan (15k rows) | Bitmap Index Scan |
| Issues access | Parallel Seq Scan (180k rows) | Bitmap Index Scan |
| Join type | Hash Join | Nested Loop |
| Sort | Full Sort | Full Sort (still needed) |

### Concurrent benchmark (pgbench)

| Metric | Before indexes | After indexes | Change |
| --- | --- | --- | --- |
| Transactions | 37 103 | 741 890 | ~20× more |
| Avg latency | 80.572 ms | 4.027 ms | ~20× faster |
| TPS | 620.56 | 12 417.52 | ~20× higher |
| Failed | 0 | 0 | Stable |

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

```text
"Sort (cost=7308.56..7308.59 rows=15 width=193) (actual time=19.096..19.101 rows=15.00 loops=1)"
"  Sort Key: w.created_at DESC"
"  Sort Method: quicksort Memory: 28kB"
"  Buffers: shared hit=4268"
"  -> Nested Loop Left Join (cost=447.39..7308.26 rows=15 width=193) (actual time=2.611..19.062 rows=15.00 loops=1)"
"      Buffers: shared hit=4268"
"      -> Nested Loop Left Join (cost=447.10..7292.36 rows=15 width=177) (actual time=2.587..19.013 rows=15.00 loops=1)"
"          Buffers: shared hit=4265"
"          -> Nested Loop Left Join (cost=446.80..7275.94 rows=15 width=161) (actual time=2.550..18.951 rows=15.00 loops=1)"
"              Buffers: shared hit=4262"
"              -> Nested Loop Left Join (cost=446.51..7259.52 rows=15 width=169) (actual time=2.506..18.880 rows=15.00 loops=1)"
"                  Buffers: shared hit=4259"
"                  -> Seq Scan on workers w (cost=0.00..561.50 rows=15 width=109) (actual time=0.035..2.739 rows=15.00 loops=1)"
"                      Filter: (organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'::uuid)"
"                      Rows Removed by Filter: 14985"
"                      Buffers: shared hit=374"
"                  -> Limit (cost=446.51..446.51 rows=1 width=116) (actual time=1.074..1.074 rows=1.00 loops=15)"
"                      Buffers: shared hit=3885"
"                      -> Sort (cost=446.51..446.51 rows=1 width=116) (actual time=1.072..1.072 rows=1.00 loops=15)"
"                          Sort Key: we_inner.start_date DESC NULLS LAST"
"                          Sort Method: quicksort Memory: 25kB"
"                          Buffers: shared hit=3885"
"                          -> Seq Scan on worker_engagements we_inner (cost=0.00..446.50 rows=1 width=116) (actual time=0.422..1.064 rows=1.00 loops=15)"
"                              Filter: (worker_id = w.id)"
"                              Rows Removed by Filter: 14999"
"                              Buffers: shared hit=3885"
"              -> Memoize (cost=0.29..8.31 rows=1 width=24) (actual time=0.003..0.003 rows=1.00 loops=15)"
"                  Cache Key: we_inner.status_id"
"                  Cache Mode: logical"
"                  Hits: 14 Misses: 1 Evictions: 0 Overflows: 0 Memory Usage: 1kB"
"                  Buffers: shared hit=3"
"                  -> Index Scan using engagement_statuses_pkey on engagement_statuses es (cost=0.28..8.30 rows=1 width=24) (actual time=0.036..0.037 rows=1.00 loops=1)"
"                      Index Cond: (id = we_inner.status_id)"
"                      Index Searches: 1"
"                      Buffers: shared hit=3"
"          -> Memoize (cost=0.30..8.31 rows=1 width=48) (actual time=0.003..0.003 rows=1.00 loops=15)"
"              Cache Key: we_inner.responsible_user_id"
"              Cache Mode: logical"
"              Hits: 14 Misses: 1 Evictions: 0 Overflows: 0 Memory Usage: 1kB"
"              Buffers: shared hit=3"
"              -> Index Scan using users_pkey on users ru (cost=0.29..8.30 rows=1 width=48) (actual time=0.033..0.033 rows=1.00 loops=1)"
"                  Index Cond: (id = we_inner.responsible_user_id)"
"                  Index Searches: 1"
"                  Buffers: shared hit=3"
"      -> Memoize (cost=0.30..8.05 rows=1 width=48) (actual time=0.002..0.002 rows=1.00 loops=15)"
"          Cache Key: w.created_by_user_id"
"          Cache Mode: logical"
"          Hits: 14 Misses: 1 Evictions: 0 Overflows: 0 Memory Usage: 1kB"
"          Buffers: shared hit=3"
"          -> Index Scan using users_pkey on users cb (cost=0.29..8.04 rows=1 width=48) (actual time=0.019..0.019 rows=1.00 loops=1)"
"              Index Cond: (id = w.created_by_user_id)"
"              Index Searches: 1"
"              Buffers: shared hit=3"
"Planning:"
"  Buffers: shared hit=115 dirtied=1"
"Planning Time: 2.614 ms"
"Execution Time: 19.352 ms"
```

### Indexes added

```sql
CREATE INDEX workers_org_created_idx
ON workers (organization_id, created_at DESC);

CREATE INDEX worker_engagements_worker_start_idx
ON worker_engagements (worker_id, start_date DESC);

ANALYZE;
```

### Single-query performance comparison

| Metric | Before indexes | After indexes |
| --- | --- | --- |
| Execution time | 19.352 ms | 0.424 ms |
| Speedup | — | ~46× faster |
| Buffers touched | 4268 | 71 |
| Worker access | Seq Scan | Bitmap Index Scan |
| Engagement access | Repeated Seq Scan | Index Scan |
| Main bottleneck | LATERAL scanned all engagements 15× | Direct lookup by worker |

### Concurrent benchmark (pgbench)

| Metric | Before indexes | After indexes | Change |
| --- | --- | --- | --- |
| Transactions | 65 732 | 1 224 414 | ~18.6× more |
| Avg latency | 45.449 ms | 2.439 ms | ~18.6× faster |
| TPS | 1 100.13 | 20 496.30 | ~18.6× higher |
| Failed | 0 | 0 | Stable |

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

```text
"Sort  (cost=20265.15..20265.16 rows=3 width=64) (actual time=47.346..47.347 rows=3.00 loops=1)"
"  Sort Key: ist.order_index"
"  Sort Method: quicksort  Memory: 25kB"
"  Buffers: shared hit=13504 read=1"
"  ->  Bitmap Heap Scan on issue_statuses ist  (cost=4.30..20265.13 rows=3 width=64) (actual time=29.892..47.330 rows=3.00 loops=1)"
"        Recheck Cond: (organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'::uuid)"
"        Heap Blocks: exact=3"
"        Buffers: shared hit=13504 read=1"
"        ->  Bitmap Index Scan on issue_statuses_organization_id_name_key  (cost=0.00..4.30 rows=3 width=0) (actual time=0.293..0.293 rows=3.00 loops=1)"
"              Index Cond: (organization_id = 'e8df6732-32d3-4278-9798-be9727da32f5'::uuid)"
"              Index Searches: 1"
"              Buffers: shared hit=1 read=1"
"        SubPlan 1"
"          ->  Aggregate  (cost=6750.45..6750.46 rows=1 width=4) (actual time=15.664..15.664 rows=1.00 loops=3)"
"                Buffers: shared hit=13500"
"                ->  Seq Scan on issues i  (cost=0.00..6750.00 rows=180 width=0) (actual time=5.804..15.646 rows=60.00 loops=3)"
"                      Filter: (status_id = ist.id)"
"                      Rows Removed by Filter: 179940"
"                      Buffers: shared hit=13500"
"Planning:"
"  Buffers: shared hit=35 dirtied=3"
"Planning Time: 0.529 ms"
"Execution Time: 47.408 ms"
```

### Indexes added

```sql
CREATE INDEX issues_status_id_idx
ON issues(status_id);

CREATE INDEX issue_statuses_org_order_idx
ON issue_statuses(organization_id, order_index);

ANALYZE;
```

### Single-query performance comparison

| Metric | Before indexes | After indexes |
| --- | --- | --- |
| Execution time | 47.408 ms | 0.232 ms |
| Speedup | — | ~204× faster |
| Buffers touched | 13 505 | 12 |
| Status lookup | Bitmap index via unique constraint | Bitmap index via org/order index |
| Issue count lookup | Seq Scan on `issues` | Index Only Scan on `issues_status_id_idx` |
| Main bottleneck | Scanned 180 000 issues 3 times | Direct count via status index |

### Concurrent benchmark (pgbench)

| Metric | Before indexes | After indexes | Change |
| --- | --- | --- | --- |
| Transactions | 18 160 | 3 220 814 | ~177× more |
| Avg latency | 164.737 ms | 0.927 ms | ~177× faster |
| TPS | 303.51 | 53 915.55 | ~177× higher |
| Failed | 0 | 0 | Stable |

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

```text
"Nested Loop Left Join (cost=447.26..7790.32 rows=12 width=407) (actual time=7.201..36.300 rows=12.00 loops=1)"
"  Buffers: shared hit=5131"
"  CTE picked_worker"
"    -> Limit (cost=0.29..0.42 rows=1 width=32) (actual time=0.014..0.014 rows=1.00 loops=1)"
"        Buffers: shared hit=3"
"        -> Index Scan using workers_pkey on workers w_1 (cost=0.29..2021.16 rows=15000 width=32) (actual time=0.013..0.013 rows=1.00 loops=1)"
"            Index Searches: 1"
"            Buffers: shared hit=3"
"  InitPlan 2"
"    -> CTE Scan on picked_worker (cost=0.00..0.02 rows=1 width=16) (actual time=0.016..0.016 rows=1.00 loops=1)"
"        Storage: Memory Maximum Storage: 17kB"
"        Buffers: shared hit=3"
"  InitPlan 3"
"    -> CTE Scan on picked_worker picked_worker_1 (cost=0.00..0.02 rows=1 width=16) (actual time=0.000..0.000 rows=1.00 loops=1)"
"        Storage: Memory Maximum Storage: 17kB"
"  -> Nested Loop Left Join (cost=0.29..570.59 rows=1 width=352) (actual time=0.715..1.420 rows=1.00 loops=1)"
"      Buffers: shared hit=372"
"      -> Index Scan using workers_pkey on workers w (cost=0.29..8.30 rows=1 width=256) (actual time=0.022..0.024 rows=1.00 loops=1)"
"          Index Cond: (id = (InitPlan 2).col1)"
"          Filter: (organization_id = (InitPlan 3).col1)"
"          Index Searches: 1"
"          Buffers: shared hit=6"
"      -> Seq Scan on worker_documents wd (cost=0.00..562.27 rows=1 width=112) (actual time=0.690..1.392 rows=1.00 loops=1)"
"          Filter: (worker_id = (InitPlan 2).col1)"
"          Rows Removed by Filter: 15701"
"          Buffers: shared hit=366"
"  -> Hash Right Join (cost=446.51..7219.15 rows=12 width=71) (actual time=6.483..34.866 rows=12.00 loops=1)"
"      Hash Cond: (i.worker_engagement_id = we.id)"
"      Buffers: shared hit=4759"
"      -> Seq Scan on issues i (cost=0.00..6300.00 rows=180000 width=55) (actual time=0.017..15.459 rows=180000.00 loops=1)"
"          Buffers: shared hit=4500"
"      -> Hash (cost=446.50..446.50 rows=1 width=32) (actual time=2.510..2.518 rows=1.00 loops=1)"
"          Buckets: 1024 Batches: 1 Memory Usage: 9kB"
"          Buffers: shared hit=259"
"          -> Seq Scan on worker_engagements we (cost=0.00..446.50 rows=1 width=32) (actual time=2.093..2.495 rows=1.00 loops=1)"
"              Filter: (worker_id = (InitPlan 2).col1)"
"              Rows Removed by Filter: 14999"
"              Buffers: shared hit=259"
"Planning:"
"  Buffers: shared hit=149"
"Planning Time: 0.762 ms"
"Execution Time: 36.382 ms"
```

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

| Metric | Before indexes | After indexes |
| --- | --- | --- |
| Execution time | 36.382 ms | 1.005 ms |
| Speedup | — | ~36× faster |
| Buffers touched | 5131 | 27 |
| Worker lookup | Index Scan (PK) | Index Scan (PK) |
| Documents access | Seq Scan | Index Scan |
| Engagement access | Seq Scan | Index Scan |
| Issues access | Seq Scan (180k rows) | Bitmap Index Scan |

### Concurrent benchmark (pgbench)

| Metric | Before indexes | After indexes | Change |
| --- | --- | --- | --- |
| Transactions | 38 246 | 920 344 | ~24× more |
| Avg latency | 78.157 ms | 3.246 ms | ~24× faster |
| TPS | 639.74 | 15 404.63 | ~24× higher |
| Failed | 0 | 0 | Stable |

The improvement comes from indexing all foreign key relationships (`worker_documents`, `worker_engagements`, `issues`). Before indexing, each join required scanning entire tables. After indexing, all joins became direct lookups, reducing latency significantly and improving throughput by ~24×.
