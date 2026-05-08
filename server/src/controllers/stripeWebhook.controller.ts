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
    const signature = req.headers["stripe-signature"];
    // stripe webhook event
    let e: Stripe.Event;

    e = stripe.webhooks.constructEvent(
        req.body,
        signature!,
        STRIPE_WEBHOOK_SECRET,
    );

    console.log("[stripe webhook]", e.type);

    try {
        await dispatchStripeWebhookEvent(e);

        res.json({ received: true });
    } catch (err) {
        next(err);
    }
}
