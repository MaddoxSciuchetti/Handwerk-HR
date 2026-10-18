import { prisma } from "@/lib/prisma";
import { issueVisibleToViewer } from "@/services/issueVisibility";
import { summarizeLifecycleStatistics } from "@/utils/lifecycleStatistics";

export async function getLifecycleStatistics(organizationId: string, viewerUserId: string) {
    const [workers, issues] = await Promise.all([
        prisma.worker.findMany({
            where: { organizationId },
            select: { id: true, status: true, engagements: { select: {
                status: true, type: true, createdAt: true, startedAt: true, completedAt: true, endDate: true,
            } } },
        }),
        prisma.issue.findMany({
            where: { AND: [
                { OR: [{ workerEngagement: { organizationId } }, { organizationId }] },
                issueVisibleToViewer(viewerUserId),
            ] },
            select: {
                status: true, createdAt: true, startedAt: true, completedAt: true, dueDate: true,
                workerEngagement: { select: { status: true, worker: { select: { status: true } } } },
            },
        }),
    ]);
    return summarizeLifecycleStatistics(workers, issues);
}
