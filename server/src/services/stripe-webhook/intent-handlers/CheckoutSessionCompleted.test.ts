import type { StripeSubscriptionResource } from "@/types/stipe.types";
import type Stripe from "stripe";

jest.mock("@/services/stripe-webhook/service/stripeWebhook.service", () => ({
    stripe: {
        subscriptions: {
            retrieve: jest.fn(),
        },
    },
    upsertSubscriptionForOrg: jest.fn(),
}));

import { handleCheckoutSessionCompleted } from "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted";
import {
    stripe,
    upsertSubscriptionForOrg,
} from "@/services/stripe-webhook/service/stripeWebhook.service";

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
        expect(mockUpsert).toHaveBeenCalledWith(
            "org_1",
            stripeRetrieveSubscriptionFixture(),
            "starter",
            "user_1",
        );
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

        expect(mockUpsert).toHaveBeenCalledWith(
            "org_1",
            stripeRetrieveSubscriptionFixture(),
            "starter",
            "user_1",
        );
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

        expect(mockUpsert).toHaveBeenCalledWith(
            "org_1",
            retrievedByPriceId,
            "starter",
            "user_1",
        );

        const retrievedByLookupKey = stripeRetrieveSubscriptionFixture({
            items: {
                data: [{ price: { lookup_key: "pro" } }],
            },
        });
        mockRetrieve.mockResolvedValue(retrievedByLookupKey as never);
        await handleCheckoutSessionCompleted(session);

        expect(mockUpsert.mock.calls.at(-1)).toEqual([
            "org_1",
            retrievedByLookupKey,
            "pro",
            "user_1",
        ]);
    });

    it("passes null actorUserId when metadata omits user_id", async () => {
        const session = handlerCheckoutSessionFixture({
            metadata: { organization_id: "org_only" },
        });

        await handleCheckoutSessionCompleted(session);

        expect(mockUpsert).toHaveBeenCalledWith(
            "org_only",
            stripeRetrieveSubscriptionFixture(),
            "starter",
            null,
        );
    });
});
