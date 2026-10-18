import { TableSkeletonRows } from '@/components/ui/table-skeleton';
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
import { cn } from '@/lib/utils';
import { DocumentMasterRow } from './components/DocumentMasterRow';
import type { DocumentMasterListItem } from './documentMaster.types';

type DocumentMasterListProps = {
  isLoading?: boolean;
  masters: DocumentMasterListItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyLabel: string;
};

export function DocumentMasterList({
  isLoading = false,
  masters,
  selectedIds,
  onToggle,
  emptyLabel,
}: DocumentMasterListProps) {
  if (!isLoading && masters.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <Table aria-busy={isLoading} className={settingsTableClassName}>
      <TableHeader>
        <TableRow className="border-0 hover:bg-transparent">
          <TableHead className="w-10 p-0">
            <span className="sr-only">Auswahl</span>
          </TableHead>
          <TableHead className="h-12 px-2 py-3">Name</TableHead>
          <TableHead className="px-2 py-3">Art</TableHead>
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
