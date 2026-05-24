import type { SubscriptionPlan } from "@prisma/client";

export const STRIPE_PRICE_ID_TO_PLAN: Record<string, SubscriptionPlan> = {
    price_1TSLW4IFABFY32sSl8hcCUBE: "starter",
    price_1TSekOIFABFY32sSYamWuX2h: "pro",
    price_1TSekYIFABFY32sS3XsLPgIW: "enterprise",
};

export function planFromStripePriceId(
    priceId: string | undefined | null,
): SubscriptionPlan | null {
    if (!priceId) {
        return null;
    }
    return STRIPE_PRICE_ID_TO_PLAN[priceId] ?? null;
}
