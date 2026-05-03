import "dotenv/config";
import { defineConfig } from "prisma/config";

// Only DATABASE_URL here so `prisma generate` / migrate work during `npm install`
// without loading the full app env (see src/constants/env.ts for runtime requirements).
const databaseUrl = process.env.DATABASE_URL;
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
