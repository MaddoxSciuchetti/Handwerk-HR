import { upsertSubscriptionForOrg } from "@/services/stripe-webhook/service/stripeWebhook.service";
import { resolveCheckoutSessionSubscriptionId } from "@/services/stripe-webhook/util/checkoutSessionSubscription.util";
import { stripe } from "@/stripeClient";
import { StripeSubscriptionResource } from "@/types/stripe.types";
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
    const retrieved = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method", "items.data.price"],
    });

    const retrievedSubscription =
        retrieved as unknown as StripeSubscriptionResource;
    const item = retrievedSubscription.items.data[0];
    const linePrice = item?.price;
    const plan = resolvePlanFromLineItemPrice(
        typeof linePrice === "string" ? { id: linePrice } : (linePrice ?? null),
    );

    await upsertSubscriptionForOrg({
        organizationId,
        stripeSub: retrievedSubscription,
        plan,
        actorUserId,
    });
}
