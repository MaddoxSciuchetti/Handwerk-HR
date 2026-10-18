import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  WEEKDAYS,
  formatHours,
  hourInput,
  hourQuantity,
  normalizeHour,
  weekdayHoursTotal,
} from '@shared/weeklyHours';

type WeeklyHoursDaysProps = {
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  variant: 'editor' | 'form';
};

export function WeeklyHoursDays({
  values,
  onChange,
  disabled = false,
  variant,
}: WeeklyHoursDaysProps) {
  const total = weekdayHoursTotal(values);
  const entered = WEEKDAYS.some((day) => hourQuantity(values[day.key] ?? '') != null);
  const invalid = WEEKDAYS.some(
    (day) => (values[day.key] ?? '').trim().length > 0 && normalizeHour(values[day.key] ?? '') === null
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        className={
          variant === 'form'
            ? 'flex flex-col gap-2 sm:grid sm:grid-cols-7 sm:gap-3'
            : 'grid grid-cols-4 gap-2 sm:grid-cols-7'
        }
      >
        {WEEKDAYS.map((day) => {
          const value = values[day.key] ?? '';
          const invalid = value.trim().length > 0 && normalizeHour(value) === null;
          return (
            <div
              key={day.key}
              className={cn(
                variant === 'form' && 'flex items-center justify-between gap-3 sm:flex-col sm:items-stretch'
              )}
            >
              <Label htmlFor={day.key}>{day.label}</Label>
              <Input
                id={day.key}
                inputMode="decimal"
                disabled={disabled}
                value={value}
                aria-invalid={invalid}
                aria-label={`${day.label} Stunden`}
                className={cn('sm:w-full', variant === 'form' && 'w-24', disabled && 'bg-muted text-muted-foreground')}
                onChange={(event) => onChange(day.key, hourInput(event.target.value))}
              />
            </div>
          );
        })}
      </div>
      {variant === 'editor' ? (
        <p className={invalid ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {invalid ? 'Bitte Stunden bis 24 eingeben, zum Beispiel 7,5.' : 'Std.'}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Summe: {entered ? `${formatHours(total)} Std.` : '—'}
        </p>
      )}
    </div>
  );
}
