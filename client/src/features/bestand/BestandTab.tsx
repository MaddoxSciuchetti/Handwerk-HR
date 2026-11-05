import { useDrawerStack } from '@/components/ui/drawer-stack';
import { BestandItemDetails } from './BestandItemDetails';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { TableSelectAllCheckbox } from '@/components/ui/table-select-all-checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import {
  settingsTableBodyClassName,
  settingsTableCardClassName,
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
  const drawers = useDrawerStack();
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
    <section
      className="flex min-h-0 w-full flex-1 flex-col"
      data-testid="bestand-tab"
    >
      <SettingsPageHeader title="Bestand" />
      <Card className={settingsTableCardClassName}>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0">
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
                    Beschreibung
                  </TableHead>
                  <TableHead className="bg-card py-3 px-2">Größe</TableHead>
                  <TableHead className="bg-card py-3 px-2">Typ</TableHead>
                  <TableHead className="bg-card py-3 px-2">
                    <div className="flex items-center justify-between gap-4 pr-4">
                      <span>Anzahl bei BSB</span>
                      <Button
                        type="button"
                        className="rounded-2xl"
                        data-testid="open-bestand-add"
                        onClick={() => setAddOpen(true)}
                      >
                        Hinzufügen
                      </Button>
                    </div>
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
                ) : stock.isError || items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-muted-foreground"
                    >
                      {stock.isError
                        ? 'Bestand konnte nicht geladen werden.'
                        : 'Noch keine Artikel vorhanden.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.data?.map((item) => (
                    <BestandRow
                      key={item.id}
                      item={item}
                      onOpen={
                        drawers
                          ? () =>
                              drawers.push(
                                item.name,
                                <BestandItemDetails id={item.id} />
                              )
                          : undefined
                      }
                      isSelected={selectedIds.includes(item.id)}
                      onToggle={toggle}
                      selectionDisabled={deleting}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollableTableViewport>
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
    </section>
  );
}
