import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { TaskStatusSelect } from '@/features/all-tasks/components/ui/TaskStatusSelect';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { EMPTY_TEMPLATE_TASK } from '@/features/template-tasks/schemas/templateTaskForm.schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useMemo } from 'react';
import { useSubmitTasks } from '../../hooks/useSubmitTasks';
import { TemplateTaskFormValues } from '../../types/index.types';
import { SidebarAside } from './task-sidebar/SidebarAside';
import SidebarContent from './task-sidebar/SidebarContent';
import SidebarFooter from './task-sidebar/SidebarFooter';
import SidebarHeader from './task-sidebar/SidebarHeader';
import { SidebarPanel } from './task-sidebar/SidebarPanel';

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  templateId: string;
  templateTaskState: 'create' | 'edit';
  editTemplateTask: TemplateTaskFormValues;
};
export function TaskSidebar({
  isOpen,
  setIsOpen,
  templateId,
  templateTaskState,
  editTemplateTask,
}: TaskSidebarProps) {
  const { register, errors, onSubmit, control } = useSubmitTasks(
    editTemplateTask.taskId,
    templateId,
    templateTaskState,
    editTemplateTask
  );
  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());

  const assigneeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })),
    [employees]
  );

  return (
    <SidebarAside isOpen={isOpen}>
      <SidebarPanel>
        <SidebarHeader>
          <Label>
            {templateTaskState === 'create'
              ? 'Erstelle deine Aufgabe'
              : 'Bearbeite deine Aufgabe'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Schließen"
            className="rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form onSubmit={onSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
          <SidebarContent className="mt-5 p-6 flex flex-col gap-2">
            <FormFields
              errors={errors}
              register={register}
              name="taskName"
              label="Name der Aufgabe"
              labelClassName="typo-body-base"
            />
            <FormFields
              errors={errors}
              register={register}
              name="taskDescription"
              label="Beschreibung der Aufgabe"
              labelClassName="typo-body-base"
            />
            <TaskStatusSelect
              control={control}
              errors={errors}
              name="defaultStatus"
              label="Status"
            />
            <FormSelectOptions
              errors={errors}
              control={control}
              data={assigneeOptions}
              name="defaultAssigneeUserId"
              label="Verantwortlich"
              labelClassName="typo-body-base"
              placeholder="Verantwortlichen wählen"
            />
          </SidebarContent>
          <SidebarFooter className="p-6">
            <Button type="submit" className="rounded-full">
              <Check className="h-4 w-4" aria-hidden /> Speichern
            </Button>
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}

export { EMPTY_TEMPLATE_TASK };
