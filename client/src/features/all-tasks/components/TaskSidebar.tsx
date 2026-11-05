import { isDeactivation } from '../utils/deactivationSchedule';
import { TaskDeactivationSchedule } from './TaskDeactivationSchedule';
import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MailSenderSelect } from '@/features/all-tasks/components/MailSenderSelect';
import TaskAutomation from '@/features/all-tasks/components/TaskAutomation';
import { MicrosoftAccountIdField } from './MicrosoftAccountIdField';
import { AutomationRequirementNotice } from '@/features/settings/integrations/AutomationRequirementNotice';
import { EngagementMailRecipients } from '@/features/worker-task-management/components/tasks/EngagementMailRecipients';
import {
  INTEGRATION_SEQUENCES,
  SELECTABLE_INTEGRATION_SEQUENCES,
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
import { TaskSaveButton } from './TaskSaveButton';
import {
  useId,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useWatch } from 'react-hook-form';
import { useFetchEngagements } from '../hooks/useFetchEngagements';
import { useTasks } from '../hooks/useTasks';
import type { TaskEditState } from '../hooks/useTaskSidebar';

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  taskState: 'create' | 'edit';
  taskEditState: TaskEditState;
  onOpenContract?: () => void;
  onOpenArbeitszeugnis?: (taskId: string) => void;
  showWorkerLink?: boolean;
};

export function TaskSidebar({
  isOpen,
  setIsOpen,
  taskState,
  taskEditState,
  onOpenContract,
  onOpenArbeitszeugnis,
  showWorkerLink = true,
}: TaskSidebarProps) {
  const {
    register,
    control,
    errors,
    storedMicrosoftAccountId,
    onSubmit,
    saveForAction,
    isTaskSaving,
    autoSaveState,
    flushAutoSave,
    saveManually,
    setValue,
  } = useTasks(taskEditState, taskState, setIsOpen, {
    autoSave: isOpen && taskState === 'edit',
  });
  const closeSidebar = async () => {
    if (taskState === 'edit' && !(await flushAutoSave())) return;
    setIsOpen(false);
  };
  const navigate = useNavigate();
  const sequence = useWatch({ control, name: 'sequence' });
  const selectedAutomation = INTEGRATION_SEQUENCES.find(
    (item) => item.value === sequence
  );
  const [savedProvider] = useState(() =>
    sequence && sequence !== 'none'
      ? selectedAutomation?.provider ||
        taskEditState.integrationProvider ||
        'saved'
      : 'none'
  );
  const [provider, setProvider] = useState(savedProvider);
  const providerId = useId();
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
  const providerOptions = [
    { value: 'none', label: 'Keine' },
    ...integrations
      .filter(
        (integration) =>
          integration.enabled &&
          SELECTABLE_INTEGRATION_SEQUENCES.some(
            (item) => item.provider === integration.provider
          )
      )
      .map((integration) => ({
        value: integration.provider,
        label: integrationLabel(integration.provider),
      })),
  ];
  if (!providerOptions.some((item) => item.value === savedProvider)) {
    providerOptions.push({
      value: savedProvider,
      label:
        savedProvider === 'saved'
          ? 'Bestehende Automatisierung'
          : integrationLabel(savedProvider),
    });
  }
  const automationOptions: { value: string; label: string }[] =
    SELECTABLE_INTEGRATION_SEQUENCES.filter(
      (item) =>
        item.provider === provider &&
        integrations.some(
          (integration) =>
            integration.provider === provider && integration.enabled
        )
    ).map((item) => ({
      value: item.value,
      label: item.label,
    }));
  if (
    provider === savedProvider &&
    taskEditState.sequence &&
    taskEditState.sequence !== 'none' &&
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
    <SidebarAside
      className="p-2"
      isOpen={isOpen}
      onClose={() => void closeSidebar()}
    >
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between gap-3 p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Label className="text-base font-semibold">
              {taskState === 'edit' ? 'Aufgabe bearbeiten' : 'Aufgabe'}
            </Label>
            {showWorkerLink && taskState === 'edit' && selectedEngagement ? (
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
            onClick={() => void closeSidebar()}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form
          onSubmit={
            taskState === 'edit'
              ? (event) => {
                  event.preventDefault();
                  void saveManually();
                }
              : onSubmit
          }
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
                  (provider !== 'none' ||
                    taskEditState.automation === ARBEITSZEUGNIS) &&
                    'rounded-2xl border border-border bg-muted/50 p-4'
                )}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor={providerId}>Automatisierung</Label>
                  <Select
                    value={provider}
                    onValueChange={(value) => {
                      setProvider(value);
                      setValue('sequence', value === 'none' ? 'none' : '', {
                        shouldDirty: true,
                      });
                      setValue('mailTemplateId', '', { shouldDirty: true });
                      setValue('mailSenderAddress', '', { shouldDirty: true });
                      if (value !== 'none') {
                        setValue('title', integrationLabel(value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      id={providerId}
                      className="w-full rounded-xl"
                    >
                      <SelectValue placeholder="Automatisierung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {provider !== 'none' ? (
                    <FormSelectOptions
                      name="sequence"
                      control={control}
                      errors={errors}
                      data={automationOptions}
                      label="Typ"
                      placeholder="Typ wählen"
                      onValueChange={(value) => {
                        setValue(
                          'title',
                          `${integrationLabel(provider)}: ${sequenceLabel(value)}`,
                          { shouldDirty: true, shouldValidate: true }
                        );
                      }}
                    />
                  ) : null}
                  <AutomationRequirementNotice sequence={sequence} />
                </div>
                <MicrosoftAccountIdField
                  sequence={sequence}
                  storedMicrosoftAccountId={storedMicrosoftAccountId}
                  register={register}
                  errors={errors}
                />
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
                {taskState === 'edit' &&
                  taskEditState.taskId &&
                  isDeactivation(sequence) && (
                    <TaskDeactivationSchedule
                      key={taskEditState.taskId}
                      taskId={taskEditState.taskId}
                      beforeSave={saveForAction}
                      disabled={
                        isSubmitting ||
                        ['done', 'cancelled', 'not_applicable'].includes(
                          taskEditState.status
                        )
                      }
                    />
                  )}
                {isMailSequence(sequence) && workerEngagementId ? (
                  <EngagementMailRecipients engagementId={workerEngagementId} />
                ) : null}
                {taskState === 'edit' &&
                taskEditState.taskId &&
                sequence &&
                sequence !== 'none' &&
                (selectedAutomation?.provider ||
                  taskEditState.integrationProvider) ? (
                  <TaskAutomation
                    taskId={taskEditState.taskId}
                    provider={
                      selectedAutomation?.provider ||
                      taskEditState.integrationProvider!
                    }
                    sequence={sequence}
                    beforeRun={saveForAction}
                    senderAddress={mailSenderAddress}
                    disabled={isSubmitting}
                    completed={taskEditState.status === 'done'}
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

              {taskState === 'edit' &&
              taskEditState.taskId &&
              onOpenContract ? (
                <Button
                  type="button"
                  className="self-start rounded-2xl"
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (await flushAutoSave()) onOpenContract();
                  }}
                >
                  Arbeitsvertrag öffnen
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
          <SidebarFooter className="shrink-0 border-0 p-6">
            {taskState === 'edit' ? (
              <TaskSaveButton state={autoSaveState} onSave={saveManually} />
            ) : (
              <Button
                type="submit"
                className="rounded-2xl"
                disabled={isSubmitting}
              >
                Hinzufügen
              </Button>
            )}
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}
