import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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
};

function TaskAutomation({
  taskId,
  provider,
  sequence,
  disabled,
}: TaskAutomationProps) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const integrations = useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: getIntegrations,
  });
  const integration = integrations.data?.find(
    (item) => item.provider === provider
  );
  const credentialsReady =
    provider === 'microsoft_graph'
      ? Boolean(
          integration?.hasClientSecret &&
            integration.tenantId &&
            integration.clientId &&
            integration.domain &&
            integration.licenseSkuId
        )
      : Boolean(integration?.hasToken);
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
    const [, error] = await tryCatch(runIssueSequence(taskId));
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

export default TaskAutomation;
