import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';
import { InvoiceRow } from './InvoiceRow';
import { useBillingInvoices } from './hooks/useBillingInvoices';

export function InvoiceList() {
  const { data, isPending, isError } = useBillingInvoices();
  const invoices = data?.invoices ?? [];

  return (
    <div className="mt-8 flex w-200 flex-col items-start gap-1">
      <h2 className="typo-body-sm font-medium">Rechnungen</h2>
      <p className="typo-caption text-muted-foreground">
        Rechnungen aus Stripe für dieses Abo.
      </p>
      <Card className="mt-3 w-full gap-0 border border-border py-0 shadow-none ring-0">
        <CardContent className="px-2 py-2">
          {isPending ? (
            <div className="flex items-center justify-center py-6">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : null}
          {isError ? (
            <p className="px-6 py-4 typo-body-sm text-destructive">
              Rechnungen konnten nicht geladen werden.
            </p>
          ) : null}
          {!isPending && !isError && invoices.length === 0 ? (
            <p className="px-6 py-4 typo-body-sm text-muted-foreground">
              Noch keine Rechnungen.
            </p>
          ) : null}
          {!isPending && !isError && invoices.length > 0 ? (
            <Table className={settingsTableClassName}>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-12 py-3 pl-10">Rechnung</TableHead>
                  <TableHead className="py-3 px-2">Betrag</TableHead>
                  <TableHead className="py-3 pr-6 text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={settingsTableBodyClassName}>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
