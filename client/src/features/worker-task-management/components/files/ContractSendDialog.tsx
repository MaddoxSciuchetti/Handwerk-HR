import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sendFilledEmploymentContract } from '../../api/employmentContract.api';
import type { UnmatchedQuestionnaireAnswer } from '../../api/employmentContract.api';
import { WORKERBYID } from '../../consts/query-key.consts';
import { rememberContractSendReturn } from '../../contractSendReturn';
import {
  employmentContractKey,
  useEmploymentContract,
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
  const { data, isLoading, isError } = useEmploymentContract(
    workerId,
    engagementId
  );
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setValues(data.values);
  }, [data]);

  const send = useMutation({
    mutationFn: () =>
      sendFilledEmploymentContract(workerId, engagementId, issueId, values),
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
    onError: () => toast.error('Vertrag konnte nicht versendet werden'),
  });

  const inputKeys =
    data?.segments
      .filter((segment) => segment.type === 'input')
      .map((segment) => segment.key) ?? [];
  const complete = inputKeys.every((key) => (values[key] ?? '').trim().length > 0);
  const alreadySent = Boolean(data?.sentAt);
  const readOnly = data?.status !== 'draft';
  const unmatched =
    data && !alreadySent && !readOnly
      ? visibleUnmatchedAnswers(
          data.unmatchedAnswers ?? [],
          data.segments,
          values
        )
      : [];

  const openMaster = () => {
    if (!data) return;
    const search = new URLSearchParams(window.location.search);
    rememberContractSendReturn({
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

  return (
    <ModalOverlay
      handleToggle={onClose}
      size={unmatched.length > 0 ? 'max-w-5xl' : 'max-w-3xl'}
    >
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
                {alreadySent
                  ? 'Der Vertrag wurde versendet.'
                  : 'Prüfen Sie den Vertrag und bestätigen Sie den Versand.'}
              </p>
            </div>
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
              {unmatched.length > 0 ? (
                <UnmatchedQuestionnaireAnswers
                  answers={unmatched}
                  onEditMaster={openMaster}
                />
              ) : null}
              <ContractDraftBody
                segments={data.segments}
                values={values}
                readOnly={readOnly}
                acceptAnswerDrop={unmatched.length > 0}
                onValueChange={(key, value) =>
                  setValues((current) => ({ ...current, [key]: value }))
                }
              />
            </div>
            {alreadySent ? null : (
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={!complete || send.isPending}
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
