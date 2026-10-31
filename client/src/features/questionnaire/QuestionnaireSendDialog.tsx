import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  QuestionnaireStack,
  type DragPayload,
} from '@/features/settings/questionnaire/QuestionnaireStack';
import {
  blocksFromItems,
  itemsFromBlocks,
} from '@/features/settings/questionnaire/questionnaireBlocks';
import type {
  ContractFieldOption,
  TemplateItem,
  TemplateField,
  TemplateRepeater,
  TemplateSection,
} from '@/features/settings/questionnaire/questionnaireTemplate.types';
import {
  ensureSectionHeadlines,
  setSectionOmitted,
  syncItemsToHeadlines,
} from '@shared/questionnaireSections';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiJson } from '@/config/apiClient';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import {
  PERSONNEL_DOCUMENTS,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  QuestionnaireQuestion as QuestionnaireQuestionData,
  QuestionnaireRepeater,
} from './questionnaire.types';

type DraftResponse = {
  success: boolean;
  data: {
    workerId: string;
    engagementId: string;
    email: string | null;
    sent: boolean;
    status?: 'sent' | 'completed' | null;
    mockEnabled?: boolean;
    intro?: string;
    name?: string;
    questions: QuestionnaireQuestionData[];
    repeaters: QuestionnaireRepeater[];
    items?: TemplateItem[];
    contractFields?: ContractFieldOption[];
  };
};

type SendResponse = {
  success: boolean;
  data: { emailSent: boolean; mockCompleted?: boolean };
};

type QuestionnaireSendDialogProps = {
  engagementId: string;
  onClose: () => void;
};

