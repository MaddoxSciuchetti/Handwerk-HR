import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import { SettingsStatusesHeader } from '@/features/settings/org-statuses/SettingsStatusesHeader';
import { TaskSidebar } from '@/features/worker-task-management/components/tasks/TaskSidebar';
import { TemplateTaskFormValues } from '@/features/worker-task-management/types/index.types';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useGetTemplateTasks } from '../../hooks/useGetTemplateTask';
import { TemplateTaskItem } from '../TemplateTaskItem';

type TemplateTasksProps = {
  templateId: string;
  templateName: string;
};

export function TemplateTasks({
  templateId,
  templateName,
}: TemplateTasksProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data: templateTasks, isLoading } = useGetTemplateTasks(templateId);
  const [editTemplateTask, setEditTemplateTask] =
    useState<TemplateTaskFormValues>({
      taskId: '',
      taskName: '',
      taskDescription: '',
      defaultPriority: 'medium',
      orderIndex: 0,
    });
  const [templateTaskState, setTemplateTaskState] = useState<'create' | 'edit'>(
    'create'
  );
  /** Bumps on each "Hinzufügen" so create mode remounts with a clean form. */
  const [createOpenNonce, setCreateOpenNonce] = useState(0);

  if (isLoading) {
    return <LoadingAlert />;
  }
  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <SettingsStatusesHeader
          action={
            <Button
              type="button"
              hierachy="ghost"
              className="size-9 p-0"
              aria-label="Zurück"
              onClick={() => navigate({ to: '/settings/templates/template' })}
            >
              <ArrowLeft className="size-5" />
            </Button>
          }
          title={templateName}
          description="Füge Aufgaben zu dieser Vorlage hinzu"
        />
        <Table className="w-200">
          <TableHeader className="gap-3 py-2">
            <Button
              onClick={() => {
                setCreateOpenNonce((n) => n + 1);
                setIsOpen(true);
                setTemplateTaskState('create');
              }}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <TemplateTaskItem
            templateTasks={templateTasks ?? []}
            setIsOpen={setIsOpen}
            setEditTemplateTask={setEditTemplateTask}
            setTemplateTaskState={setTemplateTaskState}
          />
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
