import '@/App.css';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DropdownActionTrigger from '@/components/DropdownActionTrigger';
import useFetchProcessData from '@/features/employee-overview/hooks/useFetchProcessData';
import { useState } from 'react';
import useWorkerMutations from '../hooks/useWorkerMutaitons';
import { FormType, WorkerListMode } from '../types/index.types';
import WorkerInfoModal from './WorkerInfoModal';
import WorkerItemInfo from './WorkerItemInfo';

interface ToDoItem {
  item_value: number;
  form_type: FormType;
  gotopage: (taskId: number, form_type: FormType, workerName: string) => void;
  mode: WorkerListMode;
  className?: string;
  nachname?: string;
  vorname: string;
}

export function Worker_Item({
  vorname,
  nachname,
  form_type,
  item_value,
  gotopage,
  mode,
}: ToDoItem) {
  const {
    isLoading: processLoading,
    completedTasksCount,
    totalTasks,
  } = useFetchProcessData(item_value, form_type);

  const { archiveWorkerMutation, deleteTaskMutation, unarchiveWorkerMutation } =
    useWorkerMutations();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const calculatePercent = (completedTasks: number, total: number) => {
    if (total <= 0) return 'text-(--lifecycle-progress-zero-text)';

    const percent = (completedTasks / total) * 100;

    if (percent < 20) return 'text-(--lifecycle-progress-zero-text)';
    if (percent >= 20 && percent < 100) return 'text-(--chart-3)';
    if (percent === 100) return 'text-(--chart-2)';

    return 'text-(--lifecycle-progress-zero-text)';
  };

  const completedCount = completedTasksCount ?? 0;
  const totalCount = totalTasks ?? 0;
  const color = calculatePercent(completedCount, totalCount);

  return (
    <tr className="group rounded-2xl py-5 transition-colors  ">
      <td className="text-sm font-semibold">
        <WorkerItemInfo
          setIsInfoModalOpen={setIsInfoModalOpen}
          gotopage={gotopage}
          item_value={item_value}
          form_type={form_type}
          vorname={vorname}
          nachname={nachname}
        />
      </td>
      <td
        className={
          form_type === 'Onboarding'
            ? 'text-sm underline text-(--lifecycle-onboarding-text) justify-center items-center py-5'
            : 'text-sm underline text-(--lifecycle-offboarding-text) justify-center items-center py-5'
        }
        lang="en"
      >
        {form_type}
      </td>

      <th className="">
        <span className={color}>{processLoading ? '...' : completedCount}</span>
        <span className="font-medium text-foreground">/{totalCount}</span>
      </th>

      <td>
        <DropdownActionTrigger
          description="Aktionen"
          disabled={false}
          triggerIcon="edit"
          actions={[
            {
              label: mode === 'active' ? 'Archivieren' : 'Wiederherstellen',
              action: () =>
                mode === 'active'
                  ? archiveWorkerMutation(item_value)
                  : unarchiveWorkerMutation(item_value),
              variant: 'default',
            },
            {
              label: 'Löschen',
              action: () => setIsDeleteModalOpen(true),
              variant: 'destructive',
            },
          ]}
        />
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deleteTaskMutation(item_value);
            setIsDeleteModalOpen(false);
          }}
        />
        <WorkerInfoModal
          isOpen={isInfoModalOpen}
          workerId={item_value}
          lifecycleType={form_type}
          onClose={() => setIsInfoModalOpen(false)}
        />
      </td>
    </tr>
  );
}
