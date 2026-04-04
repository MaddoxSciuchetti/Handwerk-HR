import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/trycatch';

export type CompactSelectOption = { value: string; label: string };

type CompactSelectProps = {
  value: string;
  options: CompactSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  triggerClassName?: string;
};

/**
 * Small Radix select for dense tables and list rows (team lead, status pickers).
 */
export function CompactSelect({
  value,
  options,
  onValueChange,
  placeholder = 'Wählen…',
  disabled,
  'aria-label': ariaLabel,
  className,
  triggerClassName,
}: CompactSelectProps) {
  return (
    <div
      className={cn('min-w-0', className)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger
          size="sm"
          aria-label={ariaLabel}
          className={cn('h-8 w-full min-w-[7.5rem] max-w-[14rem]', triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-60">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
