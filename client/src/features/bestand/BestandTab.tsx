import { TableSelectAllCheckbox } from '@/components/ui/table-select-all-checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';
import { cn } from '@/lib/utils';
import { BestandSelectionBar } from './BestandSelectionBar';
import type { ClothingStockItem } from './bestand.api';
import { BestandAddSidebar } from './BestandAddSidebar';
import { BestandRow } from './BestandRow';
import { useClothingStock } from './useBestand';

export function BestandTab({ isLoading = false }: { isLoading?: boolean }) {
  const stock = useClothingStock();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const selected = (stock.data ?? []).filter((item) =>
    selectedIds.includes(item.id)
  );
  const changeSelection = (items: ClothingStockItem[]) =>
    setSelectedIds(items.map((item) => item.id));
  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  const items = stock.data ?? [];
  const selectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  };

  return (
    <Card
      className="flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0"
      data-testid="bestand-tab"
    >
      <CardHeader className="flex min-h-14 shrink-0 flex-row flex-wrap items-center justify-between gap-4 px-6 py-3">
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
        {stock.isError ? (
          <p className="px-8 py-6 text-sm text-destructive">
            Bestand konnte nicht geladen werden.
          </p>
        ) : null}
        {isLoading || stock.isLoading || stock.data ? (
          <ScrollableTableViewport>
            <Table
              aria-busy={isLoading || stock.isLoading}
              className={settingsTableClassName}
            >
              <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="relative h-12 bg-card py-3 pl-12 pr-2">
                    <div className="absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                      <TableSelectAllCheckbox
                        ids={items.map((item) => item.id)}
                        selectedIds={selectedIds}
                        disabled={isLoading || stock.isLoading || deleting}
                        selectLabel="Alle Artikel auswählen"
                        clearLabel="Alle Artikel abwählen"
                        onCheckedChange={selectAll}
                      />
                    </div>
                    Artikel
                  </TableHead>
                  <TableHead className="bg-card py-3 px-2">Größe</TableHead>
                  <TableHead className="bg-card py-3 px-2">
                    Anzahl bei BSB
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={cn(
                  settingsTableBodyClassName,
                  '[&_tr[data-selected=true]_td]:bg-muted/50'
                )}
              >
                {isLoading || stock.isLoading ? (
                  <TableSkeletonRows variant="stock" />
                ) : (
                  stock.data?.map((item) => (
                    <BestandRow
                      key={item.id}
                      item={item}
                      isSelected={selectedIds.includes(item.id)}
                      onToggle={toggle}
                      selectionDisabled={deleting}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollableTableViewport>
        ) : null}
        {selected.length > 0 ? (
          <BestandSelectionBar
            selected={selected}
            onChange={changeSelection}
            deleting={deleting}
            setDeleting={setDeleting}
          />
        ) : null}
        <BestandAddSidebar open={addOpen} onOpenChange={setAddOpen} />
      </CardContent>
    </Card>
  );
}
