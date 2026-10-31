import { Button } from '@/components/ui/button';
import {
  isOptionalQuestionnaireSection,
  placeSectionHeadline,
} from '@shared/questionnaireSections';
import { useId, useState } from 'react';
import { X } from 'lucide-react';
import type { TemplateItem, TemplateSection } from './questionnaireTemplate.types';

type NewSectionFormProps = {
  items: TemplateItem[];
  insertAt: number;
  onAdd: (items: TemplateItem[]) => void;
  onCancel?: () => void;
};

export function NewSectionForm({
  items,
  insertAt,
  onAdd,
  onCancel,
}: NewSectionFormProps) {
  const titleId = useId();
  const [title, setTitle] = useState('');

  const submit = () => {
    const name = title.trim();
    if (!name) return;
    const headline: TemplateSection = {
      kind: 'section',
      key: `section.${crypto.randomUUID()}`,
      title: name,
      optional: isOptionalQuestionnaireSection(name) || undefined,
    };
    onAdd(
      placeSectionHeadline(items, insertAt, headline, []) as TemplateItem[]
    );
  };

  return (
    <div
      data-no-drag
      className="relative flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card py-5 pr-12 pl-5"
    >
      <h2 className="text-sm font-semibold">Neue Überschrift</h2>
      {onCancel ? (
        <button
          type="button"
          aria-label="Überschrift verwerfen"
          className="absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-md text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
          onClick={onCancel}
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}
      <div className="flex min-w-0 items-start gap-2 text-sm leading-6 font-medium">
        <label className="w-24 shrink-0 py-1" htmlFor={titleId}>
          Titel:
        </label>
        <input
          id={titleId}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none"
          value={title}
          maxLength={400}
          placeholder="z. B. VWL"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          className="min-w-24 rounded-2xl"
          disabled={!title.trim()}
          onClick={submit}
        >
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}
