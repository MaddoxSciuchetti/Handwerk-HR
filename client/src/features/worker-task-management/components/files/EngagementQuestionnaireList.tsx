import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { apiJson } from '@/config/apiClient';
import ModalOverlay from '@/components/modal/ModalOverlay';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import type { CandidateItem } from '@/features/questionnaire/questionnairePreview';

export type EngagementQuestionnaireLink = {
  name?: string;
  id: string;
  engagementId: string;
  engagementLabel: string;
  completedAt?: string | null;
};

type CompletedQuestionnaire = {
  name?: string;
  intro: string;
  items: CandidateItem[];
  answers: Record<string, string | Record<string, string>[]>;
};

function displayValue(value: string | undefined, type: string) {
  if (!value) return '—';
  if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.split('-').reverse().join('.');
  }
  return value;
}

function QuestionnairePreview({
  workerId,
  questionnaire,
  onClose,
}: {
  workerId: string;
  questionnaire: EngagementQuestionnaireLink;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['completed-questionnaire', workerId, questionnaire.engagementId],
    queryFn: () =>
      apiJson
        .get<{
          success: boolean;
          data: CompletedQuestionnaire;
        }>(
          `worker/${workerId}/engagements/${questionnaire.engagementId}/questionnaire/completed`
        )
        .then((response) => response.data),
  });

  return (
    <ModalOverlay handleToggle={onClose} size="max-w-4xl">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
        <div className="pr-8">
          <h2 className="text-lg font-semibold">Fragebogen</h2>
          {data?.name ? (
            <p className="text-sm font-medium">{data.name}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {questionnaire.engagementLabel} · Ausgefüllt
          </p>
        </div>
        {isLoading ? <LoadingAlert /> : null}
        {isError ? (
          <p role="alert" className="text-sm text-destructive">
            Der ausgefüllte Fragebogen konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <div className="space-y-6 overflow-auto">
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {data.intro}
            </p>
            {data.items.map((item, index) => {
              const value = data.answers[item.key];
              if (item.kind === 'repeater') {
                const rows = Array.isArray(value) ? value : [];
                return (
                  <section key={item.key}>
                    <h3 className="mb-3 font-semibold">{item.section}</h3>
                    {rows.length ? (
                      rows.map((row, rowIndex) => (
                        <dl
                          key={rowIndex}
                          className="mb-3 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3"
                        >
                          {item.columns.map((column) => (
                            <div key={column.key}>
                              <dt className="text-sm text-muted-foreground">
                                {column.label}
                              </dt>
                              <dd className="text-sm whitespace-pre-wrap break-words">
                                {displayValue(row[column.key], column.type)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Keine Angaben
                      </p>
                    )}
                  </section>
                );
              }
              return (
                <div key={item.key}>
                  {index === 0 ||
                  data.items[index - 1].section !== item.section ? (
                    <h3 className="mb-3 font-semibold">{item.section}</h3>
                  ) : null}
                  <dl className="grid gap-2 border-b border-border pb-3 sm:grid-cols-2">
                    <dt className="text-sm text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-sm whitespace-pre-wrap break-words">
                      {displayValue(
                        typeof value === 'string' ? value : undefined,
                        item.type
                      )}
                    </dd>
                  </dl>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </ModalOverlay>
  );
}

export function EngagementQuestionnaireList({
  workerId,
  questionnaires,
}: {
  workerId: string;
  questionnaires: EngagementQuestionnaireLink[];
}) {
  const [selected, setSelected] = useState<EngagementQuestionnaireLink | null>(
    null
  );
  if (!questionnaires.length) return null;

  return (
    <>
      <ul className="space-y-2 p-2">
        {questionnaires.map((questionnaire) => (
          <li key={questionnaire.id}>
            <button
              type="button"
              onClick={() => setSelected(questionnaire)}
              className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left hover:bg-primary/10"
            >
              <ClipboardCheck
                className="size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-primary">
                  Fragebogen
                </span>
                {questionnaire.name ? (
                  <p className="text-sm font-medium">{questionnaire.name}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {questionnaire.engagementLabel}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                Ausgefüllt
                {questionnaire.completedAt
                  ? ` · ${new Date(questionnaire.completedAt).toLocaleDateString('de-DE')}`
                  : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <QuestionnairePreview
          key={selected.id}
          workerId={workerId}
          questionnaire={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
