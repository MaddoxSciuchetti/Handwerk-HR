/**
 * Shared node-pg pool sizing for Prisma (adapter-pg) and the legacy Pool.
 * Sized for a single Render Starter web instance — raise carefully if you
 * add instances so total connections stay under the Postgres plan limit.
 */
export const PG_POOL_MAX = 20;

/** Wait up to 10s for a free client (Prisma URL pool_timeout analogue). */
export const PG_POOL_CONNECTION_TIMEOUT_MS = 10_000;
