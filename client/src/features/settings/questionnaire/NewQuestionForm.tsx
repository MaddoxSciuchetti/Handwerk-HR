import { Button } from '@/components/ui/button';
import { choiceLines } from '@/features/questionnaire/ChoiceLineEditor';
import { WEEKDAY_HOUR_KEYS, WEEKLY_HOURS_PROMPT } from '@shared/weeklyHours';
import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import { tableColumns } from './tableColumns';
import { weeklyHoursFields } from './weeklyHoursFields';
import type { TemplateItem } from './questionnaireTemplate.types';

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
  onCancel?: () => void;
};

export function NewQuestionForm({
  existingKeys,
  onAdd,
  onCancel,
}: NewQuestionFormProps) {
  const questionId = useId();
  const typeId = useId();
  const [label, setLabel] = useState('');
  const [type, setType] =
    useState<(typeof customTypes)[number]['type']>('text');
  const [options, setOptions] = useState('Ja\nNein');
  const [required, setRequired] = useState(true);
  const [officeOnly, setOfficeOnly] = useState(false);
  const [columns, setColumns] = useState(
    'Name\nVorname\nGeburtsdatum (TT.MM.JJJJ)'
  );
  const [allowMoreRows, setAllowMoreRows] = useState(false);
  const hoursPlaced = WEEKDAY_HOUR_KEYS.every((key) =>
    existingKeys.includes(key)
  );
  const parsedColumns = tableColumns(columns);

  const addTable = () => {
    const name = label.trim();
    if (!name || !parsedColumns) return;
    onAdd([
      {
        kind: 'repeater',
        key: `rows.${crypto.randomUUID()}`,
        section: name,
        columns: parsedColumns.map((column) => ({
          ...column,
          officeOnly: officeOnly || undefined,
        })),
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
        officeOnly: officeOnly || undefined,
        builtin: false,
        options: fieldOptions,
        max: type === 'text' ? 255 : undefined,
      },
    ]);
    setLabel('');
  };

  return (
    <div className="relative flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card py-5 pr-12 pl-5">
      <h2 className="sr-only">Neue Frage</h2>
      {onCancel ? (
        <button
          type="button"
          aria-label="Neue Frage verwerfen"
          title="Neue Frage verwerfen"
          className="absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-md text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
          onClick={onCancel}
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}
      {type === 'weekly-hours' ? (
        <div className="flex min-w-0 items-start gap-2 text-sm leading-8 font-medium">
          <span className="w-16 shrink-0">Frage:</span>
          <p className="min-w-0 flex-1">{WEEKLY_HOURS_PROMPT}</p>
        </div>
      ) : (
        <div className="flex min-w-0 items-start gap-2 text-sm leading-6 font-medium">
          <label className="w-16 shrink-0 py-1" htmlFor={questionId}>
            Frage:
          </label>
          <textarea
            id={questionId}
            rows={1}
            className="field-sizing-content min-h-8 min-w-0 flex-1 resize-none rounded-md border border-transparent bg-transparent px-1 py-[3px] text-sm leading-6 font-medium outline-none hover:border-border hover:bg-muted focus:border-border focus:bg-muted"
            value={label}
            placeholder="Frage"
            maxLength={400}
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
      )}
      <div className="flex min-w-0 items-start gap-2">
        <label
          htmlFor={typeId}
          className="w-16 shrink-0 pt-1 text-sm leading-6 font-medium"
        >
          Antwort:
        </label>
        <select
          id={typeId}
          aria-label="Antworttyp"
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none"
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
      </div>
      {type === 'weekly-hours' ? (
        <p className="text-xs text-muted-foreground">
          Eine Frage mit den sieben Wochentagen. Die Stunden erscheinen erst
          nach „Ja“.
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
            aria-label={
              type === 'check' ? 'Text neben den Kästchen' : 'Antworten'
            }
            onChange={(event) => setOptions(event.target.value)}
          />
          {type === 'check' ? (
            <p className="text-xs text-muted-foreground">
              Jede Zeile steht neben einem Kästchen. Mindestens zwei.
            </p>
          ) : null}
        </>
      ) : null}
      {type === 'weekly-hours' && hoursPlaced ? (
        <p className="text-xs text-muted-foreground">
          Diese Frage ist schon im Fragebogen.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {type === 'weekly-hours' || type === 'table' ? null : (
            <PflichtfeldSwitch checked={required} onChange={setRequired} />
          )}
          <PflichtfeldSwitch
            label="Nur vom Betrieb"
            checked={officeOnly}
            onChange={setOfficeOnly}
          />
        </div>
        <Button
          type="button"
          className="ml-auto min-w-24 rounded-2xl"
          disabled={
            (type === 'weekly-hours' ? hoursPlaced : !label.trim()) ||
            (type === 'table' && !parsedColumns)
          }
          onClick={() => {
            if (type === 'weekly-hours')
              onAdd(
                weeklyHoursFields().map((field) => ({
                  ...field,
                  officeOnly: officeOnly || undefined,
                }))
              );
            else if (type === 'table') addTable();
            else addCustom();
          }}
        >
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}
