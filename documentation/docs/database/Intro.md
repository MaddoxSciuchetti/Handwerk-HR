# Database Documentation

This folder holds everything related to the database. Below is a quick guide so you know where to look.

## Processes

If you want to make changes to the conceptual or physical data model contact maddox(at)test.com. We will discuss the changes and based on that decide if the model needs to be changed or not. Changes will than be applied in mermaid in a new project labeled DB_NAME_VERSION(Number of Version). Once the changes have been applied apply the changes in the schema.ts file. Once this is completed run `npx prisma migrate dev --name <descriptive_name> --schema=src/prisma/schema.prisma` to let prisma generate the migration file. Migration files are always reviewed with 4 eyes before commiting the changes. Once its sound push changes.

Feel free to propose changes for the below files so that this project can be maintained more efficiently.

- Information regarding the business domain and the workload the database supports can be found [here](./requirements.md).
- The high-level conceptual model showing the main entities and how they relate can be found [here](./conceptual-model.md).
- The physical model with the actual tables, columns, and foreign keys can be found [here](./physical-model.md).
- Notes on database objects beyond plain tables (triggers, constraints, etc.) can be found [here](./advanced-db-objects.md).
- Information on how transactions are handled in the app layer (Prisma) can be found [here](./transactions.md).
- The query-level performance review with `EXPLAIN ANALYZE` results before and after indexing can be found [here](./performance.md).
- Information on monitoring index size and usage over time can be found [here](./index-performance.md).
- The entry point for diagnosing overall database health when something feels slow can be found [here](./database-performance.md).
- Thoughts on vertical and horizontal scaling strategies can be found [here](./scaling.md).
- Information about the backup and point-in-time recovery setup on Neon can be found [here](./backup.md).
- Additional design considerations and trade-offs that were thought through can be found [here](./considerations.md).
