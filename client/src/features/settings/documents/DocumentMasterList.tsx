import type { ReactNode } from 'react';
import { TableSelectAllCheckbox } from '@/components/ui/table-select-all-checkbox';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';
import { cn } from '@/lib/utils';
import { DocumentMasterRow } from './components/DocumentMasterRow';
import type { DocumentMasterListItem } from './documentMaster.types';

type DocumentMasterListProps = {
  isLoading?: boolean;
  headerAction?: ReactNode;
  masters: DocumentMasterListItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  emptyLabel: string;
};

export function DocumentMasterList({
  isLoading = false,
  headerAction,
  masters,
  selectedIds,
  onToggle,
  onSelectAll,
  emptyLabel,
}: DocumentMasterListProps) {
  return (
    <Table aria-busy={isLoading} className={settingsTableClassName}>
      <TableHeader>
        <TableRow className="border-0 hover:bg-transparent">
          <TableHead className="w-10 p-0">
            <div className="flex h-12 w-10 items-center justify-center">
              <TableSelectAllCheckbox
                ids={masters.map((master) => master.id)}
                selectedIds={selectedIds}
                disabled={isLoading}
                selectLabel="Alle Dokumente auswählen"
                clearLabel="Alle Dokumente abwählen"
                onCheckedChange={onSelectAll}
              />
            </div>
          </TableHead>
          <TableHead className="h-12 px-2 py-3">Name</TableHead>
          <TableHead className="px-2 py-3">
            <div className="flex items-center justify-between gap-4 pr-4">
              <span>Art</span>
              {headerAction}
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
        {isLoading ? (
          <TableSkeletonRows variant="documents" />
        ) : masters.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-muted-foreground">
              {emptyLabel}
            </TableCell>
          </TableRow>
        ) : (
          masters.map((master) => (
            <DocumentMasterRow
              key={master.id}
              master={master}
              isSelected={selectedIds.includes(master.id)}
              onToggle={onToggle}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
