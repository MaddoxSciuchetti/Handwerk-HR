import { Button } from '@/components/ui/selfmade/button';
import {
  Cell,
  CellHolder,
  GrowingItem,
  Items,
} from '@/components/ui/selfmade/table/Table';
import { cn } from '@/lib/trycatch';
import { Headset } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { TaskEditState } from '../hooks/useTaskSidebar';
import type { IssueResponse } from '../types/index.types';
import formatDateDe from '../utilts/date.utils';
import { PriorityIndicator } from '../utilts/priority.utils';
import { PillBadge } from './ui/PillBadge';
import { SquareCheckIcon, SquareDashedIcon } from './ui/SelectIcons';

type TaskItemProps = {
  task: IssueResponse;
  isSelected: boolean;
  onOpenEdit: (seed: TaskEditState) => void;
  setLargeEditMode: Dispatch<SetStateAction<boolean>>;
  setEditModeData: Dispatch<
    SetStateAction<{ taskNumber: string; taskTitle: string }[]>
  >;
};

export function TaskItem({
  task,
  isSelected,
  onOpenEdit,
  setLargeEditMode,
  setEditModeData,
}: TaskItemProps) {
  const dateSource = task.dueDate ?? task.createdAt;

  const openInEditMode = () => {
    onOpenEdit({
      taskId: task.id,
      title: task.title,
      workerEngagementId: task.workerEngagementId,
      assigneeUserId: task.assigneeUserId ?? '',
      statusId: task.statusId,
    });
  };

  const toggleSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLargeEditMode(true);
    setEditModeData((prev) =>
      prev.some((item) => item.taskNumber === task.id)
        ? prev.filter((item) => item.taskNumber !== task.id)
        : [...prev, { taskNumber: task.id, taskTitle: task.title }]
    );
  };

  const SelectionIcon = isSelected ? SquareCheckIcon : SquareDashedIcon;

  return (
    <Items
      state="hover"
      className="relative flex items-center"
      onClick={openInEditMode}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={isSelected ? 'Auswahl entfernen' : 'Auswählen'}
        onClick={toggleSelection}
        className={cn(
          'absolute ml-2 flex h-5 w-5 items-center justify-center text-black transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <SelectionIcon className="h-5 w-5" />
      </button>
      <GrowingItem className="min-w-0 flex-1 py-0 pl-10">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <p className="typo-body-base shrink-0 whitespace-nowrap text-black">
            {`--- ${task.id.slice(0, 8)}`}
          </p>
          <PriorityIndicator priority={task.priority} />
          <p className="typo-body-base min-w-0 truncate text-black">
            {task.title}
          </p>
          <Button
            type="button"
            variant="default"
            className="ds-label-sm h-8 min-h-0 shrink-0 gap-1.5 rounded-2xl border border-[var(--border-brand)] px-3 py-0"
            onClick={(e) => {
              e.stopPropagation();
              openInEditMode();
            }}
          >
            Bearbeiten
          </Button>
        </div>
      </GrowingItem>
      <CellHolder>
        <Cell className="flex w-full max-w-none items-center justify-end gap-2 border-0">
          <PillBadge>
            <Headset className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">—</span>
          </PillBadge>
          <PillBadge>
            <span className="leading-4">{formatDateDe(dateSource)}</span>
          </PillBadge>
        </Cell>
      </CellHolder>
    </Items>
  );
}
