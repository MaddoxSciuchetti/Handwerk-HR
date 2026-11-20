import { prisma } from "@/lib/prisma";
import { invalidateTasksListCacheForIssue } from "@/services/tasksListCache";
import type { IssueStatus } from "@prisma/client";

export async function executionStatus(
    issueId: string,
    actorUserId: string,
    status: IssueStatus,
    message?: string,
) {
    const issue = await prisma.$transaction(async (tx) => {
        const current = await tx.issue.findUniqueOrThrow({
            where: { id: issueId },
            select: {
                status: true,
                assigneeOnly: true,
                organizationId: true,
                workerEngagement: { select: { organizationId: true } },
            },
        });
        await tx.issue.update({
            where: { id: issueId },
            data: {
                status,
                completedAt: status === "done" ? new Date() : null,
            },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId,
                actorUserId,
                action: "issue.updated",
                oldValue: { status: current.status },
                newValue: {
                    status,
                    ...(message ? { automationError: message } : {}),
                },
            },
        });
        return current;
    });
    await invalidateTasksListCacheForIssue({
        assigneeOnly: issue.assigneeOnly,
        organizationId: issue.organizationId,
        workerEngagementOrganizationId: issue.workerEngagement?.organizationId,
    });
}

export function executionError(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Automatisierung fehlgeschlagen.";
}
