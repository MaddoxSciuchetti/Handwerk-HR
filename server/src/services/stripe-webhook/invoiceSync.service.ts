import { prisma } from "@/lib/prisma";
import { extractStripeSubscriptionId } from "@/utils/extractStripeSubid";
import { mapInvoiceStatus } from "@/utils/mapInvoiceStatus";
import type Stripe from "stripe";

export async function upsertInvoiceFromStripe(
    invoice: Stripe.Invoice,
): Promise<void> {
    if (!invoice.id) {
        return;
    }

    const stripeSubscriptionId = extractStripeSubscriptionId(invoice);
    if (!stripeSubscriptionId) {
        return;
    }

    const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId },
        select: { id: true },
    });
    if (!subscription) {
        console.warn(
            "[stripe webhook] invoice sync: unknown subscription",
            stripeSubscriptionId,
            invoice.id,
        );
        return;
    }

    const paidTs = invoice.status_transitions?.paid_at ?? null;
    const paidAt =
        invoice.status === "paid" && paidTs != null
            ? new Date(paidTs * 1000)
            : null;

    const dueTs = invoice.due_date;
    const dueDate = dueTs != null ? new Date(dueTs * 1000) : null;

    const createPayload = {
        subscriptionId: subscription.id,
        providerInvoiceId: invoice.id,
        amountCents: invoice.total ?? 0,
        currency: invoice.currency.toUpperCase(),
        status: mapInvoiceStatus(invoice.status),
        invoicePdfUrl:
            invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
        paidAt,
        dueDate,
    };

    const updatePayload = {
        subscriptionId: createPayload.subscriptionId,
        amountCents: createPayload.amountCents,
        currency: createPayload.currency,
        status: createPayload.status,
        invoicePdfUrl: createPayload.invoicePdfUrl,
        paidAt: createPayload.paidAt,
        dueDate: createPayload.dueDate,
    };

    await prisma.invoice.upsert({
        where: { providerInvoiceId: invoice.id },
        create: createPayload,
        update: updatePayload,
    });
}
