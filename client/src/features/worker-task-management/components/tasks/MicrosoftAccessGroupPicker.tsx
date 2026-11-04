import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { getMicrosoftAccessGroups } from '../../api/microsoftAccessGroups.api';

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
  const selected = new Set(selectedIds);

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      if (selected.has(id)) return;
      onChange([...selectedIds, id]);
      return;
    }
    onChange(selectedIds.filter((entry) => entry !== id));
  };

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
    <ul
      className="flex max-h-40 flex-col gap-2 overflow-y-auto"
      aria-label="Microsoft-Gruppen"
    >
      {options.map((group) => {
        const id = `microsoft-access-group-${group.id}`;
        return (
          <li key={group.id} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={selected.has(group.id)}
              disabled={disabled}
              onCheckedChange={(value) => toggle(group.id, value === true)}
            />
            <label
              htmlFor={id}
              className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {group.displayName}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
