import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "@/constants/env";
import { handleCheckoutSessionCompleted } from "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted";
import { handleCustomerSubscriptionDeleted } from "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionDeleted";
import { handleCustomerSubscriptionWrite } from "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionWrite";
import { handleInvoiceWrite } from "@/services/stripe-webhook/intent-handlers/InvoiceWrite";
import type { NextFunction, Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function stripeWebhookHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
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

    try {
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
                await handleCheckoutSessionCompleted(
                    event.data.object as Stripe.Checkout.Session,
                );
                break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated": {
                await handleCustomerSubscriptionWrite(event.data.object);
                break;
            }
            case "customer.subscription.deleted": {
                await handleCustomerSubscriptionDeleted(event.data.object);
                break;
            }
            case "invoice.created":
            case "invoice.finalized":
            case "invoice.updated":
            case "invoice.paid":
            case "invoice.voided":
            case "invoice.marked_uncollectible": {
                await handleInvoiceWrite(
                    event.data.object as Stripe.Invoice,
                );
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        next(err);
    }
}
