import { upsertInvoiceFromStripe } from "@/services/stripe-webhook/invoiceSync.service";
import { stripe } from "@/stripeClient";
import type Stripe from "stripe";

export async function handleInvoiceWrite(
    rawInvoice: Stripe.Invoice,
): Promise<void> {
    const invoiceId = rawInvoice.id;
    if (!invoiceId) {
        return;
    }

    const invoice = await stripe.invoices.retrieve(invoiceId);
    await upsertInvoiceFromStripe(invoice);
}
