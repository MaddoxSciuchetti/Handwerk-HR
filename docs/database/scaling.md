# Scaling Considerations

This project’s production database is **Render Managed Postgres**. Scaling today is mainly **vertical**: upgrade the Postgres compute plan (CPU / RAM) and disk size in the Render Dashboard. Storage can also autoscaling when disk use is high (plan limits apply; disk cannot shrink after growth).

If the database continues to grow, evaluate **horizontal** options Render supports (read replicas) or application-level sharding. Below is a short overview.

## Vertical scaling

- Increasing CPU, RAM, and disk via the Render Postgres plan / storage settings
- Works until the chosen plan’s hardware and connection limits

## Horizontal scaling

- Read replicas (scale reads; up to Render’s replica limit per database)
- Sharding (split data across nodes)
  - Harder because of joins
