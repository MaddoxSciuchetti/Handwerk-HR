import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { MailSenderSelect } from '@/features/all-tasks/components/MailSenderSelect';
import TaskAutomation from '@/features/all-tasks/components/TaskAutomation';
import { EngagementMailRecipients } from '@/features/worker-task-management/components/tasks/EngagementMailRecipients';
import {
  INTEGRATION_SEQUENCES,
  integrationLabel,
  isMailSequence,
  sequenceLabel,
} from '@/features/settings/integrations/integration.consts';
import { getIntegrations } from '@/features/settings/integrations/integrations.api';
import { useMailTemplates } from '@/features/settings/mail-template/useMailTemplates';
import { TaskChat } from '@/features/all-tasks/components/TaskChat';
import { ARBEITSZEUGNIS } from '@/features/all-tasks/consts/task-automation.consts';
import { TaskStatusSelect } from '@/features/all-tasks/components/ui/TaskStatusSelect';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import TaskHistory from '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useWatch } from 'react-hook-form';
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
  const navigate = useNavigate();
  const sequence = useWatch({ control, name: 'sequence' });
  const mailSenderAddress = useWatch({ control, name: 'mailSenderAddress' });
  const workerEngagementId = useWatch({
    control,
    name: 'workerEngagementId',
  });
  const { data: mailTemplates = [] } = useMailTemplates();
  const { data: integrations = [] } = useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: getIntegrations,
  });
  const automationOptions = [
    { value: 'none', label: 'Keine' },
    ...INTEGRATION_SEQUENCES.filter((item) =>
      integrations.some(
        (integration) =>
          integration.provider === item.provider && integration.enabled
      )
    ).map((item) => ({
      value: item.value,
      label: `${integrationLabel(item.provider)} · ${item.label}`,
    })),
  ];
  if (
    taskEditState.sequence &&
    !automationOptions.some((item) => item.value === taskEditState.sequence)
  ) {
    automationOptions.push({
      value: taskEditState.sequence,
      label: sequenceLabel(taskEditState.sequence),
    });
  }
  const selectedEngagementId = useWatch({
    control,
    name: 'workerEngagementId',
  });

  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());
  const { data: engagements = [] } = useFetchEngagements();
  const { user } = useAuth();
  const selectedEngagement = engagements.find(
    (engagement) => engagement.id === selectedEngagementId
  );

  const isSubmitting = isTaskSaving;

  const openHandwerker = () => {
    if (!selectedEngagement) return;
    const workerName =
      `${selectedEngagement.workerFirstName} ${selectedEngagement.workerLastName}`.trim();
    navigate({
      to: '/user/$Id',
      params: { Id: selectedEngagement.workerId },
      search: {
        workerName,
        prevPage: 'Aufgaben',
      },
    });
  };

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
        <SidebarHeader className="flex items-center justify-between gap-3 p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Label className="text-base font-semibold">
              {taskState === 'edit' ? 'Aufgabe bearbeiten' : 'Aufgabe'}
            </Label>
            {taskState === 'edit' && selectedEngagement ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl"
                onClick={openHandwerker}
              >
                Zum Handwerker
              </Button>
            ) : null}
          </div>
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
              <div
                className={cn(
                  'flex flex-col gap-4',
                  ((sequence && sequence !== 'none') ||
                    taskEditState.automation === ARBEITSZEUGNIS) &&
                    'rounded-2xl border border-border bg-muted/50 p-4'
                )}
              >
                <div className="flex flex-col gap-2">
                  <FormSelectOptions
                    name="sequence"
                    control={control}
                    errors={errors}
                    data={automationOptions}
                    label="Automation"
                    placeholder="Automation wählen"
                  />
                </div>
                {sequence === 'microsoft_send_email' ||
                sequence === 'microsoft_send_teams_message' ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <FormSelectOptions
                        name="mailTemplateId"
                        control={control}
                        errors={errors}
                        data={mailTemplates.map((template) => ({
                          value: template.id,
                          label: template.name,
                        }))}
                        label={
                          sequence === 'microsoft_send_teams_message'
                            ? 'Nachrichtenvorlage'
                            : 'E-Mail-Vorlage'
                        }
                        placeholder="Vorlage wählen"
                      />
                    </div>
                    {sequence === 'microsoft_send_email' && (
                      <MailSenderSelect
                        control={control}
                        errors={errors}
                        current={mailSenderAddress}
                      />
                    )}
                  </>
                ) : null}
                {isMailSequence(sequence) && workerEngagementId ? (
                  <EngagementMailRecipients engagementId={workerEngagementId} />
                ) : null}
                {taskState === 'edit' &&
                taskEditState.taskId &&
                taskEditState.sequence &&
                taskEditState.integrationProvider ? (
                  <TaskAutomation
                    taskId={taskEditState.taskId}
                    provider={taskEditState.integrationProvider}
                    sequence={taskEditState.sequence}
                    senderAddress={mailSenderAddress}
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
              </div>

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
          <SidebarFooter className="shrink-0 border-0 p-6">
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
