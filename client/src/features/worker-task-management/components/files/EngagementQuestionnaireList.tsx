import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/config/apiClient';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import type { CandidateItem } from '@/features/questionnaire/questionnairePreview';
import { StoredFileBox } from './StoredFileBox';
import { QuestionnaireStoredFile } from './QuestionnaireStoredFile';
import { fileQuestionnaireDocuments } from '../../api/questionnaireFiles.api';
import { PERSONNEL_DOCUMENTS } from '../../consts/query-key.consts';
import { toast } from 'sonner';

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
  files?: Record<string, { name: string; url: string; filed: boolean }>;
};

function displayValue(value: string | undefined, type: string) {
  if (!value) return '—';
  if (type === 'file') return '—';
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
  const queryClient = useQueryClient();
  const unfiled = Object.values(data?.files ?? {}).filter((file) => !file.filed);
  const storeAll = useMutation({
    mutationFn: () =>
      fileQuestionnaireDocuments(workerId, questionnaire.engagementId),
    onSuccess: async () => {
      toast.success('Dateien abgelegt');
      await queryClient.invalidateQueries({
        queryKey: ['completed-questionnaire', workerId, questionnaire.engagementId],
      });
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
    onError: () => toast.error('Die Dateien konnten nicht abgelegt werden.'),
  });

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="w-full max-w-4xl border-0 bg-transparent p-0 shadow-none sm:max-w-4xl">
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
            {unfiled.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl"
                disabled={storeAll.isPending}
                onClick={() => storeAll.mutate()}
              >
                {storeAll.isPending ? 'Legt ab…' : 'Alle Dateien ablegen'}
              </Button>
            ) : null}
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
                      {item.type === 'file' ? (
                        data.files?.[item.key] ? (
                          <QuestionnaireStoredFile
                            workerId={workerId}
                            engagementId={questionnaire.engagementId}
                            questionKey={item.key}
                            file={data.files[item.key]}
                          />
                        ) : (
                          '—'
                        )
                      ) : (
                        displayValue(
                          typeof value === 'string' ? value : undefined,
                          item.type
                        )
                      )}
                    </dd>
                  </dl>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      </DialogContent>
    </Dialog>
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
      {questionnaires.map((questionnaire) => (
        <StoredFileBox
          key={questionnaire.id}
          label="Fragebogen"
          icon={FileText}
          onOpen={() => setSelected(questionnaire)}
        />
      ))}
      {selected
        ? createPortal(
            <QuestionnairePreview
              key={selected.id}
              workerId={workerId}
              questionnaire={selected}
              onClose={() => setSelected(null)}
            />,
            document.body
          )
        : null}
    </>
  );
}
