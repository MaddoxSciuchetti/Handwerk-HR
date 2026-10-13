import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type AddedQuestion = {
  key: string;
  label: string;
  section: string;
  type: QuestionnaireQuestionData['type'];
  options?: string[];
};

type DraftResponse = {
  success: boolean;
  data: {
    engagementId: string;
    email: string | null;
    sent: boolean;
    intro?: string;
    questions: QuestionnaireQuestionData[];
    repeaters: QuestionnaireRepeater[];
    addedQuestions?: AddedQuestion[];
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

const customTypes = [
  { type: 'text' as const, label: 'Textfeld' },
  { type: 'date' as const, label: 'Datum' },
  { type: 'single' as const, label: 'Auswahl' },
  { type: 'check' as const, label: 'Checkbox' },
];

function questionPayload(question: AddedQuestion) {
  return {
    kind: 'field' as const,
    key: question.key,
    label: question.label,
    section: question.section,
    type: question.type,
    options: question.options,
    required: true,
    builtin: false,
  };
}

export function QuestionnaireSendDialog({
  engagementId,
  onClose,
}: QuestionnaireSendDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<AddedQuestion[] | null>(null);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<(typeof customTypes)[number]['type']>('text');
  const [options, setOptions] = useState('Ja\nNein');
  const draft = useQuery({
    queryKey: ['questionnaire-draft', engagementId],
    queryFn: () =>
      apiJson.get<DraftResponse>(`/worker/engagements/${engagementId}/questionnaire`),
  });
  const serverQuestions = draft.data?.data.questions ?? [];
  const serverAdded = draft.data?.data.addedQuestions ?? [];
  const addedQuestions = added ?? serverAdded;
  const dropped = new Set(
    added
      ? serverAdded
          .map((question) => question.key)
          .filter((key) => !added.some((question) => question.key === key))
      : []
  );
  const addedByKey = new Map(addedQuestions.map((question) => [question.key, question]));
  const questions = [
    ...serverQuestions
      .filter((question) => !dropped.has(question.key))
      .map((question) => {
        const extra = addedByKey.get(question.key);
        return extra
          ? { ...question, label: extra.label, options: extra.options, required: true }
          : { ...question, required: true as const };
      }),
    ...addedQuestions
      .filter((question) => !serverQuestions.some((item) => item.key === question.key))
      .map((question) => ({ ...question, required: true as const })),
  ];
  const sent = Boolean(draft.data?.data.sent);

  useEffect(() => {
    if (serverQuestions.length === 0) return;
    setValues((current) => {
      const next = Object.fromEntries(
        serverQuestions.map((question) => [question.key, question.defaultValue ?? ''])
      );
      return { ...next, ...current };
    });
  }, [serverQuestions]);

  const payloadValues = () =>
    Object.fromEntries(questions.map((question) => [question.key, values[question.key] ?? '']));

  const persist = useMutation({
    mutationFn: () =>
      apiJson.put<DraftResponse>(`/worker/engagements/${engagementId}/questionnaire`, {
        values: payloadValues(),
        questions: addedQuestions.map(questionPayload),
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
    if (!sent) {
      try {
        await persist.mutateAsync();
      } catch {
        toast.error('Die Angaben konnten nicht gespeichert werden');
        return;
      }
    }
    onClose();
  };

  const addQuestion = () => {
    const name = label.trim();
    if (!name || sent) return;
    const choices = options
      .split('\n')
      .map((option) => option.trim())
      .filter(Boolean);
    if (type === 'single' && choices.length < 2) return;
    const question: AddedQuestion = {
      key: `custom.${crypto.randomUUID()}`,
      label: name,
      section: 'Weitere Angaben',
      type,
      options: type === 'single' ? choices : undefined,
    };
    setAdded([...addedQuestions, question]);
    setValues((current) => ({ ...current, [question.key]: '' }));
    setLabel('');
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
              An {draft.data.data.email ?? 'ohne E-Mail'}. Jedes Feld kann vorausgefüllt werden.
              Ausgefüllte Felder sind für den Handwerker danach gesperrt.
            </p>
            {draft.data.data.intro ? (
              <p className="text-sm text-muted-foreground">{draft.data.data.intro}</p>
            ) : null}
            {sections.map((section) => (
              <section key={section.title} className="flex flex-col gap-3">
                <h3 className="text-base font-medium">{section.title}</h3>
                {section.questions.map((question) => {
                  const extra = addedByKey.get(question.key);
                  return (
                    <div key={question.key} className="flex flex-col gap-2">
                      <QuestionnaireQuestion
                        question={question}
                        value={values[question.key] ?? ''}
                        disabled={sent}
                        labelControl={
                          extra && !sent ? (
                            <Input
                              aria-label="Frage"
                              value={extra.label}
                              maxLength={400}
                              onChange={(event) =>
                                setAdded(
                                  addedQuestions.map((item) =>
                                    item.key === question.key
                                      ? { ...item, label: event.target.value }
                                      : item
                                  )
                                )
                              }
                            />
                          ) : undefined
                        }
                        onChange={(value) =>
                          setValues((current) => ({ ...current, [question.key]: value }))
                        }
                      />
                      {extra && !sent ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-start rounded-2xl"
                          onClick={() =>
                            setAdded(addedQuestions.filter((item) => item.key !== question.key))
                          }
                        >
                          Frage entfernen
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </section>
            ))}
            {(draft.data.data.repeaters ?? []).map((repeater) => (
              <p key={repeater.key} className="text-sm text-muted-foreground">
                {repeater.section} — wird vom Handwerker ausgefüllt
              </p>
            ))}
            {sent ? null : (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <h3 className="text-sm font-medium">Neue Frage</h3>
                <Input
                  value={label}
                  placeholder="Frage"
                  maxLength={400}
                  onChange={(event) => setLabel(event.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as (typeof customTypes)[number]['type'])
                  }
                >
                  {customTypes.map((option) => (
                    <option key={option.type} value={option.type}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {type === 'single' ? (
                  <textarea
                    className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={options}
                    aria-label="Antworten"
                    onChange={(event) => setOptions(event.target.value)}
                  />
                ) : null}
                <Button type="button" className="self-start rounded-2xl" onClick={addQuestion}>
                  Hinzufügen
                </Button>
              </div>
            )}
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
            disabled={!draft.data || sent || send.isPending}
            onClick={() => send.mutate()}
          >
            {send.isPending ? 'Sendet…' : 'Senden'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
