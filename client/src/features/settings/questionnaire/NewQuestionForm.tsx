import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { choiceLines } from '@/features/questionnaire/ChoiceLineEditor';
import {
  HOURS_DISTRIBUTION_KEY,
  WEEKDAYS,
  WEEKDAY_HOUR_KEYS,
  WEEKLY_HOURS_PROMPT,
  WEEKLY_HOURS_SECTION,
} from '@shared/weeklyHours';
import { useState, type FormEvent } from 'react';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import { tableColumns } from './tableColumns';
import type { TemplateField, TemplateItem } from './questionnaireTemplate.types';

const fieldTypes = [
  { type: 'text' as const, label: 'Textfeld' },
  { type: 'date' as const, label: 'Datum' },
  { type: 'single' as const, label: 'Auswahl' },
  { type: 'check' as const, label: 'Checkbox' },
  { type: 'file' as const, label: 'Dateiupload' },
];

const createTypes = [
  ...fieldTypes,
  { type: 'weekly-hours' as const, label: 'Arbeitszeit pro Woche' },
  { type: 'table' as const, label: 'Tabelle' },
];

type QuestionType = (typeof createTypes)[number]['type'];

type NewQuestionFormProps = {
  field?: TemplateField;
  existingKeys?: string[];
  onAdd: (fields: TemplateItem[]) => void;
  onCancel?: () => void;
};

export function weeklyHoursFields(): TemplateField[] {
  return [
    {
      kind: 'field',
      key: HOURS_DISTRIBUTION_KEY,
      label: WEEKLY_HOURS_PROMPT,
      section: WEEKLY_HOURS_SECTION,
      type: 'single',
      options: ['ja', 'nein'],
      required: false,
      builtin: true,
    },
    ...WEEKDAYS.map((day) => ({
      kind: 'field' as const,
      key: day.key,
      label: day.label,
      section: WEEKLY_HOURS_SECTION,
      type: 'text' as const,
      max: 8,
      layout: 'inline' as const,
      required: false,
      builtin: true,
    })),
  ];
}

export function NewQuestionForm({
  field,
  existingKeys = [],
  onAdd,
  onCancel,
}: NewQuestionFormProps) {
  const [label, setLabel] = useState(field?.label ?? '');
  const [type, setType] = useState<QuestionType>(field?.type ?? 'text');
  const [options, setOptions] = useState(
    field?.options?.join('\n') ?? (field?.type === 'check' ? '' : 'Ja\nNein')
  );
  const [required, setRequired] = useState(field?.required !== false);
  const [bsbOnly, setBsbOnly] = useState(field?.bsbOnly === true);
  const [columns, setColumns] = useState('Name\nVorname\nGeburtsdatum (TT.MM.JJJJ)');
  const [allowMoreRows, setAllowMoreRows] = useState(false);
  const [error, setError] = useState('');
  const custom =
    !field || field.builtin === false || field.key.startsWith('custom.');
  const hoursPlaced = WEEKDAY_HOUR_KEYS.every((key) => existingKeys.includes(key));
  const parsedColumns = tableColumns(columns);
  const types = field ? fieldTypes : createTypes;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (type === 'weekly-hours') {
      if (hoursPlaced) {
        setError('Diese Frage ist schon im Fragebogen.');
        return;
      }
      onAdd(weeklyHoursFields());
      return;
    }
    if (type === 'table') {
      const name = label.trim();
      if (!name || !parsedColumns) {
        setError('Bitte eine Überschrift und eine bis sechs Spalten eingeben.');
        return;
      }
      onAdd([
        {
          kind: 'repeater',
          key: `rows.${crypto.randomUUID()}`,
          section: name,
          columns: parsedColumns,
          allowMoreRows: allowMoreRows || undefined,
        },
      ]);
      setLabel('');
      setAllowMoreRows(false);
      return;
    }
    const name = label.trim();
    if (!name) {
      setError('Bitte eine Frage eingeben.');
      return;
    }
    let fieldOptions = field?.options;
    if (custom) {
      fieldOptions = undefined;
      if (type === 'single' || (type === 'check' && (!field || options.trim()))) {
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
    onAdd([
      {
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
      },
    ]);
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
      {type === 'weekly-hours' ? null : (
        <Input
          value={label}
          aria-label="Frage"
          placeholder="Frage"
          maxLength={400}
          onChange={(event) => setLabel(event.target.value)}
        />
      )}
      {custom ? (
        <select
          aria-label="Fragetyp"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(event) => setType(event.target.value as QuestionType)}
        >
          {types.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {type === 'weekly-hours' ? (
        <p className="text-xs text-muted-foreground">
          Eine Frage mit den sieben Wochentagen. Die Stunden erscheinen erst nach „Ja“.
        </p>
      ) : null}
      {type === 'table' ? (
        <>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={columns}
            aria-label="Spalten"
            onChange={(event) => setColumns(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Jede Zeile ist eine Spalte, direkt untereinander. Eine bis sechs.
          </p>
          <Button
            type="button"
            variant={allowMoreRows ? 'default' : 'outline'}
            aria-pressed={allowMoreRows}
            className="rounded-2xl"
            onClick={() => setAllowMoreRows((current) => !current)}
          >
            Weitere Zeilen erlauben
          </Button>
        </>
      ) : null}
      {custom && (type === 'single' || type === 'check') ? (
        <>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={options}
            aria-label={type === 'check' ? 'Text neben den Kästchen' : 'Antworten'}
            onChange={(event) => setOptions(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Jede Zeile ist eine Antwort. Zwei bis acht Antworten.
          </p>
        </>
      ) : null}
      {custom && type !== 'weekly-hours' && type !== 'table' ? (
        <PflichtfeldSwitch checked={required} onChange={setRequired} />
      ) : null}
      {type === 'weekly-hours' || type === 'table' ? null : (
        <PflichtfeldSwitch
          label="Nur von BSB auszufüllen"
          checked={bsbOnly}
          onChange={setBsbOnly}
        />
      )}
      {type === 'weekly-hours' && hoursPlaced ? (
        <p className="text-xs text-muted-foreground">
          Diese Frage ist schon im Fragebogen.
        </p>
      ) : null}
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
        <Button
          type="submit"
          className="flex-1 rounded-2xl"
          disabled={
            (type === 'weekly-hours' && hoursPlaced) ||
            (type === 'table' && (!label.trim() || !parsedColumns))
          }
        >
          {field ? 'Übernehmen' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  );
}
