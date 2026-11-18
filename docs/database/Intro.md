# Database Documentation

This folder holds everything related to the database. Below is a quick guide so you know where to look.

## Processes

If you want to change the conceptual or physical data model, contact **maddoxsciuchetti@icloud.com**. We discuss the change first and decide whether the diagrams and/or the Prisma schema need an update.

When a schema change is approved:

1. Update the conceptual / physical model pages (and their diagrams) if the entities or relationships change: [conceptual-model.md](./conceptual-model.md), [physical-model.md](./physical-model.md).
2. Edit the Prisma schema at [`server/src/prisma/schema.prisma`](../../server/src/prisma/schema.prisma) — that file is the source of truth for tables, columns, and relations.
3. From `server/`, generate a migration:

```bash
npx prisma migrate dev --name <descriptive_name> --schema=src/prisma/schema.prisma
```

4. Migration files under `server/src/prisma/migrations/` are reviewed with four eyes before commit. Once the review looks sound, push the changes.
5. After merge to a branch a Render service tracks, **Render auto-deploys** and runs **Prisma migrate once as a pre-deploy step before the new app starts** (`npm run migrate:deploy` on the API service). You do not apply production/staging migrations from GitHub Actions or by hand for a normal release. Details: [CI/CD — Deploy](../clean-code-testing/ci.cd.md#deploy-render-auto-deploy--prisma-migrate).

Feel free to propose improvements to the pages below so this project stays maintainable.

- Information regarding the business domain and the workload the database supports can be found [here](./requirements.md).
- The high-level conceptual model showing the main entities and how they relate can be found [here](./conceptual-model.md).
- The physical model with the actual tables, columns, and foreign keys can be found [here](./physical-model.md).
- Notes on database objects beyond plain tables (triggers, constraints, etc.) can be found [here](./advanced-db-objects.md).
- Information on how transactions are handled in the app layer (Prisma) can be found [here](./transactions.md).
- The query-level performance review with `EXPLAIN ANALYZE` results before and after indexing can be found [here](./performance.md).
- Information on monitoring index size and usage over time can be found [here](./index-performance.md).
- The entry point for diagnosing overall database health when something feels slow can be found [here](./database-performance.md).
- Thoughts on vertical and horizontal scaling strategies can be found [here](./scaling.md).
- Information about backups and point-in-time recovery on **Render Managed Postgres** can be found [here](./backup.md).
- Additional design considerations and trade-offs that were thought through can be found [here](./considerations.md).
