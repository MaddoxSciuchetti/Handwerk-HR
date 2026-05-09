import type Stripe from "stripe";

import { extractStripeSubscriptionId } from "@/utils/extractStripeSubid";

function invoiceShape(partial: Record<string, unknown>): Stripe.Invoice {
    return partial as unknown as Stripe.Invoice;
}

describe("extractStripeSubscriptionId", () => {
    it("returns the subscription id when subscription is an expanded object", () => {
        const invoice = invoiceShape({
            subscription: { id: "sub_expanded" },
        });

        expect(extractStripeSubscriptionId(invoice)).toBe("sub_expanded");
    });
});
