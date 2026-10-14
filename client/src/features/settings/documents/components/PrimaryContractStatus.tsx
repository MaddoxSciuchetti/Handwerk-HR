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
  if (isPrimary) {
    return (
      <p className="text-sm text-muted-foreground">
        Diese Vorlage ist der primäre Mustervertrag und wird für den Versand
        verwendet.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={onSelect}
    >
      Als primären Mustervertrag verwenden
    </Button>
  );
}
