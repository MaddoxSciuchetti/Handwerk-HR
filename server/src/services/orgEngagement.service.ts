import { prisma } from "@/lib/prisma";

export async function listOrgEngagements(organizationId: string) {
    const rows = await prisma.workerEngagement.findMany({
        where: { organizationId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            type: true,
            worker: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });

    return rows.map((r) => ({
        id: r.id,
        type: r.type,
        workerId: r.worker.id,
        workerFirstName: r.worker.firstName,
        workerLastName: r.worker.lastName,
    }));
}
