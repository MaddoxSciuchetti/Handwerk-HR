import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import type { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export function stripeWebhookHandler(req: Request, res: Response): void {
    const signature = req.headers["stripe-signature"];

    if (!STRIPE_WEBHOOK_SECRET) {
        console.warn("STRIPE_WEBHOOK_SECRET is not set; refusing webhook");
        res.sendStatus(500);
        return;
    }

    let event: Stripe.Event;

    try {
        if (typeof signature !== "string") {
            res.sendStatus(400);
            return;
        }
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("Webhook signature verification failed.", message);
        res.sendStatus(400);
        return;
    }

    console.log("[stripe webhook]", event.type);

    switch (event.type) {
        case "payment_intent.succeeded": {
            event.data.object as Stripe.PaymentIntent;
            // handlePaymentIntentSucceeded(paymentIntent);
            break;
        }
        case "payment_method.attached": {
            event.data.object as Stripe.PaymentMethod;
            // handlePaymentMethodAttached(paymentMethod);
            break;
        }
        case "checkout.session.completed": {
            event.data.object as Stripe.Checkout.Session;
            // Sync org subscription + Stripe customer/subscription IDs
            break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            event.data.object as Stripe.Subscription;
            // Keep Subscription row in sync with Stripe status
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
}
