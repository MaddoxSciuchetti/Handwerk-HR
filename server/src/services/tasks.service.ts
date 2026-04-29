import { STATUS_ENTITY_ISSUE } from "@/constants/statusEntity.consts";
import { prisma } from "@/lib/prisma";
import { createIssue, updateIssue } from "@/services/worker.serviceV2";

export type TaskHistoryChange = {
    field: string;
    from: string | null;
    to: string | null;
};

export type TaskHistoryEntry = {
    id: string;
    action: string;
    createdAt: Date;
    actorUser: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    } | null;
    status: {
        id: string;
        name: string;
        color: string | null;
    } | null;
    changes: TaskHistoryChange[];
};

export const queryTasks = async (orgId: string) => {
    return prisma.issue.findMany({
        where: {
            workerEngagement: {
                organizationId: orgId,
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export async function createTaskInOrg(orgId: string, userId: string) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
    });
    if (!engagement) {
        throw new Error("No worker engagement for organization");
    }

    const status = await prisma.organizationStatus.findFirst({
        where: { organizationId: orgId, entityType: STATUS_ENTITY_ISSUE },
        orderBy: { orderIndex: "asc" },
    });
    if (!status) {
        throw new Error("No issue status for organization");
    }

    return createIssue({
        workerEngagementId: engagement.id,
        createdByUserId: userId,
        statusId: status.id,
        title: "Neue Aufgabe",
    });
}

export async function deleteTasksInOrg(orgId: string, taskIds: string[]) {
    if (!taskIds.length) return { count: 0 };
    return prisma.issue.deleteMany({
        where: {
            id: { in: taskIds },
            workerEngagement: { organizationId: orgId },
        },
    });
}

export async function updateTaskInOrg(
    orgId: string,
    userId: string,
    taskId: string,
    payload: unknown,
) {
    const existing = await prisma.issue.findFirst({
        where: {
            id: taskId,
            workerEngagement: { organizationId: orgId },
        },
        select: { id: true, workerEngagementId: true },
    });
    if (!existing) {
        throw new Error("Task not found for organization");
    }

    const body = (payload ?? {}) as {
        title?: string;
        statusId?: string;
        assigneeUserId?: string;
    };

    return updateIssue({
        issueId: existing.id,
        workerEngagementId: existing.workerEngagementId,
        actorUserId: userId,
        title: body.title,
        statusId: body.statusId,
        assigneeUserId: body.assigneeUserId,
    });
}

// Fields that we know how to display in the task history feed.
// Anything outside this set is still returned but with raw values.
const HUMAN_READABLE_FIELDS = new Set([
    "title",
    "description",
    "statusId",
    "assigneeUserId",
    "priority",
    "dueDate",
]);

const PRIORITY_LABELS: Record<string, string> = {
    no_priority: "Keine Priorität",
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    urgent: "Dringend",
};

type ChangeResolvers = {
    statusName: (id: string) => string | null;
    userName: (id: string) => string | null;
};

function valueToString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (value instanceof Date) return value.toISOString();
    return JSON.stringify(value);
}

// Maps a raw audit-log value to a user-facing string for a given field.
// IDs (statusId, assigneeUserId) are resolved to readable names; enums get
// localized labels; everything else falls back to a string representation.
function resolveFieldValue(
    field: string,
    rawValue: unknown,
    resolvers: ChangeResolvers,
): string | null {
    const stringValue = valueToString(rawValue);
    if (stringValue === null) return null;

    if (field === "statusId") {
        return resolvers.statusName(stringValue) ?? stringValue;
    }
    if (field === "assigneeUserId") {
        return resolvers.userName(stringValue) ?? stringValue;
    }
    if (field === "priority") {
        return PRIORITY_LABELS[stringValue] ?? stringValue;
    }
    return stringValue;
}

function diffAuditValues(
    oldValue: unknown,
    newValue: unknown,
    resolvers: ChangeResolvers,
): TaskHistoryChange[] {
    const oldObj =
        oldValue && typeof oldValue === "object"
            ? (oldValue as Record<string, unknown>)
            : {};
    const newObj =
        newValue && typeof newValue === "object"
            ? (newValue as Record<string, unknown>)
            : {};

    const fields = new Set<string>([
        ...Object.keys(oldObj),
        ...Object.keys(newObj),
    ]);

    const changes: TaskHistoryChange[] = [];
    for (const field of fields) {
        if (!HUMAN_READABLE_FIELDS.has(field)) continue;
        changes.push({
            field,
            from: resolveFieldValue(field, oldObj[field], resolvers),
            to: resolveFieldValue(field, newObj[field], resolvers),
        });
    }
    return changes;
}

// Gathers every referenced ID for a given key across both old and new
// audit-log payloads. Used to batch-fetch display names in one query.
function collectReferencedIds(
    logs: Array<{ oldValue: unknown; newValue: unknown }>,
    key: string,
): string[] {
    const ids = new Set<string>();
    for (const log of logs) {
        for (const blob of [log.oldValue, log.newValue]) {
            if (blob && typeof blob === "object" && key in blob) {
                const id = (blob as Record<string, unknown>)[key];
                if (typeof id === "string") ids.add(id);
            }
        }
    }
    return Array.from(ids);
}

export async function getTaskHistoryInOrg(
    orgId: string,
    taskId: string,
): Promise<TaskHistoryEntry[]> {
    const task = await prisma.issue.findFirst({
        where: {
            id: taskId,
            workerEngagement: { organizationId: orgId },
        },
        select: { id: true },
    });
    if (!task) {
        throw new Error("Task not found for organization");
    }

    const logs = await prisma.issueAuditLog.findMany({
        where: { issueId: taskId },
        orderBy: { createdAt: "desc" },
        include: {
            actorUser: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
        },
    });

    const statusIds = collectReferencedIds(logs, "statusId");
    const assigneeIds = collectReferencedIds(logs, "assigneeUserId");

    const statuses = statusIds.length
        ? await prisma.organizationStatus.findMany({
              where: { id: { in: statusIds } },
              select: { id: true, name: true, color: true },
          })
        : [];
    const assignees = assigneeIds.length
        ? await prisma.user.findMany({
              where: { id: { in: assigneeIds } },
              select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
              },
          })
        : [];

    const statusById = new Map(statuses.map((s) => [s.id, s]));
    const userById = new Map(assignees.map((u) => [u.id, u]));

    const resolvers: ChangeResolvers = {
        statusName: (id) => statusById.get(id)?.name ?? null,
        userName: (id) => {
            const u = userById.get(id);
            if (!u) return null;
            const name = `${u.firstName} ${u.lastName}`.trim();
            return name || u.email;
        },
    };

    return logs.map((log) => {
        const newObj =
            log.newValue && typeof log.newValue === "object"
                ? (log.newValue as Record<string, unknown>)
                : null;
        const newStatusId =
            newObj && typeof newObj.statusId === "string"
                ? (newObj.statusId as string)
                : null;

        return {
            id: log.id,
            action: log.action,
            createdAt: log.createdAt,
            actorUser: log.actorUser
                ? {
                      id: log.actorUser.id,
                      email: log.actorUser.email,
                      firstName: log.actorUser.firstName,
                      lastName: log.actorUser.lastName,
                      avatarUrl: log.actorUser.avatarUrl,
                  }
                : null,
            status: newStatusId ? (statusById.get(newStatusId) ?? null) : null,
            changes: diffAuditValues(log.oldValue, log.newValue, resolvers),
        };
    });
}
