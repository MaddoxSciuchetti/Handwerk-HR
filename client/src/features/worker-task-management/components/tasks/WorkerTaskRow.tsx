import { Button } from '@/components/ui/selfmade/button';
import { Items } from '@/components/ui/selfmade/table/Table';
import { PillBadge } from '@/features/all-tasks/components/ui/PillBadge';
import { SquareDashedIcon } from '@/features/all-tasks/components/ui/SelectIcons';
import type { TaskEditState } from '@/features/all-tasks/hooks/useTaskSidebar';
import { IssueResponse } from '@/features/all-tasks/types/index.types';
import formatDateDe from '@/features/all-tasks/utilts/date.utils';
import { PriorityIndicator } from '@/features/all-tasks/utilts/priority.utils';
import { Headset } from 'lucide-react';

type WorkerTaskRowProps = {
  task: IssueResponse;
  onOpenEdit: (seed: TaskEditState) => void;
};

export function WorkerTaskRow({ task, onOpenEdit }: WorkerTaskRowProps) {
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

  return (
    <Items
      state="hover"
      className="relative flex min-h-12 items-center gap-0 px-4 py-2.5"
      onClick={openInEditMode}
    >
      <span className="absolute ml-2 flex h-5 w-5 items-center justify-center text-black opacity-0 transition-opacity group-hover:opacity-100">
        <SquareDashedIcon className="h-5 w-5" />
      </span>
      <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2.5 pl-10">
        <p className="typo-body-sm w-24 shrink-0 truncate whitespace-nowrap font-mono text-black">
          {`--- ${task.id.slice(0, 8)}`}
        </p>
        <span className="flex w-4 shrink-0 items-center justify-center">
          <PriorityIndicator priority={task.priority} />
        </span>
        <p className="typo-body-sm min-w-0 max-w-[min(32rem,45vw)] truncate text-black">
          {task.title}
        </p>
        <Button
          type="button"
          variant="default"
          className="ds-label-sm shrink-0 gap-1.5 border border-[var(--border-brand)] bg-card text-foreground shadow-none hover:bg-muted/60"
          onClick={(e) => {
            e.stopPropagation();
            openInEditMode();
          }}
        >
          Bearbeiten
        </Button>
      </div>
      <div className="min-w-0 flex-1" aria-hidden />
      <div className="flex shrink-0 items-center justify-end gap-2">
        <PillBadge>
          <Headset className="size-4 shrink-0" aria-hidden />
          <span className="whitespace-nowrap">—</span>
        </PillBadge>
        <PillBadge>
          <span className="leading-4">{formatDateDe(dateSource)}</span>
        </PillBadge>
      </div>
    </Items>
  );
}
