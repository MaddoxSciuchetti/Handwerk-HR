import { Button } from '@/components/ui/button';
import { GrowingItem, Items } from '@/features/settings/components/Table';

type SubscriptionRowProps = {
  planName: string;
  isLoading?: boolean;
  onChangePaymentMethod: () => void;
};

export function SubscriptionRow({
  planName,
  isLoading = false,
  onChangePaymentMethod,
}: SubscriptionRowProps) {
  return (
    <Items state="default">
      <GrowingItem>
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">Aktuelles Abo</p>
          <p className="typo-caption text-muted-foreground">{planName}</p>
        </div>
      </GrowingItem>
      <Button
        size="sm"
        className="rounded-full text-xs"
        disabled={isLoading}
        onClick={onChangePaymentMethod}
      >
        {isLoading ? 'Weiterleitung…' : 'Zahlungsmethode ändern'}
      </Button>
    </Items>
  );
}
