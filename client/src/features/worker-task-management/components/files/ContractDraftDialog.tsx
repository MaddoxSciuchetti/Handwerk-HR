import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchPreparedEmploymentContractPdf,
  prepareEmploymentContractDownload,
} from '../../api/employmentContract.api';
import { downloadBlob } from '../../downloadBlob';
import {
  useEmploymentContract,
  useSaveEmploymentContract,
  employmentContractKey,
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

function openStoredPdf(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ContractDraftDialog({
  workerId,
  engagementId,
  onClose,
}: ContractDraftDialogProps) {
  const queryClient = useQueryClient();
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

  const readOnly = Boolean(data?.sentAt || data?.status === 'signed');
  const downloadPdf = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const filename = `${data.name?.trim() || 'Arbeitsvertrag'}.pdf`;

      if (data.outgoingFileUrl) {
        openStoredPdf(data.outgoingFileUrl, filename);
        return;
      }
      if (data.signedFileUrl) {
        openStoredPdf(data.signedFileUrl, filename);
        return;
      }

      if (data.sentAt || data.status === 'signed') {
        throw new Error('Kein PDF zum Herunterladen vorhanden.');
      }

      const dirty = JSON.stringify(values) !== JSON.stringify(data.values);
      let blob: Blob;
      if (!dirty && data.prepared?.id) {
        blob = await fetchPreparedEmploymentContractPdf(
          workerId,
          engagementId,
          data.prepared.id
        );
      } else {
        const result = await prepareEmploymentContractDownload(
          workerId,
          engagementId,
          values
        );
        blob = result.blob;
        queryClient.setQueryData(
          employmentContractKey(workerId, engagementId),
          {
            ...data,
            values,
            prepared: result.prepared,
          }
        );
      }
      if (!(blob instanceof Blob)) {
        throw new Error('PDF konnte nicht geladen werden');
      }
      downloadBlob(blob, filename);
    },
    onError: (error) =>
      toast.error(
        (error as { message?: string }).message ??
          'PDF konnte nicht heruntergeladen werden'
      ),
  });

  const busy = saveDraft.isPending || syncing || downloadPdf.isPending;

  const save = () => {
    if (!data || readOnly) return;
    saveDraft.mutate(values, {
      onSuccess: () => toast.success('Entwurf gespeichert'),
      onError: () => toast.error('Entwurf konnte nicht gespeichert werden'),
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        className={`w-full border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,90rem)] ${documentPreviewModalSize}`}
      >
        <div className={documentPreviewModalPanel}>
          {isLoading ? <PdfSkeleton /> : null}
          {isError || (!isLoading && !data) ? (
            <p className="text-sm text-destructive">
              Der Vertrag konnte nicht geladen werden.
            </p>
          ) : null}
          {data ? (
            <>
              <div className="flex shrink-0 items-center gap-2 pr-8">
                <div>
                  <h2 className="text-base font-medium">{data.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {STATUS_LABEL[data.status]}
                  </p>
                </div>
                <ContractQuestionnaireSync
                  workerId={workerId}
                  engagementId={engagementId}
                  contract={data}
                  beforeSync={async () => {
                    if (JSON.stringify(values) !== JSON.stringify(data.values)) {
                      await saveDraft.mutateAsync(values);
                    }
                  }}
                  onBusy={setSyncing}
                  disabled={busy}
                  onSynced={(saved) => setValues(saved.values)}
                />
              </div>
              {data.followsMaster ? null : (
                <p className="shrink-0 text-sm text-muted-foreground">
                  {FROZEN_NOTE}
                </p>
              )}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <ContractDraftBody
                  document={data.document}
                  segments={data.segments}
                  values={values}
                  readOnly={readOnly || syncing || downloadPdf.isPending}
                  onValueChange={(key, value) =>
                    setValues((current) => ({ ...current, [key]: value }))
                  }
                />
              </div>
              <div className="flex shrink-0 justify-end gap-2">
                {readOnly ? null : (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={busy}
                    onClick={save}
                  >
                    {saveDraft.isPending ? 'Speichert…' : 'Entwurf speichern'}
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  className="rounded-2xl"
                  aria-label="PDF herunterladen"
                  title="PDF herunterladen"
                  aria-busy={downloadPdf.isPending}
                  disabled={busy}
                  onClick={() => downloadPdf.mutate()}
                >
                  {downloadPdf.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Download aria-hidden="true" />
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
