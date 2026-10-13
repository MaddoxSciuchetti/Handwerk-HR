import { GrowingItem, Items } from '@/features/settings/components/Table';
import type { BillingInvoice } from './billing.types';
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  invoiceStatusLabel,
} from './util/invoiceDisplay.util';

type InvoiceRowProps = {
  invoice: BillingInvoice;
};

export function InvoiceRow({ invoice }: InvoiceRowProps) {
  const title = invoice.number ?? 'Rechnung';
  const link = invoice.hostedInvoiceUrl ?? invoice.invoicePdfUrl;

  return (
    <Items state="hover">
      <GrowingItem>
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">{title}</p>
          <p className="typo-caption text-muted-foreground">
            {formatInvoiceDate(invoice.createdAt)} ·{' '}
            {invoiceStatusLabel(invoice.status)}
          </p>
        </div>
      </GrowingItem>
      <p className="typo-body-sm font-medium">
        {formatInvoiceAmount(invoice.amountCents, invoice.currency)}
      </p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="typo-body-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Öffnen
        </a>
      ) : null}
    </Items>
  );
}
