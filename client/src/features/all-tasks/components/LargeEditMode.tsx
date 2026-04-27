import type { Dispatch, SetStateAction } from 'react';
import { useDeleteTasks } from '../hooks/useDeleteTasks';
import EditModeBar from './EditModeBar';

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
    <EditModeBar
      selectedItems={editModeData}
      setSelectedItems={setEditModeData}
      isPending={isPending}
      onDelete={handleDelete}
      onClose={() => setLargeEditMode(false)}
    />
  );
}
