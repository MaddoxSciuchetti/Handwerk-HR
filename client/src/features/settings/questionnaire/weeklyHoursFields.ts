import {
  HOURS_DISTRIBUTION_KEY,
  WEEKDAYS,
  WEEKLY_HOURS_PROMPT,
  WEEKLY_HOURS_SECTION,
} from '@shared/weeklyHours';
import type { TemplateField } from './questionnaireTemplate.types';

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
