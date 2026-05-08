import type { NextFunction, Request, Response } from "express";

/** One `constructEvent` fn per mocked `Stripe` client (controller instantiates exactly one). */
const mockConstructFns: jest.Mock[] = [];

jest.mock("stripe", () => ({
    __esModule: true,
    default: jest.fn(() => {
        const constructEventFn = jest.fn();
        mockConstructFns.push(constructEventFn);
        return {
            webhooks: {
                constructEvent: constructEventFn,
            },
        };
    }),
}));

jest.mock("@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted", () => ({
    handleCheckoutSessionCompleted: jest.fn(),
}));

jest.mock("@/services/stripe-webhook/intent-handlers/CustomerSubscriptionDeleted", () => ({
    handleCustomerSubscriptionDeleted: jest.fn(),
}));

jest.mock("@/services/stripe-webhook/intent-handlers/CustomerSubscriptionWrite", () => ({
    handleCustomerSubscriptionWrite: jest.fn(),
}));

jest.mock("@/services/stripe-webhook/intent-handlers/InvoiceWrite", () => ({
    handleInvoiceWrite: jest.fn(),
}));

import { STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import { handleCheckoutSessionCompleted } from "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted";
import { stripeWebhookHandler } from "@/controllers/stripeWebhook.controller";

const mockCheckout = jest.mocked(handleCheckoutSessionCompleted);

if (mockConstructFns.length !== 1) {
    throw new Error(
        `Expected one Stripe mock client (controller load order), got ${mockConstructFns.length}`,
    );
}
const mockConstructEvent = mockConstructFns[0]!;

function mockWebhookRequestResponse() {
    const req = {
        body: Buffer.from('{"id":"evt_checkout"}', "utf8"),
        headers: { "stripe-signature": "sig_test_checkout" },
    } as unknown as Request;

    const res = { json: jest.fn() as Response["json"] } as Partial<Response>;
    const next = jest.fn() as NextFunction;

    return { req, res: res as Response, next };
}

describe("stripeWebhookHandler (integration)", () => {
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        mockConstructEvent.mockReset();
        mockConstructEvent.mockImplementation(() => {
            throw new Error(
                "mockConstructEvent: configure checkout event in each test",
            );
        });

        mockCheckout.mockReset();
        mockCheckout.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("verifies webhook then runs checkout.session.completed handler and acknowledges", async () => {
        const session = {
            id: "cs_test",
            object: "checkout.session" as const,
            metadata: { organization_id: "org_z3" },
        };

        mockConstructEvent.mockImplementationOnce(() => ({
            id: "evt_checkout_done",
            object: "event",
            type: "checkout.session.completed",
            data: { object: session },
        }) as never);

        const { req, res, next } = mockWebhookRequestResponse();

        await stripeWebhookHandler(req, res, next);

        expect(mockConstructEvent).toHaveBeenCalledTimes(1);
        expect(mockConstructEvent).toHaveBeenCalledWith(
            req.body,
            "sig_test_checkout",
            STRIPE_WEBHOOK_SECRET,
        );

        expect(mockCheckout).toHaveBeenCalledTimes(1);
        expect(mockCheckout).toHaveBeenCalledWith(session);

        expect(res.json).toHaveBeenCalledWith({ received: true });
        expect(next).not.toHaveBeenCalled();
    });
});
