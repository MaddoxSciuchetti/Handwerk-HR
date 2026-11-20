import { logger, serializeError } from "@/observability/logger";
import Redis from "ioredis";

/** Empty / unset disables Redis — API falls through to Postgres. */
export function redisUrl(): string {
    return process.env.REDIS_URL?.trim() ?? "";
}

let client: Redis | null | undefined;
let loggedConnectError = false;

function getClient(): Redis | null {
    // Prefer an injected test client even when REDIS_URL is unset.
    if (client !== undefined) return client;

    const url = redisUrl();
    if (!url) return null;

    try {
        const redis = new Redis(url, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: true,
            lazyConnect: true,
            // Fail fast when Redis is down so request path stays on Postgres.
            connectTimeout: 2_000,
            commandTimeout: 1_000,
        });
        redis.on("error", (err) => {
            if (!loggedConnectError) {
                loggedConnectError = true;
                logger.warn("redis_client_error", { err: serializeError(err) });
            }
        });
        client = redis;
        return client;
    } catch (err) {
        logger.warn("redis_client_init_failed", { err: serializeError(err) });
        client = null;
        return null;
    }
}

/** Test helper: reset singleton between cases. */
export function resetRedisClientForTests(): void {
    if (client) {
        void client.quit().catch(() => undefined);
    }
    client = undefined;
    loggedConnectError = false;
}

/** Test helper: inject a fake client (or null). */
export function setRedisClientForTests(fake: Redis | null): void {
    client = fake;
    loggedConnectError = false;
}

async function ensureConnected(redis: Redis): Promise<boolean> {
    if (redis.status === "ready") return true;
    try {
        if (redis.status === "wait" || redis.status === "end") {
            await redis.connect();
        }
        // Re-read after connect — TS narrows status across the await incorrectly.
        const status: string = redis.status;
        return status === "ready";
    } catch (err) {
        if (!loggedConnectError) {
            loggedConnectError = true;
            logger.warn("redis_connect_failed", { err: serializeError(err) });
        }
        return false;
    }
}

export async function redisGet(key: string): Promise<string | null> {
    const redis = getClient();
    if (!redis) return null;
    try {
        if (!(await ensureConnected(redis))) return null;
        return await redis.get(key);
    } catch (err) {
        logger.warn("redis_get_failed", { key, err: serializeError(err) });
        return null;
    }
}

export async function redisSetEx(
    key: string,
    ttlSeconds: number,
    value: string,
): Promise<void> {
    const redis = getClient();
    if (!redis) return;
    try {
        if (!(await ensureConnected(redis))) return;
        await redis.setex(key, ttlSeconds, value);
    } catch (err) {
        logger.warn("redis_setex_failed", { key, err: serializeError(err) });
    }
}

export async function redisDel(key: string): Promise<void> {
    const redis = getClient();
    if (!redis) return;
    try {
        if (!(await ensureConnected(redis))) return;
        await redis.del(key);
    } catch (err) {
        logger.warn("redis_del_failed", { key, err: serializeError(err) });
    }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
    const raw = await redisGet(key);
    if (raw == null) return null;
    try {
        return JSON.parse(raw) as T;
    } catch (err) {
        logger.warn("redis_json_parse_failed", {
            key,
            err: serializeError(err),
        });
        return null;
    }
}

export async function redisSetJson(
    key: string,
    ttlSeconds: number,
    value: unknown,
): Promise<void> {
    await redisSetEx(key, ttlSeconds, JSON.stringify(value));
}
