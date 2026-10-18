import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';

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
    <TableRow className="hover:bg-transparent">
      <TableCell className="whitespace-normal">
        <div className="flex flex-col">
          <p className="typo-body-sm font-medium">{name}</p>
          <p className="typo-caption text-muted-foreground">{price}</p>
        </div>
      </TableCell>
      <TableCell className="pr-6 text-right">
      <Button
        size="sm"
        className="rounded-full text-xs"
        disabled={isLoading}
        onClick={onSubscribe}
      >
        {isLoading ? 'Weiterleitung…' : 'Abonnieren'}
      </Button>
      </TableCell>
    </TableRow>
  );
}
