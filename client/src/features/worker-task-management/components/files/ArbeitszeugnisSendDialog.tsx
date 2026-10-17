import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import {
  getArbeitszeugnisPreview,
  sendArbeitszeugnis,
  prepareArbeitszeugnisPdf,
  saveArbeitszeugnisDraft,
} from '@/features/all-tasks/api/arbeitszeugnis.api';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { rememberContractSendReturn } from '@/features/worker-task-management/contractSendReturn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ContractDraftBody } from '@/features/worker-task-management/components/files/ContractDraftBody';
import { UnmatchedQuestionnaireAnswers } from '@/features/worker-task-management/components/files/UnmatchedQuestionnaireAnswers';
import { PreparedPdfPreview, type PreparedPdf } from './PreparedPdfPreview';
import {
  documentPreviewModalPanel,
  documentPreviewModalSize,
} from './documentPreviewModal';
import {
  documentFields,
  fieldComplete,
  fromSegments,
} from '@/features/settings/documents/styledDocument';

function visibleUnmatched(
  answers: { key: string; label: string; value: string }[],
  values: Record<string, string>
) {
  const placed = new Set(
    Object.values(values)
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
  return answers.filter((answer) => !placed.has(answer.value.trim()));
}

type ArbeitszeugnisSendDialogProps = {
  issueId: string;
  onClose: () => void;
  onSent: () => void;
};

export function ArbeitszeugnisSendDialog({
  issueId,
  onClose,
  onSent,
}: ArbeitszeugnisSendDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const preview = useQuery({
    queryKey: ['automation', 'arbeitszeugnis', issueId],
    queryFn: () => getArbeitszeugnisPreview(issueId),
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [prepared, setPrepared] = useState<PreparedPdf | null>(null);
  const [approved, setApproved] = useState(false);

  const initialized = useRef(false);
  useEffect(() => {
    if (!preview.data || initialized.current) return;
    initialized.current = true;
    // Hydrate once; later query refreshes must not overwrite local corrections.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(preview.data.values);
    setPrepared(preview.data.prepared ?? null);
  }, [preview.data]);

  const send = useMutation({
    mutationFn: () => sendArbeitszeugnis(issueId, prepared?.id ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      toast.success(
        preview.data?.alreadySent
          ? 'Die Aufgabe ist erledigt.'
          : 'Das Arbeitszeugnis wurde versendet. Die Aufgabe ist erledigt.'
      );
      onSent();
      onClose();
    },
    onError: async (error) => {
      const message =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Das Arbeitszeugnis konnte nicht versendet werden.';
      toast.error(message);
      setApproved(false);
      const refreshed = await preview.refetch();
      setPrepared(refreshed.data?.prepared ?? null);
    },
  });

  const prepare = useMutation({
    mutationFn: () => prepareArbeitszeugnisPdf(issueId, values),
    onSuccess: (pdf) => {
      setPrepared(pdf);
      setApproved(false);
      queryClient.setQueryData(
        ['automation', 'arbeitszeugnis', issueId],
        (previous: typeof preview.data) =>
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
  const close = async () => {
    if (prepare.isPending || send.isPending) return;
    if (
      preview.data &&
      !preview.data.alreadySent &&
      JSON.stringify(values) !== JSON.stringify(preview.data.values)
    ) {
      try {
        await saveArbeitszeugnisDraft(issueId, values);
      } catch {
        toast.error('Entwurf konnte nicht gespeichert werden');
        return;
      }
    }
    onClose();
  };

  const data = preview.data;
  const complete =
    data?.alreadySent ||
    (data &&
      documentFields(data.document ?? fromSegments(data.segments)).every(
        (field) =>
          fieldComplete(
            field,
            field.fieldType === 'checkbox'
              ? (values[field.key] ?? 'false')
              : values[field.key]
          )
      ));
  const unmatched = data ? visibleUnmatched(data.unmatched, values) : [];
  const showAside =
    Boolean(data) &&
    !data?.alreadySent &&
    (unmatched.length > 0 || (data?.unresolved.length ?? 0) > 0);

  const leaveForMaster = async () => {
    if (!data) return;
    try {
      await saveArbeitszeugnisDraft(issueId, values);
    } catch {
      toast.error('Entwurf konnte nicht gespeichert werden');
      return;
    }
    const search = new URLSearchParams(window.location.search);
    rememberContractSendReturn({
      kind: 'arbeitszeugnis',
      returnTo: window.location.pathname.startsWith('/tasks')
        ? 'tasks'
        : 'worker',
      workerId: data.workerId,
      engagementId: data.engagementId,
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

  return (
    <ModalOverlay
      handleToggle={() => void close()}
      className="p-3 sm:p-6"
      size={documentPreviewModalSize}
    >
      <div className={documentPreviewModalPanel}>
        {preview.isLoading ? <LoadingAlert className="min-h-40" /> : null}
        {preview.isError || (!preview.isLoading && !data) ? (
          <p className="text-sm text-destructive">
            Das Arbeitszeugnis konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <>
            <div className="shrink-0 pr-8">
              <h2 className="text-base font-medium">{data.name}</h2>
              <p className="text-sm text-muted-foreground">
                {data.alreadySent
                  ? 'Das Arbeitszeugnis wurde bereits versendet.'
                  : 'Prüfen Sie das Arbeitszeugnis und bestätigen Sie den Versand.'}
              </p>
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
                page={{
                  width: data.document.page.width,
                  height: data.document.page.height,
                }}
              />
            ) : (
              <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
                {showAside ? (
                  <UnmatchedQuestionnaireAnswers
                    answers={unmatched}
                    saving={false}
                    unresolvedLabels={data.unresolved.map((item) => item.label)}
                    description="Diese Angaben des Mitarbeiters sind keinem Feld zugeordnet. Ziehen Sie eine Angabe auf das passende Feld."
                    masterHint="Konnte ein Platzhalter nicht gefüllt werden, benennen Sie das Feld im Muster so, dass es einer Mitarbeiterangabe entspricht, und kehren Sie danach hierher zurück."
                    masterAction="Muster ergänzen"
                    onEditMaster={leaveForMaster}
                  />
                ) : null}
                <ContractDraftBody
                  document={data.document}
                  segments={data.segments}
                  values={values}
                  readOnly={
                    data.alreadySent || prepare.isPending || send.isPending
                  }
                  acceptAnswerDrop={showAside}
                  onValueChange={(key, value) => {
                    setPrepared(null);
                    setApproved(false);
                    setValues((current) => ({ ...current, [key]: value }));
                  }}
                />
              </div>
            )}
            <div className="flex shrink-0 justify-end">
              {!data.alreadySent &&
                (prepared ? (
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
                ))}
              <Button
                type="button"
                className="rounded-2xl"
                disabled={
                  !complete ||
                  (!data.alreadySent && (!prepared || !approved)) ||
                  send.isPending ||
                  blockedDelivery ||
                  (!data.masterId && !data.alreadySent)
                }
                onClick={() => send.mutate()}
              >
                {send.isPending
                  ? 'Sendet…'
                  : data.alreadySent
                    ? 'Aufgabe erledigen'
                    : 'Arbeitszeugnis versenden'}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </ModalOverlay>
  );
}
