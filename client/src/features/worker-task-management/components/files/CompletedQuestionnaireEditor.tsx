import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/config/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { QuestionnaireQuestion } from '@/features/questionnaire/QuestionnaireQuestion';
import { QuestionnaireRepeatableRows } from '@/features/questionnaire/QuestionnaireRepeatableRows';
import { QuestionnaireSectionCard } from '@/features/questionnaire/QuestionnaireSectionCard';
import { QuestionnaireTableRows } from '@/features/questionnaire/QuestionnaireTableRows';
import { WeeklyHoursAnswer } from '@/features/questionnaire/WeeklyHoursAnswer';
import type {
  QuestionnaireQuestion as QuestionnaireQuestionData,
  QuestionnaireRepeater,
} from '@/features/questionnaire/questionnaire.types';
import { isWeekdayHourKey, isWeeklyHoursKey } from '@shared/weeklyHours';
import { employmentContractKey } from '../../hooks/useEmploymentContract';
import { WORKERBYID } from '../../consts/query-key.consts';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import type { CompletedQuestionnaire } from './EngagementQuestionnaireList';

function SavingField({
  saving,
  children,
}: {
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <div
      aria-busy={saving || undefined}
      className={
        saving
          ? '[&_input]:bg-muted [&_textarea]:bg-muted [&_select]:bg-muted'
          : undefined
      }
    >
      {children}
    </div>
  );
}

type Props = {
  workerId: string;
  engagementId: string;
  questionnaire: CompletedQuestionnaire;
  onClose: () => void;
  onBusy: (busy: boolean) => void;
  onFlushReady?: (flush: () => Promise<void>) => void;
};

type Section = {
  title: string;
  optional?: boolean;
  questions: QuestionnaireQuestionData[];
  repeater?: QuestionnaireRepeater;
};

type Answers = CompletedQuestionnaire['answers'];

const AUTOSAVE_MS = 300;

