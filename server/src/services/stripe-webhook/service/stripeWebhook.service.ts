import { prisma } from "@/lib/prisma";
import { appendSubscriptionAuditLog } from "@/services/subscriptionAudit.service";
import { StripeSubscriptionResource } from "@/types/stipe.types";
import {
    extractCardFieldsFromStripeSubscription,
    mapStripeSubscriptionStatus,
} from "@/utils/stripeSubscriptionWebhook";
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
    const mapSubscription = () => {
        const customerRaw = stripeSub.customer;
        const customerId =
            typeof customerRaw === "string"
                ? customerRaw
                : customerRaw && typeof customerRaw === "object"
                  ? customerRaw.id
                  : null;
        if (!customerId || typeof customerId !== "string") {
            throw new Error("Stripe subscription missing customer id");
        }

        return {
            status: mapStripeSubscriptionStatus(stripeSub.status),
            provider: "stripe",
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: customerId,
            currentPeriodStart:
                stripeSub.current_period_start != null
                    ? new Date(stripeSub.current_period_start * 1000)
                    : null,
            currentPeriodEnd:
                stripeSub.current_period_end != null
                    ? new Date(stripeSub.current_period_end * 1000)
                    : null,
            trialEndsAt:
                stripeSub.trial_end != null
                    ? new Date(stripeSub.trial_end * 1000)
                    : null,
            ...extractCardFieldsFromStripeSubscription(stripeSub),
        };
    };
    const stripeFields = mapSubscription();

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
