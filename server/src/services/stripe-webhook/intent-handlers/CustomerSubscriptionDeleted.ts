import { prisma } from "@/lib/prisma";
import { appendSubscriptionAuditLog } from "@/services/subscriptionAudit.service";
import { StripeSubscriptionResource } from "@/types/stripe.types";

export async function handleCustomerSubscriptionDeleted(
    rawSubscription: unknown,
): Promise<void> {
    const stripeSub = rawSubscription as unknown as StripeSubscriptionResource;
    const row = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id },
    });
    if (!row) {
        return;
    }

    const updated = await prisma.subscription.update({
        where: { id: row.id },
        data: { status: "cancelled" },
    });

    await appendSubscriptionAuditLog({
        subscriptionId: row.id,
        source: "webhook",
        action: "stripe.subscription.deleted",
        oldValue: { status: row.status },
        newValue: { status: updated.status },
    });
}
