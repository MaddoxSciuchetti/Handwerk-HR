import { RadioGroupItem } from '@/components/ui/radio-group';

type PrimaryContractMarkProps = {
  id: string;
  name: string;
  isPrimary: boolean;
};

export function primaryContractLabel(name: string) {
  return `${name} als primären Mustervertrag für den Versand verwenden`;
}

export function PrimaryContractMark({
  id,
  name,
  isPrimary,
}: PrimaryContractMarkProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <RadioGroupItem
        value={id}
        aria-label={primaryContractLabel(name)}
        onClick={(event) => event.stopPropagation()}
      />
      {isPrimary ? (
        <span className="typo-body-xs rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
          Für den Versand
        </span>
      ) : null}
    </div>
  );
}
