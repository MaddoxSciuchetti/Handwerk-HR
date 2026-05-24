import type Stripe from "stripe";

export function resolveCheckoutSessionSubscriptionId(
    session: Stripe.Checkout.Session,
): string | undefined {
    if (typeof session.subscription === "string") {
        return session.subscription;
    }
    return session.subscription?.id;
}
