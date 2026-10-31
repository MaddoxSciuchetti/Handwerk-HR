import { ContractPreviewSkeleton } from './ContractPreviewSkeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchPreparedEmploymentContractPdf,
  prepareEmploymentContractDownload,
  selectEngagementContractTemplate,
} from '../../api/employmentContract.api';
import { downloadBlob } from '../../downloadBlob';
import { PreparedPdfPreview, type PreparedPdf } from './PreparedPdfPreview';
import {
  documentFields,
  fieldComplete,
  fromSegments,
} from '@/features/settings/documents/styledDocument';
import type { UnmatchedQuestionnaireAnswer } from '../../api/employmentContract.api';
import { rememberContractSendReturn } from '../../contractSendReturn';
import {
  employmentContractKey,
  useEmploymentContract,
  useSaveEmploymentContract,
} from '../../hooks/useEmploymentContract';
import { useDocumentMasters } from '@/features/settings/documents/useDocumentMasters';
import { ContractDraftBody } from './ContractDraftBody';
import { ContractQuestionnaireSync } from './ContractQuestionnaireSync';
import {
  documentPreviewModalPanel,
  documentPreviewModalSize,
} from './documentPreviewModal';
import { UnmatchedQuestionnaireAnswers } from './UnmatchedQuestionnaireAnswers';

function visibleUnmatchedAnswers(
  answers: UnmatchedQuestionnaireAnswer[],
  segments: DocumentSegment[],
  values: Record<string, string>
) {
  const placed = new Set<string>();
  for (const segment of segments) {
    if (segment.type !== 'input') continue;
    const value = (values[segment.key] ?? '').trim();
    if (value) placed.add(value);
  }
  const byKey = new Map(
    answers.map((answer) => [answer.key, answer.value.trim()])
  );
  const consumed = new Set<string>();
  const consumeCombined = (keys: string[], separator: string) => {
    const combined = keys
      .map((key) => byKey.get(key))
      .filter(Boolean)
      .join(separator);
    if (combined && placed.has(combined))
      keys.forEach((key) => consumed.add(key));
  };
  consumeCombined(['firstName', 'lastName'], ' ');
  const locality = ['postalCode', 'city']
    .map((key) => byKey.get(key))
    .filter(Boolean)
    .join(' ');
  const address = [byKey.get('street'), locality].filter(Boolean).join(', ');
  if (address && placed.has(address))
    ['street', 'postalCode', 'city'].forEach((key) => consumed.add(key));
  return answers.filter(
    (answer) => !consumed.has(answer.key) && !placed.has(answer.value.trim())
  );
}

type ContractSendDialogProps = {
  workerId: string;
  engagementId: string;
  issueId: string;
  onClose: () => void;
};

