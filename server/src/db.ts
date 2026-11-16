import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

import { NODE_ENV, POSTGRES_URI } from "@/constants/env";

const pool = new Pool({
    connectionString: POSTGRES_URI,
    ssl:
        NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
});

export { pool };
