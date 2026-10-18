import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { choiceLines } from '@/features/questionnaire/ChoiceLineEditor';
import { useState, type FormEvent } from 'react';
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
  field?: TemplateField;
  onAdd: (field: TemplateField) => void;
  onCancel?: () => void;
};

export function NewQuestionForm({
  field,
  onAdd,
  onCancel,
}: NewQuestionFormProps) {
  const [label, setLabel] = useState(field?.label ?? '');
  const [type, setType] = useState<TemplateField['type']>(
    field?.type ?? 'text'
  );
  const [options, setOptions] = useState(
    field?.options?.join('\n') ?? (field?.type === 'check' ? '' : 'Ja\nNein')
  );
  const [required, setRequired] = useState(field?.required !== false);
  const [bsbOnly, setBsbOnly] = useState(field?.bsbOnly === true);
  const [error, setError] = useState('');
  const custom =
    !field || field.builtin === false || field.key.startsWith('custom.');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = label.trim();
    if (!name) {
      setError('Bitte eine Frage eingeben.');
      return;
    }
    let fieldOptions = field?.options;
    if (custom) {
      fieldOptions = undefined;
      if (
        type === 'single' ||
        (type === 'check' && (!field || options.trim()))
      ) {
        const choices = choiceLines(options);
        if (!choices) {
          setError(
            'Bitte zwei bis acht unterschiedliche Antworten mit höchstens 80 Zeichen eingeben.'
          );
          return;
        }
        fieldOptions = choices;
      }
    }
    let defaultValue = type === field?.type ? field.defaultValue : undefined;
    if (
      (type === 'single' || type === 'check') &&
      defaultValue &&
      !(fieldOptions ?? ['ja']).includes(defaultValue)
    )
      defaultValue = '';
    onAdd({
      ...field,
      kind: 'field',
      key: field?.key ?? `custom.${crypto.randomUUID()}`,
      label: name,
      section: field?.section ?? 'Weitere Angaben',
      type,
      required: custom ? required : field?.required,
      bsbOnly,
      builtin: field ? field.builtin : false,
      options: fieldOptions,
      max: type === 'text' ? (field?.max ?? 255) : undefined,
      defaultValue,
      contractFieldKey: type === 'file' ? undefined : field?.contractFieldKey,
    });
    setError('');
    if (!field) setLabel('');
  };

  return (
    <form
      aria-label={field ? 'Frage bearbeiten' : 'Neue Frage'}
      data-no-drag
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-2xl border border-border px-5 py-4"
    >
      <h2 className="text-sm font-medium">
        {field ? 'Frage bearbeiten' : 'Neue Frage'}
      </h2>
      <Input
        value={label}
        aria-label="Frage"
        placeholder="Frage"
        maxLength={400}
        onChange={(event) => setLabel(event.target.value)}
      />
      {custom ? (
        <select
          aria-label="Fragetyp"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(event) =>
            setType(event.target.value as TemplateField['type'])
          }
        >
          {customTypes.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {custom && (type === 'single' || type === 'check') ? (
        <>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={options}
            aria-label={
              type === 'check' ? 'Text neben den Kästchen' : 'Antworten'
            }
            onChange={(event) => setOptions(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Jede Zeile ist eine Antwort. Zwei bis acht Antworten.
          </p>
        </>
      ) : null}
      {custom ? (
        <PflichtfeldSwitch checked={required} onChange={setRequired} />
      ) : null}
      <PflichtfeldSwitch
        label="Nur von BSB auszufüllen"
        checked={bsbOnly}
        onChange={setBsbOnly}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={onCancel}
          >
            Abbrechen
          </Button>
        ) : null}
        <Button type="submit" className="flex-1 rounded-2xl">
          {field ? 'Übernehmen' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  );
}
