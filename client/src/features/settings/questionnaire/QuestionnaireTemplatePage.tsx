import LoadingAlert from '@/components/alerts/LoadingAlert';
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
import { paletteItems, QuestionnairePalette } from './QuestionnairePalette';
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

  if (template.isPending) return <LoadingAlert />;
  if (template.isError || !template.data) {
    return (
      <p className="p-6 text-sm text-destructive">
        Fragebogen konnte nicht geladen werden.
      </p>
    );
  }

  const catalog = template.data.catalog;
  const blocks = blocksFromItems(items);

  const addItems = (next: TemplateItem[]) => {
    const placed = new Set(items.map((item) => item.key));
    setItems([...items, ...next.filter((item) => !placed.has(item.key))]);
  };

  const drop = (index: number, payload: DragPayload) => {
    const current = blocksFromItems(items);
    if (payload.source === 'stack') {
      const from = current.findIndex((block) => block.id === payload.id);
      if (from < 0) return;
      const [moved] = current.splice(from, 1);
      if (!moved) return;
      const target = from < index ? index - 1 : index;
      current.splice(target, 0, moved);
      setItems(itemsFromBlocks(current));
      return;
    }
    const incoming = paletteItems(catalog, payload.id).filter(
      (item) => !items.some((placed) => placed.key === item.key)
    );
    if (incoming.length === 0) return;
    current.splice(index, 0, {
      id: payload.id,
      items: incoming,
    });
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
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <SettingsPageHeader title="Fragebogen" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={openPreview}
          >
            Vorschau
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={save.isPending || !name.trim()}
            onClick={() => save.mutate(itemsRef.current)}
          >
            {save.isPending ? 'Speichert…' : 'Speichern'}
          </Button>
        </div>
      </div>
      <div className="mt-4 flex max-w-xl flex-col gap-2">
        <Label htmlFor="questionnaire-name">Name des Fragebogens</Label>
        <Input
          id="questionnaire-name"
          value={name}
          required
          maxLength={200}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <QuestionnairePalette
          catalog={catalog}
          items={items}
          onAdd={addItems}
        />
        <QuestionnaireStack
          blocks={blocks}
          contractFields={template.data.contractFields}
          onDrop={drop}
          onChangeField={changeField}
          onCommitField={commitField}
          onRemove={remove}
        />
      </div>
    </div>
  );
}
