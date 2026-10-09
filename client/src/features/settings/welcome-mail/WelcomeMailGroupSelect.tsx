import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MicrosoftGroupOption } from './welcomeMail.api';

type WelcomeMailGroupSelectProps = {
  groups: MicrosoftGroupOption[];
  groupId: string;
  groupName: string;
  disabled?: boolean;
  onChange: (group: MicrosoftGroupOption) => void;
};

export function WelcomeMailGroupSelect({
  groups,
  groupId,
  groupName,
  disabled = false,
  onChange,
}: WelcomeMailGroupSelectProps) {
  const options =
    groupId && !groups.some((group) => group.id === groupId)
      ? [{ id: groupId, displayName: groupName || groupId }, ...groups]
      : groups;

  return (
    <Select
      value={groupId || undefined}
      disabled={disabled || options.length === 0}
      onValueChange={(value) => {
        const group = options.find((option) => option.id === value);
        if (!group) return;
        onChange(group);
      }}
    >
      <SelectTrigger id="welcome-group" className="w-full">
        <SelectValue placeholder="Team auswählen" />
      </SelectTrigger>
      <SelectContent>
        {options.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
