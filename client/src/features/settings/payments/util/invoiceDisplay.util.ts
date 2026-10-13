import type { BillingInvoiceStatus } from '../billing.types';

const STATUS_LABEL: Record<BillingInvoiceStatus, string> = {
  draft: 'Entwurf',
  open: 'Offen',
  paid: 'Bezahlt',
  void: 'Storniert',
  uncollectible: 'Uneinbringlich',
};

export function invoiceStatusLabel(status: BillingInvoiceStatus): string {
  return STATUS_LABEL[status];
}

export function formatInvoiceAmount(
  amountCents: number,
  currency: string
): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

export function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
