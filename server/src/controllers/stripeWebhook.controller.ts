import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import { dispatchStripeWebhookEvent } from "@/services/stripe-webhook/dispatchStripeWebhookEvent";
import type { NextFunction, Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function stripeWebhookHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    let event: Stripe.Event;
    try {
        const signature = req.headers["stripe-signature"];
        if (typeof signature !== "string") {
            throw new Error("Missing stripe-signature header");
        }

        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        next(err);
        return;
    }

    console.log("[stripe webhook]", event.type);

    try {
        await dispatchStripeWebhookEvent(event);

        res.json({ received: true });
    } catch (err) {
        next(err);
    }
}
