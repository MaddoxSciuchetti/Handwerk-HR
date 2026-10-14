import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  sendFilledEmploymentContract,
  prepareEmploymentContractPdf,
} from '../../api/employmentContract.api';
import { PreparedPdfPreview, type PreparedPdf } from './PreparedPdfPreview';
import {
  documentFields,
  fieldComplete,
  fromSegments,
} from '@/features/settings/documents/styledDocument';
import type { UnmatchedQuestionnaireAnswer } from '../../api/employmentContract.api';
import { WORKERBYID } from '../../consts/query-key.consts';
import { rememberContractSendReturn } from '../../contractSendReturn';
import {
  employmentContractKey,
  useEmploymentContract,
  useResyncEmploymentContract,
  useSaveEmploymentContract,
} from '../../hooks/useEmploymentContract';
import { ContractDraftBody } from './ContractDraftBody';
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
  return answers.filter((answer) => !placed.has(answer.value.trim()));
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
  const { data, isLoading, isError, refetch } = useEmploymentContract(
    workerId,
    engagementId
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [prepared, setPrepared] = useState<PreparedPdf | null>(null);
  const [approved, setApproved] = useState(false);
  const [confirmResync, setConfirmResync] = useState(false);
  const saveDraft = useSaveEmploymentContract(workerId, engagementId);
  const resync = useResyncEmploymentContract(workerId, engagementId);

  const initialized = useRef(false);
  useEffect(() => {
    if (!data || initialized.current) return;
    initialized.current = true;
    // Hydrate once; later query refreshes must not overwrite local corrections.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(data.values);
    setPrepared(data.prepared ?? null);
  }, [data]);

  const send = useMutation({
    mutationFn: () =>
      sendFilledEmploymentContract(
        workerId,
        engagementId,
        issueId,
        prepared!.id
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        employmentContractKey(workerId, engagementId),
        saved
      );
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] });
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      toast.success('Vertrag wurde versendet');
      onClose();
    },
    onError: async (error) => {
      toast.error(
        (error as { message?: string }).message ??
          'Vertrag konnte nicht versendet werden'
      );
      setApproved(false);
      const refreshed = await refetch();
      setPrepared(refreshed.data?.prepared ?? null);
    },
  });

  const complete = data
    ? documentFields(data.document ?? fromSegments(data.segments)).every(
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
  const prepare = useMutation({
    mutationFn: () =>
      prepareEmploymentContractPdf(workerId, engagementId, values),
    onSuccess: (pdf) => {
      setPrepared(pdf);
      setApproved(false);
      queryClient.setQueryData(
        employmentContractKey(workerId, engagementId),
        (previous: typeof data) =>
          previous ? { ...previous, values, prepared: pdf } : previous
      );
    },
    onError: (error) =>
      toast.error(
        (error as { message?: string }).message ??
          'PDF konnte nicht erstellt werden'
      ),
  });
  const blockedDelivery = ['sending', 'uncertain'].includes(
    prepared?.status ?? ''
  );
  const needsResync = Boolean(
    data?.followsMaster &&
      data.questionnaireCompleted &&
      !readOnly &&
      data.masterRevision !== data.matchedMasterRevision
  );

  const close = async () => {
    if (send.isPending || prepare.isPending || resync.isPending) return;
    if (
      !readOnly &&
      data &&
      JSON.stringify(values) !== JSON.stringify(data.values)
    ) {
      try {
        await saveDraft.mutateAsync(values);
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
          data.unmatchedAnswers ?? [],
          data.segments,
          values
        )
      : [];

  const leaveForMaster = () => {
    if (!data) return;
    const search = new URLSearchParams(window.location.search);
    rememberContractSendReturn({
      kind: 'contract',
      returnTo: window.location.pathname.startsWith('/tasks')
        ? 'tasks'
        : 'worker',
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
    if (!data || readOnly || saveDraft.isPending) return;
    saveDraft.mutate(values, {
      onSuccess: leaveForMaster,
      onError: () =>
        toast.error('Die Zuordnung konnte nicht gespeichert werden'),
    });
  };

  return (
    <ModalOverlay
      handleToggle={() => void close()}
      className="p-3 sm:p-6"
      size={prepared ? 'max-w-3xl' : 'max-w-7xl'}
    >
      <div className="flex h-[85dvh] max-h-[85dvh] min-h-0 flex-col gap-4 overflow-hidden rounded-2xl bg-card p-4 text-card-foreground sm:p-6">
        {isLoading ? <LoadingAlert className="min-h-40" /> : null}
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
                {alreadySent
                  ? 'Der Vertrag wurde versendet.'
                  : 'Prüfen Sie den Vertrag und bestätigen Sie den Versand.'}
              </p>
              {needsResync ? (
                <div className="mt-3 flex flex-col gap-2">
                  {confirmResync ? (
                    <p className="text-sm text-muted-foreground">
                      Erneut abgleichen ersetzt alle Eingaben im Vertrag durch
                      die Antworten des Fragebogens, auch Werte, die von Hand
                      geändert wurden.
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    {confirmResync ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={resync.isPending}
                          onClick={() => setConfirmResync(false)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          type="button"
                          disabled={resync.isPending}
                          onClick={() =>
                            resync.mutate(undefined, {
                              onSuccess: (saved) => {
                                setValues(saved.values);
                                setPrepared(null);
                                setApproved(false);
                                setConfirmResync(false);
                                toast.success(
                                  'Vertrag wurde erneut mit dem Fragebogen abgeglichen'
                                );
                              },
                              onError: (error) =>
                                toast.error(
                                  (error as { message?: string }).message ??
                                    'Abgleich ist fehlgeschlagen'
                                ),
                            })
                          }
                        >
                          {resync.isPending ? 'Wird abgeglichen…' : 'Werte ersetzen'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirmResync(true)}
                      >
                        Erneut abgleichen
                      </Button>
                    )}
                  </div>
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
                approved={approved}
                onApprove={setApproved}
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
                  document={data.document}
                  segments={data.segments}
                  values={values}
                  readOnly={
                    readOnly ||
                    prepare.isPending ||
                    send.isPending ||
                    resync.isPending
                  }
                  acceptAnswerDrop={unmatched.length > 0}
                  onValueChange={(key, value) => {
                    setPrepared(null);
                    setApproved(false);
                    setValues((current) => ({ ...current, [key]: value }));
                  }}
                />
              </div>
            )}
            {alreadySent ? null : (
              <div className="flex shrink-0 justify-end">
                {prepared ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={send.isPending || blockedDelivery}
                    onClick={() => {
                      setPrepared(null);
                      setApproved(false);
                    }}
                  >
                    Werte bearbeiten
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!complete || prepare.isPending}
                    onClick={() => prepare.mutate()}
                  >
                    {prepare.isPending
                      ? 'PDF wird erstellt…'
                      : 'Finales PDF erstellen und prüfen'}
                  </Button>
                )}
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={
                    !prepared || !approved || send.isPending || blockedDelivery
                  }
                  onClick={() => send.mutate()}
                >
                  {send.isPending ? 'Sendet…' : 'Vertrag versenden'}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </ModalOverlay>
  );
}
