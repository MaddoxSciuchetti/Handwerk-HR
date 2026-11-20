import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ExtraWorkerColumnId } from '../consts/extra-worker-columns';

export function RemoveWorkerColumn({
  columnId,
  onRemove,
}: {
  columnId: ExtraWorkerColumnId;
  onRemove: (id: ExtraWorkerColumnId) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Remove column"
      onClick={() => onRemove(columnId)}
      className="ml-0.5 size-6 shrink-0 text-muted-foreground opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
    >
      <X className="size-3.5" aria-hidden />
    </Button>
  );
}
