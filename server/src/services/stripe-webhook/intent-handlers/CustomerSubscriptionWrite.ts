import { prisma } from "@/lib/prisma";
import { upsertSubscriptionForOrg } from "@/services/stripe-webhook/service/stripeWebhook.service";
import { stripe } from "@/stripeClient";
import { StripeSubscriptionResource } from "@/types/stripe.types";
import { resolvePlanFromLineItemPrice } from "@/utils/stripeSubscriptionWebhook";

export async function handleCustomerSubscriptionWrite(
    rawSubscription: unknown,
): Promise<void> {
    const stripeSubRaw =
        rawSubscription as unknown as StripeSubscriptionResource;
    const retrieved = await stripe.subscriptions.retrieve(stripeSubRaw.id, {
        expand: ["default_payment_method", "items.data.price"],
    });
    const stripeSub = retrieved as unknown as StripeSubscriptionResource;
    const fromMeta = stripeSub.metadata?.organization_id?.trim() || null;
    const row =
        fromMeta === null
            ? await prisma.subscription.findFirst({
                  where: { stripeSubscriptionId: stripeSub.id },
                  select: { organizationId: true },
              })
            : null;
    const organizationId = fromMeta ?? row?.organizationId ?? null;

    if (!organizationId) {
        console.warn(
            "[stripe webhook] subscription write: could not resolve organization",
            stripeSub.id,
        );
        return;
    }

    const item = stripeSub.items.data[0];
    const plan = resolvePlanFromLineItemPrice(
        item?.price as { id?: string; lookup_key?: string | null } | null,
    );

    await upsertSubscriptionForOrg({
        organizationId,
        stripeSub,
        plan,
        actorUserId: null,
    });
}
