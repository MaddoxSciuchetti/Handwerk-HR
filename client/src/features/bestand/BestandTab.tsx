import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { BestandAddSidebar } from './BestandAddSidebar';
import { BestandRow } from './BestandRow';
import { useClothingStock } from './useBestand';

export function BestandTab() {
  const stock = useClothingStock();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card
      className="flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0"
      data-testid="bestand-tab"
    >
      <CardHeader className="flex min-h-14 shrink-0 flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
        <CardTitle className="text-base font-medium">Bestand</CardTitle>
        <Button
          type="button"
          className="rounded-2xl"
          data-testid="open-bestand-add"
          onClick={() => setAddOpen(true)}
        >
          Hinzufügen
        </Button>
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
                {stock.data.map((item) => (
                  <BestandRow key={item.id} item={item} />
                ))}
              </TableBody>
            </Table>
          </ScrollableTableViewport>
        ) : null}
        <BestandAddSidebar open={addOpen} onOpenChange={setAddOpen} />
      </CardContent>
    </Card>
  );
}
