import { STRIPE_SECRET_KEY } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import { appendSubscriptionAuditLog } from "@/services/subscriptionAudit.service";
import { StripeSubscriptionResource } from "@/types/stipe.types";
import { buildSubscriptionDbFieldsFromStripeSubscription } from "@/utils/stripeSubscriptionWebhook";
import type { SubscriptionPlan } from "@prisma/client";
import Stripe from "stripe";

export const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function upsertSubscriptionForOrg(
    organizationId: string,
    stripeSub: StripeSubscriptionResource,
    plan: SubscriptionPlan | null,
    actorUserId: string | null,
) {
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
            plan: plan ?? null,
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
