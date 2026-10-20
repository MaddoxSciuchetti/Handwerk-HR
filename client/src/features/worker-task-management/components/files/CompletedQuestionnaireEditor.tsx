import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/config/apiClient';
import { Button } from '@/components/ui/button';
import { QuestionnaireQuestion } from '@/features/questionnaire/QuestionnaireQuestion';
import { QuestionnaireRepeatableRows } from '@/features/questionnaire/QuestionnaireRepeatableRows';
import { employmentContractKey } from '../../hooks/useEmploymentContract';
import { WORKERBYID } from '../../consts/query-key.consts';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { toast } from 'sonner';
import type { CompletedQuestionnaire } from './EngagementQuestionnaireList';

type Props = {
  workerId: string;
  engagementId: string;
  questionnaire: CompletedQuestionnaire;
  onDone: () => void;
  onBusy: (busy: boolean) => void;
};

export function CompletedQuestionnaireEditor({
  workerId,
  engagementId,
  questionnaire: initialQuestionnaire,
  onDone,
  onBusy,
}: Props) {
  // Keep the revision and baseline from when editing began. Background refetches
  // must not make an old draft look like it was based on newer answers.
  const [questionnaire] = useState(initialQuestionnaire);
  const [answers, setAnswers] = useState(() =>
    structuredClone(questionnaire.answers)
  );
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () => {
      const corrections = Object.fromEntries(
        questionnaire.items.flatMap((item) => {
          if (item.kind === 'field' && item.type === 'file') return [];
          const before =
            questionnaire.answers[item.key] ??
            (item.kind === 'repeater' ? [] : '');
          const after =
            answers[item.key] ?? (item.kind === 'repeater' ? [] : '');
          return JSON.stringify(before) === JSON.stringify(after)
            ? []
            : [[item.key, after]];
        })
      );
      return apiJson.put<{ data: CompletedQuestionnaire }>(
        `worker/${workerId}/engagements/${engagementId}/questionnaire/completed`,
        { revision: questionnaire.revision, answers: corrections }
      );
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(
        ['completed-questionnaire', workerId, engagementId],
        data
      );
      void queryClient.invalidateQueries({
        queryKey: employmentContractKey(workerId, engagementId),
      });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] });
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      toast.success('Fragebogen gespeichert');
      onDone();
    },
    onError: (failure: {
      message?: string;
      status?: number;
      errors?: { path: string; message: string }[];
    }) => {
      if (failure.status === 409) {
        setError(
          'Der Fragebogen wurde inzwischen geändert. Bitte abbrechen und neu öffnen.'
        );
      } else if (failure.status === 400) {
        const labels = questionnaire.items
          .filter((item) =>
            failure.errors?.some(
              (issue) =>
                issue.path === item.key || issue.path.startsWith(`${item.key}.`)
            )
          )
          .map((item) => (item.kind === 'field' ? item.label : item.section));
        setError(
          labels.length
            ? `Bitte Eingaben prüfen: ${labels.join(', ')}.`
            : 'Bitte die eingegebenen Werte prüfen.'
        );
      } else {
        setError(
          failure.message ?? 'Die Änderungen konnten nicht gespeichert werden.'
        );
      }
    },
    onSettled: () => onBusy(false),
  });
  const update = (key: string, value: string | Record<string, string>[]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError('');
        onBusy(true);
        save.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">
        Änderungen werden erst mit „Speichern“ übernommen. Der Vertrag wird
        separat synchronisiert.
      </p>
      <fieldset disabled={save.isPending} className="space-y-6">
        {questionnaire.items.map((item) => {
          const value = answers[item.key];
          if (item.kind === 'repeater')
            return (
              <QuestionnaireRepeatableRows
                key={item.key}
                repeater={{
                  ...item,
                  columns: item.columns.map((column) => ({
                    ...column,
                    officeOnly: false,
                  })),
                }}
                rows={Array.isArray(value) ? value : []}
                onChange={(rows) => update(item.key, rows)}
              />
            );
          if (item.type === 'file')
            return (
              <p key={item.key} className="text-sm">
                {item.label}: {questionnaire.files?.[item.key]?.name ?? '—'}
              </p>
            );
          return (
            <QuestionnaireQuestion
              key={item.key}
              question={{
                ...item,
                required: item.bsbOnly ? false : item.required,
                officeEditable: true,
              }}
              value={typeof value === 'string' ? value : ''}
              onChange={(next) => update(item.key, next)}
            />
          );
        })}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={onDone}
        >
          Abbrechen
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
