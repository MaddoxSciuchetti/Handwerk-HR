import { mapStripeInvoiceToBillingJson } from "@/utils/mapBillingInvoice";
import type Stripe from "stripe";

function invoice(partial: Partial<Stripe.Invoice>): Stripe.Invoice {
    return partial as Stripe.Invoice;
}

describe("mapStripeInvoiceToBillingJson", () => {
    it("returns null when the invoice has no id", () => {
        expect(
            mapStripeInvoiceToBillingJson(
                invoice({
                    currency: "eur",
                    created: 1_700_000_000,
                }),
            ),
        ).toBeNull();
    });

    it("maps a paid Stripe invoice into the billing payload", () => {
        const mapped = mapStripeInvoiceToBillingJson(
            invoice({
                id: "in_123",
                number: "INV-001",
                total: 2900,
                currency: "eur",
                status: "paid",
                invoice_pdf: "https://files.stripe.com/inv.pdf",
                hosted_invoice_url: "https://invoice.stripe.com/i/acct",
                status_transitions: {
                    paid_at: 1_700_000_000,
                    finalized_at: null,
                    marked_uncollectible_at: null,
                    voided_at: null,
                },
                due_date: 1_700_086_400,
                created: 1_699_000_000,
            }),
        );

        expect(mapped).toEqual({
            id: "in_123",
            number: "INV-001",
            amountCents: 2900,
            currency: "EUR",
            status: "paid",
            invoicePdfUrl: "https://files.stripe.com/inv.pdf",
            hostedInvoiceUrl: "https://invoice.stripe.com/i/acct",
            paidAt: new Date(1_700_000_000 * 1000).toISOString(),
            dueDate: new Date(1_700_086_400 * 1000).toISOString(),
            createdAt: new Date(1_699_000_000 * 1000).toISOString(),
        });
    });

    it("omits paidAt unless the invoice is paid", () => {
        const mapped = mapStripeInvoiceToBillingJson(
            invoice({
                id: "in_open",
                number: null,
                total: null,
                currency: "usd",
                status: "open",
                invoice_pdf: null,
                hosted_invoice_url: null,
                status_transitions: {
                    paid_at: 1_700_000_000,
                    finalized_at: null,
                    marked_uncollectible_at: null,
                    voided_at: null,
                },
                due_date: null,
                created: 1_699_000_000,
            }),
        );

        expect(mapped?.amountCents).toBe(0);
        expect(mapped?.currency).toBe("USD");
        expect(mapped?.status).toBe("open");
        expect(mapped?.paidAt).toBeNull();
        expect(mapped?.dueDate).toBeNull();
    });
});