function buildSections(items: CompletedQuestionnaire['items']): Section[] {
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

function correctionsFrom(
  items: CompletedQuestionnaire['items'],
  before: Answers,
  after: Answers
) {
  return Object.fromEntries(
    items.flatMap((item) => {
      if (item.kind === 'field' && item.type === 'file') return [];
      const previous = before[item.key] ?? (item.kind === 'repeater' ? [] : '');
      const next = after[item.key] ?? (item.kind === 'repeater' ? [] : '');
      return JSON.stringify(previous) === JSON.stringify(next)
        ? []
        : [[item.key, next]];
    })
  );
}

export function CompletedQuestionnaireEditor({
  workerId,
  engagementId,
  questionnaire: initialQuestionnaire,
  onClose,
  onBusy,
  onFlushReady,
}: Props) {
  // Freeze structure from open; revision/answers advance via autosave refs.
  const [questionnaire] = useState(initialQuestionnaire);
  const [answers, setAnswers] = useState(() =>
    structuredClone(questionnaire.answers)
  );
  const [status, setStatus] = useState<'saved' | 'pending' | 'error'>('saved');
  const [savingKeys, setSavingKeys] = useState<string[]>([]);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const questions = questionnaire.items.flatMap((item) =>
    item.kind === 'field' ? [item] : []
  );
  const sections = buildSections(questionnaire.items);
  const saving = savingKeys.length > 0;

  const answersRef = useRef(answers);
  const savedRef = useRef(structuredClone(questionnaire.answers));
  const revisionRef = useRef(questionnaire.revision);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const runningRef = useRef(false);
  const queuedRef = useRef(false);
  const mountedRef = useRef(true);

  answersRef.current = answers;

  const persist = async () => {
    if (runningRef.current) {
      queuedRef.current = true;
      return;
    }
    runningRef.current = true;
    onBusy(true);
    try {
      while (true) {
        queuedRef.current = false;
        const snapshot = structuredClone(answersRef.current);
        const corrections = correctionsFrom(
          questionnaire.items,
          savedRef.current,
          snapshot
        );
        const keys = Object.keys(corrections);
        if (keys.length === 0) {
          if (mountedRef.current) {
            setSavingKeys([]);
            setStatus('saved');
            setError('');
          }
          break;
        }
        if (mountedRef.current) setSavingKeys(keys);
        try {
          const { data } = await apiJson.put<{ data: CompletedQuestionnaire }>(
            `worker/${workerId}/engagements/${engagementId}/questionnaire/completed`,
            { revision: revisionRef.current, answers: corrections }
          );
          revisionRef.current = data.revision;
          savedRef.current = structuredClone(data.answers);
          queryClient.setQueryData(
            ['completed-questionnaire', workerId, engagementId],
            data
          );
          void queryClient.invalidateQueries({
            queryKey: employmentContractKey(workerId, engagementId),
          });
          void queryClient.invalidateQueries({
            queryKey: [WORKERBYID, workerId],
          });
          void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
          if (!queuedRef.current && mountedRef.current) {
            setSavingKeys([]);
            setStatus('saved');
            setError('');
          }
        } catch (failure: unknown) {
          const issue = failure as {
            message?: string;
            status?: number;
            errors?: { path: string; message: string }[];
          };
          if (mountedRef.current) {
            setSavingKeys([]);
            setStatus('error');
            if (issue.status === 409) {
              setError(
                'Der Fragebogen wurde inzwischen geändert. Bitte schließen und neu öffnen.'
              );
            } else if (issue.status === 400) {
              const labels = questionnaire.items
                .filter((item) =>
                  issue.errors?.some(
                    (entry) =>
                      entry.path === item.key ||
                      entry.path.startsWith(`${item.key}.`)
                  )
                )
                .map((item) => {
                  if (item.kind === 'field') return item.label;
                  if (item.kind === 'repeater') return item.section;
                  return item.title;
                });
              setError(
                labels.length
                  ? `Bitte Eingaben prüfen: ${labels.join(', ')}.`
                  : 'Bitte die eingegebenen Werte prüfen.'
              );
            } else {
              setError(
                issue.message ??
                  'Die Änderungen konnten nicht gespeichert werden.'
              );
            }
          }
          break;
        }
        if (!queuedRef.current) break;
      }
    } finally {
      runningRef.current = false;
      if (mountedRef.current && !queuedRef.current) setSavingKeys([]);
      onBusy(false);
    }
  };

  const scheduleSave = () => {
    setStatus('pending');
    setError('');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void persist(), AUTOSAVE_MS);
  };

  const flush = async () => {
    clearTimeout(timerRef.current);
    await persist();
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    mountedRef.current = true;
    onFlushReady?.(() => flushRef.current());
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, [onFlushReady]);

  const update = (key: string, value: string | Record<string, string>[]) => {
    setAnswers((current) => {
      const next = { ...current, [key]: value };
      answersRef.current = next;
      return next;
    });
    scheduleSave();
  };

  const close = async () => {
    await flush();
    if (mountedRef.current) onClose();
  };

  const fieldValue = (key: string) => {
    const value = answers[key];
    return typeof value === 'string' ? value : '';
  };
  const fieldValues = Object.fromEntries(
    questions.map((question) => [question.key, fieldValue(question.key)])
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-medium">
            {questionnaire.name ?? 'Personalfragebogen'}
          </h1>
          {questionnaire.intro ? (
            <p className="text-sm text-muted-foreground">
              {questionnaire.intro}
            </p>
          ) : null}
          <div className="flex flex-col gap-4">
            {sections.map((section, index) => {
              const weekly = section.questions.some((question) =>
                isWeeklyHoursKey(question.key)
              );
              const value = section.repeater
                ? answers[section.repeater.key]
                : undefined;
              const rows = Array.isArray(value) ? value : [];
              const repeaterSaving = Boolean(
                section.repeater && savingKeys.includes(section.repeater.key)
              );
              const weeklySaving = section.questions.some(
                (question) =>
                  isWeeklyHoursKey(question.key) &&
                  savingKeys.includes(question.key)
              );
              const repeaterBlock = section.repeater ? (
                <SavingField saving={repeaterSaving}>
                  {section.repeater.key.startsWith('rows.') ? (
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
                  )}
                </SavingField>
              ) : null;

              return (
                <QuestionnaireSectionCard
                  key={`${index}-${section.title}`}
                  title={section.title}
                  optional={section.optional}
                >
                  {section.questions.length === 0 && repeaterBlock ? (
                    repeaterBlock
                  ) : weekly ? (
                    <>
                      <SavingField saving={weeklySaving}>
                        <WeeklyHoursAnswer
                          questions={questions}
                          values={fieldValues}
                          fillBsb={section.questions.some((question) =>
                            isWeekdayHourKey(question.key)
                          )}
                          onChange={(key, next) => update(key, next)}
                        />
                      </SavingField>
                      {section.questions
                        .filter((question) => !isWeeklyHoursKey(question.key))
                        .map((question) =>
                          question.type === 'file' ? (
                            <p key={question.key} className="text-sm">
                              {question.label}:{' '}
                              {questionnaire.files?.[question.key]?.name ?? '—'}
                            </p>
                          ) : (
                            <SavingField
                              key={question.key}
                              saving={savingKeys.includes(question.key)}
                            >
                              <QuestionnaireQuestion
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
                            </SavingField>
                          )
                        )}
                    </>
                  ) : section.questions.every(
                      (question) => question.layout === 'inline'
                    ) ? (
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                      {section.questions.map((question) => (
                        <SavingField
                          key={question.key}
                          saving={savingKeys.includes(question.key)}
                        >
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={question.key}>
                              {question.label}
                            </Label>
                            <Input
                              id={question.key}
                              value={fieldValue(question.key)}
                              onChange={(event) =>
                                update(question.key, event.target.value)
                              }
                            />
                          </div>
                        </SavingField>
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
                        <SavingField
                          key={question.key}
                          saving={savingKeys.includes(question.key)}
                        >
                          <QuestionnaireQuestion
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
                        </SavingField>
                      )
                    )
                  )}
                  {section.questions.length > 0 ? repeaterBlock : null}
                </QuestionnaireSectionCard>
              );
            })}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3">
        {status === 'pending' || saving ? (
          <Spinner
            className="size-4 text-muted-foreground"
            aria-label="Speichert…"
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={() => void close()}
        >
          Schließen
        </Button>
      </div>
    </div>
  );
}
