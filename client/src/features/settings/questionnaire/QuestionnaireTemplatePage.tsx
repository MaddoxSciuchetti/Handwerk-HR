import { Skeleton } from '@/components/ui/skeleton';
import { QuestionnaireSkeleton } from './QuestionnaireSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import {
  readQuestionnaireDraft,
  rememberQuestionnaireDraft,
} from '@/features/questionnaire/questionnairePreview';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { QuestionnaireStack, type DragPayload } from './QuestionnaireStack';
import { blocksFromItems, itemsFromBlocks } from './questionnaireBlocks';
import { getQuestionnaireTemplate } from './questionnaireTemplate.api';
import {
  templateKey,
  useQuestionnaireAutosave,
} from './useQuestionnaireAutosave';
import type {
  TemplateField,
  TemplateItem,
  TemplateRepeater,
  TemplateSection,
} from './questionnaireTemplate.types';
import {
  ensureSectionHeadlines,
  setSectionMembers,
  syncItemsToHeadlines,
} from '@shared/questionnaireSections';

export function QuestionnaireTemplatePage() {
  const navigate = useNavigate();
  const template = useQuery({
    queryKey: templateKey,
    queryFn: getQuestionnaireTemplate,
  });
  const [draftOnOpen] = useState(readQuestionnaireDraft);
  const [name, setName] = useState(draftOnOpen?.name ?? 'Personalfragebogen');
  const [items, setItems] = useState<TemplateItem[]>(
    () => (draftOnOpen?.items as TemplateItem[] | undefined) ?? []
  );
  const [initialized, setInitialized] = useState(false);
  // Seed the editor once. Refetches and save responses must not replace local edits.
  if (template.data && !initialized) {
    setInitialized(true);
    const source =
      (draftOnOpen?.items as TemplateItem[] | undefined) ?? template.data.items;
    setItems(ensureSectionHeadlines(source) as TemplateItem[]);
    setName(draftOnOpen?.name ?? template.data.name ?? 'Personalfragebogen');
  }

  const save = useQuestionnaireAutosave(
    template.data
      ? {
          name: template.data.name ?? 'Personalfragebogen',
          items: template.data.items,
        }
      : null,
    initialized ? { name: name.trim(), items } : null
  );

  const openPreview = () => {
    if (!template.data) return;
    rememberQuestionnaireDraft({
      name: name.trim(),
      intro: template.data.intro,
      items,
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
    setItems(syncItemsToHeadlines(itemsFromBlocks(current)));
  };

  const changeRepeater = (repeater: TemplateRepeater) => {
    setItems((current) =>
      current.map((item) =>
        item.kind === 'repeater' && item.key === repeater.key ? repeater : item
      )
    );
  };

  const changeField = (field: TemplateField) => {
    setItems((current) =>
      current.map((item) =>
        item.kind === 'field' && item.key === field.key ? field : item
      )
    );
  };

  const changeSection = (section: TemplateSection) => {
    setItems((current) => {
      const previous = current.find(
        (item) => item.kind === 'section' && item.key === section.key
      );
      const oldTitle =
        previous && previous.kind === 'section' ? previous.title : section.title;
      return current.map((item) => {
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
  };

  const changeSectionMembers = (sectionKey: string, memberKeys: string[]) => {
    setItems((current) => setSectionMembers(current, sectionKey, memberKeys));
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
            className="min-w-24 rounded-2xl"
            aria-label="Speichern"
            aria-busy={save.status === 'pending' && !!name.trim()}
            disabled={template.isPending || !name.trim()}
            onClick={save.saveNow}
          >
            {save.status === 'pending' && name.trim() ? (
              <span role="status" aria-label="Wird gespeichert">
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              </span>
            ) : (
              'Speichern'
            )}
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
              onReplaceItems={setItems}
              onChangeField={changeField}
              onChangeRepeater={changeRepeater}
              onChangeSection={changeSection}
              onSectionMembersChange={changeSectionMembers}
              onCommitField={changeField}
              onRemove={remove}
            />
          )}
        </div>
      </div>
    </div>
  );
}
