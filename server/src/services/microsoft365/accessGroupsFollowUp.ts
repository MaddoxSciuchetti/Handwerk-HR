import { prisma } from "@/lib/prisma";

const FOLLOW_UP_TITLE = "Microsoft-Gruppen zuweisen";
const FOLLOW_UP_DESCRIPTION =
    "Das Microsoft-Konto wurde ohne Gruppenrechte angelegt. Bitte Gruppen wählen und zuweisen.";

export async function ensureMicrosoftAccessGroupsFollowUp(params: {
    organizationId: string;
    engagementId: string;
    actorUserId: string;
}) {
    const existing = await prisma.issue.findFirst({
        where: {
            workerEngagementId: params.engagementId,
            sequence: "microsoft_assign_access_groups",
            status: { in: ["open", "in_progress"] },
        },
        select: { id: true },
    });
    if (existing) return existing.id;

    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: params.engagementId,
            organizationId: params.organizationId,
        },
        select: { responsibleUserId: true },
    });
    if (!engagement) return null;

    const assigneeUserId =
        engagement.responsibleUserId || params.actorUserId;

    const created = await prisma.issue.create({
        data: {
            workerEngagementId: params.engagementId,
            createdByUserId: params.actorUserId,
            assigneeUserId,
            status: "open",
            isTemporary: true,
            title: FOLLOW_UP_TITLE,
            description: FOLLOW_UP_DESCRIPTION,
            integrationProvider: "microsoft_graph",
            sequence: "microsoft_assign_access_groups",
        },
        select: { id: true },
    });
    return created.id;
}
