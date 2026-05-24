import { handleCheckoutSessionCompleted } from "@/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted";
import { handleCustomerSubscriptionDeleted } from "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionDeleted";
import { handleCustomerSubscriptionWrite } from "@/services/stripe-webhook/intent-handlers/CustomerSubscriptionWrite";
import { handleInvoiceWrite } from "@/services/stripe-webhook/intent-handlers/InvoiceWrite";
import type Stripe from "stripe";

export async function dispatchStripeWebhookEvent(
    e: Stripe.Event,
): Promise<void> {
    switch (e.type) {
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
            break;
    }
}
