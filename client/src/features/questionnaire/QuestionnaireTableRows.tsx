import { useId, type CSSProperties } from 'react';
import { Label } from '@/components/ui/label';
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
  const id = useId();
  const columns = {
    '--questionnaire-columns': `repeat(${repeater.columns.length}, minmax(0, 1fr))`,
  } as CSSProperties;
  const canAdd = repeater.allowMoreRows === true;
  const shown = rows.length > 0 ? rows : [{}];

  const update = (index: number, key: string, value: string) => {
    const base = rows.length > 0 ? rows : [{}];
    onChange(
      base.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="pt-2 text-base font-medium text-foreground">
        {repeater.section}
      </h2>
      <div className="min-w-0 sm:overflow-x-auto sm:rounded-md sm:border sm:border-border">
        <div
          className="flex flex-col gap-3 sm:min-w-[36rem] sm:gap-0"
          style={columns}
        >
          <div className="hidden sm:grid sm:grid-cols-[var(--questionnaire-columns)]">
            {repeater.columns.map((column) => (
              <div
                key={column.key}
                className="border-r border-b border-border px-3 py-2 text-sm font-medium last:border-r-0"
              >
                {column.label}
              </div>
            ))}
          </div>
          {shown.map((row, index) => (
            <div
              key={index}
              role="group"
              aria-label={`Eintrag ${index + 1}`}
              className="grid min-w-0 grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[var(--questionnaire-columns)] sm:gap-0 sm:rounded-none sm:border-0 sm:p-0"
            >
              <p className="text-sm font-medium sm:hidden">Zeile {index + 1}</p>
              {repeater.columns.map((column) => (
                <div
                  key={column.key}
                  className="flex min-w-0 flex-col gap-2 sm:border-r sm:border-b sm:border-border sm:p-2 sm:last:border-r-0"
                >
                  <Label
                    className="sm:sr-only"
                    htmlFor={`${id}-${index}-${column.key}`}
                  >
                    {column.label}
                  </Label>
                  <Input
                    id={`${id}-${index}-${column.key}`}
                    aria-label={`${column.label} Zeile ${index + 1}`}
                    type={column.type === 'date' ? 'date' : 'text'}
                    disabled={column.officeOnly === true}
                    value={row[column.key] ?? ''}
                    placeholder={column.label}
                    className={
                      column.officeOnly
                        ? 'bg-muted text-muted-foreground'
                        : undefined
                    }
                    onChange={(event) =>
                      update(index, column.key, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
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
              onClick={() =>
                onChange(shown.filter((_, rowIndex) => rowIndex !== index))
              }
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
