import { Cell, GrowingItem, Items } from '@/components/ui/selfmade/table/Table';
import { TaskSubmission } from '@/features/task-management/types/index.types';
import { cn } from '@/lib/trycatch';
import { PencilIcon, TrashIcon } from 'lucide-react';
export type TemplateTaskItemProps = {
  templateTasks: TaskSubmission[];
};

export function TemplateTaskItem({ templateTasks }: TemplateTaskItemProps) {
  return (
    <div className="flex w-full min-w-0 flex-col divide-y divide-border-subtle">
      {templateTasks.map((task) => (
        <Items
          key={task.taskName}
          state="hover"
          className={cn(
            'group w-full min-w-0 cursor-pointer items-center justify-between gap-6',
            'px-6 py-4'
          )}
        >
          <GrowingItem
            className={cn(
              'min-w-0 flex-1 flex-col items-start gap-1',
              'py-0 pl-0 pr-4'
            )}
          >
            <p className="typo-body-sm text-text-primary">{task.taskName}</p>
            {task.taskDescription ? (
              <p className="typo-body-xs text-text-secondary line-clamp-3">
                {task.taskDescription}
              </p>
            ) : null}
          </GrowingItem>
          <Cell
            className={cn(
              'opacity-0 group-hover:opacity-100 w-auto flex gap-5 min-w-0 max-w-[min(100%,14rem)] shrink-0',
              'text-right typo-body-sm font-normal text-text-primary'
            )}
          >
            <PencilIcon />
            <TrashIcon />
          </Cell>
        </Items>
      ))}
    </div>
  );
}
