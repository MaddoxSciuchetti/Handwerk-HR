import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/features/settings/components/Table';
import { useBillingInvoices } from './hooks/useBillingInvoices';
import { InvoiceRow } from './InvoiceRow';

export function InvoiceList() {
  const { data, isPending, isError } = useBillingInvoices();
  const invoices = data?.invoices ?? [];

  return (
    <div className="mt-8 flex w-200 flex-col items-start gap-1">
      <h2 className="typo-body-sm font-medium">Rechnungen</h2>
      <p className="typo-caption text-muted-foreground">
        Rechnungen aus Stripe für dieses Abo.
      </p>
      <Table className="w-200">
        {isPending ? (
          <div className="flex items-center justify-center py-6">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : null}
        {isError ? (
          <p className="px-3 py-4 typo-body-sm text-destructive">
            Rechnungen konnten nicht geladen werden.
          </p>
        ) : null}
        {!isPending && !isError && invoices.length === 0 ? (
          <p className="px-3 py-4 typo-body-sm text-muted-foreground">
            Noch keine Rechnungen.
          </p>
        ) : null}
        {!isPending && !isError
          ? invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))
          : null}
      </Table>
    </div>
  );
}
