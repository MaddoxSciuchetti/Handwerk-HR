import { issueStatusLabel } from "@/constants/issueStatus.consts";
import { prisma } from "@/lib/prisma";
import type { IssueStatus } from "@prisma/client";
import { createIssue, updateIssue } from "@/services/worker.service";

export type TaskHistoryChange = {
    field: string;
    from: string | null;
    to: string | null;
};

export type TaskHistoryActorJson = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
};

export type TaskHistoryAuditEntry = {
    kind: "audit";
    id: string;
    action: string;
    createdAt: Date;
    actorUser: TaskHistoryActorJson | null;
    status: {
        id: string;
        name: string;
        color: string | null;
    } | null;
    changes: TaskHistoryChange[];
};

export type TaskHistoryCommentEntry = {
    kind: "comment";
    id: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    user: TaskHistoryActorJson;
};

export type TaskHistoryItem = TaskHistoryAuditEntry | TaskHistoryCommentEntry;

export const queryTasks = async (orgId: string) => {
    return prisma.issue.findMany({
        where: {
            workerEngagement: {
                organizationId: orgId,
            },
        },
        orderBy: { createdAt: "desc" },
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            workerEngagement: {
                select: { workerId: true },
            },
        },
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

    return createIssue({
        workerEngagementId: engagement.id,
        createdByUserId: userId,
        status: "open",
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
        status?: IssueStatus;
        assigneeUserId?: string;
    };

    return updateIssue({
        issueId: existing.id,
        workerEngagementId: existing.workerEngagementId,
        actorUserId: userId,
        title: body.title,
        status: body.status,
        assigneeUserId: body.assigneeUserId,
    });
}

const HUMAN_READABLE_FIELDS = new Set([
    "title",
    "description",
    "status",
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

function resolveFieldValue(
    field: string,
    rawValue: unknown,
    resolvers: ChangeResolvers,
): string | null {
    const stringValue = valueToString(rawValue);
    if (stringValue === null) return null;

    if (field === "status" || field === "statusId") {
        return issueStatusLabel(stringValue);
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
        const normalizedField = field === "statusId" ? "status" : field;
        if (changes.some((c) => c.field === normalizedField)) continue;
        changes.push({
            field: normalizedField,
            from: resolveFieldValue(field, oldObj[field], resolvers),
            to: resolveFieldValue(field, newObj[field], resolvers),
        });
    }
    return changes;
}

function readStatusFromAuditBlob(
    blob: Record<string, unknown> | null,
): IssueStatus | null {
    if (!blob) return null;
    const raw =
        typeof blob.status === "string"
            ? blob.status
            : typeof blob.statusId === "string"
              ? blob.statusId
              : null;
    if (!raw) return null;
    return raw as IssueStatus;
}

function statusDisplay(status: IssueStatus) {
    return {
        id: status,
        name: issueStatusLabel(status),
        color: null as string | null,
    };
}

export async function getTaskHistoryInOrg(
    orgId: string,
    taskId: string,
): Promise<TaskHistoryItem[]> {
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

    const assigneeIds = new Set<string>();
    for (const log of logs) {
        for (const blob of [log.oldValue, log.newValue]) {
            if (blob && typeof blob === "object" && "assigneeUserId" in blob) {
                const id = (blob as Record<string, unknown>).assigneeUserId;
                if (typeof id === "string") assigneeIds.add(id);
            }
        }
    }

    const assignees = assigneeIds.size
        ? await prisma.user.findMany({
              where: { id: { in: Array.from(assigneeIds) } },
              select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
              },
          })
        : [];

    const userById = new Map(assignees.map((u) => [u.id, u]));

    const resolvers: ChangeResolvers = {
        userName: (id) => {
            const u = userById.get(id);
            if (!u) return null;
            const name = `${u.firstName} ${u.lastName}`.trim();
            return name || u.email;
        },
    };

    const auditItems: TaskHistoryAuditEntry[] = logs.map((log) => {
        const newObj =
            log.newValue && typeof log.newValue === "object"
                ? (log.newValue as Record<string, unknown>)
                : null;
        const newStatus = readStatusFromAuditBlob(newObj);

        return {
            kind: "audit" as const,
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
            status: newStatus ? statusDisplay(newStatus) : null,
            changes: diffAuditValues(log.oldValue, log.newValue, resolvers),
        };
    });

    const comments = await prisma.comment.findMany({
        where: { issueId: taskId },
        orderBy: { createdAt: "asc" },
        include: {
            user: {
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

    const commentItems: TaskHistoryCommentEntry[] = comments.map((c) => ({
        kind: "comment" as const,
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        user: {
            id: c.user.id,
            email: c.user.email,
            firstName: c.user.firstName,
            lastName: c.user.lastName,
            avatarUrl: c.user.avatarUrl,
        },
    }));

    const merged: TaskHistoryItem[] = [...auditItems, ...commentItems];
    merged.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return merged;
}

export async function upsertIssueCommentInOrg(
    orgId: string,
    userId: string,
    issueId: string,
    payload: { body: string; commentId?: string | null },
) {
    const body = payload.body.trim();
    if (!body) {
        throw new Error("Comment cannot be empty");
    }

    const issue = await prisma.issue.findFirst({
        where: {
            id: issueId,
            workerEngagement: { organizationId: orgId },
        },
        select: { id: true },
    });
    if (!issue) {
        throw new Error("Task not found for organization");
    }

    if (payload.commentId) {
        const existing = await prisma.comment.findFirst({
            where: { id: payload.commentId, issueId },
        });
        if (!existing) {
            throw new Error("Comment not found");
        }
        if (existing.userId !== userId) {
            throw new Error("You can only edit your own comments");
        }
        return prisma.comment.update({
            where: { id: existing.id },
            data: { body },
            include: {
                user: {
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
    }

    return prisma.comment.create({
        data: { issueId, userId, body },
        include: {
            user: {
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
}
