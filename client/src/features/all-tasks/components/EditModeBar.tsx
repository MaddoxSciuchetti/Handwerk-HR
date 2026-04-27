import { Trash2, X } from 'lucide-react';

type EditModeBarProps<T> = {
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  isPending: boolean;
  onDelete: () => void;
  onClose: () => void;
};

function EditModeBar<T>({
  selectedItems,
  isPending,
  onDelete,
  onClose,
  setSelectedItems,
}: EditModeBarProps<T>) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
      <span className="typo-body-sm whitespace-nowrap">
        {selectedItems.length} ausgewählt
      </span>
      <button
        type="button"
        aria-label="Ausgewählte Aufgaben löschen"
        disabled={isPending || selectedItems.length === 0}
        onClick={onDelete}
        className="rounded-full p-1 hover:bg-muted disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Schließen"
        onClick={() => {
          setSelectedItems([]);
          onClose();
        }}
        className="rounded-full p-1 hover:bg-muted"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export default EditModeBar;
