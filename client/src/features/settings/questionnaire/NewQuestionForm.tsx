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
import { useState } from 'react';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import { tableColumns } from './tableColumns';
import type { TemplateField, TemplateItem } from './questionnaireTemplate.types';

const customTypes = [
  { type: 'text' as const, label: 'Textfeld' },
  { type: 'date' as const, label: 'Datum' },
  { type: 'single' as const, label: 'Auswahl' },
  { type: 'check' as const, label: 'Checkbox' },
  { type: 'file' as const, label: 'Dateiupload' },
  { type: 'weekly-hours' as const, label: 'Arbeitszeit pro Woche' },
  { type: 'table' as const, label: 'Tabelle' },
];

type NewQuestionFormProps = {
  existingKeys: string[];
  onAdd: (fields: TemplateItem[]) => void;
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

export function NewQuestionForm({ existingKeys, onAdd }: NewQuestionFormProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<(typeof customTypes)[number]['type']>('text');
  const [options, setOptions] = useState('Ja\nNein');
  const [required, setRequired] = useState(true);
  const [columns, setColumns] = useState('Name\nVorname\nGeburtsdatum (TT.MM.JJJJ)');
  const [allowMoreRows, setAllowMoreRows] = useState(false);
  const hoursPlaced = WEEKDAY_HOUR_KEYS.every((key) => existingKeys.includes(key));
  const parsedColumns = tableColumns(columns);

  const addTable = () => {
    const name = label.trim();
    if (!name || !parsedColumns) return;
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
  };

  const addCustom = () => {
    if (type === 'weekly-hours' || type === 'table') return;
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
    onAdd([
      {
        kind: 'field',
        key: `custom.${crypto.randomUUID()}`,
        label: name,
        section: 'Weitere Angaben',
        type,
        required,
        builtin: false,
        options: fieldOptions,
        max: type === 'text' ? 255 : undefined,
      },
    ]);
    setLabel('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border px-5 py-4">
      <h2 className="text-sm font-medium">Neue Frage</h2>
      {type === 'weekly-hours' ? null : (
        <Input
          value={label}
          placeholder="Frage"
          maxLength={400}
          onChange={(event) => setLabel(event.target.value)}
        />
      )}
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
      {type === 'weekly-hours' ? (
        <p className="text-xs text-muted-foreground">
          Eine Frage mit den sieben Wochentagen. Die Stunden erscheinen erst nach
          „Ja“.
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
      {type === 'weekly-hours' || type === 'table' ? null : (
        <PflichtfeldSwitch checked={required} onChange={setRequired} />
      )}
      {type === 'weekly-hours' && hoursPlaced ? (
        <p className="text-xs text-muted-foreground">
          Diese Frage ist schon im Fragebogen.
        </p>
      ) : null}
      <Button
        type="button"
        className="rounded-2xl"
        disabled={
          (type === 'weekly-hours' && hoursPlaced) ||
          (type === 'table' && (!label.trim() || !parsedColumns))
        }
        onClick={() => {
          if (type === 'weekly-hours') onAdd(weeklyHoursFields());
          else if (type === 'table') addTable();
          else addCustom();
        }}
      >
        Hinzufügen
      </Button>
    </div>
  );
}
