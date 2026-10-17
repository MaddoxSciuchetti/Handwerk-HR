import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Headset } from 'lucide-react';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import {
  storedTaskAutomation,
  TASK_AUTOMATION_NONE,
} from '../consts/task-automation.consts';
import type { TaskEditState } from '../hooks/useTaskSidebar';
import type { IssueResponse } from '../types/index.types';
import { getAssigneeLabel } from '../utilts/assignee.utils';
import formatDateDe from '../utilts/date.utils';
import { PriorityIndicator } from '../utilts/priority.utils';
import { ConfirmationTaskDecor } from './ConfirmationTaskDecor';
import { PillBadge } from './ui/PillBadge';
import { SquareCheckIcon, SquareDashedIcon } from './ui/SelectIcons';
import { TaskStatusPicker } from './ui/TaskStatusPicker';

type TaskItemProps = {
  task: IssueResponse;
  isSelected: boolean;
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
  onOpenEdit,
  onOpenContractSend,
  onOpenContractConfirm,
  setLargeEditMode,
  setEditModeData,
}: TaskItemProps) {
  const dateSource = task.dueDate ?? task.createdAt;
  const isAutomationTask =
    storedTaskAutomation(task.automation) !== TASK_AUTOMATION_NONE;
  const isConfirmationTask = task.kind === 'contract_confirm';
  const isContractActionTask =
    isConfirmationTask || task.kind === 'contract_send';

  const openInEditMode = () => {
    onOpenEdit({
      taskId: task.id,
      title: task.title,
      workerEngagementId: task.workerEngagementId,
      assigneeUserId: task.assigneeUserId ?? '',
      status: task.status,
      automation: storedTaskAutomation(task.automation),
      integrationProvider: task.integrationProvider ?? null,
      sequence: task.sequence ?? null,
    });
  };

  const toggleSelection = (e: MouseEvent) => {
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

  const showTemporaryEdge = task.isTemporary && !isContractActionTask;
  const temporaryEdge = showTemporaryEdge ? 'border-y-2 border-purple-500' : '';

  return (
    <TableRow
      data-automation-task={isAutomationTask || undefined}
      data-confirmation-task={isConfirmationTask || undefined}
      className={cn(
        'group relative border-0 hover:bg-transparent',
        isAutomationTask && !isContractActionTask && 'automation-task-row',
        isContractActionTask && 'confirmation-task-row'
      )}
    >
      <TableCell
        className={cn(
          'relative pl-10 pr-2 font-medium transition-colors group-hover:rounded-l-xl',
          !isContractActionTask && 'group-hover:bg-muted/50',
          isSelected && 'rounded-l-xl',
          isSelected && !isContractActionTask && 'bg-muted/50',
          temporaryEdge,
          showTemporaryEdge && 'rounded-l-xl border-l-2'
        )}
      >
        {isContractActionTask ? <ConfirmationTaskDecor /> : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-pressed={isSelected}
          aria-label={isSelected ? 'Auswahl entfernen' : 'Auswählen'}
          onClick={toggleSelection}
          className={cn(
            'absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-2xl',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <SelectionIcon className="size-4" />
        </Button>
        <div className="relative z-10 flex min-w-0 items-center gap-2.5">
          <TaskStatusPicker taskId={task.id} status={task.status} />
          <p className="min-w-0 truncate text-sm">
            {task.title}
            {task.isTemporary ? (
              <span className="sr-only">, temporäre Aufgabe</span>
            ) : null}
            {isAutomationTask ? (
              <span className="sr-only">, Automatisierungsaufgabe</span>
            ) : null}
            {isConfirmationTask ? (
              <span className="sr-only">, Bestätigungsaufgabe</span>
            ) : null}
          </p>
          {task.priority === 'urgent' ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-600">
              <PriorityIndicator priority="urgent" />
              Dringend
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0 rounded-2xl"
            onClick={() => {
              if (task.kind === 'contract_send' && task.status !== 'done') {
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
          'transition-colors',
          !isContractActionTask && 'group-hover:bg-muted/50',
          isSelected && !isContractActionTask && 'bg-muted/50',
          temporaryEdge
        )}
      />
      <TableCell
        className={cn(
          'transition-colors group-hover:rounded-r-xl',
          !isContractActionTask && 'group-hover:bg-muted/50',
          isSelected && 'rounded-r-xl',
          isSelected && !isContractActionTask && 'bg-muted/50',
          temporaryEdge,
          showTemporaryEdge && 'rounded-r-xl border-r-2'
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
