import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WEEKDAYS, suggestWeekdayLinks } from '@shared/weeklyHours';
import { useState } from 'react';
import type { ContractFieldOption, TemplateField } from './questionnaireTemplate.types';

type WeekdayAssignProps = {
  days: TemplateField[];
  contractFields: ContractFieldOption[];
  onChange: (field: TemplateField) => void;
};

export function WeekdayAssign({ days, contractFields, onChange }: WeekdayAssignProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const suggestions = suggestWeekdayLinks(contractFields);
  const assigned = days.filter((day) => day.contractFieldKey).length;

  const openAssign = () => {
    setDraft(
      Object.fromEntries(
        days.map((day) => [day.key, day.contractFieldKey || suggestions[day.key as keyof typeof suggestions] || ''])
      )
    );
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {assigned === 0
            ? 'Die Wochentage sind noch keinem Vertragsfeld zugeordnet.'
            : `${assigned} von ${days.length} Wochentagen sind zugeordnet.`}
        </p>
        <Button type="button" variant="outline" className="rounded-2xl" data-no-drag onClick={openAssign}>
          Wochentage zuordnen
        </Button>
      </div>
      {open ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
          {WEEKDAYS.map((day) => {
            const suggested = suggestions[day.key];
            const suggestedLabel = contractFields.find((field) => field.key === suggested)?.label;
            const highlighted = Boolean(suggested) && draft[day.key] === suggested;
            return (
              <label key={day.key} className="grid grid-cols-[2rem_1fr] items-center gap-3 text-sm">
                <span>{day.label}</span>
                <select
                  aria-label={`${day.label} Vertragsfeld`}
                  value={draft[day.key] ?? ''}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [day.key]: event.target.value }))
                  }
                  className={cn(
                    'h-9 rounded-md border bg-background px-3',
                    highlighted ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  <option value="">Keins</option>
                  {contractFields.map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                      {field.key === suggested ? ' · Vorschlag' : ''}
                    </option>
                  ))}
                </select>
                {highlighted && suggestedLabel ? (
                  <span className="col-start-2 text-xs text-primary">Vorschlag: {suggestedLabel}</span>
                ) : null}
              </label>
            );
          })}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              onClick={() => {
                for (const day of days) {
                  const next = draft[day.key] ?? '';
                  if ((day.contractFieldKey ?? '') === next) continue;
                  onChange({ ...day, contractFieldKey: next });
                }
                setOpen(false);
              }}
            >
              Zuordnung übernehmen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
