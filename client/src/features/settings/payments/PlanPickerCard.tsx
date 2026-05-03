import { Button } from '@/components/ui/selfmade/button';
import { cn } from '@/lib/trycatch';

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
          ? 'border-interactive-primary-bg ring-1 ring-interactive-primary-bg/25'
          : 'border-border'
      )}
    >
      <div className="space-y-1">
        <h2 className="typo-body-sm font-semibold text-foreground">{name}</h2>
        <p className="typo-caption text-muted-foreground">{price}</p>
        {isCurrent ? (
          <p className="typo-caption text-interactive-primary-bg">Aktueller Plan</p>
        ) : null}
      </div>
      <Button
        type="button"
        size="small"
        radius="lg"
        className="mt-6 w-full text-xs"
        disabled={primaryDisabled || primaryLoading}
        onClick={onPrimary}
      >
        {primaryLoading ? 'Weiterleitung…' : primaryLabel}
      </Button>
    </div>
  );
}
