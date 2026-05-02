# Scaling Considerations

## Vertical scaling

- Increasing CPU, RAM, SSD
- Works until hardware limit

## Horizontal scaling

- Read replicas (scale reads)
- Sharding (split data across nodes)
  - Harder because of joins

## This system specifically

- OLTP → read-heavy queries
- Indexing reduces the need for scaling initially
- But at millions of rows → need replicas

## Plan

For this database I will first continue to use Neon's built-in options for vertical scaling. This is due to them having direct options to purchase more compute. However, if I start to realize that the costs are no longer maintainable due to a high growth in data, I will need to consider ways to efficiently handle this problem. Horizontal scaling might apply here, which includes distributing the data over different servers.
