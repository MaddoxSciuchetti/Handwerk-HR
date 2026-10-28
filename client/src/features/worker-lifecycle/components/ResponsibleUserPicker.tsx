import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';

export type ResponsibleUserOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type Props = {
  value: ResponsibleUserOption;
  options: ResponsibleUserOption[];
  workerName: string;
  disabled: boolean;
  onChange: (userId: string) => void;
};

export function ResponsibleUserPicker({
  value,
  options,
  workerName,
  disabled,
  onChange,
}: Props) {
  const users = options.some((user) => user.id === value.id)
    ? options
    : [value, ...options];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Verantwortlichen für ${workerName} ändern`}
          disabled={disabled}
          aria-busy={disabled}
          className="-ml-2 max-w-full gap-2 rounded-lg border-border bg-muted px-2 font-normal shadow-none hover:bg-muted focus-visible:border-border focus-visible:ring-0 aria-expanded:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted"
        >
          <span className="truncate">
            {`${value.firstName} ${value.lastName}`.trim()}
          </span>
          {disabled ? (
            <Loader2
              className="size-3.5 shrink-0 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : (
            <ChevronDown
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuRadioGroup
          value={value.id}
          onValueChange={(id) => {
            if (id !== value.id && options.some((user) => user.id === id))
              onChange(id);
          }}
        >
          {users.map((user) => (
            <DropdownMenuRadioItem key={user.id} value={user.id}>
              {`${user.firstName} ${user.lastName}`.trim()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
