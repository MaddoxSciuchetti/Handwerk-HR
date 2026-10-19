import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import {
  INTEGRATION_NONE,
  INTEGRATION_SEQUENCES,
} from '@/features/settings/integrations/integration.consts';
import { getIntegrations } from '@/features/settings/integrations/integrations.api';
import { useMailTemplates } from '@/features/settings/mail-template/useMailTemplates';
import { TaskStatusSelect } from '@/features/all-tasks/components/ui/TaskStatusSelect';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { EMPTY_TEMPLATE_TASK } from '@/features/template-tasks/schemas/templateTaskForm.schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useWatch } from 'react-hook-form';
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
  const { data: integrations = [] } = useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: getIntegrations,
  });
  const integrationProvider = useWatch({ control, name: 'integrationProvider' });
  const sequence = useWatch({ control, name: 'sequence' });
  const { data: mailTemplates = [] } = useMailTemplates();
  const integrationOptions = [
    { value: INTEGRATION_NONE, label: 'Keine' },
    ...integrations
      .filter((integration) => integration.enabled)
      .map((integration) => ({
        value: integration.provider,
        label:
          integration.provider === 'microsoft_graph' ? 'Microsoft' : 'Crewmeister',
      })),
  ];
  const sequenceOptions = [
    { value: INTEGRATION_NONE, label: 'Keine' },
    ...INTEGRATION_SEQUENCES.filter(
      (sequence) => sequence.provider === integrationProvider
    ).map((sequence) => ({
      value: sequence.value,
      label: sequence.label,
    })),
  ];

  const assigneeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })),
    [employees]
  );

  return (
    <SidebarAside className="p-2" isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">
            {templateTaskState === 'create'
              ? 'Aufgabe erstellen'
              : 'Aufgabe bearbeiten'}
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
          <SidebarContent className="mt-2 flex flex-col gap-4 p-6">
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
            <FormSelectOptions
              errors={errors}
              control={control}
              data={integrationOptions}
              name="integrationProvider"
              label="Integration"
              labelClassName="typo-body-base"
              placeholder="Integration wählen"
            />
            <FormSelectOptions
              errors={errors}
              control={control}
              data={sequenceOptions}
              name="sequence"
              label="Sequenz"
              labelClassName="typo-body-base"
              placeholder="Sequenz wählen"
            />
            {sequence === 'microsoft_send_email' ? (
              <FormSelectOptions
                errors={errors}
                control={control}
                data={mailTemplates.map((template) => ({
                  value: template.id,
                  label: template.name,
                }))}
                name="mailTemplateId"
                label="E-Mail-Vorlage"
                labelClassName="typo-body-base"
                placeholder="Vorlage wählen"
              />
            ) : null}
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
