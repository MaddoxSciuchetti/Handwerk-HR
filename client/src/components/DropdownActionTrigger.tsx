import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, TrashIcon } from 'lucide-react';

type DropdownActionItem = {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
};

type DropdownActionTriggerProps = {
  disabled?: boolean;
  description: string;
  triggerIcon: 'trash' | 'edit';
  actionLabel: string;
  onPrimaryAction: () => void;
  secondaryAction?: DropdownActionItem;
};

function DropdownActionTrigger({
  disabled,
  description,
  triggerIcon,
  actionLabel,
  onPrimaryAction,
  secondaryAction,
}: DropdownActionTriggerProps) {
  const TriggerIcon = triggerIcon === 'edit' ? Edit : TrashIcon;
  const shouldUseMenu = Boolean(secondaryAction) || triggerIcon === 'edit';

  if (!shouldUseMenu) {
    return (
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled}
        className="cursor-pointer rounded-md text-muted-foreground hover:text-(--destructive) disabled:cursor-not-allowed disabled:opacity-50"
        onClick={(event) => {
          event.stopPropagation();
          if (!disabled) {
            onPrimaryAction();
          }
        }}
        aria-label={`${description} öffnen`}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={disabled}
          className="cursor-pointer rounded-md text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(event) => event.stopPropagation()}
          aria-label={`${description} öffnen`}
        >
          <TriggerIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        {secondaryAction ? (
          <DropdownMenuItem
            variant={secondaryAction.variant ?? 'default'}
            onSelect={() => secondaryAction.action()}
          >
            {secondaryAction.label}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem variant="destructive" onSelect={onPrimaryAction}>
          {actionLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { DropdownActionItem };
export default DropdownActionTrigger;
