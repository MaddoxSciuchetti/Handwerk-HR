import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import {
  PG_POOL_CONNECTION_TIMEOUT_MS,
  PG_POOL_MAX,
} from "./pgPoolOptions";

const connectionString = `${process.env.DATABASE_URL}`;

// Driver adapter owns the pool — URL connection_limit is ignored at runtime.
const adapter = new PrismaPg({
  connectionString,
  max: PG_POOL_MAX,
  connectionTimeoutMillis: PG_POOL_CONNECTION_TIMEOUT_MS,
});
const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? // Prisma error logs can include entire document/value payloads.
        ["query", "warn"]
      : [],
});

export { prisma };
