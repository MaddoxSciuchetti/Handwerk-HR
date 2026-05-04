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
    const smetadata = session.metadata;
    const organizationId = smetadata?.organization_id;
    const actorUserId = smetadata?.user_id ?? null;
    const retrieved = await stripe.subscriptions.retrieve(
        typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id!,
        {
            expand: ["default_payment_method", "items.data.price"],
        },
    );

    const retrievedSubscription =
        retrieved as unknown as StripeSubscriptionResource;

    const item = retrievedSubscription.items.data[0];
    const plan = resolvePlanFromLineItemPrice(
        item?.price as { id?: string; lookup_key?: string | null } | null,
    );

    await upsertSubscriptionForOrg(
        organizationId!,
        retrievedSubscription,
        plan,
        actorUserId,
    );
}
