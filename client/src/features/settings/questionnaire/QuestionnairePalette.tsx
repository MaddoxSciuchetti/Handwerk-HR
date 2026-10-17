import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { choiceLines } from '@/features/questionnaire/ChoiceLineEditor';
import { useState } from 'react';
import { isHourField } from './questionnaireBlocks';
import {
  QUESTION_DRAG_TYPE,
  type TemplateField,
  type TemplateItem,
} from './questionnaireTemplate.types';

type QuestionnairePaletteProps = {
  catalog: TemplateItem[];
  items: TemplateItem[];
  onAdd: (items: TemplateItem[]) => void;
};

const customTypes = [
  { type: 'text' as const, label: 'Textfeld' },
  { type: 'date' as const, label: 'Datum' },
  { type: 'single' as const, label: 'Auswahl' },
  { type: 'check' as const, label: 'Checkbox' },
  { type: 'file' as const, label: 'Dateiupload' },
];

export function QuestionnairePalette({ catalog, items, onAdd }: QuestionnairePaletteProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<(typeof customTypes)[number]['type']>('text');
  const [options, setOptions] = useState('Ja\nNein');
  const [required, setRequired] = useState(true);
  const placed = new Set(items.map((item) => item.key));
  const hoursPlaced = items.some(isHourField);
  const available = catalog.filter((item) => {
    if (isHourField(item)) return false;
    return !placed.has(item.key);
  });
  const hours = catalog.filter(isHourField);
  const groups = available.reduce<Record<string, TemplateItem[]>>((list, item) => {
    const section = item.kind === 'field' ? item.section : 'Blöcke';
    list[section] = [...(list[section] ?? []), item];
    return list;
  }, {});

  const addCustom = () => {
    const name = label.trim();
    if (!name) return;
    const choices = options
      .split('\n')
      .map((option) => option.trim())
      .filter(Boolean);
    let fieldOptions: string[] | undefined;
    if (type === 'single') {
      if (choices.length < 2) return;
      fieldOptions = choices;
    }
    if (type === 'check') {
      const checkboxChoices = choiceLines(options);
      if (!checkboxChoices) return;
      fieldOptions = checkboxChoices;
    }
    const field: TemplateField = {
      kind: 'field',
      key: `custom.${crypto.randomUUID()}`,
      label: name,
      section: 'Weitere Angaben',
      type,
      required: type === 'file' ? required : true,
      builtin: false,
      options: fieldOptions,
      max: type === 'text' ? 255 : undefined,
    };
    onAdd([field]);
    setLabel('');
  };

  return (
    <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-xl border border-border p-4">
      <div>
        <h2 className="text-sm font-medium">Vorhandene Felder</h2>
        <div className="mt-3 flex flex-col gap-4">
          {hoursPlaced ? null : (
            <PaletteButton
              label="Wochenstunden"
              detail="Mo bis So"
              payload={{ source: 'palette', id: 'hours' }}
              onClick={() => onAdd(hours)}
            />
          )}
          {Object.entries(groups).map(([section, entries]) => (
            <div key={section} className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{section}</p>
              {entries.map((entry) => (
                <PaletteButton
                  key={entry.key}
                  label={entry.kind === 'field' ? entry.label : entry.section}
                  payload={{ source: 'palette', id: entry.key }}
                  onClick={() => onAdd([entry])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h2 className="text-sm font-medium">Neue Frage</h2>
        <Input
          value={label}
          placeholder="Frage"
          maxLength={400}
          onChange={(event) => setLabel(event.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(event) =>
            setType(event.target.value as (typeof customTypes)[number]['type'])
          }
        >
          {customTypes.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
        {type === 'single' || type === 'check' ? (
          <>
            <textarea
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={options}
              aria-label={type === 'check' ? 'Text neben den Kästchen' : 'Antworten'}
              onChange={(event) => setOptions(event.target.value)}
            />
            {type === 'check' ? (
              <p className="text-xs text-muted-foreground">
                Jede Zeile steht neben einem Kästchen. Mindestens zwei.
              </p>
            ) : null}
          </>
        ) : null}
        {type === 'file' ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
            />
            Pflichtfeld
          </label>
        ) : null}
        <Button type="button" className="rounded-2xl" onClick={addCustom}>
          Hinzufügen
        </Button>
      </div>
    </aside>
  );
}

function PaletteButton({
  label,
  detail,
  payload,
  onClick,
}: {
  label: string;
  detail?: string;
  payload: { source: 'palette'; id: string };
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(QUESTION_DRAG_TYPE, JSON.stringify(payload));
        event.dataTransfer.setData('text/plain', JSON.stringify(payload));
      }}
      onClick={onClick}
      className="h-auto rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-normal text-foreground hover:bg-muted hover:text-foreground"
    >
      {label}
      {detail ? <span className="mt-1 block text-xs text-muted-foreground">{detail}</span> : null}
    </Button>
  );
}

export function paletteItems(catalog: TemplateItem[], id: string) {
  if (id === 'hours') return catalog.filter(isHourField);
  const item = catalog.find((entry) => entry.key === id);
  return item ? [item] : [];
}
