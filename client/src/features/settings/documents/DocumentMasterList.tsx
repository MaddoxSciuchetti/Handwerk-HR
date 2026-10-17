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
  masters: DocumentMasterListItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyLabel: string;
};

export function DocumentMasterList({
  masters,
  selectedIds,
  onToggle,
  emptyLabel,
}: DocumentMasterListProps) {
  if (masters.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <Table className={settingsTableClassName}>
      <TableHeader>
        <TableRow className="border-0 hover:bg-transparent">
          <TableHead className="h-12 py-3 pl-10">Name</TableHead>
          <TableHead className="px-2 py-3">Art</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody
        className={cn(
          settingsTableBodyClassName,
          '[&_tr[data-selected=true]_td]:bg-muted/50'
        )}
      >
        {masters.map((master) => (
          <DocumentMasterRow
            key={master.id}
            master={master}
            isSelected={selectedIds.includes(master.id)}
            onToggle={onToggle}
          />
        ))}
      </TableBody>
    </Table>
  );
}
