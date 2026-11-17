# Database Performance

The goal of this file is to demonstrate how to gain data insights regarding the overall database. The file should be used as a entry point when performance issues arise and once wants to get a overall overview of how the database is doing and if there are any obvious issues that can be fixed directly. Once query performance starts to get slow based on the performance measures in the previous files below are queries that you can run to help you get an entry point in pinpointing the issue.

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

## Table size split

```sql
SELECT
    relname AS table_name,
    pg_size_pretty(pg_relation_size(relid)) AS table_data_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

The above query tells us how much storage the index of a database takes up and how much storage the actual rows take up.
