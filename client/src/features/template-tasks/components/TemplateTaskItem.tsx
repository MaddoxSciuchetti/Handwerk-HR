import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { INTEGRATION_NONE } from '@/features/settings/integrations/integration.consts';

import {
  TemplateTaskFormValues,
  TemplateTaskResponse,
} from '@/features/worker-task-management/types/index.types';
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
    <>
      {templateTasks.map((task) => (
        <TableRow key={task.id} className="group hover:bg-transparent">
          <TableCell className="whitespace-normal">
            <p className="typo-body-sm text-text-primary">{task.taskName}</p>
          </TableCell>
          <TableCell className="whitespace-normal">
            {task.taskDescription ? (
              <p className="typo-body-xs text-text-secondary line-clamp-3">
                {task.taskDescription}
              </p>
            ) : null}
          </TableCell>
          <TableCell className="pr-6 text-right">
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
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
                    integrationProvider:
                      task.integrationProvider ?? INTEGRATION_NONE,
                    sequence: task.sequence ?? INTEGRATION_NONE,
                    mailTemplateId: task.mailTemplateId ?? '',
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
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
