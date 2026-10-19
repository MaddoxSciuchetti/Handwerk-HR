import { Button } from '@/components/ui/button';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import type { TemplateRepeater } from './questionnaireTemplate.types';

type TableQuestionCardProps = {
  repeater: TemplateRepeater;
  onChange: (repeater: TemplateRepeater) => void;
};

export function TableQuestionCard({ repeater, onChange }: TableQuestionCardProps) {
  const allowMoreRows = repeater.allowMoreRows === true;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{repeater.section}</p>
      <div className="overflow-hidden rounded-md border border-border">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${repeater.columns.length}, minmax(0, 1fr))` }}
        >
          {repeater.columns.map((column) => (
            <div
              key={column.key}
              className="border-r border-border px-3 py-2 text-sm last:border-r-0"
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>
      <PflichtfeldSwitch
        label="Nur von BSB auszufüllen"
        checked={repeater.columns.every((column) => column.officeOnly === true)}
        onChange={(checked) =>
          onChange({
            ...repeater,
            columns: repeater.columns.map((column) => ({
              ...column,
              officeOnly: checked || undefined,
            })),
          })
        }
      />
      <Button
        type="button"
        data-no-drag
        variant={allowMoreRows ? 'default' : 'outline'}
        aria-pressed={allowMoreRows}
        className="w-fit rounded-2xl"
        onClick={() => onChange({ ...repeater, allowMoreRows: !allowMoreRows || undefined })}
      >
        Weitere Zeilen erlauben
      </Button>
    </div>
  );
}
