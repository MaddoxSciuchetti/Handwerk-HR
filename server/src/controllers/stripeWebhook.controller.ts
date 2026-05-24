import { STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import { dispatchStripeWebhookEvent } from "@/services/stripe-webhook/dispatchStripeWebhookEvent";
import { stripe } from "@/stripeClient";
import type { NextFunction, Request, Response } from "express";
import type Stripe from "stripe";

export async function stripeWebhookHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const event = parseStripeEvent(req);
        await dispatchStripeWebhookEvent(event);
        res.json({ received: true });
    } catch (err) {
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
