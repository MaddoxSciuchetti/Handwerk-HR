import { RadioGroupItem } from '@/components/ui/radio-group';

type PrimaryContractMarkProps = {
  id: string;
  name: string;
};

export function primaryContractLabel(name: string) {
  return `${name} als primären Mustervertrag für den Versand verwenden`;
}

export function PrimaryContractMark({
  id,
  name,
}: PrimaryContractMarkProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <RadioGroupItem
        value={id}
        aria-label={primaryContractLabel(name)}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
