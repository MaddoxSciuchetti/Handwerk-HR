# Physical Data Model

Postgres tables, columns, and foreign keys as implemented for production on **Render Managed Postgres**. The authoritative definition is [`server/src/prisma/schema.prisma`](../../server/src/prisma/schema.prisma); migrations live under [`server/src/prisma/migrations/`](../../server/src/prisma/migrations/).

## How to read this

- Table and column names in the diagram match the mapped database names (Prisma `@@map` / `@map` where used).
- Relations are enforced with foreign keys; extra integrity (check constraints, triggers such as `set_updated_at`) is described in [advanced-db-objects.md](./advanced-db-objects.md).
- Enums such as `OrgMemberRole` (`admin` | `worker`) are defined in the Prisma schema.

## Diagram

![Physical data model](./physical-datamodel.png)

When you change tables or FKs, update `schema.prisma`, generate a migration, and refresh this diagram (and the [conceptual model](./conceptual-model.md) if entities/relationships changed). See the process in [Intro.md](./Intro.md).
