import { prisma } from "@/lib/prisma";
import type { ProvisioningRepository } from "./types";

export const microsoft365Repository: ProvisioningRepository = {
    async findWorker(organizationId, workerId) {
        return prisma.worker.findFirst({
            where: { id: workerId, organizationId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                microsoftEmail: true,
                externalAccounts: {
                    where: { provider: "microsoft_365" },
                    select: { externalId: true },
                    take: 1,
                },
            },
        });
    },
    async saveAccount(workerId, account) {
        await prisma.$transaction(async (tx) => {
            await tx.worker.update({
                where: { id: workerId },
                data: { microsoftEmail: account.workEmail },
            });
            await tx.workerExternalAccount.upsert({
                where: {
                    workerId_provider: {
                        workerId,
                        provider: "microsoft_365",
                    },
                },
                create: {
                    workerId,
                    provider: "microsoft_365",
                    externalId: account.externalId,
                    status: "active",
                },
                update: {
                    externalId: account.externalId,
                    status: "active",
                },
            });
        });
    },
};
