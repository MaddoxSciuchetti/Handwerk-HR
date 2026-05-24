import { InvoiceStatus } from "@prisma/client";
import type Stripe from "stripe";

export function mapInvoiceStatus(
    status: Stripe.Invoice.Status | null | undefined,
): InvoiceStatus {
    if (!status) {
        return "draft";
    }
    switch (status) {
        case "draft":
            return "draft";
        case "open":
            return "open";
        case "paid":
            return "paid";
        case "void":
            return "void";
        case "uncollectible":
            return "uncollectible";
        default:
            return "open";
    }
}
