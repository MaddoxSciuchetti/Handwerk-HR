# Transactions

## Prisma ORM

My project is using Prisma's ORM. This means that the Prisma engine is being used to convert Prisma syntax into SQL queries that can be understood by the underlying DBMS. The syntax for writing queries in Prisma is similar to writing a JavaScript object. The mapping engine converts this into executable SQL code. Once the DBMS responds with the rows, the engine is also responsible for building up the object again and — in the case of Prisma — ensuring that this is type safe.

This improves developer productivity and type safety because queries are checked against the Prisma schema. However, the ORM does not remove the need to understand SQL performance. Prisma may generate joins, nested reads, or multiple queries internally, which still depend on database indexes and query plans. Therefore, the database was analyzed with `EXPLAIN ANALYZE` to understand the actual SQL execution behavior underneath the ORM layer.

## Setting up the connection

The connection is created using a `prisma.ts` file. This file contains the connection string, from which you then create the adapter and the client:

```ts
const connectionString = `${process.env.DATABASE_URL}`;

// set the DATABASE_URL variable to the desired connection string.

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

Whenever you want to interact with the DB, import `prisma` from this file and you can start writing queries and transactions.

## ACID

Transactions are present at several different places inside my codebase. It is crucial that transactions follow the ACID principle to ensure data correctness and integrity.

ACID stands for:

- **Atomicity** — ensures that the whole operation is rolled back if one step fails.
- **Consistency** — ensures that constraints such as foreign keys, required fields, and enums keep the database in a valid state.
- **Isolation** — protects concurrent users from interfering with each other when they update the same issue or worker data.
- **Durability** — ensures that once the transaction is committed, the data remains stored even after a crash or restart.

## Isolation levels

Prisma allows the option to pass another argument into the transaction that lets you determine the isolation level. As Postgres runs `READ COMMITTED` by default, you do not have to add any argument if you want to keep this. However, if you want to set the isolation level explicitly you can do so as shown below:

```ts
{
  timeout: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
},
```

After `TransactionIsolationLevel.` four options appear:

- `ReadUncommitted`
- `ReadCommitted`
- `RepeatableRead`
- `Serializable`

## Handling transaction failures

When writing transactions it is also important to understand their behaviour when they fail. In your application code it should be defined that failures of a transaction are being handled. Below is an example of such application code:

```ts
return withTxRetry(async (tx) => {
  await tx.workerDocument.deleteMany({ where: { workerId } });
  await tx.workerEngagement.deleteMany({ where: { workerId } });
  return tx.worker.delete({ where: { id: workerId } });
});
```

Instead of writing the transaction in Prisma's usual format like so:

```ts
return prisma.$transaction(async (tx) => { ... });
```

We create a utility function that takes in the above function and options. It then runs a loop on the transaction in case the transaction fails. You can determine how often the transaction should be retried.