export function QuestionnaireSendDialog({
  engagementId,
  onClose,
}: QuestionnaireSendDialogProps) {
  const cache = useQueryClient();
  const sendButton = useRef<HTMLButtonElement>(null);
  const [localItems, setLocalItems] = useState<TemplateItem[] | null>(null);
  const draft = useQuery({
    queryKey: ['questionnaire-draft', engagementId],
    queryFn: () =>
      apiJson.get<DraftResponse>(
        `/worker/engagements/${engagementId}/questionnaire`
      ),
  });
  const data = draft.data?.data;
  const items: TemplateItem[] = ensureSectionHeadlines(
    localItems ??
      data?.items ?? [
        ...(data?.questions ?? []).map((question) => ({
          ...question,
          kind: 'field' as const,
        })),
        ...(data?.repeaters ?? []).map((repeater) => ({
          ...repeater,
          kind: 'repeater' as const,
          key: repeater.key as 'children' | 'priorEmployment',
        })),
      ]
  ) as TemplateItem[];
  const blocks = blocksFromItems(items);
  const changeField = (field: TemplateField) =>
    setLocalItems((current) =>
      (current ?? items).map((item) => (item.key === field.key ? field : item))
    );
  const changeRepeater = (repeater: TemplateRepeater) =>
    setLocalItems((current) =>
      (current ?? items).map((item) =>
        item.key === repeater.key ? repeater : item
      )
    );
  const changeSection = (section: TemplateSection) =>
    setLocalItems((current) => {
      const list = current ?? items;
      const previous = list.find(
        (item) => item.kind === 'section' && item.key === section.key
      );
      const oldTitle =
        previous && previous.kind === 'section' ? previous.title : section.title;
      return list.map((item) => {
        if (item.kind === 'section' && item.key === section.key) return section;
        if (
          item.kind !== 'section' &&
          oldTitle !== section.title &&
          item.section === oldTitle
        ) {
          return { ...item, section: section.title };
        }
        return item;
      });
    });
  const insertItems = (index: number, incoming: TemplateItem[]) => {
    const placed = new Set(items.map((item) => item.key));
    const offset = blocks
      .slice(0, index)
      .reduce((sum, block) => sum + block.items.length, 0);
    const next = [...items];
    next.splice(offset, 0, ...incoming.filter((item) => !placed.has(item.key)));
    setLocalItems(syncItemsToHeadlines(next));
  };
  const drop = (index: number, payload: DragPayload) => {
    if (payload.source !== 'stack') return;
    const next = [...blocks];
    const from = next.findIndex((block) => block.id === payload.id);
    if (from < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(from < index ? index - 1 : index, 0, moved!);
    setLocalItems(syncItemsToHeadlines(itemsFromBlocks(next)));
  };
  const sent = Boolean(draft.data?.data.sent);
  const retryMock =
    draft.data?.data.mockEnabled && draft.data.data.status === 'sent';

  const persist = useMutation({
    mutationFn: () =>
      apiJson.put<DraftResponse>(
        `/worker/engagements/${engagementId}/questionnaire`,
        {
          values: Object.fromEntries(
            items.flatMap((item) =>
              item.kind === 'field' ? [[item.key, item.defaultValue ?? '']] : []
            )
          ),
          questions: [],
          definition: { name: data?.name ?? 'Personalfragebogen', items },
        }
      ),
    onSuccess: (response) =>
      cache.setQueryData(['questionnaire-draft', engagementId], response),
  });

  const send = useMutation({
    mutationFn: async () => {
      await persist.mutateAsync();
      return apiJson.post<SendResponse>(
        `/worker/engagements/${engagementId}/questionnaire/send`
      );
    },
    onSuccess: (response) => {
      const workerId = data?.workerId;
      cache.setQueryData<DraftResponse>(
        ['questionnaire-draft', engagementId],
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  sent: true,
                  status: response.data.mockCompleted ? 'completed' : 'sent',
                },
              }
            : current
      );
      void cache.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      void cache.invalidateQueries({
        queryKey: [WORKERBYID, ...(workerId ? [workerId] : [])],
      });
      void cache.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void cache.invalidateQueries({
        queryKey: ['employment-contract'],
        predicate: (query) => query.queryKey[2] === engagementId,
      });
      if (response.data.mockCompleted) {
        void cache.invalidateQueries({
          queryKey: ['completed-questionnaire'],
          predicate: (query) => query.queryKey[2] === engagementId,
        });
        void cache.invalidateQueries({
          queryKey: [PERSONNEL_DOCUMENTS, ...(workerId ? [workerId] : [])],
        });
      }
      if (response.data.mockCompleted) {
        toast.success(
          'Testfragebogen ausgefüllt. Der Vertrag kann bearbeitet werden.'
        );
        onClose();
        return;
      }
      if (!response.data.emailSent) {
        toast.error(
          'Die E-Mail ist nicht rausgegangen. Senden erneut versuchen.'
        );
        void draft.refetch();
        return;
      }
      toast.success('Fragebogen gesendet');
      onClose();
    },
    onError: () => toast.error('Fragebogen konnte nicht gesendet werden'),
  });

  const close = async () => {
    if (data && !sent) {
      try {
        await persist.mutateAsync();
      } catch {
        toast.error('Die Angaben konnten nicht gespeichert werden');
        return;
      }
    }
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !persist.isPending && !send.isPending) void close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full max-w-3xl border-0 bg-transparent p-0 shadow-none sm:max-w-3xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (sendButton.current && !sendButton.current.disabled) {
            sendButton.current.focus();
          } else {
            (event.target as HTMLElement).focus();
          }
        }}
        onKeyDown={(event) => {
          if (
            event.key !== 'Enter' ||
            event.defaultPrevented ||
            event.nativeEvent.isComposing ||
            event.repeat ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          )
            return;
          const target = event.target as HTMLElement;
          if (
            target.closest(
              'button, a, textarea, select, [contenteditable="true"], [role="combobox"]'
            )
          )
            return;
          event.preventDefault();
          sendButton.current?.click();
        }}
      >
        <div className="flex h-[80vh] flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 text-card-foreground">
          <DialogTitle className="sr-only">Fragebogen</DialogTitle>
          <div className="-mt-3 -mr-3 flex shrink-0 items-center justify-end gap-1">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Dialog schließen"
                disabled={persist.isPending || send.isPending}
              >
                <X />
              </Button>
            </DialogClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {draft.isPending ? (
              <p className="text-sm text-muted-foreground">Lädt…</p>
            ) : null}
            {draft.isError ? (
              <p className="text-sm text-destructive">
                Der Fragebogen konnte nicht geladen werden.
              </p>
            ) : null}
            {draft.data ? (
              <>
                {draft.data.data.mockEnabled ? (
                  <p
                    role="status"
                    className="mb-4 rounded-lg border border-border bg-muted p-3 text-sm"
                  >
                    Testmodus: Senden füllt den Fragebogen mit Beispielantworten
                    aus. Es wird keine E-Mail verschickt.
                  </p>
                ) : null}
                <p className="mb-4 text-xs text-muted-foreground">
                  Änderungen gelten nur für diesen Einsatz.
                </p>
                <h1 className="mb-4 text-xl font-medium">
                  {data?.name ?? 'Personalfragebogen'}
                </h1>
                {data?.intro ? (
                  <p className="mb-4 text-sm whitespace-pre-wrap text-muted-foreground">
                    {data.intro}
                  </p>
                ) : null}
                <QuestionnaireStack
                  blocks={blocks}
                  contractFields={data?.contractFields ?? []}
                  onDrop={drop}
                  onInsert={insertItems}
                  onReplaceItems={setLocalItems}
                  onChangeField={changeField}
                  onChangeRepeater={changeRepeater}
                  onChangeSection={changeSection}
                  onCommitField={changeField}
                  onSectionOmitChange={(section, omitted) =>
                    setLocalItems((current) =>
                      setSectionOmitted(current ?? items, section, omitted)
                    )
                  }
                  onRemove={(id) =>
                    setLocalItems(
                      syncItemsToHeadlines(
                        itemsFromBlocks(
                          blocks.filter((block) => block.id !== id)
                        )
                      )
                    )
                  }
                />
              </>
            ) : null}
          </div>
          <div className="flex shrink-0 justify-end gap-2">
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
              ref={sendButton}
              type="button"
              className="rounded-2xl"
              disabled={
                !draft.data ||
                (sent && !retryMock) ||
                persist.isPending ||
                send.isPending ||
                items.length === 0
              }
              onClick={() => send.mutate()}
            >
              {send.isPending ? 'Sendet…' : 'Senden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
