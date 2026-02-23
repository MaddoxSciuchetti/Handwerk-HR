import "dotenv/config";
import { defineConfig } from "prisma/config";
import { POSTGRES_URI } from "./src/constants/env";

export default defineConfig({
    schema: "./src/prisma/schema.prisma",
    migrations: {
        path: "src/prisma/migrations",
        seed: "tsx src/prisma/seed.ts",
    },
    datasource: {
        url: POSTGRES_URI,
    },
});
