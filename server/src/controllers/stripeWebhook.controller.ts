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
    // stripe webhook event
    let e: Stripe.Event;

    e = stripe.webhooks.constructEvent(
        req.body,
        signature!,
        STRIPE_WEBHOOK_SECRET,
    );

    console.log("[stripe webhook]", e.type);

    try {
        switch (e.type) {
            case "payment_intent.succeeded": {
                e.data.object as Stripe.PaymentIntent;
                break;
            }
            case "payment_method.attached": {
                e.data.object as Stripe.PaymentMethod;
                break;
            }
            case "checkout.session.completed": {
                await handleCheckoutSessionCompleted(
                    e.data.object as Stripe.Checkout.Session,
                );
                break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated": {
                await handleCustomerSubscriptionWrite(e.data.object);
                break;
            }
            case "customer.subscription.deleted": {
                await handleCustomerSubscriptionDeleted(e.data.object);
                break;
            }
            case "invoice.created":
            case "invoice.finalized":
            case "invoice.updated":
            case "invoice.paid":
            case "invoice.voided":
            case "invoice.marked_uncollectible": {
                await handleInvoiceWrite(e.data.object as Stripe.Invoice);
                break;
            }
            default:
                console.log(`Unhandled event type ${e.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        next(err);
    }
}
