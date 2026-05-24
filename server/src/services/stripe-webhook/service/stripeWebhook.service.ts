import { prisma } from "@/lib/prisma";
import { appendSubscriptionAuditLog } from "@/services/subscriptionAudit.service";
import { StripeSubscriptionResource } from "@/types/stripe.types";
import { buildSubscriptionDbFieldsFromStripeSubscription } from "@/utils/stripeSubscriptionWebhook";
import type { SubscriptionPlan } from "@prisma/client";

export type UpsertSubscriptionForOrgParams = {
    organizationId: string;
    stripeSub: StripeSubscriptionResource;
    plan: SubscriptionPlan | null;
    actorUserId: string | null;
};

export async function upsertSubscriptionForOrg({
    organizationId,
    stripeSub,
    plan,
    actorUserId,
}: UpsertSubscriptionForOrgParams) {
    const stripeFields =
        buildSubscriptionDbFieldsFromStripeSubscription(stripeSub);

    const existing = await prisma.subscription.findUnique({
        where: { organizationId },
    });

    const subscription = await prisma.subscription.upsert({
        where: { organizationId },
        create: {
            organizationId,
            ...stripeFields,
            plan,
        },
        update: {
            ...stripeFields,
            ...(plan !== null ? { plan } : {}),
        },
    });

    await appendSubscriptionAuditLog({
        subscriptionId: subscription.id,
        actorUserId,
        source: "webhook",
        action: "stripe.subscription.synced",
        oldValue: existing
            ? { plan: existing.plan, status: existing.status }
            : null,
        newValue: {
            plan: subscription.plan,
            status: subscription.status,
            stripeSubscriptionId: stripeSub.id,
        },
    });
}
