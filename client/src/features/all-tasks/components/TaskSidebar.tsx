import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import TaskAutomation from '@/features/all-tasks/components/TaskAutomation';
import { ARBEITSZEUGNIS } from '@/features/all-tasks/consts/task-automation.consts';
import { EngagementTaskDeleteButton } from '@/features/all-tasks/components/EngagementTaskDeleteButton';
import { TaskChat } from '@/features/all-tasks/components/TaskChat';
import { TaskStatusSelect } from '@/features/all-tasks/components/ui/TaskStatusSelect';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import TaskHistory from '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useFetchEngagements } from '../hooks/useFetchEngagements';
import { useTasks } from '../hooks/useTasks';
import type { TaskEditState } from '../hooks/useTaskSidebar';

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  taskState: 'create' | 'edit';
  taskEditState: TaskEditState;
  onOpenArbeitszeugnis?: (taskId: string) => void;
};

export function TaskSidebar({
  isOpen,
  setIsOpen,
  taskState,
  taskEditState,
  onOpenArbeitszeugnis,
}: TaskSidebarProps) {
  const { register, control, errors, onSubmit, isTaskSaving } = useTasks(
    taskEditState,
    taskState,
    setIsOpen
  );

  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());
  const { data: engagements = [] } = useFetchEngagements();
  const { user } = useAuth();

  const isSubmitting = isTaskSaving;

  const ownerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}`,
      })),
    [employees]
  );

  const engagementOptions = useMemo(
    () =>
      engagements.map((e) => ({
        value: e.id,
        label: `${e.workerFirstName} ${e.workerLastName} — ${e.type}`,
      })),
    [engagements]
  );

  return (
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="text-base font-semibold">
            {taskState === 'edit' ? 'Aufgabe bearbeiten' : 'Aufgabe'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-2xl"
            aria-label="Schließen"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <SidebarContent className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
            <FieldGroup className="gap-4 pb-8">
              <div className="grid grid-cols-2 items-start gap-4">
                <FormFields
                  errors={errors}
                  register={register}
                  name="title"
                  label="Aufgabe"
                  placeholder="Titel"
                  className="h-8"
                />
                <div className="flex min-w-0 flex-col gap-2">
                  <FormSelectOptions
                    name="workerEngagementId"
                    control={control}
                    data={engagementOptions}
                    placeholder="Handwerker"
                    errors={errors}
                    label="Handwerker"
                    triggerClassName="min-w-0 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <FormSelectOptions
                    name="assigneeUserId"
                    control={control}
                    data={ownerOptions}
                    placeholder="Zuständig"
                    errors={errors}
                    label="Zuständigkeit"
                    triggerClassName="min-w-0 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <TaskStatusSelect control={control} errors={errors} />
                </div>
              </div>
              {taskState === 'edit' &&
              taskEditState.taskId &&
              taskEditState.sequence &&
              taskEditState.integrationProvider ? (
                <TaskAutomation
                  taskId={taskEditState.taskId}
                  provider={taskEditState.integrationProvider}
                  sequence={taskEditState.sequence}
                  disabled={isSubmitting}
                />
              ) : null}
              {taskState === 'edit' &&
              taskEditState.automation === ARBEITSZEUGNIS &&
              onOpenArbeitszeugnis ? (
                <Button
                  type="button"
                  className="rounded-2xl"
                  onClick={() => onOpenArbeitszeugnis(taskEditState.taskId)}
                >
                  Arbeitszeugnis
                </Button>
              ) : null}

              {taskState === 'edit' && taskEditState.taskId ? (
                <>
                  <TaskChat
                    taskId={taskEditState.taskId}
                    coworkers={employees.map((employee) => ({
                      id: employee.id,
                      firstName: employee.firstName,
                      lastName: employee.lastName,
                    }))}
                    currentUserId={user?.id}
                    disabled={isSubmitting}
                  />
                  <TaskHistory
                    taskId={taskEditState.taskId}
                    currentUserId={user?.id}
                    hideComments
                  />
                </>
              ) : null}
            </FieldGroup>
          </SidebarContent>
          <SidebarFooter
            className={cn(
              'shrink-0 border-0 p-6',
              taskState === 'edit' && 'w-full justify-between'
            )}
          >
            {taskState === 'edit' && taskEditState.taskId ? (
              <EngagementTaskDeleteButton
                taskId={taskEditState.taskId}
                disabled={isSubmitting}
                onDeleted={() => setIsOpen(false)}
              />
            ) : null}
            <Button
              type="submit"
              className="rounded-2xl"
              disabled={isSubmitting}
            >
              {taskState === 'edit' ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}
