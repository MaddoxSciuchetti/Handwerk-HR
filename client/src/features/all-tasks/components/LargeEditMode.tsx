import { Trash2, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useDeleteTasks } from '../hooks/useDeleteTasks';

type LargeEditModeProps = {
  editModeData: { taskNumber: string; taskTitle: string }[];
  setLargeEditMode: (value: boolean) => void;
  setEditModeData: Dispatch<
    SetStateAction<{ taskNumber: string; taskTitle: string }[]>
  >;
};

export function LargeEditMode({
  editModeData,
  setLargeEditMode,
  setEditModeData,
}: LargeEditModeProps) {
  const { mutate: deleteTasks, isPending } = useDeleteTasks();

  const handleDelete = () => {
    const ids = editModeData
      .map((item) => item.taskNumber)
      .filter((id) => id.length > 0);
    if (!ids.length) return;
    deleteTasks(ids, {
      onSuccess: () => {
        setEditModeData([]);
        setLargeEditMode(false);
      },
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
      <span className="typo-body-sm whitespace-nowrap">
        {editModeData.length} ausgewählt
      </span>
      <button
        type="button"
        aria-label="Ausgewählte Aufgaben löschen"
        disabled={isPending || editModeData.length === 0}
        onClick={handleDelete}
        className="rounded-full p-1 hover:bg-muted disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Schließen"
        onClick={() => {
          setEditModeData([]);
          setLargeEditMode(false);
        }}
        className="rounded-full p-1 hover:bg-muted"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
