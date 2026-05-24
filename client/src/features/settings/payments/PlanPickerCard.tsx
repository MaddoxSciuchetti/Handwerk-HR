import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PlanPickerCardProps = {
  name: string;
  price: string;
  isCurrent: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
};

export function PlanPickerCard({
  name,
  price,
  isCurrent,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
}: PlanPickerCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col justify-between rounded-2xl border bg-card p-6 shadow-sm transition-colors',
        isCurrent
          ? 'border-primary ring-1 ring-primary/25'
          : 'border-border'
      )}
    >
      <div className="space-y-1">
        <h2 className="typo-body-sm font-semibold text-foreground">{name}</h2>
        <p className="typo-caption text-muted-foreground">{price}</p>
        {isCurrent ? (
          <p className="typo-caption text-primary">
            Aktueller Plan
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-6 w-full rounded-full text-xs"
        disabled={primaryDisabled || primaryLoading}
        onClick={onPrimary}
      >
        {primaryLoading ? 'Weiterleitung…' : primaryLabel}
      </Button>
    </div>
  );
}
