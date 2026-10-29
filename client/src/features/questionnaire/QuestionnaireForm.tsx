import './questionnaire-mobile.css';
import { isValidTaxId } from '@shared/taxId';
import {
  QUESTIONNAIRE_DECLARATION_HEADING,
  QUESTIONNAIRE_DECLARATION_TEXT,
} from '@shared/questionnaireDeclaration';
import { mockQuestionnaireValues } from '@shared/questionnaireMock';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiJson } from '@/config/apiClient';
import { isValidInsuranceNumber } from '@shared/insuranceNumber';
import {
  HOURS_DISTRIBUTION_KEY,
  WEEKDAY_HOUR_KEYS,
  isWeekdayHourKey,
  isWeeklyHoursKey,
  normalizeHour,
} from '@shared/weeklyHours';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { QuestionnaireQuestion } from './QuestionnaireQuestion';
import { WeeklyHoursAnswer } from './WeeklyHoursAnswer';
import { QuestionnaireRepeatableRows } from './QuestionnaireRepeatableRows';
import { QuestionnaireTableRows } from './QuestionnaireTableRows';
import type { CandidateItem } from './questionnairePreview';
import type {
  QuestionnaireQuestion as QuestionnaireQuestionData,
  QuestionnaireRepeater,
} from './questionnaire.types';

type QuestionnaireResponse = {
  success: boolean;
  data: {
    status: 'sent' | 'completed';
    staging?: boolean;
    name?: string;
    intro?: string;
    questions?: QuestionnaireQuestionData[];
    repeaters?: QuestionnaireRepeater[];
    items?: Array<
      | (QuestionnaireQuestionData & { kind: 'field' })
      | (QuestionnaireRepeater & { kind: 'repeater' })
    >;
  };
};

type QuestionnaireFormProps = {
  token?: string;
  embedded?: boolean;
  preview?: {
    name?: string;
    intro?: string;
    items: CandidateItem[];
  };
  onPresetChange?: (key: string, value: string) => void;
};

type Section = {
  title: string;
  questions: QuestionnaireQuestionData[];
  repeater?: QuestionnaireRepeater;
};

function unanswered(
  question: QuestionnaireQuestionData,
  values: Record<string, string>,
  questions: QuestionnaireQuestionData[]
) {
  const value = (values[question.key] ?? '').trim();
  if (isWeekdayHourKey(question.key)) {
    const office = questions.some(
      (item) => isWeekdayHourKey(item.key) && item.employerFilled
    );
    const open = office || values[HOURS_DISTRIBUTION_KEY] === 'ja';
    if (!open) return false;
    return value.length > 0 && normalizeHour(value) === null;
  }
  if (question.key === HOURS_DISTRIBUTION_KEY) {
    if (
      questions.some(
        (item) => isWeekdayHourKey(item.key) && item.employerFilled
      )
    )
      return false;
    return Boolean(question.required) && value !== 'ja' && value !== 'nein';
  }
  if (question.key === 'taxId') {
    return value ? !isValidTaxId(value) : Boolean(question.required);
  }
  if (question.key === 'insuranceNumber') {
    if (!value) return Boolean(question.required);
    return !isValidInsuranceNumber(value);
  }
  return Boolean(question.required) && !value;
}

function filledRows(rows: Record<string, string>[]) {
  return rows.filter((row) =>
    Object.values(row).some((value) => value.trim().length > 0)
  );
}

