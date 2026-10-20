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
import { PillBadge } from './ui/PillBadge';
import { RowSelectButton } from './ui/RowSelectButton';
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
      mailTemplateId: task.mailTemplateId ?? null,
      mailSenderAddress: task.mailSenderAddress ?? null,
      microsoftAccountId: task.microsoftAccountId ?? null,
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

  return (
    <TableRow
      data-automation-task={isAutomationTask || undefined}
      data-confirmation-task={isConfirmationTask || undefined}
      className={cn(
        'group relative border-0 hover:bg-transparent has-aria-expanded:bg-transparent',
        isAutomationTask && !isContractActionTask && 'automation-task-row'
      )}
    >
      <TableCell
        className={cn(
          'w-px relative pl-10 pr-2 font-medium transition-colors group-hover:rounded-l-xl',
          'group-hover:bg-muted/50',
          isSelected && 'rounded-l-xl',
          isSelected && 'bg-muted/50'
        )}
      >
        <RowSelectButton isSelected={isSelected} onClick={toggleSelection} />
        <div className="relative z-10 flex min-w-0 items-center gap-2.5 pl-2">
          <TaskStatusPicker taskId={task.id} status={task.status} />
          {task.hasMention ? (
            <span
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
              aria-label="1 Erwähnung"
            >
              1
            </span>
          ) : null}
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
        </div>
      </TableCell>
      <TableCell
        className={cn(
          'w-px transition-colors',
          'group-hover:bg-muted/50',
          isSelected && 'bg-muted/50'
        )}
      >
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
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:rounded-r-xl',
          'group-hover:bg-muted/50',
          isSelected && 'rounded-r-xl',
          isSelected && 'bg-muted/50'
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
