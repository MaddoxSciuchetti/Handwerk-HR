import { prisma } from "@/lib/prisma";
import { createIssue, updateIssue } from "@/services/worker.serviceV2";

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
        where: { organizationId: orgId, entityType: "issue" },
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
