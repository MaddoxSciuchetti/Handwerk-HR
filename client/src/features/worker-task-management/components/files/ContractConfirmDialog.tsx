import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import {
  documentPreviewModalPanel,
  documentPreviewModalSize,
} from './documentPreviewModal';

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
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className={`w-full border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,90rem)] ${documentPreviewModalSize}`}>
      <div className={documentPreviewModalPanel}>
        {isLoading ? <PdfSkeleton /> : null}
        {isError || (!isLoading && !data) ? (
          <p className="text-sm text-destructive">
            Der Vertrag konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <>
            <div className="shrink-0 pr-8">
              <h2 className="text-base font-medium">{data.name}</h2>
              <p className="text-sm text-muted-foreground">
                Der unterschriebene Vertrag ist eingegangen. Bitte bestätigen
                Sie ihn.
              </p>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <ContractDraftBody
                document={data.document}
                segments={data.segments}
                values={data.values}
                readOnly
                onValueChange={() => undefined}
              />
            </div>
            {data.signedFileUrl ? (
              <a
                href={data.signedFileUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm underline"
              >
                Unterschriebenes PDF öffnen
              </a>
            ) : null}
            <div className="flex shrink-0 justify-end">
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
      </DialogContent>
    </Dialog>
  );
}
