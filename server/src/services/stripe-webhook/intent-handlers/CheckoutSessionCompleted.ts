import {
    stripe,
    upsertSubscriptionForOrg,
} from "@/services/stripe-webhook/service/stripeWebhook.service";
import { StripeSubscriptionResource } from "@/types/stipe.types";
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

    const subscriptionId =
        typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

    if (!subscriptionId) {
        throw new Error("Subscription ID is required");
    }
    const retrieved = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method", "items.data.price"],
    });

    const retrievedSubscription =
        retrieved as unknown as StripeSubscriptionResource;

    const item = retrievedSubscription.items.data[0];
    const plan = resolvePlanFromLineItemPrice(
        item?.price as { id?: string; lookup_key?: string | null } | null,
    );

    await upsertSubscriptionForOrg(
        organizationId,
        retrievedSubscription,
        plan,
        actorUserId,
    );
}
