import { Button } from '@/components/ui/button';
import { GrowingItem, Items } from '@/features/settings/components/Table';

type PlanRowProps = {
  name: string;
  price: string;
  isLoading?: boolean;
  onSubscribe: () => void;
};

export function PlanRow({
  name,
  price,
  isLoading = false,
  onSubscribe,
}: PlanRowProps) {
  return (
    <Items state="default">
      <GrowingItem>
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">{name}</p>
          <p className="typo-caption text-muted-foreground">{price}</p>
        </div>
      </GrowingItem>
      <Button
        size="sm"
        className="rounded-full text-xs"
        disabled={isLoading}
        onClick={onSubscribe}
      >
        {isLoading ? 'Weiterleitung…' : 'Abonnieren'}
      </Button>
    </Items>
  );
}
