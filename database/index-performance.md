# Index Performance

## Index sizes

The following query lets us see all the index sizes that are being used:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

Looking at the following result we can, for example, see that:

```text
"issues"   "issues_worker_engagement_id_idx"   "1680 kB"   4900067
```

The index on `issues` is used very much and is therefore very important. However, there are also other indexes such as:

```text
"comments"   "comments_pkey"   "29 MB"   0
```

Which are large in size but rarely used. It is still required as it is a primary key. The above query helps one to keep track of the indexes and have a better overview of query performance. The indexes that were manually created are shown to be used and drastically improve the query performance.

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

Looking at the first row we can see that the index size is very small yet the amount of times it is being scanned is high:

```text
"issue_statuses"   "issue_statuses_pkey"   122158188   122158188   119505060   "160 kB"
```
