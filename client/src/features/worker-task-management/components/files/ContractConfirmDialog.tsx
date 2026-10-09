import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { confirmReturnedEmploymentContract } from '../../api/employmentContract.api';
import { WORKERBYID } from '../../consts/query-key.consts';
import {
  employmentContractKey,
  useEmploymentContract,
} from '../../hooks/useEmploymentContract';
import { ContractDraftBody } from './ContractDraftBody';

type ContractConfirmDialogProps = {
  workerId: string;
  engagementId: string;
  issueId: string;
  onClose: () => void;
};

export function ContractConfirmDialog({
  workerId,
  engagementId,
  issueId,
  onClose,
}: ContractConfirmDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useEmploymentContract(
    workerId,
    engagementId
  );

  const confirm = useMutation({
    mutationFn: () =>
      confirmReturnedEmploymentContract(workerId, engagementId, issueId),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        employmentContractKey(workerId, engagementId),
        saved
      );
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] });
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      toast.success('Vertrag bestätigt');
      onClose();
    },
    onError: () => toast.error('Vertrag konnte nicht bestätigt werden'),
  });

  return (
    <ModalOverlay handleToggle={onClose} size="max-w-3xl">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
        {isLoading ? <LoadingAlert className="min-h-40" /> : null}
        {isError || (!isLoading && !data) ? (
          <p className="text-sm text-destructive">
            Der Vertrag konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <>
            <div className="pr-8">
              <h2 className="text-base font-medium">{data.name}</h2>
              <p className="text-sm text-muted-foreground">
                Der unterschriebene Vertrag ist eingegangen. Bitte bestätigen
                Sie ihn.
              </p>
            </div>
            <ContractDraftBody
              segments={data.segments}
              values={data.values}
              readOnly
              onValueChange={() => undefined}
            />
            {data.signedFileUrl ? (
              <a
                href={data.signedFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Unterschriebenes PDF öffnen
              </a>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                className="rounded-2xl"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate()}
              >
                {confirm.isPending ? 'Bestätigt…' : 'Vertrag bestätigen'}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </ModalOverlay>
  );
}
