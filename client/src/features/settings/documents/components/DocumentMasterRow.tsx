import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  SquareCheckIcon,
  SquareDashedIcon,
} from '@/features/all-tasks/components/ui/SelectIcons';
import { cn } from '@/lib/utils';
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
  const SelectionIcon = isSelected ? SquareCheckIcon : SquareDashedIcon;

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
      <TableCell className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? `${master.name} aus der Auswahl entfernen`
              : `${master.name} auswählen`
          }
          onClick={toggle}
          className={cn(
            'absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-2xl',
            isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          )}
        >
          <SelectionIcon className="size-4" />
        </Button>
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
