import type { AuditSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function appendSubscriptionAuditLog(params: {
    subscriptionId: string;
    actorUserId?: string | null;
    source?: AuditSource;
    action: string;
    oldValue?: Prisma.InputJsonValue | null;
    newValue?: Prisma.InputJsonValue | null;
}) {
    return prisma.subscriptionAuditLog.create({
        data: {
            subscriptionId: params.subscriptionId,
            actorUserId: params.actorUserId ?? null,
            source: params.source ?? "user",
            action: params.action,
            oldValue: params.oldValue ?? undefined,
            newValue: params.newValue ?? undefined,
        },
    });
}
