import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';
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
        <Card className="mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex shrink-0 flex-row items-center justify-end px-6 py-3">
            <Button
              className="rounded-2xl"
              onClick={() => {
                setEditTemplateTask(EMPTY_TEMPLATE_TASK);
                setCreateOpenNonce((n) => n + 1);
                setIsOpen(true);
                setTemplateTaskState('create');
              }}
            >
              Hinzufügen
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
            <ScrollableTableViewport>
              <Table aria-busy={isLoading} className={settingsTableClassName}>
                <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b-0">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="h-12 bg-card py-3 pl-10">
                      Aufgabe
                    </TableHead>
                    <TableHead className="bg-card py-3 px-2">
                      Beschreibung
                    </TableHead>
                    <TableHead className="bg-card py-3 pr-6 text-right">
                      Aktionen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={settingsTableBodyClassName}>
                  {isLoading ? (
                    <TableSkeletonRows variant="templates" />
                  ) : (
                    <TemplateTaskItem
                      templateTasks={templateTasks ?? []}
                      setIsOpen={setIsOpen}
                      setEditTemplateTask={setEditTemplateTask}
                      setTemplateTaskState={setTemplateTaskState}
                    />
                  )}
                </TableBody>
              </Table>
            </ScrollableTableViewport>
          </CardContent>
        </Card>
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
