# Index Performance

## Index sizes

The purpose of this document is to show how we keep track of our growing indexes. It is important so that when testing db performance and queries get slower we have another potential idea where the issue could be.

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

Below are two rows that follow the example output of the above query. As you can see indexes do not come without any cost. Some indexes take more storage such as comments which is also the largest table while others such as issues use smaller storage.

The above query helps one to keep track of the indexes and have a better overview of query performance. The indexes that were manually created are shown to be used and drastically improve the query performance.

| schemaname | tablename | indexname            | index_size |
| ---------- | --------- | -------------------- | ---------- |
| public     | issues    | issues_status_id_idx | 1248 kB    |
| public     | comments  | comments_pkey        | 29 MB      |

## Index usage

The second query answers the question: when was an index used, and how much work did it actually do?

```sql
SELECT
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

| table_name       | index_name                     |    idx_scan | idx_tup_read | idx_tup_fetch | index_size |
| ---------------- | ------------------------------ | ----------: | -----------: | ------------: | ---------- |
| issue_statuses   | issue_statuses_pkey            | 122 158 924 |  122 158 924 |   119 505 780 | 160 kB     |
| worker_documents | worker_documents_worker_id_idx |     920 282 |      963 320 |       963 320 | 432 kB     |

What is interesting about the result shown in table format is that it shows the amount of times the index was looked up. This indicates that the index is often being used and thus also helpful to get the results.
