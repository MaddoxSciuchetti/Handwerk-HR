import { Button } from '@/components/ui/button';
import { Cell, GrowingItem, Items } from '@/features/settings/components/Table';

import {
  TemplateTaskFormValues,
  TemplateTaskResponse,
} from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/utils';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useDeleteTemplateTask } from '../hooks/useDeleteTemplateTask';
export type TemplateTaskItemProps = {
  templateTasks: TemplateTaskResponse[];
  setIsOpen: (isOpen: boolean) => void;
  setEditTemplateTask: (task: TemplateTaskFormValues) => void;
  setTemplateTaskState: (state: 'create' | 'edit') => void;
};

export function TemplateTaskItem({
  templateTasks,
  setIsOpen,
  setEditTemplateTask,
  setTemplateTaskState,
}: TemplateTaskItemProps) {
  const { deleteTemplateTask } = useDeleteTemplateTask();
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {templateTasks.map((task) => (
        <Items
          key={task.id}
          state="hover"
          className={cn(
            'group w-full min-w-0 cursor-pointer items-center justify-between gap-6'
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
              'opacity-0 group-hover:opacity-100 w-auto flex gap-2 min-w-0 max-w-[min(100%,14rem)] shrink-0',
              'text-right typo-body-sm font-normal text-text-primary'
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Aufgabe bearbeiten"
              onClick={() => {
                setIsOpen(true);
                setEditTemplateTask({
                  taskId: task.id,
                  taskName: task.taskName,
                  taskDescription: task.taskDescription,
                  defaultStatus: task.defaultStatus,
                  defaultAssigneeUserId: task.defaultAssigneeUserId ?? '',
                  orderIndex: task.orderIndex,
                });
                setTemplateTaskState('edit');
              }}
            >
              <PencilIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Aufgabe löschen"
              onClick={() => {
                deleteTemplateTask(task.id);
              }}
            >
              <TrashIcon className="size-4" />
            </Button>
          </Cell>
        </Items>
      ))}
    </div>
  );
}
