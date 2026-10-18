import { Skeleton } from '@/components/ui/skeleton';
import { QuestionnaireSkeleton } from './QuestionnaireSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import {
  forgetQuestionnaireDraft,
  readQuestionnaireDraft,
  rememberQuestionnaireDraft,
} from '@/features/questionnaire/questionnairePreview';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { QuestionnaireStack, type DragPayload } from './QuestionnaireStack';
import { blocksFromItems, itemsFromBlocks } from './questionnaireBlocks';
import {
  getQuestionnaireTemplate,
  saveQuestionnaireTemplate,
} from './questionnaireTemplate.api';
import type {
  TemplateField,
  TemplateItem,
} from './questionnaireTemplate.types';

const templateKey = ['automation', 'questionnaire'] as const;

export function QuestionnaireTemplatePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const template = useQuery({
    queryKey: templateKey,
    queryFn: getQuestionnaireTemplate,
  });
  const draftOnOpen = useRef(readQuestionnaireDraft());
  const [name, setName] = useState(
    draftOnOpen.current?.name ?? 'Personalfragebogen'
  );
  const [items, setItems] = useState<TemplateItem[]>(
    () => (draftOnOpen.current?.items as TemplateItem[] | undefined) ?? []
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (!template.data) return;
    const draft = draftOnOpen.current;
    if (draft) {
      draftOnOpen.current = null;
      setItems(draft.items as TemplateItem[]);
      setName(draft.name ?? template.data.name ?? 'Personalfragebogen');
      return;
    }
    setItems(template.data.items);
    setName(template.data.name ?? 'Personalfragebogen');
  }, [template.data]);

  const save = useMutation({
    mutationFn: (next: TemplateItem[]) =>
      saveQuestionnaireTemplate(next, name.trim()),
    onSuccess: async () => {
      forgetQuestionnaireDraft();
      await queryClient.invalidateQueries({ queryKey: templateKey });
      toast.success('Fragebogen gespeichert');
    },
    onError: () => toast.error('Fragebogen konnte nicht gespeichert werden'),
  });

  const openPreview = () => {
    if (!template.data) return;
    rememberQuestionnaireDraft({
      name: name.trim(),
      intro: template.data.intro,
      items: itemsRef.current,
    });
    void navigate({ to: '/fragebogen/preview' });
  };

  if (!template.isPending && (template.isError || !template.data)) {
    return (
      <p className="p-6 text-sm text-destructive">
        Fragebogen konnte nicht geladen werden.
      </p>
    );
  }

  const blocks = blocksFromItems(items);

  const insertItems = (index: number, next: TemplateItem[]) => {
    const placed = new Set(items.map((item) => item.key));
    const incoming = next.filter((item) => !placed.has(item.key));
    if (incoming.length === 0) return;
    const offset = blocks
      .slice(0, index)
      .reduce((sum, block) => sum + block.items.length, 0);
    const current = [...items];
    current.splice(offset, 0, ...incoming);
    setItems(current);
  };

  const drop = (index: number, payload: DragPayload) => {
    if (payload.source !== 'stack') return;
    const current = blocksFromItems(items);
    const from = current.findIndex((block) => block.id === payload.id);
    if (from < 0) return;
    const [moved] = current.splice(from, 1);
    if (!moved) return;
    const target = from < index ? index - 1 : index;
    current.splice(target, 0, moved);
    setItems(itemsFromBlocks(current));
  };

  const changeField = (field: TemplateField) => {
    setItems((current) =>
      current.map((item) =>
        item.kind === 'field' && item.key === field.key ? field : item
      )
    );
  };

  const commitField = (field: TemplateField) => {
    const next = itemsRef.current.map((item) =>
      item.kind === 'field' && item.key === field.key ? field : item
    );
    setItems(next);
    save.mutate(next);
  };

  const remove = (id: string) => {
    setItems(itemsFromBlocks(blocks.filter((block) => block.id !== id)));
  };

  return (
    <div className="mx-auto h-full min-h-0 overflow-x-hidden overflow-y-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <SettingsPageHeader title="Fragebogen" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            disabled={template.isPending}
            onClick={openPreview}
          >
            Vorschau
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={template.isPending || save.isPending || !name.trim()}
            onClick={() => save.mutate(itemsRef.current)}
          >
            {save.isPending ? 'Speichert…' : 'Speichern'}
          </Button>
        </div>
      </div>
      <div className="mx-auto mt-4 w-full max-w-3xl">
        <div className="flex flex-col gap-2">
          <Label htmlFor="questionnaire-name">Name des Fragebogens</Label>
          {template.isPending ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Input
              id="questionnaire-name"
              value={name}
              required
              maxLength={200}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </div>
        <div className="mt-4">
          {template.isPending ? (
            <QuestionnaireSkeleton />
          ) : (
            <QuestionnaireStack
              blocks={blocks}
              contractFields={template.data?.contractFields ?? []}
              onDrop={drop}
              onInsert={insertItems}
              onChangeField={changeField}
              onCommitField={commitField}
              onRemove={remove}
            />
          )}
        </div>
      </div>
    </div>
  );
}
