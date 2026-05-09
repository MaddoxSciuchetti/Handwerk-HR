import type Stripe from "stripe";

import { resolveCheckoutSessionSubscriptionId } from "@/services/stripe-webhook/util/checkoutSessionSubscription.util";

function sessionShape(
    partial: Record<string, unknown>,
): Stripe.Checkout.Session {
    return partial as unknown as Stripe.Checkout.Session;
}

describe("resolveCheckoutSessionSubscriptionId", () => {
    it("returns the subscription id when session.subscription is a string id", () => {
        const session = sessionShape({ subscription: "sub_checkout_ref" });

        expect(resolveCheckoutSessionSubscriptionId(session)).toBe(
            "sub_checkout_ref",
        );
    });

    it("returns the nested id when session.subscription is expanded", () => {
        const session = sessionShape({
            subscription: { id: "sub_expanded_checkout" },
        });

        expect(resolveCheckoutSessionSubscriptionId(session)).toBe(
            "sub_expanded_checkout",
        );
    });

    it("returns undefined when subscription is missing", () => {
        expect(resolveCheckoutSessionSubscriptionId(sessionShape({}))).toBeUndefined();
    });

    it("returns undefined when subscription is expanded without id", () => {
        const session = sessionShape({ subscription: {} });

        expect(resolveCheckoutSessionSubscriptionId(session)).toBeUndefined();
    });
});
