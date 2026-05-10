import { resolvePlanFromLineItemPrice } from "@/utils/stripeSubscriptionWebhook";

describe("resolvePlanFromLineItemPrice", () => {
    it("returns null for null, undefined, or empty price object", () => {
        expect(resolvePlanFromLineItemPrice(null)).toBeNull();
        expect(resolvePlanFromLineItemPrice(undefined)).toBeNull();
        expect(resolvePlanFromLineItemPrice({})).toBeNull();
    });

    it("maps known Stripe price ids from constants", () => {
        expect(
            resolvePlanFromLineItemPrice({
                id: "price_1TSLW4IFABFY32sSl8hcCUBE",
            }),
        ).toBe("starter");
        expect(
            resolvePlanFromLineItemPrice({
                id: "price_1TSekOIFABFY32sSYamWuX2h",
            }),
        ).toBe("pro");
        expect(
            resolvePlanFromLineItemPrice({
                id: "price_1TSekYIFABFY32sS3XsLPgIW",
            }),
        ).toBe("enterprise");
    });

    it("prefers price id mapping over lookup_key when both are set", () => {
        expect(
            resolvePlanFromLineItemPrice({
                id: "price_1TSLW4IFABFY32sSl8hcCUBE",
                lookup_key: "pro",
            }),
        ).toBe("starter");
    });

    it("maps lookup_key when id is missing or unknown", () => {
        expect(resolvePlanFromLineItemPrice({ lookup_key: "starter" })).toBe(
            "starter",
        );
        expect(resolvePlanFromLineItemPrice({ lookup_key: "pro" })).toBe("pro");
        expect(resolvePlanFromLineItemPrice({ lookup_key: "enterprise" })).toBe(
            "enterprise",
        );
    });

    it("returns null for unknown price id and no matching lookup_key", () => {
        expect(
            resolvePlanFromLineItemPrice({ id: "price_unknown" }),
        ).toBeNull();
        expect(
            resolvePlanFromLineItemPrice({ lookup_key: "business" }),
        ).toBeNull();
        expect(
            resolvePlanFromLineItemPrice({ id: "price_x", lookup_key: null }),
        ).toBeNull();
    });
});
