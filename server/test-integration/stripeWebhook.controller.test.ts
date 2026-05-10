import type { NextFunction, Request, Response } from "express";

jest.mock("@/stripeClient", () => ({
    stripe: {
        webhooks: {
            constructEvent: jest.fn(),
        },
    },
}));

jest.mock(
    "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted",
    () => ({
        handleCheckoutSessionCompleted: jest.fn(),
    }),
);

jest.mock(
    "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionDeleted",
    () => ({
        handleCustomerSubscriptionDeleted: jest.fn(),
    }),
);

jest.mock(
    "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionWrite",
    () => ({
        handleCustomerSubscriptionWrite: jest.fn(),
    }),
);

jest.mock("@/services/stripe-webhook/intent-handlers/InvoiceWrite", () => ({
    handleInvoiceWrite: jest.fn(),
}));

import { STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import { stripeWebhookHandler } from "@/controllers/stripeWebhook.controller";
import { handleCheckoutSessionCompleted } from "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted";
import { handleCustomerSubscriptionDeleted } from "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionDeleted";
import { handleCustomerSubscriptionWrite } from "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionWrite";
import { handleInvoiceWrite } from "@/services/stripe-webhook/intent-handlers/InvoiceWrite";
import { stripe } from "@/stripeClient";

const mockCheckout = jest.mocked(handleCheckoutSessionCompleted);
const mockSubscriptionWrite = jest.mocked(handleCustomerSubscriptionWrite);
const mockSubscriptionDeleted = jest.mocked(handleCustomerSubscriptionDeleted);
const mockInvoiceWrite = jest.mocked(handleInvoiceWrite);

const mockConstructEvent = jest.mocked(stripe.webhooks.constructEvent);

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
        mockConstructEvent.mockReset();
        mockConstructEvent.mockImplementation(() => {
            throw new Error("mockConstructEvent: set event shape in each test");
        });

        mockCheckout.mockReset();
        mockCheckout.mockResolvedValue(undefined);

        mockSubscriptionWrite.mockReset();
        mockSubscriptionWrite.mockResolvedValue(undefined);

        mockSubscriptionDeleted.mockReset();
        mockSubscriptionDeleted.mockResolvedValue(undefined);

        mockInvoiceWrite.mockReset();
        mockInvoiceWrite.mockResolvedValue(undefined);
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

        mockConstructEvent.mockImplementationOnce(
            () =>
                ({
                    id: "evt_checkout_done",
                    object: "event",
                    type: "checkout.session.completed",
                    data: { object: session },
                }) as never,
        );

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

    it("routes customer.subscription.updated to subscription write handler", async () => {
        const subscriptionPayload = {
            id: "sub_integration",
            object: "subscription" as const,
        };

        mockConstructEvent.mockImplementationOnce(
            () =>
                ({
                    id: "evt_sub_updated",
                    object: "event",
                    type: "customer.subscription.updated",
                    data: { object: subscriptionPayload },
                }) as never,
        );

        const { req, res, next } = mockWebhookRequestResponse();

        await stripeWebhookHandler(req, res, next);

        expect(mockCheckout).not.toHaveBeenCalled();
        expect(mockSubscriptionWrite).toHaveBeenCalledTimes(1);
        expect(mockSubscriptionWrite).toHaveBeenCalledWith(subscriptionPayload);

        expect(res.json).toHaveBeenCalledWith({ received: true });
        expect(next).not.toHaveBeenCalled();
    });

    it("acknowledges unknown event types without invoking Stripe intent handlers", async () => {
        mockConstructEvent.mockImplementationOnce(
            () =>
                ({
                    id: "evt_unknown",
                    object: "event",
                    type: "billing.alert.triggered",
                    data: { object: {} },
                }) as never,
        );

        const { req, res, next } = mockWebhookRequestResponse();

        await stripeWebhookHandler(req, res, next);

        expect(mockCheckout).not.toHaveBeenCalled();
        expect(mockSubscriptionWrite).not.toHaveBeenCalled();
        expect(mockSubscriptionDeleted).not.toHaveBeenCalled();
        expect(mockInvoiceWrite).not.toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith({ received: true });
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards intent handler failure to next(err) without sending success JSON", async () => {
        mockConstructEvent.mockImplementationOnce(
            () =>
                ({
                    id: "evt_checkout_fail",
                    object: "event",
                    type: "checkout.session.completed",
                    data: {
                        object: { id: "cs_fail", object: "checkout.session" },
                    },
                }) as never,
        );

        const err = new Error("checkout handler failed");
        mockCheckout.mockRejectedValueOnce(err);

        const { req, res, next } = mockWebhookRequestResponse();

        await stripeWebhookHandler(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
        expect(res.json).not.toHaveBeenCalled();
    });

    it("forwards constructEvent failure to next(err) without invoking handlers", async () => {
        const verifyErr = new Error("Webhook signature verification failed");
        mockConstructEvent.mockImplementationOnce(() => {
            throw verifyErr;
        });

        const { req, res, next } = mockWebhookRequestResponse();

        await stripeWebhookHandler(req, res, next);

        expect(next).toHaveBeenCalledWith(verifyErr);
        expect(mockCheckout).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
