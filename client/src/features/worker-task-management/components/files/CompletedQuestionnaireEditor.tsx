import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/config/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuestionnaireQuestion } from '@/features/questionnaire/QuestionnaireQuestion';
import { QuestionnaireRepeatableRows } from '@/features/questionnaire/QuestionnaireRepeatableRows';
import { QuestionnaireSectionCard } from '@/features/questionnaire/QuestionnaireSectionCard';
import { QuestionnaireTableRows } from '@/features/questionnaire/QuestionnaireTableRows';
import { WeeklyHoursAnswer } from '@/features/questionnaire/WeeklyHoursAnswer';
import type {
  QuestionnaireQuestion as QuestionnaireQuestionData,
  QuestionnaireRepeater,
} from '@/features/questionnaire/questionnaire.types';
import {
  isWeekdayHourKey,
  isWeeklyHoursKey,
} from '@shared/weeklyHours';
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

type Section = {
  title: string;
  optional?: boolean;
  questions: QuestionnaireQuestionData[];
  repeater?: QuestionnaireRepeater;
};

function buildSections(
  items: CompletedQuestionnaire['items']
): Section[] {
  const editableItems = items.filter((item) => item.key !== 'declaration');
  const hasHeadlines = editableItems.some((item) => item.kind === 'section');
  return editableItems.reduce<Section[]>((list, item) => {
    if (item.kind === 'section') {
      list.push({
        title: item.title,
        optional: item.optional,
        questions: [],
      });
      return list;
    }
    if (item.kind === 'repeater') {
      if (hasHeadlines) {
        const current = list.at(-1);
        if (current && !current.repeater && current.questions.length === 0) {
          current.repeater = item;
          return list;
        }
        if (current && !current.repeater) {
          current.repeater = item;
          return list;
        }
      }
      list.push({ title: item.section, questions: [], repeater: item });
      return list;
    }
    if (hasHeadlines) {
      const current = list.at(-1);
      if (!current) {
        list.push({ title: item.section, questions: [item] });
      } else if (current.repeater && current.questions.length > 0) {
        list.push({
          title: current.title,
          optional: current.optional,
          questions: [item],
        });
      } else {
        current.questions.push(item);
      }
      return list;
    }
    const current = list.at(-1);
    if (!current || current.repeater || current.title !== item.section) {
      list.push({ title: item.section, questions: [item] });
    } else {
      current.questions.push(item);
    }
    return list;
  }, []);
}

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
  const questions = questionnaire.items.flatMap((item) =>
    item.kind === 'field' ? [item] : []
  );
  const sections = buildSections(questionnaire.items);
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
  const fieldValue = (key: string) => {
    const value = answers[key];
    return typeof value === 'string' ? value : '';
  };
  const fieldValues = Object.fromEntries(
    questions.map((question) => [question.key, fieldValue(question.key)])
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError('');
        onBusy(true);
        save.mutate();
      }}
    >
      <h1 className="text-xl font-medium">
        {questionnaire.name ?? 'Personalfragebogen'}
      </h1>
      {questionnaire.intro ? (
        <p className="text-sm text-muted-foreground">{questionnaire.intro}</p>
      ) : null}
      <fieldset disabled={save.isPending} className="flex flex-col gap-4">
        {sections.map((section, index) => {
          const weekly = section.questions.some((question) =>
            isWeeklyHoursKey(question.key)
          );
          const value = section.repeater
            ? answers[section.repeater.key]
            : undefined;
          const rows = Array.isArray(value) ? value : [];
          const repeaterBlock = section.repeater ? (
            section.repeater.key.startsWith('rows.') ? (
              <QuestionnaireTableRows
                repeater={{
                  ...section.repeater,
                  columns: section.repeater.columns.map((column) => ({
                    ...column,
                    officeOnly: false,
                  })),
                }}
                rows={rows}
                onChange={(next) => update(section.repeater!.key, next)}
              />
            ) : (
              <QuestionnaireRepeatableRows
                repeater={{
                  ...section.repeater,
                  columns: section.repeater.columns.map((column) => ({
                    ...column,
                    officeOnly: false,
                  })),
                }}
                rows={rows}
                onChange={(next) => update(section.repeater!.key, next)}
              />
            )
          ) : null;

          return (
            <QuestionnaireSectionCard
              key={`${index}-${section.title}`}
              title={section.title}
              optional={section.optional}
            >
              {section.questions.length === 0 && repeaterBlock
                ? repeaterBlock
                : weekly ? (
                    <>
                      <WeeklyHoursAnswer
                        questions={questions}
                        values={fieldValues}
                        fillBsb={section.questions.some((question) =>
                          isWeekdayHourKey(question.key)
                        )}
                        onChange={(key, next) => update(key, next)}
                      />
                      {section.questions
                        .filter((question) => !isWeeklyHoursKey(question.key))
                        .map((question) =>
                          question.type === 'file' ? (
                            <p key={question.key} className="text-sm">
                              {question.label}:{' '}
                              {questionnaire.files?.[question.key]?.name ?? '—'}
                            </p>
                          ) : (
                            <QuestionnaireQuestion
                              key={question.key}
                              question={{
                                ...question,
                                required: question.bsbOnly
                                  ? false
                                  : question.required,
                                officeEditable: true,
                              }}
                              value={fieldValue(question.key)}
                              onChange={(next) => update(question.key, next)}
                            />
                          )
                        )}
                    </>
                  ) : section.questions.every(
                      (question) => question.layout === 'inline'
                    ) ? (
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                      {section.questions.map((question) => (
                        <div key={question.key} className="flex flex-col gap-2">
                          <Label htmlFor={question.key}>{question.label}</Label>
                          <Input
                            id={question.key}
                            value={fieldValue(question.key)}
                            onChange={(event) =>
                              update(question.key, event.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    section.questions.map((question) =>
                      question.type === 'file' ? (
                        <p key={question.key} className="text-sm">
                          {question.label}:{' '}
                          {questionnaire.files?.[question.key]?.name ?? '—'}
                        </p>
                      ) : (
                        <QuestionnaireQuestion
                          key={question.key}
                          question={{
                            ...question,
                            required: question.bsbOnly
                              ? false
                              : question.required,
                            officeEditable: true,
                          }}
                          value={fieldValue(question.key)}
                          onChange={(next) => update(question.key, next)}
                        />
                      )
                    )
                  )}
              {section.questions.length > 0 ? repeaterBlock : null}
            </QuestionnaireSectionCard>
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
          className="rounded-2xl"
          disabled={save.isPending}
          onClick={onDone}
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          className="rounded-2xl"
          disabled={save.isPending}
        >
          {save.isPending ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
