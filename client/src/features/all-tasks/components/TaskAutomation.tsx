import { Button } from '@/components/ui/button';
import { MicrosoftSimulationNotice } from '@/features/settings/integrations/MicrosoftSimulationNotice';
import { Spinner } from '@/components/ui/spinner';
import {
  integrationLabel,
  isMailSequence,
  sequenceLabel,
} from '@/features/settings/integrations/integration.consts';
import { MailSendDialog } from './MailSendDialog';
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
};

function TaskAutomation({
  taskId,
  provider,
  sequence,
  disabled,
}: TaskAutomationProps) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const integrations = useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: getIntegrations,
  });
  const integration = integrations.data?.find(
    (item) => item.provider === provider
  );
  const credentialsReady = Boolean(
    integration?.simulated || integration?.ready
  );
  const blockedReason = !integration?.enabled
    ? 'Die Integration ist deaktiviert.'
    : !credentialsReady
      ? 'Die Zugangsdaten sind unvollständig.'
      : integration.live || integration.simulated
        ? ''
        : 'Sequenzen werden in dieser Umgebung nicht ausgeführt.';

  const onGo = async (senderAddress?: string) => {
    if (disabled || isRunning || blockedReason) return;
    setIsRunning(true);
    const [, error] = await tryCatch(runIssueSequence(taskId, senderAddress));
    setIsRunning(false);
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
    setMailOpen(false);
    void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
    void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
    toast.success(
      integration?.simulated
        ? 'Die Sequenz wurde simuliert. Die Testaufgabe ist erledigt.'
        : 'Die Sequenz wurde ausgeführt. Die Aufgabe ist erledigt.'
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {integrationLabel(provider)} · {sequenceLabel(sequence)}
      </p>
      {integration?.simulated && <MicrosoftSimulationNotice />}
      {blockedReason ? (
        <p className="text-sm text-muted-foreground">{blockedReason}</p>
      ) : null}
      <Button
        type="button"
        className="rounded-2xl"
        disabled={disabled || isRunning || Boolean(blockedReason)}
        aria-busy={isRunning}
        onClick={() => {
          if (isMailSequence(sequence)) {
            setMailOpen(true);
            return;
          }
          void onGo();
        }}
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
      {isMailSequence(sequence) ? (
        <MailSendDialog
          taskId={taskId}
          open={mailOpen}
          pending={isRunning}
          onOpenChange={setMailOpen}
          onConfirm={(senderAddress) => void onGo(senderAddress)}
        />
      ) : null}
    </div>
  );
}

export default TaskAutomation;
