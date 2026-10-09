import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Headset } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import {
  O365_BLOCK_SIGN_IN,
  TASK_AUTOMATION_NONE,
} from '../consts/task-automation.consts';
import type { TaskEditState } from '../hooks/useTaskSidebar';
import type { IssueResponse } from '../types/index.types';
import { getAssigneeLabel } from '../utilts/assignee.utils';
import formatDateDe from '../utilts/date.utils';
import { PillBadge } from './ui/PillBadge';
import { SquareCheckIcon, SquareDashedIcon } from './ui/SelectIcons';
import { TaskStatusPicker } from './ui/TaskStatusPicker';

type TaskItemProps = {
  task: IssueResponse;
  isSelected: boolean;
  workerId?: string;
  onOpenEdit: (seed: TaskEditState) => void;
  onOpenContractSend?: (task: IssueResponse) => void;
  onOpenContractConfirm?: (task: IssueResponse) => void;
  setLargeEditMode: Dispatch<SetStateAction<boolean>>;
  setEditModeData: Dispatch<
    SetStateAction<{ taskNumber: string; taskTitle: string }[]>
  >;
};

export function TaskItem({
  task,
  isSelected,
  workerId,
  onOpenEdit,
  onOpenContractSend,
  onOpenContractConfirm,
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
      status: task.status,
      automation:
        task.automation === O365_BLOCK_SIGN_IN
          ? O365_BLOCK_SIGN_IN
          : TASK_AUTOMATION_NONE,
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

  const temporaryEdge = task.isTemporary
    ? 'border-y-2 border-purple-500'
    : '';

  return (
    <TableRow className="group relative border-0 hover:bg-transparent">
      <TableCell
        className={cn(
          'relative pl-10 pr-2 font-medium transition-colors group-hover:rounded-l-xl group-hover:bg-muted/50',
          isSelected && 'rounded-l-xl bg-muted/50',
          temporaryEdge,
          task.isTemporary && 'rounded-l-xl border-l-2'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-pressed={isSelected}
          aria-label={isSelected ? 'Auswahl entfernen' : 'Auswählen'}
          onClick={toggleSelection}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 rounded-2xl',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <SelectionIcon className="size-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <TaskStatusPicker
            taskId={task.id}
            status={task.status}
            workerId={workerId}
          />
          <p className="min-w-0 truncate text-sm">
            {task.title}
            {task.isTemporary ? (
              <span className="sr-only">, temporäre Aufgabe</span>
            ) : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0 rounded-2xl"
            onClick={() => {
              if (task.kind === 'contract_send') {
                onOpenContractSend?.(task);
                return;
              }
              if (task.kind === 'contract_confirm') {
                onOpenContractConfirm?.(task);
                return;
              }
              openInEditMode();
            }}
          >
            Bearbeiten
          </Button>
        </div>
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:bg-muted/50',
          isSelected && 'bg-muted/50',
          temporaryEdge
        )}
      />
      <TableCell
        className={cn(
          'transition-colors group-hover:rounded-r-xl group-hover:bg-muted/50',
          isSelected && 'rounded-r-xl bg-muted/50',
          temporaryEdge,
          task.isTemporary && 'rounded-r-xl border-r-2'
        )}
      >
        <div className="flex items-center justify-end gap-2">
          <PillBadge>
            <Headset className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{getAssigneeLabel(task)}</span>
          </PillBadge>
          <PillBadge>
            <span className="leading-4">{formatDateDe(dateSource)}</span>
          </PillBadge>
        </div>
      </TableCell>
    </TableRow>
  );
}
