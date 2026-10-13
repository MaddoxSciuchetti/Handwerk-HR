import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { apiJson } from '@/config/apiClient';
import queryClient from '@/config/query.client';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QuestionnaireQuestion } from './QuestionnaireQuestion';
import type {
  QuestionnaireQuestion as QuestionnaireQuestionData,
  QuestionnaireRepeater,
} from './questionnaire.types';

type DraftResponse = {
  success: boolean;
  data: {
    engagementId: string;
    email: string | null;
    sent: boolean;
    intro?: string;
    questions: QuestionnaireQuestionData[];
    repeaters: QuestionnaireRepeater[];
  };
};

type SendResponse = {
  success: boolean;
  data: { emailSent: boolean };
};

type QuestionnaireSendDialogProps = {
  engagementId: string;
  onClose: () => void;
};

export function QuestionnaireSendDialog({
  engagementId,
  onClose,
}: QuestionnaireSendDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const draft = useQuery({
    queryKey: ['questionnaire-draft', engagementId],
    queryFn: () =>
      apiJson.get<DraftResponse>(`/worker/engagements/${engagementId}/questionnaire`),
  });
  const questions = draft.data?.data.questions ?? [];

  useEffect(() => {
    if (questions.length === 0) return;
    setValues(
      Object.fromEntries(
        questions.map((question) => [question.key, question.defaultValue ?? ''])
      )
    );
  }, [questions]);

  const officeValues = () =>
    Object.fromEntries(
      questions
        .filter((question) => question.officeEditable)
        .map((question) => [question.key, values[question.key] ?? ''])
    );

  const persist = useMutation({
    mutationFn: () =>
      apiJson.put<DraftResponse>(`/worker/engagements/${engagementId}/questionnaire`, {
        values: officeValues(),
      }),
  });

  const send = useMutation({
    mutationFn: async () => {
      await persist.mutateAsync();
      return apiJson.post<SendResponse>(
        `/worker/engagements/${engagementId}/questionnaire/send`
      );
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      if (!response.data.emailSent) {
        toast.error('Die E-Mail ist nicht rausgegangen. Senden erneut versuchen.');
        void draft.refetch();
        return;
      }
      toast.success('Fragebogen gesendet');
      onClose();
    },
    onError: () => toast.error('Fragebogen konnte nicht gesendet werden'),
  });

  const close = async () => {
    if (!draft.data?.data.sent) {
      try {
        await persist.mutateAsync();
      } catch {
        toast.error('Die Angaben konnten nicht gespeichert werden');
        return;
      }
    }
    onClose();
  };

  const sections = questions.reduce<
    { title: string; questions: QuestionnaireQuestionData[] }[]
  >((list, question) => {
    const current = list.at(-1);
    if (!current || current.title !== question.section) {
      list.push({ title: question.section, questions: [question] });
    } else {
      current.questions.push(question);
    }
    return list;
  }, []);

  return (
    <ModalOverlay handleToggle={() => void close()} size="max-w-3xl">
      <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground">
        <h2 className="text-lg font-medium">Fragebogen senden</h2>
        {draft.isPending ? <p className="text-sm text-muted-foreground">Lädt…</p> : null}
        {draft.isError ? (
          <p className="text-sm text-destructive">Der Fragebogen konnte nicht geladen werden.</p>
        ) : null}
        {draft.data ? (
          <>
            <p className="text-sm text-muted-foreground">
              An {draft.data.data.email ?? 'ohne E-Mail'}. Graue Felder und Vorgaben können
              geändert werden.
            </p>
            {draft.data.data.intro ? (
              <p className="text-sm text-muted-foreground">{draft.data.data.intro}</p>
            ) : null}
            {sections.map((section) => (
              <section key={section.title} className="flex flex-col gap-3">
                <h3 className="text-base font-medium">{section.title}</h3>
                {section.questions.map((question) => (
                  <QuestionnaireQuestion
                    key={question.key}
                    question={question}
                    value={values[question.key] ?? ''}
                    disabled={!question.officeEditable}
                    employerFilled={Boolean(question.employerFilled && question.officeEditable)}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, [question.key]: value }))
                    }
                  />
                ))}
              </section>
            ))}
            {(draft.data.data.repeaters ?? []).map((repeater) => (
              <p key={repeater.key} className="text-sm text-muted-foreground">
                {repeater.section} — wird vom Handwerker ausgefüllt
              </p>
            ))}
          </>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            disabled={persist.isPending || send.isPending}
            onClick={() => void close()}
          >
            Schließen
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={!draft.data || send.isPending}
            onClick={() => send.mutate()}
          >
            {send.isPending ? 'Sendet…' : 'Senden'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
