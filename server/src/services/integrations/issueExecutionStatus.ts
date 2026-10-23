import { prisma } from "@/lib/prisma";
import type { IssueStatus } from "@prisma/client";

export async function executionStatus(
    issueId: string,
    actorUserId: string,
    status: IssueStatus,
    message?: string,
) {
    await prisma.$transaction(async (tx) => {
        const issue = await tx.issue.findUniqueOrThrow({
            where: { id: issueId },
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
                oldValue: { status: issue.status },
                newValue: {
                    status,
                    ...(message ? { automationError: message } : {}),
                },
            },
        });
    });
}

export function executionError(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Automatisierung fehlgeschlagen.";
}
