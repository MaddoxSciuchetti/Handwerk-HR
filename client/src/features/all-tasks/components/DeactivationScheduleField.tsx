import { useId, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { scheduleDateLabel } from '../utils/deactivationSchedule';
import { de } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function DeactivationScheduleField({
  value,
  onChange,
  disabled = false,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>Planen</Label>
        <Switch
          id={id}
          checked={value !== null}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked ? '' : null)}
        />
      </div>
      {value !== null && (
        <div className="space-y-1.5">
          <Label
            htmlFor={`${id}-date`}
            className="text-xs text-muted-foreground"
          >
            Letzter aktiver Tag
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`${id}-date`}
                type="button"
                variant="outline"
                disabled={disabled}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="size-4" />
                {value ? scheduleDateLabel(value) : 'Datum wählen'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                locale={de}
                selected={value ? parseISO(value.slice(0, 10)) : undefined}
                defaultMonth={
                  value ? parseISO(value.slice(0, 10)) : parseISO(today)
                }
                disabled={(date) => format(date, 'yyyy-MM-dd') < today}
                onSelect={(date) => {
                  if (!date) return;
                  onChange(format(date, 'yyyy-MM-dd'));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
