import { printContent } from '../../printStoredFile';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/config/apiClient';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import type { CandidateItem } from '@/features/questionnaire/questionnairePreview';
import { StoredFileBox } from './StoredFileBox';
import { fileQuestionnaireDocuments } from '../../api/questionnaireFiles.api';
import { PERSONNEL_DOCUMENTS } from '../../consts/query-key.consts';
import { toast } from 'sonner';
import { CompletedQuestionnaireEditor } from './CompletedQuestionnaireEditor';

export type EngagementQuestionnaireLink = {
  name?: string;
  id: string;
  engagementId: string;
  engagementLabel: string;
  completedAt?: string | null;
};

export type CompletedQuestionnaire = {
  revision: number;
  updatedAt?: string;
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

function buildQuestionnairePrintContent(
  data: CompletedQuestionnaire,
  engagementLabel: string
) {
  const content = document.createElement('article');
  const add = (tag: string, text: string) => {
    const element = document.createElement(tag);
    element.textContent = text;
    content.append(element);
  };
  add('h1', data.name || 'Fragebogen');
  add('p', engagementLabel);
  add('p', data.intro);
  data.items.forEach((item) => {
    if (item.kind === 'section') {
      add('h2', item.title);
      return;
    }
    const value = data.answers[item.key];
    if (item.kind === 'repeater') {
      const rows = Array.isArray(value) ? value : [];
      if (!rows.length) add('p', 'Keine Angaben');
      rows.forEach((row, rowIndex) => {
        add('h3', `${rowIndex + 1}.`);
        item.columns.forEach((column) => {
          add('dt', column.label);
          add('dd', displayValue(row[column.key], column.type));
        });
      });
    } else {
      add('dt', item.label);
      add(
        'dd',
        item.type === 'file'
          ? data.files?.[item.key]?.name || '—'
          : displayValue(
              typeof value === 'string' ? value : undefined,
              item.type
            )
      );
    }
  });
  return content;
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
  const [saving, setSaving] = useState(false);
  const flushRef = useRef<() => Promise<void>>(async () => undefined);
  const queryClient = useQueryClient();
  const unfiled = Object.values(data?.files ?? {}).filter((file) => !file.filed);
  const storeAll = useMutation({
    mutationFn: () =>
      fileQuestionnaireDocuments(workerId, questionnaire.engagementId),
    onSuccess: async () => {
      toast.success('Dateien abgelegt');
      await queryClient.invalidateQueries({
        queryKey: [
          'completed-questionnaire',
          workerId,
          questionnaire.engagementId,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
    onError: () => toast.error('Die Dateien konnten nicht abgelegt werden.'),
  });

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (next || saving) return;
        void (async () => {
          await flushRef.current();
          onClose();
        })();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="w-full max-w-3xl border-0 bg-transparent p-0 shadow-none sm:max-w-3xl"
      >
        <div className="flex h-[80vh] flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 text-card-foreground">
          <DialogTitle className="sr-only">Fragebogen</DialogTitle>
          {isLoading ? <LoadingAlert /> : null}
          {isError ? (
            <p role="alert" className="text-sm text-destructive">
              Der ausgefüllte Fragebogen konnte nicht geladen werden.
            </p>
          ) : null}
          {data ? (
            <>
              {unfiled.length > 0 ? (
                <div className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    disabled={storeAll.isPending || saving}
                    onClick={() => storeAll.mutate()}
                  >
                    {storeAll.isPending ? 'Legt ab…' : 'Alle Dateien ablegen'}
                  </Button>
                </div>
              ) : null}
              <div className="min-h-0 flex-1">
                <CompletedQuestionnaireEditor
                  workerId={workerId}
                  engagementId={questionnaire.engagementId}
                  questionnaire={data}
                  onClose={onClose}
                  onBusy={setSaving}
                  onFlushReady={(flush) => {
                    flushRef.current = flush;
                  }}
                />
              </div>
            </>
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
  const printCache = useRef(
    new Map<string, Promise<{ data: CompletedQuestionnaire }>>()
  );

  const loadCompleted = (engagementId: string) => {
    const cached = printCache.current.get(engagementId);
    if (cached) return cached;
    const pending = apiJson
      .get<{ data: CompletedQuestionnaire }>(
        `worker/${workerId}/engagements/${engagementId}/questionnaire/completed`
      )
      .catch((error) => {
        printCache.current.delete(engagementId);
        throw error;
      });
    printCache.current.set(engagementId, pending);
    return pending;
  };

  if (!questionnaires.length) return null;

  return (
    <>
      {questionnaires.map((questionnaire) => (
        <StoredFileBox
          key={questionnaire.id}
          label="Fragebogen"
          icon={FileText}
          onOpen={() => setSelected(questionnaire)}
          onPrefetchPrint={() => {
            void loadCompleted(questionnaire.engagementId);
          }}
          onPrint={async () => {
            const { data } = await loadCompleted(questionnaire.engagementId);
            await printContent(
              data.name || 'Fragebogen',
              buildQuestionnairePrintContent(
                data,
                questionnaire.engagementLabel
              )
            );
          }}
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
