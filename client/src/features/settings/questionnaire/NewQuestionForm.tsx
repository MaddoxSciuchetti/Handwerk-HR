import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { choiceLines } from '@/features/questionnaire/ChoiceLineEditor';
import { useState } from 'react';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import type { TemplateField } from './questionnaireTemplate.types';

const customTypes = [
  { type: 'text' as const, label: 'Textfeld' },
  { type: 'date' as const, label: 'Datum' },
  { type: 'single' as const, label: 'Auswahl' },
  { type: 'check' as const, label: 'Checkbox' },
  { type: 'file' as const, label: 'Dateiupload' },
];

type NewQuestionFormProps = {
  onAdd: (field: TemplateField) => void;
};

export function NewQuestionForm({ onAdd }: NewQuestionFormProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<(typeof customTypes)[number]['type']>('text');
  const [options, setOptions] = useState('Ja\nNein');
  const [required, setRequired] = useState(true);

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
    onAdd({
      kind: 'field',
      key: `custom.${crypto.randomUUID()}`,
      label: name,
      section: 'Weitere Angaben',
      type,
      required,
      builtin: false,
      options: fieldOptions,
      max: type === 'text' ? 255 : undefined,
    });
    setLabel('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border px-5 py-4">
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
      <PflichtfeldSwitch checked={required} onChange={setRequired} />
      <Button type="button" className="rounded-2xl" onClick={addCustom}>
        Hinzufügen
      </Button>
    </div>
  );
}
