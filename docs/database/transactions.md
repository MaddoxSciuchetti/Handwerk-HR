# Transactions

## Prisma ORM

My project is using Prisma's ORM. This means that the Prisma engine is being used to convert Prisma syntax into SQL queries that can be understood by the underlying DBMS. The syntax for writing queries in Prisma is similar to writing a JavaScript object. The mapping engine converts the written objects into executable SQL code that gets sends to the DBMS system using the connection string that is present in the .env. Once the DBMS responds with the rows, the engine is also responsible for building up the object again and — in the case of Prisma — ensuring that this is type safe.

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

Whenever you want to interact with the DB, import `prisma` from this file and than use the `prisma` object to interact with the db. An example would be
`const result = await prisma.<tablename>.findMany({})`

## Transactions

Transactions are present at several different places inside my codebase. They are responsible for ensuring that the data being inserted is correct. It is crucial that transactions follow the ACID principle to ensure their proper functioning and ultimately lead to data correctness and integrity of the database.

ACID stands for:

- **Atomicity** — ensures that the whole operation is rolled back if one step fails.
- **Consistency** — ensures that constraints such as foreign keys, required fields, and enums keep the database in a valid state.
- **Isolation** — protects concurrent users from interfering with each other when they update the same issue or worker data.
- **Durability** — ensures that once the transaction is committed, the data remains stored even after a crash or restart.

## Isolation levels

Prisma allows the option to pass another argument into the transaction that lets you determine the isolation level. As Postgres runs `READ COMMITTED` by default, you do not have to add any argument if you want to keep this. However, if you want to set the isolation level explicitly you can do so as shown below:

```ts
await prisma.$transaction(
    async (tx) => {
        // the transactional work
    },
    {
        // second argument: transaction options
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
);
```

After `TransactionIsolationLevel.` four options appear from which you can than choose the correct isolation level :

- `ReadUncommitted`
- `ReadCommitted`
- `RepeatableRead`
- `Serializable`

## Handling transaction failures

When writing transactions it is also important to understand their behaviour when they fail. In your application code it should be clear how failures of a transaction are being handled. Below is one way transactions are being handled once they fail. Instead of writing the standard prisma

```ts
return prisma.$transaction(async (tx) => { ... });
```

notation i have created a helper function that lets me pass the transaction as a callback function. This helper function runs a for loop on the transaction for a set amount of attempts in case the transaction fails. For a detailed example on how this is being applied view the route worker.delete("/:workerId", workerController.deleteWorker); inside the worker.route file.

```ts
return withTxRetry(async (tx) => {
    await tx.workerDocument.deleteMany({ where: { workerId } });
    await tx.workerEngagement.deleteMany({ where: { workerId } });
    return tx.worker.delete({ where: { id: workerId } });
});
```
