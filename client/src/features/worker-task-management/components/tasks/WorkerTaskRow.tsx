import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { PillBadge } from '@/features/all-tasks/components/ui/PillBadge';
import { TaskStatusPicker } from '@/features/all-tasks/components/ui/TaskStatusPicker';
import type { TaskEditState } from '@/features/all-tasks/hooks/useTaskSidebar';
import { IssueResponse } from '@/features/all-tasks/types/index.types';
import { getAssigneeLabel } from '@/features/all-tasks/utilts/assignee.utils';
import formatDateDe from '@/features/all-tasks/utilts/date.utils';
import { cn } from '@/lib/utils';
import { Headset } from 'lucide-react';

type WorkerTaskRowProps = {
  task: IssueResponse;
  workerId?: string;
  onOpenEdit: (seed: TaskEditState) => void;
};

export function WorkerTaskRow({ task, workerId, onOpenEdit }: WorkerTaskRowProps) {
  const dateSource = task.dueDate ?? task.createdAt;

  const openInEditMode = () => {
    onOpenEdit({
      taskId: task.id,
      title: task.title,
      workerEngagementId: task.workerEngagementId,
      assigneeUserId: task.assigneeUserId ?? '',
      status: task.status,
    });
  };

  return (
    <TableRow className="group relative border-0 hover:bg-transparent">
      <TableCell
        className={cn(
          'relative pl-10 pr-2 font-medium transition-colors group-hover:rounded-l-xl group-hover:bg-muted/50'
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <TaskStatusPicker
            taskId={task.id}
            status={task.status}
            workerId={workerId}
          />
          <p className="min-w-0 truncate text-sm">{task.title}</p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0 rounded-2xl"
            onClick={openInEditMode}
          >
            Bearbeiten
          </Button>
        </div>
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:rounded-r-xl group-hover:bg-muted/50'
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
