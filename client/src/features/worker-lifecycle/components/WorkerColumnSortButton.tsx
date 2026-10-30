import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ExtraColumnSort, ExtraWorkerColumnId } from '../consts/extra-worker-columns';

export function WorkerColumnSortButton({
  column,
  sort,
  onToggle,
}: {
  column: ExtraWorkerColumnId;
  sort: ExtraColumnSort | null;
  onToggle: (column: ExtraWorkerColumnId) => void;
}) {
  const active = sort?.column === column;
  const direction = active ? sort.direction : null;
  const label =
    direction === 'asc'
      ? 'Sort ascending'
      : direction === 'desc'
        ? 'Sort descending'
        : 'Sort column';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      onClick={() => onToggle(column)}
      className="ml-1 size-6 shrink-0 text-muted-foreground"
    >
      {direction === 'desc' ? (
        <ArrowDown className="size-3.5" aria-hidden />
      ) : (
        <ArrowUp className="size-3.5" aria-hidden />
      )}
    </Button>
  );
}
