# Scaling Considerations

This project currently runs on NEON and therefore will use the vertical scaling options that are offered. This includes the ability to buy more CPU computer. If however the database continous to grow we should look at horizontal scaling options. Below is a short overview of the two differences.

## Vertical scaling

- Increasing CPU, RAM, SSD
- Works until hardware limit

## Horizontal scaling

- Read replicas (scale reads)
- Sharding (split data across nodes)
    - Harder because of joins
