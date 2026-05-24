import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/features/settings/components/Table';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { TaskSidebar } from '@/features/worker-task-management/components/tasks/TaskSidebar';
import { EMPTY_TEMPLATE_TASK } from '@/features/template-tasks/schemas/templateTaskForm.schema';
import { TemplateTaskFormValues } from '@/features/worker-task-management/types/index.types';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useGetTemplateTasks } from '../../hooks/useGetTemplateTask';
import { TemplateTaskItem } from '../TemplateTaskItem';

type TemplateTasksProps = {
  templateId: string;
  name: string;
};

export function TemplateTasks({ templateId, name }: TemplateTasksProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data: templateTasks, isLoading } = useGetTemplateTasks(templateId);
  const [editTemplateTask, setEditTemplateTask] =
    useState<TemplateTaskFormValues>(EMPTY_TEMPLATE_TASK);
  const [templateTaskState, setTemplateTaskState] = useState<'create' | 'edit'>(
    'create'
  );
  /** Bumps on each "Hinzufügen" so create mode remounts with a clean form. */
  const [createOpenNonce, setCreateOpenNonce] = useState(0);

  if (isLoading) {
    return <LoadingAlert />;
  }
  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center">
        <SettingsPageHeader
          action={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Zurück"
              onClick={() => navigate({ to: '/settings/templates/template' })}
            >
              <ArrowLeft className="size-5" />
            </Button>
          }
          title={name}
          description="Füge Aufgaben zu dieser Vorlage hinzu"
        />
        <Table className="min-h-0 flex-1 w-200">
          <TableHeader>
            <Button
              className="rounded-full"
              onClick={() => {
                setEditTemplateTask(EMPTY_TEMPLATE_TASK);
                setCreateOpenNonce((n) => n + 1);
                setIsOpen(true);
                setTemplateTaskState('create');
              }}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <ScrollableTableViewport>
            <TemplateTaskItem
              templateTasks={templateTasks ?? []}
              setIsOpen={setIsOpen}
              setEditTemplateTask={setEditTemplateTask}
              setTemplateTaskState={setTemplateTaskState}
            />
          </ScrollableTableViewport>
        </Table>
        <TaskSidebar
          key={
            templateTaskState === 'edit'
              ? `edit-${editTemplateTask.taskId}`
              : `create-${createOpenNonce}`
          }
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          templateId={templateId}
          templateTaskState={templateTaskState}
          editTemplateTask={editTemplateTask}
        />
      </div>
    </div>
  );
}
