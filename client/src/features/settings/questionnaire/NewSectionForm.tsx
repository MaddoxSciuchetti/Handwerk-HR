import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

function itemLabel(item: TemplateItem) {
  if (item.kind === 'section') return item.title;
  if (item.kind === 'repeater') return item.section;
  return item.label || item.key;
}

export function NewSectionForm({
  items,
  insertAt,
  onAdd,
  onCancel,
}: NewSectionFormProps) {
  const titleId = useId();
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const assignable = items.filter((item) => item.kind !== 'section');

  const toggle = (key: string) => {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key]
    );
  };

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
      placeSectionHeadline(items, insertAt, headline, selected) as TemplateItem[]
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
      <p className="text-xs text-muted-foreground">
        Wählen Sie Fragen, die unter dieser Überschrift stehen sollen. Sie
        können später weitere Fragen darunter ziehen.
      </p>
      {assignable.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Noch keine Fragen zum Zuordnen.
        </p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {assignable.map((item) => (
            <li key={item.key}>
              <Label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-muted">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={selected.includes(item.key)}
                  onChange={() => toggle(item.key)}
                />
                <span className="min-w-0">
                  <span className="block truncate">{itemLabel(item)}</span>
                  {item.kind !== 'section' && item.section ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      bisher: {item.section}
                    </span>
                  ) : null}
                </span>
              </Label>
            </li>
          ))}
        </ul>
      )}
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
