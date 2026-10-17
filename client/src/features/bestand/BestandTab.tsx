import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BestandAddForm } from './BestandAddForm';
import { BestandRow } from './BestandRow';
import { useClothingStock } from './useBestand';

export function BestandTab() {
  const stock = useClothingStock();

  return (
    <Card
      className="flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0"
      data-testid="bestand-tab"
    >
      <CardHeader className="flex shrink-0 flex-row flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-4">
        <div className="grid gap-1">
          <CardTitle className="text-base font-medium">Bestand</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kleidung, die BSB bereits auf Lager hat.
          </p>
        </div>
        <BestandAddForm />
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
        {stock.isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16" role="status">
            <Spinner className="w-8" />
          </div>
        ) : null}
        {stock.isError ? (
          <p className="px-8 py-6 text-sm text-destructive">
            Bestand konnte nicht geladen werden.
          </p>
        ) : null}
        {stock.data ? (
          <ScrollableTableViewport>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-12 bg-card py-3 pl-10 pr-2">Artikel</TableHead>
                  <TableHead className="bg-card py-3 px-2">Größe</TableHead>
                  <TableHead className="bg-card py-3 px-2">Anzahl bei BSB</TableHead>
                  <TableHead className="bg-card py-3 pr-6 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2">
                {stock.data.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="px-8 py-8 text-sm text-muted-foreground"
                    >
                      Noch kein Bestand erfasst.
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.data.map((item) => <BestandRow key={item.id} item={item} />)
                )}
              </TableBody>
            </Table>
          </ScrollableTableViewport>
        ) : null}
      </CardContent>
    </Card>
  );
}
