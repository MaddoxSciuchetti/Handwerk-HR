import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/features/settings/components/Table';
import { useState } from 'react';
import { AddDocumentMasterDialog } from './AddDocumentMasterDialog';
import { DocumentMasterList } from './DocumentMasterList';
import { useDocumentMasters } from './useDocumentMasters';

export function DocumentsPage() {
  const { data, isLoading, isError } = useDocumentMasters();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center">
        <SettingsPageHeader
          title="Dokumente"
          description="Master für Arbeitsverträge und Arbeitszeugnisse"
        />
        <Table className="min-h-0 w-200 flex-1">
          <TableHeader>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setIsOpen(true)}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <ScrollableTableViewport>
            {isError ? (
              <p className="px-3 py-6 text-sm text-destructive">
                Dokumente konnten nicht geladen werden.
              </p>
            ) : (
              <DocumentMasterList masters={data ?? []} />
            )}
          </ScrollableTableViewport>
        </Table>
      </div>
      {isOpen ? (
        <AddDocumentMasterDialog onClose={() => setIsOpen(false)} />
      ) : null}
    </div>
  );
}
