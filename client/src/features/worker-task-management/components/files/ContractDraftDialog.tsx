import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import { Download, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  fetchPreparedEmploymentContractPdf,
  fetchPrintedEmploymentContractPdf,
  prepareEmploymentContractDownload,
  type EmploymentContractDraft,
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

const FROZEN_NOTE =
  'Dieser Vertragstext gilt nur für diese Person und ändert das Muster nicht.';

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
  const [contractDocument, setContractDocument] =
    useState<StyledDocument | null>(null);
  const [documentEdited, setDocumentEdited] = useState(false);

  const [syncedContract, setSyncedContract] = useState(data);
  if (data && data !== syncedContract) {
    setSyncedContract(data);
    setValues(data.values);
    if (!documentEdited) setContractDocument(data.document);
  }

  const readOnly = Boolean(
    data?.printedAt || data?.sentAt || data?.status === 'signed'
  );
  const draftPayload = () => ({
    values,
    document: documentEdited && contractDocument ? contractDocument : undefined,
  });
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

      if (data.printedAt) {
        downloadBlob(
          await fetchPrintedEmploymentContractPdf(workerId, engagementId),
          filename
        );
        return;
      }

      if (data.sentAt || data.status === 'signed') {
        throw new Error('Kein PDF zum Herunterladen vorhanden.');
      }

      const dirty =
        documentEdited ||
        JSON.stringify(values) !== JSON.stringify(data.values);
      let blob: Blob;
      if (!dirty && data.prepared?.id) {
        blob = await fetchPreparedEmploymentContractPdf(
          workerId,
          engagementId,
          data.prepared.id
        );
      } else {
        if (dirty) {
          const saved = await saveDraft.mutateAsync(draftPayload());
          setDocumentEdited(false);
          setContractDocument(saved.document);
          setValues(saved.values);
        }
        const result = await prepareEmploymentContractDownload(
          workerId,
          engagementId,
          values
        );
        blob = result.blob;
        queryClient.setQueryData<EmploymentContractDraft>(
          employmentContractKey(workerId, engagementId),
          (previous) =>
            previous
              ? {
                  ...previous,
                  values,
                  document: contractDocument ?? previous.document,
                  prepared: result.prepared,
                }
              : previous
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
    saveDraft.mutate(draftPayload(), {
      onSuccess: (saved) => {
        setDocumentEdited(false);
        setContractDocument(saved.document);
        setValues(saved.values);
        toast.success('Entwurf gespeichert');
      },
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
                    {data.status === 'signed'
                      ? STATUS_LABEL.signed
                      : data.printedAt
                        ? 'Gedruckt'
                        : STATUS_LABEL[data.status]}
                  </p>
                </div>
                <ContractQuestionnaireSync
                  workerId={workerId}
                  engagementId={engagementId}
                  contract={data}
                  beforeSync={async () => {
                    const dirty =
                      documentEdited ||
                      JSON.stringify(values) !== JSON.stringify(data.values);
                    if (dirty) await saveDraft.mutateAsync(draftPayload());
                  }}
                  onBusy={setSyncing}
                  disabled={busy}
                  onSynced={(saved) => {
                    setDocumentEdited(false);
                    setValues(saved.values);
                    setContractDocument(saved.document);
                  }}
                />
              </div>
              {data.followsMaster && !documentEdited ? null : (
                <p className="shrink-0 text-sm text-muted-foreground">
                  {FROZEN_NOTE}
                </p>
              )}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <ContractDraftBody
                  document={contractDocument ?? data.document}
                  segments={data.segments}
                  values={values}
                  readOnly={readOnly || syncing || downloadPdf.isPending}
                  onValueChange={(key, value) =>
                    setValues((current) => ({ ...current, [key]: value }))
                  }
                  onDocumentChange={
                    readOnly
                      ? undefined
                      : (next) => {
                          setDocumentEdited(true);
                          setContractDocument(next);
                        }
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
