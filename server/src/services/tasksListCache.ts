import { redisDel, redisGetJson, redisSetJson } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

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

/** Resolve org from an issue row and drop the list cache (skips assigneeOnly). */
export async function invalidateTasksListCacheForIssue(fields: {
    assigneeOnly?: boolean | null;
    organizationId?: string | null;
    workerEngagementOrganizationId?: string | null;
}): Promise<void> {
    if (fields.assigneeOnly) return;
    const orgId =
        fields.organizationId ?? fields.workerEngagementOrganizationId ?? "";
    await invalidateTasksListCache(orgId);
}

/** Lookup + invalidate for writers that only have an issue id. */
export async function invalidateTasksListCacheByIssueId(
    issueId: string,
): Promise<void> {
    if (!issueId) return;
    const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        select: {
            assigneeOnly: true,
            organizationId: true,
            workerEngagement: { select: { organizationId: true } },
        },
    });
    if (!issue) return;
    await invalidateTasksListCacheForIssue({
        assigneeOnly: issue.assigneeOnly,
        organizationId: issue.organizationId,
        workerEngagementOrganizationId: issue.workerEngagement?.organizationId,
    });
}
