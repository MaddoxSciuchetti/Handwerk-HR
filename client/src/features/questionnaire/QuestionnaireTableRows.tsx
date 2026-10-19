import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { QuestionnaireRepeater } from './questionnaire.types';

type Row = Record<string, string>;

type QuestionnaireTableRowsProps = {
  repeater: QuestionnaireRepeater;
  rows: Row[];
  onChange: (rows: Row[]) => void;
};

export function QuestionnaireTableRows({
  repeater,
  rows,
  onChange,
}: QuestionnaireTableRowsProps) {
  const canAdd = repeater.allowMoreRows === true;
  const shown = rows.length > 0 ? rows : [{}];

  const update = (index: number, key: string, value: string) => {
    const base = rows.length > 0 ? rows : [{}];
    onChange(
      base.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="pt-2 text-base font-medium text-foreground">{repeater.section}</h2>
      <div className="overflow-x-auto rounded-md border border-border">
        <div
          className="grid min-w-[36rem]"
          style={{ gridTemplateColumns: `repeat(${repeater.columns.length}, minmax(0, 1fr))` }}
        >
          {repeater.columns.map((column) => (
            <div
              key={column.key}
              className="border-r border-b border-border px-3 py-2 text-sm font-medium last:border-r-0"
            >
              {column.label}
            </div>
          ))}
          {shown.map((row, index) =>
            repeater.columns.map((column) => (
              <div
                key={`${index}-${column.key}`}
                className="border-r border-b border-border p-2 last:border-r-0"
              >
                <Input
                  aria-label={`${column.label} Zeile ${index + 1}`}
                  type={column.type === 'date' ? 'date' : 'text'}
                  disabled={column.officeOnly === true}
                  value={row[column.key] ?? ''}
                  placeholder={column.label}
                  className={column.officeOnly ? 'bg-muted text-muted-foreground' : undefined}
                  onChange={(event) => update(index, column.key, event.target.value)}
                />
              </div>
            ))
          )}
        </div>
      </div>
      {canAdd && shown.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {shown.map((_, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => onChange(shown.filter((_, rowIndex) => rowIndex !== index))}
            >
              Zeile {index + 1} entfernen
            </Button>
          ))}
        </div>
      ) : null}
      {repeater.columns.some((column) => column.officeOnly) ? (
        <p className="text-xs text-muted-foreground">Vom Betrieb ausgefüllt</p>
      ) : null}
      {canAdd ? (
        <div>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onChange([...shown, {}])}
          >
            Weitere Zeile
          </Button>
        </div>
      ) : null}
    </section>
  );
}
