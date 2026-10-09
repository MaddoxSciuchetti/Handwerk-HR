import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import {
  getArbeitszeugnisPreview,
  sendArbeitszeugnis,
} from '@/features/all-tasks/api/arbeitszeugnis.api';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { rememberContractSendReturn } from '@/features/worker-task-management/contractSendReturn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ContractDraftBody } from '@/features/worker-task-management/components/files/ContractDraftBody';
import { UnmatchedQuestionnaireAnswers } from '@/features/worker-task-management/components/files/UnmatchedQuestionnaireAnswers';

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

  useEffect(() => {
    if (!preview.data) return;
    setValues(preview.data.values);
  }, [preview.data]);

  const send = useMutation({
    mutationFn: () => sendArbeitszeugnis(issueId, values),
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
    onError: (error) => {
      const message =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Das Arbeitszeugnis konnte nicht versendet werden.';
      toast.error(message);
    },
  });

  const data = preview.data;
  const inputKeys =
    data?.segments
      .filter((segment) => segment.type === 'input')
      .map((segment) => segment.key) ?? [];
  const complete =
    data?.alreadySent ||
    inputKeys.every((key) => (values[key] ?? '').trim().length > 0);
  const unmatched = data
    ? visibleUnmatched(data.unmatched, values)
    : [];
  const showAside =
    Boolean(data) &&
    !data?.alreadySent &&
    (unmatched.length > 0 || (data?.unresolved.length ?? 0) > 0);

  const leaveForMaster = () => {
    if (!data) return;
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
      handleToggle={onClose}
      size={showAside ? 'max-w-5xl' : 'max-w-3xl'}
    >
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
        {preview.isLoading ? <LoadingAlert className="min-h-40" /> : null}
        {preview.isError || (!preview.isLoading && !data) ? (
          <p className="text-sm text-destructive">
            Das Arbeitszeugnis konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <>
            <div className="pr-8">
              <h2 className="text-base font-medium">{data.name}</h2>
              <p className="text-sm text-muted-foreground">
                {data.alreadySent
                  ? 'Das Arbeitszeugnis wurde bereits versendet.'
                  : 'Prüfen Sie das Arbeitszeugnis und bestätigen Sie den Versand.'}
              </p>
            </div>
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
                segments={data.segments}
                values={values}
                readOnly={data.alreadySent}
                acceptAnswerDrop={showAside}
                onValueChange={(key, value) =>
                  setValues((current) => ({ ...current, [key]: value }))
                }
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                className="rounded-2xl"
                disabled={
                  !complete ||
                  send.isPending ||
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
