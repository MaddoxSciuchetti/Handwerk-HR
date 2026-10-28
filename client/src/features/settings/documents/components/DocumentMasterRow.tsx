import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { useNavigate } from '@tanstack/react-router';
import type { MouseEvent } from 'react';
import { documentKindLabel } from '../documentMaster.types';
import type { DocumentMasterListItem } from '../documentMaster.types';
import { MainContractPill } from './MainContractPill';

type DocumentMasterRowProps = {
  master: DocumentMasterListItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
};

export function DocumentMasterRow({
  master,
  isSelected,
  onToggle,
}: DocumentMasterRowProps) {
  const navigate = useNavigate();

  const toggle = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onToggle(master.id);
  };

  return (
    <TableRow
      data-selected={isSelected ? 'true' : undefined}
      className="group cursor-pointer border-0 hover:bg-transparent"
      onClick={() =>
        navigate({
          to: '/settings/documents/$id',
          params: { id: master.id },
        })
      }
    >
      <TableCell className="w-10 !p-0" onClick={toggle}>
        <div className="flex h-full min-h-12 w-10 items-center justify-center">
          <Checkbox
            checked={isSelected}
            aria-label={
              isSelected
                ? `${master.name} aus der Auswahl entfernen`
                : `${master.name} auswählen`
            }
            onClick={toggle}
            className="relative cursor-pointer after:absolute after:-inset-3 after:content-['']"
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2">
          <p className="typo-body-sm min-w-0 truncate text-text-primary">
            {master.name}
          </p>
          {master.isPrimary ? <MainContractPill /> : null}
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <span className="typo-body-xs inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
          {documentKindLabel(master.kind)}
        </span>
      </TableCell>
    </TableRow>
  );
}
