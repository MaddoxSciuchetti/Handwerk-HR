import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';

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
    <TableRow className="hover:bg-transparent">
      <TableCell className="whitespace-normal">
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">Aktuelles Abo</p>
          <p className="typo-caption text-muted-foreground">{planName}</p>
        </div>
      </TableCell>
      <TableCell className="pr-6 text-right">
      <Button
        size="sm"
        className="rounded-full text-xs"
        disabled={isLoading}
        onClick={onChangePaymentMethod}
      >
        {isLoading ? 'Weiterleitung…' : 'Zahlungsmethode ändern'}
      </Button>
      </TableCell>
    </TableRow>
  );
}
