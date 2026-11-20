import { redisDel, redisGetJson, redisSetJson } from "@/lib/redis";

/** Matches client poll interval; also a safety net if a write misses invalidation. */
export const TASKS_LIST_CACHE_TTL_SECONDS = 15;

export function tasksListCacheKey(orgId: string): string {
    return `tasks:list:org:${orgId}`;
}

export async function readTasksListCache<T>(orgId: string): Promise<T | null> {
    return redisGetJson<T>(tasksListCacheKey(orgId));
}

export async function writeTasksListCache(
    orgId: string,
    value: unknown,
): Promise<void> {
    await redisSetJson(
        tasksListCacheKey(orgId),
        TASKS_LIST_CACHE_TTL_SECONDS,
        value,
    );
}

export async function invalidateTasksListCache(orgId: string): Promise<void> {
    if (!orgId) return;
    await redisDel(tasksListCacheKey(orgId));
}
