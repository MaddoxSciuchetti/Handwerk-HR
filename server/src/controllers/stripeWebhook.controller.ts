import { STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import { logger, serializeError } from "@/observability/logger";
import { dispatchStripeWebhookEvent } from "@/services/stripe-webhook/dispatchStripeWebhookEvent";
import { stripe } from "@/stripeClient";
import type { NextFunction, Request, Response } from "express";
import type Stripe from "stripe";

export async function stripeWebhookHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    let eventType: string | undefined;
    try {
        const event = parseStripeEvent(req);
        eventType = event.type;
        logger.info("Stripe webhook received", {
            event: "stripe.webhook",
            outcome: "received",
            stripeEventId: event.id,
            stripeEventType: event.type,
        });
        await dispatchStripeWebhookEvent(event);
        logger.info("Stripe webhook handled", {
            event: "stripe.webhook",
            outcome: "ok",
            stripeEventId: event.id,
            stripeEventType: event.type,
        });
        res.json({ received: true });
    } catch (err) {
        logger.error("Stripe webhook failed", {
            event: "stripe.webhook",
            outcome: "error",
            stripeEventType: eventType,
            error: serializeError(err),
        });
        next(err);
    }
}

function parseStripeEvent(req: Request): Stripe.Event {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
        throw new Error("Missing stripe-signature header");
    }
    return stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET,
    );
}
