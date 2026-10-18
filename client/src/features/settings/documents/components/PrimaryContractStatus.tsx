import { Button } from '@/components/ui/button';

type PrimaryContractStatusProps = {
  isPrimary: boolean;
  pending: boolean;
  onSelect: () => void;
};

export function PrimaryContractStatus({
  isPrimary,
  pending,
  onSelect,
}: PrimaryContractStatusProps) {
  if (isPrimary) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="h-8 shrink-0"
      disabled={pending}
      onClick={onSelect}
    >
      Als primären Mustervertrag verwenden
    </Button>
  );
}
