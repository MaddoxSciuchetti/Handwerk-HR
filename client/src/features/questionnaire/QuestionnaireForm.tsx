import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiJson } from '@/config/apiClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { QuestionnaireQuestion } from './QuestionnaireQuestion';
import { QuestionnaireRepeatableRows } from './QuestionnaireRepeatableRows';
import type {
  QuestionnaireQuestion as QuestionnaireQuestionData,
  QuestionnaireRepeater,
} from './questionnaire.types';

type QuestionnaireResponse = {
  success: boolean;
  data: {
    status: 'sent' | 'completed';
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
  token: string;
};

type Section = {
  title: string;
  questions: QuestionnaireQuestionData[];
  repeater?: QuestionnaireRepeater;
};

function filledRows(rows: Record<string, string>[]) {
  return rows.filter((row) =>
    Object.values(row).some((value) => value.trim().length > 0)
  );
}

export function QuestionnaireForm({ token }: QuestionnaireFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, Record<string, string>[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const questionnaire = useQuery({
    queryKey: ['fragebogen', token],
    queryFn: () => apiJson.get<QuestionnaireResponse>(`fragebogen/${token}`),
    retry: false,
  });

  const data = questionnaire.data?.data;
  const questions =
    data?.items?.flatMap((item) => (item.kind === 'field' ? [item] : [])) ??
    data?.questions ??
    [];
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
    mutationFn: () =>
      apiJson.post<QuestionnaireResponse>(`fragebogen/${token}`, {
        ...values,
        children: filledRows(rows.children ?? []),
        priorEmployment: filledRows(rows.priorEmployment ?? []),
      }),
    onSuccess: () => setSubmitted(true),
  });

  const done = submitted || data?.status === 'completed';
  const missing = questions.some(
    (question) => question.required && !(values[question.key] ?? '').trim()
  );
  const sections = data?.items
    ? data.items.reduce<Section[]>((list, item) => {
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
      const index = sections.findIndex((section) => section.title === repeater.afterSection);
      const block = { title: repeater.section, questions: [], repeater };
      if (index === -1) sections.push(block);
      else sections.splice(index + 1, 0, block);
    });
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-8 text-card-foreground shadow-lg">
        <h1 className="text-xl font-medium">Personalfragebogen</h1>
        {questionnaire.isPending ? <LoadingAlert className="min-h-40" /> : null}
        {questionnaire.isError ? (
          <p className="mt-4 text-sm text-destructive">Dieser Link ist ungültig.</p>
        ) : null}
        {done ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Danke, Ihre Angaben wurden übermittelt.
          </p>
        ) : null}
        {data?.status === 'sent' && !done ? (
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (missing || submit.isPending) return;
              submit.mutate();
            }}
          >
            {data.intro ? <p className="text-sm text-muted-foreground">{data.intro}</p> : null}
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-4">
                {section.repeater ? (
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
                ) : (
                  <>
                    <h2 className="pt-2 text-base font-medium text-foreground">
                      {section.title}
                    </h2>
                    {section.questions.every((question) => question.layout === 'inline') ? (
                      <>
                      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                        {section.questions.map((question) => (
                          <div key={question.key} className="flex flex-col gap-2">
                            <Label htmlFor={question.key}>{question.label}</Label>
                            <Input
                              id={question.key}
                              disabled={question.employerFilled}
                              value={values[question.key] ?? ''}
                              className={
                                question.employerFilled
                                  ? 'bg-muted text-muted-foreground'
                                  : undefined
                              }
                              onChange={(event) =>
                                setValues((current) => ({
                                  ...current,
                                  [question.key]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                      {section.questions.some((question) => question.employerFilled) ? (
                        <p className="text-xs text-muted-foreground">Vom Betrieb ausgefüllt</p>
                      ) : null}
                      </>
                    ) : (
                      section.questions.map((question) => (
                        <QuestionnaireQuestion
                          key={question.key}
                          question={question}
                          disabled={question.employerFilled}
                          employerFilled={question.employerFilled}
                          value={values[question.key] ?? ''}
                          onChange={(value) =>
                            setValues((current) => ({
                              ...current,
                              [question.key]: value,
                            }))
                          }
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            ))}
            {submit.isError ? (
              <p className="text-sm text-destructive">
                Das Formular konnte nicht gesendet werden.
              </p>
            ) : null}
            <Button type="submit" className="rounded-2xl" disabled={missing || submit.isPending}>
              {submit.isPending ? 'Sendet…' : 'Absenden'}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
