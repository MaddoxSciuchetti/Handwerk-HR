# Further Considerations

Further considerations I thought about include:

## Monitoring dashboard

I thought about setting up a dashboard that runs the following types of queries every hour or 12 hours and than shows the results:

- Runs specific DB queries
- Runs the queries that check the index size
- Runs the queries that check overall DB sizes
- Runs concurrent queries using pgbench

The benefit of the above would be that I can compare the latest result to the one before that. It would give me an overview of how my queries perform in regards to the growth that my DB is experiencing. Once queries get slower, it gets easier to pinpoint the issue and take measures that are efficient, ensuring that the queries stay fast.

## End-to-end response monitoring with K6

I also considered using a tool such as K6 to monitor the entire speed of an HTTPS response — i.e. when fetching all the workers with their engagements, etc. This implementation is beneficial when you have the problem that an HTTPS response is taking a long time. Together with the dashboard measuring the speed of the raw queries, I can find out if the database structure should be optimized or if something else in my code is causing the HTTP response to take too much time. The key takeaway is that having these two processes set up gives me valuable data insights and makes spotting problems faster.

## Independent backups

To avoid relying only on Render’s managed snapshots, I also considered a worker that regularly runs `pg_dump` to durable object storage. That is not required yet: Render’s daily backups (and PITR on eligible plans) are enough for the current data volume. If retention needs grow or we want vendor-independent archives, schedule logical dumps to object storage.

Very large databases make full dumps slower and heavier. At that point prefer Render PITR / snapshot restores for operational recovery, and keep infrequent logical exports only as a long-term archive.
