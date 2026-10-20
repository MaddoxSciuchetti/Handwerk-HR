import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useEmploymentContract,
  useSaveEmploymentContract,
} from '../../hooks/useEmploymentContract';
import { ContractDraftBody } from './ContractDraftBody';
import { ContractQuestionnaireSync } from './ContractQuestionnaireSync';
import {
  documentPreviewModalPanel,
  documentPreviewModalSize,
} from './documentPreviewModal';

const STATUS_LABEL = {
  draft: 'Entwurf',
  ready: 'Zum Versand',
  signed: 'Unterschrieben',
} as const;

const FROZEN_NOTE = 'Änderungen am Mustertext werden nicht mehr übernommen.';

type ContractDraftDialogProps = {
  workerId: string;
  engagementId: string;
  onClose: () => void;
};

export function ContractDraftDialog({
  workerId,
  engagementId,
  onClose,
}: ContractDraftDialogProps) {
  const { data, isLoading, isError } = useEmploymentContract(
    workerId,
    engagementId
  );
  const saveDraft = useSaveEmploymentContract(workerId, engagementId);
  const [syncing, setSyncing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setValues(data.values);
  }, [data]);

  const readOnly = data?.status !== 'draft';

  const save = () => {
    if (!data || readOnly) return;
    saveDraft.mutate(values, {
      onSuccess: () => toast.success('Entwurf gespeichert'),
      onError: () => toast.error('Entwurf konnte nicht gespeichert werden'),
    });
  };

  return (
    <Dialog open onOpenChange={(next) => { if (!next && !syncing && !saveDraft.isPending) onClose(); }}>
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
                {STATUS_LABEL[data.status]}
              </p>
            </div>
            <ContractQuestionnaireSync workerId={workerId} engagementId={engagementId}
              contract={data} onBusy={setSyncing} disabled={saveDraft.isPending || syncing} onSynced={(saved) => setValues(saved.values)} />
            {data.followsMaster ? null : (
              <p className="shrink-0 text-sm text-muted-foreground">{FROZEN_NOTE}</p>
            )}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <ContractDraftBody
                document={data.document}
                segments={data.segments}
                values={values}
                readOnly={readOnly || syncing}
                onValueChange={(key, value) =>
                  setValues((current) => ({ ...current, [key]: value }))
                }
              />
            </div>
            {readOnly ? null : (
              <div className="flex shrink-0 justify-end">
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={saveDraft.isPending || syncing}
                  onClick={save}
                >
                  {saveDraft.isPending ? 'Speichert…' : 'Entwurf speichern'}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
      </DialogContent>
    </Dialog>
  );
}
