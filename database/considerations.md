# Further Considerations

Further considerations I thought about include:

## Monitoring dashboard

I thought about setting up a dashboard that runs the following types of queries every hour or 12 hours:

- Runs specific DB queries
- Runs the queries that check the index size
- Runs the queries that check overall DB sizes

The benefit of the above would be that I can compare the latest result to the one before that. It would give me an overview of how my queries perform in regards to the growth that my DB is experiencing. Once queries get slower, it gets easier to pinpoint the issue and take measures that are efficient, ensuring that the queries stay fast.

## End-to-end response monitoring with K6

I also considered using a tool such as K6 to monitor the entire speed of an HTTPS response — i.e. when fetching all the workers with their engagements, etc. This implementation is beneficial when you have the problem that an HTTPS response is taking a long time. Together with the dashboard measuring the speed of the raw queries, I can find out if the database structure should be optimized or if something else in my code is causing the HTTP response to take too much time. The key takeaway is that having these two processes set up gives me valuable data insights and makes spotting problems faster.

## Independent backups

To not be completely bound to Neon, I also considered setting up a worker that regularly dumps the SQL database to a dedicated storage system. I decided not to do this as the option Neon provides is enough security for the current state of the DB. With an increase of the data volume it would make sense to create this worker.

However, another consideration is that after time dumping the databases is no longer feasible, as they become too big in size and thus also require more storage. Another option would be to use the file-system backup option and run this at midnight. This would lead to the database being down for some time, however, considering the current small number of users and the timezone this project is in, it can prove to be feasible.