export function ContractSendDialog({
  workerId,
  engagementId,
  issueId,
  onClose,
}: ContractSendDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useEmploymentContract(
    workerId,
    engagementId
  );
  const templates = useDocumentMasters(
    Boolean(data && !data.sentAt && data.status !== 'signed')
  );
  const [syncing, setSyncing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [document, setDocument] = useState<StyledDocument | null>(null);
  const [prepared, setPrepared] = useState<PreparedPdf | null>(null);
  const saveDraft = useSaveEmploymentContract(workerId, engagementId);

  const edited = useRef(false);
  const documentEdited = useRef(false);
  useEffect(() => {
    if (!data || edited.current) return;
    // Cached data can predate questionnaire completion. Accept fresh server
    // values until the user starts editing; then preserve local corrections.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(data.values);
    if (!documentEdited.current) setDocument(data.document);
    setPrepared(data.prepared ?? null);
  }, [data]);

  const activeDocument = document ?? data?.document;
  const draftPayload = () => ({
    values,
    document:
      documentEdited.current && activeDocument ? activeDocument : undefined,
  });
  const complete = data
    ? documentFields(activeDocument ?? fromSegments(data.segments)).every(
        (field) =>
          fieldComplete(
            field,
            field.fieldType === 'checkbox'
              ? (values[field.key] ?? 'false')
              : values[field.key]
          )
      )
    : false;
  const alreadySent = Boolean(data?.sentAt);
  const readOnly = data?.status === 'signed' || alreadySent;
  const savePdf = useMutation({
    mutationFn: async () => {
      let blob: Blob;
      if (prepared) {
        blob = await fetchPreparedEmploymentContractPdf(
          workerId,
          engagementId,
          prepared.id
        );
      } else {
        const dirty =
          documentEdited.current ||
          JSON.stringify(values) !== JSON.stringify(data?.values);
        if (dirty) {
          const saved = await saveDraft.mutateAsync(draftPayload());
          documentEdited.current = false;
          edited.current = false;
          setDocument(saved.document);
          setValues(saved.values);
        }
        const result = await prepareEmploymentContractDownload(
          workerId,
          engagementId,
          values
        );
        blob = result.blob;
        setPrepared(result.prepared);
        queryClient.setQueryData(
          employmentContractKey(workerId, engagementId),
          (previous: typeof data) =>
            previous
              ? {
                  ...previous,
                  values,
                  document: activeDocument ?? previous.document,
                  prepared: result.prepared,
                }
              : previous
        );
      }
      if (!(blob instanceof Blob)) {
        throw new Error('PDF konnte nicht geladen werden');
      }
      downloadBlob(blob, `${data?.name ?? 'Arbeitsvertrag'}.pdf`);
    },
    onError: (error) =>
      toast.error(
        (error as { message?: string }).message ??
          'PDF konnte nicht heruntergeladen werden'
      ),
  });
  const saveBeforeSync = async () => {
    if (
      data &&
      (documentEdited.current ||
        JSON.stringify(values) !== JSON.stringify(data.values))
    ) {
      await saveDraft.mutateAsync(draftPayload());
    }
  };
  const switchTemplate = useMutation({
    mutationFn: async (masterId: string) => {
      await saveBeforeSync();
      return selectEngagementContractTemplate(workerId, engagementId, masterId);
    },
    onSuccess: (saved) => {
      edited.current = false;
      documentEdited.current = false;
      setValues(saved.values);
      setDocument(saved.document);
      setPrepared(null);
      queryClient.setQueryData(
        employmentContractKey(workerId, engagementId),
        saved
      );
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      toast.success(
        'Vertragsvorlage gewechselt und mit dem Fragebogen ausgefüllt.'
      );
    },
    onError: (error) =>
      toast.error(
        (error as { message?: string }).message ??
          'Vertragsvorlage konnte nicht gewechselt werden.'
      ),
  });
  const changingTemplate = switchTemplate.isPending;
  const templateChoices = (templates.data ?? []).filter(
    (template) => template.kind === 'employment_contract'
  );
  const busy =
    syncing || changingTemplate || savePdf.isPending || saveDraft.isPending;
  const blockedDelivery = ['sending', 'uncertain'].includes(
    prepared?.status ?? ''
  );
  const close = async () => {
    if (busy) return;
    if (
      !readOnly &&
      data &&
      (documentEdited.current ||
        JSON.stringify(values) !== JSON.stringify(data.values))
    ) {
      try {
        await saveDraft.mutateAsync(draftPayload());
        documentEdited.current = false;
      } catch {
        toast.error('Entwurf konnte nicht gespeichert werden');
        return;
      }
    }
    onClose();
  };
  const unmatched =
    data && !alreadySent && !readOnly
      ? visibleUnmatchedAnswers(
          data.questionnaireAnswers ?? data.unmatchedAnswers ?? [],
          data.segments,
          values
        )
      : [];

  const leaveForMaster = () => {
    if (!data) return;
    const search = new URLSearchParams(window.location.search);
    rememberContractSendReturn({
      kind: 'contract',
      returnTo: 'worker',
      workerId,
      engagementId,
      issueId,
      workerName: search.get('workerName') ?? '',
      prevPage: search.get('prevPage') ?? '',
    });
    onClose();
    void navigate({
      to: '/settings/documents/$id',
      params: { id: data.masterId },
      search: { returnContract: '1' },
    });
  };

  const openMaster = () => {
    if (!data || readOnly || busy) return;
    saveDraft.mutate(draftPayload(), {
      onSuccess: () => {
        documentEdited.current = false;
        leaveForMaster();
      },
      onError: () =>
        toast.error('Die Zuordnung konnte nicht gespeichert werden'),
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) void close();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className={`w-full border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,90rem)] ${documentPreviewModalSize}`}
      >
        <div className={documentPreviewModalPanel}>
          {isLoading ? <ContractPreviewSkeleton /> : null}
          {isError || (!isLoading && !data) ? (
            <p className="text-sm text-destructive">
              Der Vertrag konnte nicht geladen werden.
            </p>
          ) : null}
          {data ? (
            <>
              <div className="shrink-0 pr-8">
                <DialogTitle className="text-base font-medium">
                  {data.name}
                </DialogTitle>
                {!readOnly && data.questionnaireCompleted ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <label
                      htmlFor="contract-template"
                      className="text-sm font-medium"
                    >
                      Vertragsvorlage wechseln
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        id="contract-template"
                        className="h-9 w-60 min-w-0 max-w-full shrink-0 truncate rounded-md border border-input bg-background px-3 text-sm"
                        value={data.masterId}
                        disabled={
                          busy ||
                          blockedDelivery ||
                          templates.isPending ||
                          templates.isError
                        }
                        onChange={(event) =>
                          switchTemplate.mutate(event.target.value)
                        }
                      >
                        {!templateChoices.some(
                          (template) => template.id === data.masterId
                        ) ? (
                          <option value={data.masterId}>{data.name}</option>
                        ) : null}
                        {templateChoices.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      <ContractQuestionnaireSync
                        workerId={workerId}
                        engagementId={engagementId}
                        contract={data}
                        beforeSync={saveBeforeSync}
                        onBusy={setSyncing}
                        disabled={busy || blockedDelivery}
                        onSynced={(saved) => {
                          edited.current = false;
                          documentEdited.current = false;
                          setValues(saved.values);
                          setDocument(saved.document);
                          setPrepared(null);
                        }}
                      />
                    </div>
                    {templates.isError ? (
                      <p className="text-sm text-destructive">
                        Vertragsvorlagen konnten nicht geladen werden.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {data.outgoingFileUrl ? (
                <a
                  href={data.outgoingFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline"
                >
                  Versendetes Original-PDF öffnen
                </a>
              ) : null}
              {prepared ? (
                <PreparedPdfPreview
                  prepared={prepared}
                  showConfirmation={false}
                  showOpenLink={false}
                  frameTitle="Arbeitsvertrag PDF-Vorschau"
                  page={{
                    width: (activeDocument ?? data.document).page.width,
                    height: (activeDocument ?? data.document).page.height,
                  }}
                />
              ) : (
                <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
                  {unmatched.length > 0 ? (
                    <UnmatchedQuestionnaireAnswers
                      answers={unmatched}
                      saving={saveDraft.isPending}
                      onEditMaster={openMaster}
                      description=""
                    />
                  ) : null}
                  <ContractDraftBody
                    document={activeDocument}
                    segments={data.segments}
                    values={values}
                    readOnly={
                      readOnly ||
                      syncing ||
                      changingTemplate ||
                      saveDraft.isPending ||
                      savePdf.isPending
                    }
                    acceptAnswerDrop={unmatched.length > 0}
                    onValueChange={(key, value) => {
                      edited.current = true;
                      setPrepared(null);
                      setValues((current) => ({ ...current, [key]: value }));
                    }}
                    onDocumentChange={
                      readOnly
                        ? undefined
                        : (next) => {
                            edited.current = true;
                            documentEdited.current = true;
                            setPrepared(null);
                            setDocument(next);
                          }
                    }
                  />
                </div>
              )}
              {alreadySent ? (
                data.outgoingFileUrl ? (
                  <div className="flex shrink-0 justify-end">
                    <Button
                      type="button"
                      size="icon"
                      className="rounded-2xl"
                      aria-label="PDF herunterladen"
                      title="PDF herunterladen"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = data.outgoingFileUrl!;
                        link.download = `${data.name ?? 'Arbeitsvertrag'}.pdf`;
                        link.target = '_blank';
                        link.rel = 'noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      }}
                    >
                      <Download aria-hidden="true" />
                    </Button>
                  </div>
                ) : null
              ) : (
                <div className="flex shrink-0 justify-end gap-2">
                  {prepared ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || blockedDelivery}
                      onClick={() => {
                        setPrepared(null);
                      }}
                    >
                      Bearbeiten
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={readOnly || busy || blockedDelivery}
                    onClick={() =>
                      saveDraft.mutate(draftPayload(), {
                        onSuccess: (saved) => {
                          edited.current = false;
                          documentEdited.current = false;
                          setValues(saved.values);
                          setDocument(saved.document);
                          setPrepared(saved.prepared ?? null);
                          toast.success('Entwurf gespeichert');
                        },
                        onError: () =>
                          toast.error(
                            'Entwurf konnte nicht gespeichert werden'
                          ),
                      })
                    }
                  >
                    {saveDraft.isPending ? 'Speichert…' : 'Speichern'}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className="rounded-2xl"
                    aria-label="PDF herunterladen"
                    title="PDF herunterladen"
                    aria-busy={savePdf.isPending}
                    disabled={!complete || busy || blockedDelivery}
                    onClick={() => savePdf.mutate()}
                  >
                    {savePdf.isPending ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Download aria-hidden="true" />
                    )}
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
