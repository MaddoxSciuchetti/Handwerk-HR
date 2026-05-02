# Database Performance

Below I describe the performance of the entire local database.

## Table sizes

The following query gives an overview of what the sizes of the tables are:

```sql
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

The above query helps to identify the fastest growing tables. It lets us determine where we should index and look more closely when performance starts to get worse.

## Total database size

The query below gives an overview of the total database size:

```sql
SELECT pg_size_pretty(pg_database_size('database-testing4')) AS database_size;
```
