import { cn } from '@/lib/utils';

export function IntegrationSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-primary bg-primary' : 'border-border bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 left-0.5 size-3.5 -translate-y-1/2 rounded-full transition-transform',
            checked ? 'translate-x-4 bg-primary-foreground' : 'bg-foreground'
          )}
        />
      </button>
      <span className="text-sm text-muted-foreground">
        {checked ? 'Aktiv' : 'Inaktiv'}
      </span>
    </div>
  );
}
