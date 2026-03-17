import '@/App.css';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DropdownActionTrigger from '@/components/DropdownActionTrigger';
import { Button } from '@/components/ui/button';
import useFetchProcessData from '@/features/employee-overview/hooks/useFetchProcessData';
import { UseMutateFunction } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useState } from 'react';
import {
  DeleteUser,
  FormType,
  ItemUser,
  WorkerListMode,
} from '../types/index.types';
import WorkerInfoModal from './WorkerInfoModal';

interface ToDoItem {
  item_value: number;
  item: string;
  form_type: FormType;
  gotopage: (taskId: number, form_type: FormType, workerName: string) => void;
  onRemove: UseMutateFunction<DeleteUser, Error, number, unknown>;
  onArchive: UseMutateFunction<ItemUser, Error, number, unknown>;
  onUnarchive: UseMutateFunction<ItemUser, Error, number, unknown>;
  mode: WorkerListMode;
  className?: string;
  item1?: string;
}

export function Worker_Item({
  form_type,
  item_value,
  item,
  gotopage,
  onRemove,
  onArchive,
  onUnarchive,
  mode,
  item1,
}: ToDoItem) {
  const {
    isLoading: processLoading,
    completedTasksCount,
    totalTasks,
  } = useFetchProcessData(item_value, form_type);

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
        <div className="flex items-center gap-3">
          <span>
            {item} {item1}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Handwerker Informationen"
            className="cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setIsInfoModalOpen(true);
            }}
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size={'sm'}
            variant="outline"
            className="cursor-pointer pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
            onClick={() =>
              gotopage(item_value, form_type, `${item} ${item1 ?? ''}`.trim())
            }
          >
            Anschauen
          </Button>
        </div>
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
                  ? onArchive(item_value)
                  : onUnarchive(item_value),
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
            onRemove(item_value);
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
