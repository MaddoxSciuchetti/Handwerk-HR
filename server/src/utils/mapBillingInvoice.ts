import { mapInvoiceStatus } from "@/utils/mapInvoiceStatus";
import type { InvoiceStatus } from "@prisma/client";
import type Stripe from "stripe";

export type BillingInvoiceJson = {
    id: string;
    number: string | null;
    amountCents: number;
    currency: string;
    status: InvoiceStatus;
    invoicePdfUrl: string | null;
    hostedInvoiceUrl: string | null;
    paidAt: string | null;
    dueDate: string | null;
    createdAt: string;
};

function unixToIso(seconds: number | null | undefined): string | null {
    if (seconds == null) {
        return null;
    }
    return new Date(seconds * 1000).toISOString();
}

export function mapStripeInvoiceToBillingJson(
    invoice: Stripe.Invoice,
): BillingInvoiceJson | null {
    if (!invoice.id) {
        return null;
    }

    const paidTs = invoice.status_transitions?.paid_at ?? null;
    const paidAt =
        invoice.status === "paid" && paidTs != null
            ? new Date(paidTs * 1000).toISOString()
            : null;

    return {
        id: invoice.id,
        number: invoice.number,
        amountCents: invoice.total ?? 0,
        currency: invoice.currency.toUpperCase(),
        status: mapInvoiceStatus(invoice.status),
        invoicePdfUrl: invoice.invoice_pdf ?? null,
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        paidAt,
        dueDate: unixToIso(invoice.due_date),
        createdAt: new Date(invoice.created * 1000).toISOString(),
    };
}
