import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

import { NODE_ENV, POSTGRES_URI } from "@/constants/env";
import {
    PG_POOL_CONNECTION_TIMEOUT_MS,
    PG_POOL_MAX,
} from "@/lib/pgPoolOptions";

const pool = new Pool({
    connectionString: POSTGRES_URI,
    max: PG_POOL_MAX,
    connectionTimeoutMillis: PG_POOL_CONNECTION_TIMEOUT_MS,
    ssl:
        NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
});

export { pool };
