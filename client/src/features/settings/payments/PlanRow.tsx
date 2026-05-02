import { Button } from '@/components/ui/selfmade/button';
import { GrowingItem, Items } from '@/components/ui/selfmade/table/Table';

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
    <Items state="default" className="px-3 py-1">
      <GrowingItem>
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">{name}</p>
          <p className="typo-caption text-muted-foreground">{price}</p>
        </div>
      </GrowingItem>
      <Button
        size="small"
        radius="lg"
        className="text-xs"
        disabled={isLoading}
        onClick={onSubscribe}
      >
        {isLoading ? 'Weiterleitung…' : 'Abonnieren'}
      </Button>
    </Items>
  );
}