export function QuestionnaireForm({
  token,
  preview,
  embedded,
  onPresetChange,
}: QuestionnaireFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, Record<string, string>[]>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [uploads, setUploads] = useState(0);

  const questionnaire = useQuery({
    queryKey: ['fragebogen', token],
    queryFn: () => apiJson.get<QuestionnaireResponse>(`fragebogen/${token}`),
    enabled: !preview && Boolean(token),
    retry: false,
  });

  const data = preview
    ? {
        status: 'sent' as const,
        name: preview.name,
        intro: preview.intro,
        items: preview.items,
      }
    : questionnaire.data?.data;
  const questions = (
    data?.items?.flatMap((item) => (item.kind === 'field' ? [item] : [])) ??
    data?.questions ??
    []
  ).filter((question) => question.key !== 'declaration');
  const repeaters = data?.repeaters ?? [];

  useEffect(() => {
    if (questions.length === 0) return;
    setValues((current) => {
      if (Object.keys(current).length > 0) return current;
      return Object.fromEntries(
        questions.map((question) => [question.key, question.defaultValue ?? ''])
      );
    });
  }, [questions]);

  const submit = useMutation({
    mutationFn: () => {
      const officeHours = questions.some(
        (question) => isWeekdayHourKey(question.key) && question.employerFilled
      );
      const payload = { ...values };
      if (
        questions.some((question) => isWeekdayHourKey(question.key)) &&
        payload[HOURS_DISTRIBUTION_KEY] !== 'ja' &&
        !officeHours
      ) {
        for (const key of WEEKDAY_HOUR_KEYS) payload[key] = '';
      }
      if (preview)
        return Promise.resolve({
          success: true,
          data: { status: 'completed' as const },
        });
      const tables = Object.fromEntries(
        Object.entries(rows).flatMap(([key, value]) =>
          key.startsWith('rows.') ? [[key, filledRows(value)]] : []
        )
      );
      return apiJson.post<QuestionnaireResponse>(`fragebogen/${token}`, {
        ...payload,
        ...tables,
        children: filledRows(rows.children ?? []),
        priorEmployment: filledRows(rows.priorEmployment ?? []),
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  const remember = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    const question = questions.find((item) => item.key === key);
    if (preview && question?.bsbOnly) onPresetChange?.(key, value);
  };
  const fillStagingDemo = () => {
    const demo = mockQuestionnaireValues([
      ...questions
        .filter((question) => question.type !== 'file')
        .map((question) => ({
          key: question.key,
          type: question.type,
          defaultValue: question.defaultValue,
          options: question.options,
          max: question.max,
          required: question.required,
        })),
      { key: 'declaration', type: 'check', required: true },
    ]);
    setValues((current) => ({
      ...current,
      ...demo,
      declaration: 'ja',
    }));
  };
  const fillsBsb = (question: QuestionnaireQuestionData) =>
    Boolean(preview) && question.bsbOnly === true && question.type !== 'file';

  const done = submitted || data?.status === 'completed';
  const missing =
    values.declaration !== 'ja' ||
    questions.some(
      (question) => !question.bsbOnly && unanswered(question, values, questions)
    );
  const sections = data?.items
    ? data.items
        .filter((item) => item.key !== 'declaration')
        .reduce<Section[]>((list, item) => {
          if (item.kind === 'repeater') {
            list.push({ title: item.section, questions: [], repeater: item });
            return list;
          }
          const current = list.at(-1);
          if (!current || current.repeater || current.title !== item.section) {
            list.push({ title: item.section, questions: [item] });
          } else {
            current.questions.push(item);
          }
          return list;
        }, [])
    : questions.reduce<Section[]>((list, question) => {
        const current = list.at(-1);
        if (!current || current.title !== question.section) {
          list.push({ title: question.section, questions: [question] });
        } else {
          current.questions.push(question);
        }
        return list;
      }, []);
  if (!data?.items) {
    repeaters.forEach((repeater) => {
      const index = sections.findIndex(
        (section) => section.title === repeater.afterSection
      );
      const block = { title: repeater.section, questions: [], repeater };
      if (index === -1) sections.push(block);
      else sections.splice(index + 1, 0, block);
    });
  }

  return (
    <div
      className={
        embedded
          ? undefined
          : 'h-full overflow-y-auto px-2 py-4 sm:px-4 sm:py-8'
      }
    >
      <div
        className={
          embedded
            ? 'w-full'
            : 'mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-4 text-card-foreground sm:p-8 shadow-lg'
        }
      >
        <h1 className="text-xl font-medium">
          {data?.name ?? 'Personalfragebogen'}
        </h1>
        {!preview && questionnaire.isPending ? (
          <LoadingAlert className="min-h-40" />
        ) : null}
        {!preview && questionnaire.isError ? (
          <p className="mt-4 text-sm text-destructive">
            Dieser Link ist ungültig.
          </p>
        ) : null}
        {done ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Danke, Ihre Angaben wurden übermittelt.
          </p>
        ) : null}
        {data?.status === 'sent' && !done ? (
          <form
            className="questionnaire-form mt-6 flex min-w-0 flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (embedded || missing || submit.isPending) return;
              submit.mutate();
            }}
          >
            {data.intro ? (
              <p className="text-sm text-muted-foreground">{data.intro}</p>
            ) : null}
            {sections.map((section, index) => (
              <div
                key={`${index}-${section.title}`}
                className="flex flex-col gap-4"
              >
                {section.repeater ? (
                  section.repeater.key.startsWith('rows.') ? (
                    <QuestionnaireTableRows
                      repeater={section.repeater}
                      rows={rows[section.repeater.key] ?? []}
                      onChange={(next) =>
                        setRows((current) => ({
                          ...current,
                          [section.repeater!.key]: next,
                        }))
                      }
                    />
                  ) : (
                    <QuestionnaireRepeatableRows
                      repeater={section.repeater}
                      rows={rows[section.repeater.key] ?? []}
                      onChange={(next) =>
                        setRows((current) => ({
                          ...current,
                          [section.repeater!.key]: next,
                        }))
                      }
                    />
                  )
                ) : (
                  <>
                    {section.questions.some((question) =>
                      isWeeklyHoursKey(question.key)
                    ) ? (
                      <WeeklyHoursAnswer
                        questions={questions}
                        values={values}
                        fillBsb={section.questions.some(
                          (question) =>
                            isWeekdayHourKey(question.key) && fillsBsb(question)
                        )}
                        onChange={remember}
                      />
                    ) : (
                      <h2 className="pt-2 text-base font-medium text-foreground">
                        {section.title}
                      </h2>
                    )}
                    {section.questions.some((question) =>
                      isWeeklyHoursKey(question.key)
                    ) ? (
                      section.questions
                        .filter((question) => !isWeeklyHoursKey(question.key))
                        .map((question) => (
                          <QuestionnaireQuestion
                            key={question.key}
                            question={question}
                            disabled={
                              question.employerFilled && !fillsBsb(question)
                            }
                            employerFilled={question.employerFilled}
                            fillable={fillsBsb(question)}
                            uploadToken={token}
                            onUploadBusy={(busy) =>
                              setUploads((count) => count + (busy ? 1 : -1))
                            }
                            value={values[question.key] ?? ''}
                            onChange={(value) => remember(question.key, value)}
                          />
                        ))
                    ) : section.questions.every(
                        (question) => question.layout === 'inline'
                      ) ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
                          {section.questions.map((question) => {
                            const open = fillsBsb(question);
                            const locked =
                              !open &&
                              (question.employerFilled || question.bsbOnly);
                            return (
                              <div
                                key={question.key}
                                className="flex flex-col gap-2"
                              >
                                <Label htmlFor={question.key}>
                                  {question.label}
                                </Label>
                                <Input
                                  id={question.key}
                                  disabled={locked}
                                  value={values[question.key] ?? ''}
                                  className={
                                    open
                                      ? 'bg-muted dark:bg-muted'
                                      : locked
                                        ? 'bg-muted text-muted-foreground'
                                        : undefined
                                  }
                                  onChange={(event) =>
                                    remember(question.key, event.target.value)
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                        {section.questions.some(
                          (question) =>
                            !fillsBsb(question) &&
                            (question.employerFilled || question.bsbOnly)
                        ) ? (
                          <p className="text-xs text-muted-foreground">
                            {section.questions.some(
                              (question) => question.bsbOnly
                            )
                              ? 'Nur von BSB auszufüllen'
                              : 'Vom Betrieb ausgefüllt'}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      section.questions.map((question) => (
                        <QuestionnaireQuestion
                          key={question.key}
                          question={question}
                          disabled={
                            (question.employerFilled || question.bsbOnly) &&
                            !fillsBsb(question)
                          }
                          employerFilled={question.employerFilled}
                          fillable={fillsBsb(question)}
                          uploadToken={token}
                          onUploadBusy={(busy) =>
                            setUploads((count) => count + (busy ? 1 : -1))
                          }
                          value={values[question.key] ?? ''}
                          onChange={(value) => remember(question.key, value)}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            ))}
            <label className="mt-4 flex items-start gap-3 border-t border-border pt-4 text-sm text-foreground">
              <input
                type="checkbox"
                name="declaration"
                required
                className="mt-1 size-4 shrink-0 accent-primary"
                checked={values.declaration === 'ja'}
                disabled={submit.isPending}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    declaration: event.target.checked ? 'ja' : '',
                  }))
                }
              />
              <span>
                <strong>{QUESTIONNAIRE_DECLARATION_HEADING}</strong>{' '}
                {QUESTIONNAIRE_DECLARATION_TEXT} *
              </span>
            </label>
            {submit.isError ? (
              <p className="text-sm text-destructive">
                Das Formular konnte nicht gesendet werden.
              </p>
            ) : null}
            {!embedded && data.staging ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={fillStagingDemo}
              >
                Fill out with staging
              </Button>
            ) : null}
            {!embedded ? (
              <Button
                type="submit"
                className="rounded-2xl"
                disabled={missing || submit.isPending || uploads > 0}
              >
                {submit.isPending ? 'Sendet…' : 'Absenden'}
              </Button>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
