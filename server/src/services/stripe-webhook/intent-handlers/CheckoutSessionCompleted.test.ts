import type { StripeSubscriptionResource } from "@/types/stipe.types";
import type Stripe from "stripe";

jest.mock("@/stripeClient", () => ({
    stripe: {
        subscriptions: {
            retrieve: jest.fn(),
        },
    },
}));

jest.mock("@/services/stripe-webhook/service/stripeWebhook.service", () => ({
    upsertSubscriptionForOrg: jest.fn(),
}));

import { handleCheckoutSessionCompleted } from "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted";
import { stripe } from "@/stripeClient";
import { upsertSubscriptionForOrg } from "@/services/stripe-webhook/service/stripeWebhook.service";
import { resolveCheckoutSessionSubscriptionId } from "@/services/stripe-webhook/util/checkoutSessionSubscription.util";

const mockRetrieve = stripe.subscriptions.retrieve as jest.MockedFunction<
    typeof stripe.subscriptions.retrieve
>;
const mockUpsert = upsertSubscriptionForOrg as jest.MockedFunction<
    typeof upsertSubscriptionForOrg
>;

const KNOWN_PRICE_ID_STARTER = "price_1TSLW4IFABFY32sSl8hcCUBE";

function stripeRetrieveSubscriptionFixture(
    overrides: Partial<StripeSubscriptionResource> = {},
): StripeSubscriptionResource {
    return {
        id: "sub_fixture",
        status: "active",
        customer: "cus_fixture",
        current_period_start: 1_700_000_000,
        current_period_end: 1_700_086_400,
        trial_end: null,
        metadata: {},
        items: {
            data: [{ price: { id: KNOWN_PRICE_ID_STARTER } }],
        },
        ...overrides,
    };
}

function handlerCheckoutSessionFixture(
    overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
    return {
        id: "cs_fixture",
        object: "checkout.session",
        metadata: {
            organization_id: "org_1",
            user_id: "user_1",
        },
        subscription: "sub_fixture",
        ...overrides,
    } as unknown as Stripe.Checkout.Session;
}

describe("resolveCheckoutSessionSubscriptionId", () => {
    it("returns subscription when session holds a string subscription id", () => {
        const session = handlerCheckoutSessionFixture({
            subscription: "sub_str",
        });
        expect(resolveCheckoutSessionSubscriptionId(session)).toBe("sub_str");
    });

    it("returns id from expanded subscription object when subscription is not a string", () => {
        const session = handlerCheckoutSessionFixture({
            subscription: { id: "sub_obj" } as Stripe.Subscription,
        });
        expect(resolveCheckoutSessionSubscriptionId(session)).toBe("sub_obj");
    });

    it("returns undefined when subscription is absent or object has no id", () => {
        expect(
            resolveCheckoutSessionSubscriptionId(
                handlerCheckoutSessionFixture({ subscription: null }),
            ),
        ).toBeUndefined();
        expect(
            resolveCheckoutSessionSubscriptionId(
                handlerCheckoutSessionFixture({
                    subscription: {} as Stripe.Subscription,
                }),
            ),
        ).toBeUndefined();
    });
});

describe("handleCheckoutSessionCompleted", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRetrieve.mockResolvedValue(
            stripeRetrieveSubscriptionFixture() as never,
        );
        mockUpsert.mockResolvedValue(undefined);
    });

    it("calls retrieve with string subscription id and expand options, then upserts with org, retrieved subscription, starter plan, and actor", async () => {
        const session = handlerCheckoutSessionFixture({
            subscription: "sub_from_string",
        });

        await handleCheckoutSessionCompleted(session);

        expect(mockRetrieve).toHaveBeenCalledTimes(1);
        expect(mockRetrieve).toHaveBeenCalledWith("sub_from_string", {
            expand: ["default_payment_method", "items.data.price"],
        });

        expect(mockUpsert).toHaveBeenCalledTimes(1);
        expect(mockUpsert).toHaveBeenCalledWith({
            organizationId: "org_1",
            stripeSub: stripeRetrieveSubscriptionFixture(),
            plan: "starter",
            actorUserId: "user_1",
        });
    });

    it("calls retrieve with expanded subscription object's id when subscription is not a string", async () => {
        const session = handlerCheckoutSessionFixture({
            subscription: { id: "sub_expanded" } as Stripe.Subscription,
        });

        await handleCheckoutSessionCompleted(session);

        expect(mockRetrieve).toHaveBeenCalledTimes(1);
        expect(mockRetrieve).toHaveBeenCalledWith("sub_expanded", {
            expand: ["default_payment_method", "items.data.price"],
        });

        expect(mockUpsert).toHaveBeenCalledWith({
            organizationId: "org_1",
            stripeSub: stripeRetrieveSubscriptionFixture(),
            plan: "starter",
            actorUserId: "user_1",
        });
    });

    it("passes SubscriptionPlan resolved from first line item (mapped price id, then lookup_key)", async () => {
        const retrievedByPriceId = stripeRetrieveSubscriptionFixture({
            items: {
                data: [
                    {
                        price: {
                            id: KNOWN_PRICE_ID_STARTER,
                        },
                    },
                ],
            },
        });
        mockRetrieve.mockResolvedValue(retrievedByPriceId as never);

        const session = handlerCheckoutSessionFixture();
        await handleCheckoutSessionCompleted(session);

        expect(mockUpsert).toHaveBeenCalledWith({
            organizationId: "org_1",
            stripeSub: retrievedByPriceId,
            plan: "starter",
            actorUserId: "user_1",
        });

        const retrievedByLookupKey = stripeRetrieveSubscriptionFixture({
            items: {
                data: [{ price: { lookup_key: "pro" } }],
            },
        });
        mockRetrieve.mockResolvedValue(retrievedByLookupKey as never);
        await handleCheckoutSessionCompleted(session);

        expect(mockUpsert.mock.calls.at(-1)?.[0]).toEqual({
            organizationId: "org_1",
            stripeSub: retrievedByLookupKey,
            plan: "pro",
            actorUserId: "user_1",
        });
    });

    it("passes null actorUserId when metadata omits user_id", async () => {
        const session = handlerCheckoutSessionFixture({
            metadata: { organization_id: "org_only" },
        });

        await handleCheckoutSessionCompleted(session);

        expect(mockUpsert).toHaveBeenCalledWith({
            organizationId: "org_only",
            stripeSub: stripeRetrieveSubscriptionFixture(),
            plan: "starter",
            actorUserId: null,
        });
    });

    it("rejects checkout session completed without organization_id", async () => {
        const session = handlerCheckoutSessionFixture({
            metadata: { user_id: "user_1" },
        });

        await expect(handleCheckoutSessionCompleted(session)).rejects.toThrow(
            "Organization ID is required",
        );

        expect(mockRetrieve).not.toHaveBeenCalled();
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("rejects checkout session completed without subscription id", async () => {
        const session = handlerCheckoutSessionFixture({
            subscription: null,
        });

        await expect(handleCheckoutSessionCompleted(session)).rejects.toThrow(
            "Subscription ID is required",
        );

        expect(mockRetrieve).not.toHaveBeenCalled();
        expect(mockUpsert).not.toHaveBeenCalled();
    });
});
