import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { useState } from 'react';
import { AddDocumentMasterDialog } from './AddDocumentMasterDialog';
import { DocumentMasterList } from './DocumentMasterList';
import { DocumentSelectionBar } from './components/DocumentSelectionBar';
import {
  documentKindLabel,
  type DocumentMasterListItem,
} from './documentMaster.types';
import { useDocumentMasters } from './useDocumentMasters';

export function DocumentsPage() {
  const { data, isLoading, isError } = useDocumentMasters();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const masters = data ?? [];
  const selected = masters.filter((master) => selectedIds.includes(master.id));

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const changeSelection = (next: DocumentMasterListItem[]) => {
    setSelectedIds(next.map((master) => master.id));
  };
  const selectAll = (checked: boolean) => {
    setSelectedIds(checked ? masters.map((master) => master.id) : []);
  };

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center">
        <SettingsPageHeader title="Dokumente" />
        <Card className="mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex shrink-0 flex-row items-center justify-end px-6 py-3">
            <Button
              type="button"
              className="rounded-2xl"
              onClick={() => setIsOpen(true)}
            >
              Hinzufügen
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
            <ScrollableTableViewport>
              {isError ? (
                <p className="px-6 py-6 text-sm text-destructive">
                  Dokumente konnten nicht geladen werden.
                </p>
              ) : (
                <DocumentMasterList
                  isLoading={isLoading}
                  masters={masters}
                  selectedIds={selectedIds}
                  onToggle={toggle}
                  onSelectAll={selectAll}
                  emptyLabel="Noch keine Dokumente."
                />
              )}
            </ScrollableTableViewport>
          </CardContent>
        </Card>
      </div>
        <DocumentSelectionBar
          masters={masters}
          selected={selected}
          onChange={changeSelection}
        />
      <AddDocumentMasterDialog
        isOpen={isOpen}
        existingKinds={masters.map((master) => documentKindLabel(master.kind))}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
