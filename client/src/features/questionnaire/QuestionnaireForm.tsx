import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiJson } from '@/config/apiClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Question = {
  key: string;
  label: string;
  type: 'text' | 'date';
};

type QuestionnaireResponse = {
  success: boolean;
  data: {
    status: 'sent' | 'completed';
    questions?: Question[];
  };
};

type QuestionnaireFormProps = {
  token: string;
};

export function QuestionnaireForm({ token }: QuestionnaireFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questionnaire = useQuery({
    queryKey: ['fragebogen', token],
    queryFn: () =>
      apiJson.get<QuestionnaireResponse>(`fragebogen/${token}`),
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      apiJson.post<QuestionnaireResponse>(`fragebogen/${token}`, values),
    onSuccess: () => setSubmitted(true),
  });

  const data = questionnaire.data?.data;
  const questions = data?.questions ?? [];
  const done = submitted || data?.status === 'completed';
  const missing = questions.some((question) => !(values[question.key] ?? '').trim());

  return (
    <div className="flex h-dvh w-full items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-card-foreground shadow-lg">
        <h1 className="text-xl font-medium">Personalfragebogen</h1>
        {questionnaire.isPending ? <LoadingAlert className="min-h-40" /> : null}
        {questionnaire.isError ? (
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
            className="mt-6 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (missing || submit.isPending) return;
              submit.mutate();
            }}
          >
            {questions.map((question) => (
              <div key={question.key} className="flex flex-col gap-2">
                <Label htmlFor={question.key}>{question.label}</Label>
                <Input
                  id={question.key}
                  type={question.type}
                  required
                  value={values[question.key] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [question.key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            {submit.isError ? (
              <p className="text-sm text-destructive">
                Das Formular konnte nicht gesendet werden.
              </p>
            ) : null}
            <Button
              type="submit"
              className="rounded-2xl"
              disabled={missing || submit.isPending}
            >
              {submit.isPending ? 'Sendet…' : 'Absenden'}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
