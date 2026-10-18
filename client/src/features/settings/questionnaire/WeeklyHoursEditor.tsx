import { Button } from '@/components/ui/button';
import { WeeklyHoursDays } from '@/features/questionnaire/WeeklyHoursDays';
import {
  HOURS_DISTRIBUTION_KEY,
  WEEKDAYS,
  WEEKLY_HOURS_PROMPT,
  WEEKLY_HOURS_SECTION,
  isWeekdayHourKey,
} from '@shared/weeklyHours';
import { useState } from 'react';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import { WeekdayAssign } from './WeekdayAssign';
import type { ContractFieldOption, TemplateField } from './questionnaireTemplate.types';

type WeeklyHoursEditorProps = {
  fields: TemplateField[];
  contractFields: ContractFieldOption[];
  onChange: (field: TemplateField) => void;
  onAdd: (field: TemplateField) => void;
};

export function WeeklyHoursEditor({
  fields,
  contractFields,
  onChange,
  onAdd,
}: WeeklyHoursEditorProps) {
  const [editing, setEditing] = useState(false);
  const days = WEEKDAYS.flatMap((day) => {
    const field = fields.find((item) => item.key === day.key);
    return field ? [field] : [];
  });
  const distribution = fields.find((field) => field.key === HOURS_DISTRIBUTION_KEY);
  const values = Object.fromEntries(days.map((day) => [day.key, day.defaultValue ?? '']));
  const officeOnly = days.some((day) => day.officeOnly);

  const ensureDistribution = (required: boolean) => {
    if (distribution) {
      onChange({ ...distribution, required });
      return;
    }
    onAdd({
      kind: 'field',
      key: HOURS_DISTRIBUTION_KEY,
      label: WEEKLY_HOURS_PROMPT,
      section: WEEKLY_HOURS_SECTION,
      type: 'single',
      options: ['ja', 'nein'],
      required,
      builtin: true,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Wöchentliche Arbeitszeit</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-2xl"
          data-no-drag
          aria-expanded={editing}
          onClick={() => setEditing((open) => !open)}
        >
          Bearbeiten
        </Button>
      </div>
      <WeeklyHoursDays
        variant="editor"
        values={values}
        onChange={(key, value) => {
          const field = days.find((day) => day.key === key);
          if (!field || !isWeekdayHourKey(key)) return;
          onChange({ ...field, defaultValue: value });
        }}
      />
      {editing ? (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <PflichtfeldSwitch
            checked={distribution?.required === true}
            onChange={ensureDistribution}
          />
          <PflichtfeldSwitch
            label="Nur vom Betrieb"
            checked={officeOnly}
            onChange={(checked) => {
              for (const day of days) onChange({ ...day, officeOnly: checked || undefined });
            }}
          />
          <WeekdayAssign days={days} contractFields={contractFields} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
}
