import Stripe from "stripe";

export function extractStripeSubscriptionId(
    invoice: Stripe.Invoice,
): string | null {
    const o = invoice as unknown as {
        subscription?: string | { id?: string } | null;
        parent?: {
            type?: string;
            subscription_details?: { subscription?: string | null };
        } | null;
    };

    if (o.subscription) {
        return typeof o.subscription === "string"
            ? o.subscription
            : (o.subscription.id ?? null);
    }

    if (
        o.parent?.type === "subscription_details" &&
        o.parent.subscription_details?.subscription
    ) {
        return o.parent.subscription_details.subscription;
    }

    return null;
}
