import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getMicrosoftAccessGroups } from '../../api/microsoftAccessGroups.api';

const NONE = '__none__';

type MicrosoftAccessGroupPickerProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function MicrosoftAccessGroupPicker({
  selectedIds,
  onChange,
  disabled,
}: MicrosoftAccessGroupPickerProps) {
  const groups = useQuery({
    queryKey: ['microsoft-access-groups'],
    queryFn: getMicrosoftAccessGroups,
  });

  const options = groups.data?.groups ?? [];
  const error = groups.isError
    ? 'Microsoft-Gruppen konnten nicht geladen werden.'
    : groups.data?.error;
  const selected = selectedIds[0] ?? NONE;

  if (groups.isPending) {
    return (
      <p className="text-xs text-muted-foreground">Gruppen werden geladen…</p>
    );
  }
  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }
  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Keine geeigneten Gruppen gefunden.
      </p>
    );
  }

  return (
    <Select
      value={selected}
      onValueChange={(value) => onChange(value === NONE ? [] : [value])}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="Microsoft-Gruppe"
        className="h-8 w-full text-xs"
      >
        <SelectValue placeholder="Gruppe wählen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Keine</SelectItem>
        {options.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
