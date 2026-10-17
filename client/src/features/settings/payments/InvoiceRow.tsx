import { TableCell, TableRow } from '@/components/ui/table';
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
    <TableRow className="hover:bg-transparent">
      <TableCell className="whitespace-normal">
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">{title}</p>
          <p className="typo-caption text-muted-foreground">
            {formatInvoiceDate(invoice.createdAt)} ·{' '}
            {invoiceStatusLabel(invoice.status)}
          </p>
        </div>
      </TableCell>
      <TableCell className="typo-body-sm font-medium">
        {formatInvoiceAmount(invoice.amountCents, invoice.currency)}
      </TableCell>
      <TableCell className="pr-6 text-right">
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
      </TableCell>
    </TableRow>
  );
}
