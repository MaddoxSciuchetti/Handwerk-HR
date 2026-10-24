import { TeamsSendAction } from '@/features/microsoft-teams/TeamsSendAction';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  integrationLabel,
  sequenceLabel,
} from '@/features/settings/integrations/integration.consts';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { getIntegrations } from '@/features/settings/integrations/integrations.api';
import { tryCatch } from '@/lib/trycatch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { runIssueSequence } from '../api/tasks.api';
import { FETCHDESCRIPTION } from '../consts/query.consts';

type TaskAutomationProps = {
  taskId: string;
  provider: string;
  sequence: string;
  disabled: boolean;
  completed?: boolean;
  senderAddress?: string;
  beforeRun?: () => Promise<boolean>;
};

function ExistingTaskAutomation({
  taskId,
  provider,
  sequence,
  disabled,
  senderAddress,
  beforeRun,
  onCompleted,
}: TaskAutomationProps & { onCompleted: () => void }) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const integrations = useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: getIntegrations,
  });
  const integration = integrations.data?.find(
    (item) => item.provider === provider
  );
  const credentialsReady = Boolean(integration?.ready);
  const blockedReason = !integration?.enabled
    ? 'Die Integration ist deaktiviert.'
    : !credentialsReady
      ? 'Die Zugangsdaten sind unvollständig.'
      : integration.live
        ? ''
        : 'Sequenzen werden in dieser Umgebung nicht ausgeführt.';

  const onGo = async () => {
    if (disabled || isRunning || blockedReason) return;
    setIsRunning(true);
    if (beforeRun && !(await beforeRun())) {
      setIsRunning(false);
      return;
    }
    const [, error] = await tryCatch(
      runIssueSequence(taskId, senderAddress?.trim() || undefined)
    );
    setIsRunning(false);
    void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
    void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
    if (error) {
      const message =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Sequenz konnte nicht ausgeführt werden.';
      toast.error(message);
      return;
    }
    onCompleted();
    void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
    void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
    toast.success('Die Sequenz wurde ausgeführt. Die Aufgabe ist erledigt.');
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {integrationLabel(provider)} · {sequenceLabel(sequence)}
      </p>
      {blockedReason ? (
        <p className="text-sm text-muted-foreground">{blockedReason}</p>
      ) : null}
      <Button
        type="button"
        className="rounded-2xl"
        disabled={disabled || isRunning || Boolean(blockedReason)}
        aria-busy={isRunning}
        onClick={() => void onGo()}
      >
        {isRunning ? (
          <>
            <Spinner className="size-4 text-(--automation-accent)" />
            Wird ausgeführt…
          </>
        ) : (
          'Go'
        )}
      </Button>
    </div>
  );
}

function TaskAutomation(props: TaskAutomationProps) {
  const [executedTaskId, setExecutedTaskId] = useState<string | null>(null);
  if (props.completed || executedTaskId === props.taskId) {
    const message =
      props.sequence === 'microsoft_send_email'
        ? 'Diese E-Mail wurde bereits gesendet.'
        : 'Diese Sequenz wurde bereits ausgeführt.';
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="block cursor-not-allowed rounded-2xl"
              aria-label={message}
            >
              <Button
                type="button"
                disabled
                className="w-full rounded-2xl bg-muted text-muted-foreground disabled:opacity-100"
              >
                {props.sequence === 'microsoft_send_teams_message'
                  ? 'Teams-Nachricht senden'
                  : 'Go'}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{message}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return props.sequence === 'microsoft_send_teams_message' ? (
    <TeamsSendAction
      taskId={props.taskId}
      disabled={props.disabled}
      beforeOpen={props.beforeRun}
    />
  ) : (
    <ExistingTaskAutomation
      {...props}
      onCompleted={() => setExecutedTaskId(props.taskId)}
    />
  );
}
export default TaskAutomation;
