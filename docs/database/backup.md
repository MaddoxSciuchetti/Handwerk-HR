# Backup

Production PostgreSQL runs on **Render Managed Postgres**. Render takes **automatic daily snapshots**; retention and whether **point-in-time recovery (PITR)** is available depend on the Postgres plan in the Render Dashboard ([Render databases](https://render.com/docs/databases)).

Use Dashboard → database → **Backups** to restore a snapshot or (when the plan includes it) a point in time. That protects against accidental deletes, failed migrations, or corrupted writes.

Logical dumps with `pg_dump` (preferably `pg_dump -Fc` for larger databases) can be scheduled for long-term archives you control. They are a secondary mechanism: dumps get slower and larger as the database grows, while Render’s managed backups stay the primary recovery path. Store dumps in durable object storage, not on ephemeral Render service disks.

**Important:** deleting a Managed Postgres instance also removes its Render backups. Export or restore to another instance before deletion if you need continuity.
