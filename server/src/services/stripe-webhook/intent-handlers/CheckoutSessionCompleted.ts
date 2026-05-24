import { upsertSubscriptionForOrg } from "@/services/stripe-webhook/service/stripeWebhook.service";
import { resolveCheckoutSessionSubscriptionId } from "@/services/stripe-webhook/util/checkoutSessionSubscription.util";
import { stripe } from "@/stripeClient";
import { resolvePlanFromLineItemPrice } from "@/utils/stripeSubscriptionWebhook";
import Stripe from "stripe";

export async function handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
): Promise<void> {
    const sessionMetadata = session.metadata;
    const organizationId = sessionMetadata?.organization_id;
    const actorUserId = sessionMetadata?.user_id ?? null;
    if (!organizationId) {
        throw new Error("Organization ID is required");
    }
    const subscriptionId = resolveCheckoutSessionSubscriptionId(session);
    if (!subscriptionId) {
        throw new Error("Subscription ID is required");
    }
    const retrievedSubscription = await stripe.subscriptions.retrieve(
        subscriptionId,
        {
            expand: ["default_payment_method", "items.data.price"],
        },
    );

    await upsertOrgSubscriptionFromCheckoutRetrieve(
        organizationId,
        actorUserId,
        retrievedSubscription,
    );
}
async function upsertOrgSubscriptionFromCheckoutRetrieve(
    organizationId: string,
    actorUserId: string | null,
    subscription: Stripe.Subscription,
): Promise<void> {
    const item = subscription.items.data[0];
    const linePrice = item?.price;
    const plan = resolvePlanFromLineItemPrice(
        typeof linePrice === "string"
            ? { id: linePrice }
            : linePrice && "deleted" in linePrice
              ? null
              : (linePrice ?? null),
    );

    await upsertSubscriptionForOrg({
        organizationId,
        stripeSub: subscription,
        plan,
        actorUserId,
    });
}
