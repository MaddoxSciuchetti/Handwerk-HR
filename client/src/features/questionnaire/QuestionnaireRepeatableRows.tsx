import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuestionnaireRepeater } from './questionnaire.types';

type Row = Record<string, string>;

type QuestionnaireRepeatableRowsProps = {
  repeater: QuestionnaireRepeater;
  rows: Row[];
  onChange: (rows: Row[]) => void;
};

export function QuestionnaireRepeatableRows({
  repeater,
  rows,
  onChange,
}: QuestionnaireRepeatableRowsProps) {
  const update = (index: number, key: string, value: string) => {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  };

  return (
    <section className="flex flex-col gap-3" aria-label={repeater.section}>
      {rows.map((row, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-3">
          {repeater.columns.map((column) => (
            <div key={column.key} className="flex flex-col gap-2">
              <Label htmlFor={`${repeater.key}-${index}-${column.key}`}>
                {column.label}
              </Label>
              <Input
                id={`${repeater.key}-${index}-${column.key}`}
                type={column.type === 'date' ? 'date' : 'text'}
                disabled={column.officeOnly === true}
                value={row[column.key] ?? ''}
                className={column.officeOnly ? 'bg-muted text-muted-foreground' : undefined}
                onChange={(event) => update(index, column.key, event.target.value)}
              />
            </div>
          ))}
          <div className="sm:col-span-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
            >
              Entfernen
            </Button>
          </div>
        </div>
      ))}
      {repeater.columns.some((column) => column.officeOnly) ? (
        <p className="text-xs text-muted-foreground">Vom Betrieb ausgefüllt</p>
      ) : null}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...rows, {}])}
        >
          Weitere Zeile
        </Button>
      </div>
    </section>
  );
}
