import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL is optional (Neon direct connection for Prisma CLI). Falls back to DATABASE_URL.
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (databaseUrl == null || databaseUrl === "") {
    throw new Error(
        "Missing DATABASE_URL: add it to server/.env (see repo README). Required for Prisma CLI.",
    );
}

export default defineConfig({
    schema: "./src/prisma/schema.prisma",
    migrations: {
        path: "src/prisma/migrations",
        seed: "tsx src/prisma/seed.ts",
    },
    datasource: {
        url: databaseUrl,
    },
});
