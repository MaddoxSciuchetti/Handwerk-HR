import {
  HOURS_DISTRIBUTION_KEY,
  WEEKLY_HOURS_PROMPT,
  formatHours,
  hourQuantity,
  isWeekdayHourKey,
  weeklyHoursReference,
  weekdayHoursTotal,
} from '@shared/weeklyHours';
import { BsbPreviewFlag } from './BsbPreviewFlag';
import { WeeklyHoursDays } from './WeeklyHoursDays';
import type { QuestionnaireQuestion } from './questionnaire.types';

type WeeklyHoursAnswerProps = {
  questions: QuestionnaireQuestion[];
  values: Record<string, string>;
  showBsbFlag?: boolean;
  onChange: (key: string, value: string) => void;
};

export function WeeklyHoursAnswer({
  questions,
  values,
  showBsbFlag = false,
  onChange,
}: WeeklyHoursAnswerProps) {
  const days = questions.filter((question) => isWeekdayHourKey(question.key));
  const office = days.some((day) => day.employerFilled);
  const choice = values[HOURS_DISTRIBUTION_KEY] ?? '';
  const showDays = office || choice === 'ja';
  const total = weekdayHoursTotal(values);
  const entered = days.some((day) => hourQuantity(values[day.key] ?? '') != null);
  const reference = weeklyHoursReference(questions, values);
  const mismatch =
    showDays && entered && reference != null && Math.abs(reference.hours - total) > 0.001;

  return (
    <fieldset className="flex flex-col gap-4">
      {office ? (
        <legend className="flex flex-wrap items-center gap-2 text-sm font-medium">
          Wöchentliche Arbeitszeit
          {showBsbFlag ? <BsbPreviewFlag /> : null}
        </legend>
      ) : (
        <legend className="text-sm font-medium">{WEEKLY_HOURS_PROMPT}</legend>
      )}
      {office ? null : (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            ['nein', 'Nein'],
            ['ja', 'Ja'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={HOURS_DISTRIBUTION_KEY}
                className="size-4 accent-primary"
                checked={choice === value}
                onChange={() => {
                  onChange(HOURS_DISTRIBUTION_KEY, value);
                  if (value === 'nein') {
                    for (const day of days) onChange(day.key, '');
                  }
                }}
              />
              {label}
            </label>
          ))}
        </div>
      )}
      {showDays ? (
        <WeeklyHoursDays
          variant="form"
          values={values}
          disabled={office}
          onChange={onChange}
        />
      ) : null}
      {office ? <p className="text-xs text-muted-foreground">Vom Betrieb ausgefüllt</p> : null}
      {mismatch && reference ? (
        <p className="text-sm text-destructive">
          Die Summe {formatHours(total)} Std. weicht von „{reference.label}“ (
          {formatHours(reference.hours)} Std.) ab.
        </p>
      ) : null}
    </fieldset>
  );
}
