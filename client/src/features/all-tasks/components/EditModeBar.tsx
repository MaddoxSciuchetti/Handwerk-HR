import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';

type EditModeBarProps<T> = {
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  isPending: boolean;
  onDelete: () => void;
  onClose: () => void;
  actions?: ReactNode;
  deleteLabel?: string;
};

function EditModeBar<T>({
  selectedItems,
  isPending,
  onDelete,
  onClose,
  setSelectedItems,
  actions,
  deleteLabel = 'Ausgewählte Aufgaben löschen',
}: EditModeBarProps<T>) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
      <span className="typo-body-sm whitespace-nowrap">
        {selectedItems.length} ausgewählt
      </span>
      {actions}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={deleteLabel}
        disabled={isPending || selectedItems.length === 0}
        onClick={onDelete}
        className="rounded-full"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Schließen"
        onClick={() => {
          setSelectedItems([]);
          onClose();
        }}
        className="rounded-full"
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

export default EditModeBar;
