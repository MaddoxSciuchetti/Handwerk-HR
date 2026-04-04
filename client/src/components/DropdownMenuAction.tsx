import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';

export type DropdownMenuActionItem = {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
};

export type DropdownMenuActionProps = {
  disabled?: boolean;
  description: string;
  triggerIcon: React.ReactNode;
  actions: DropdownMenuActionItem[];
};

const DropdownMenuAction = ({
  disabled,
  description,
  triggerIcon,
  actions,
}: DropdownMenuActionProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={disabled}
          className="cursor-pointer rounded-md text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${description} öffnen`}
        >
          {triggerIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[var(--muted)]"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((item, idx) => (
          <DropdownMenuItem
            key={item.label + idx}
            variant={item.variant ?? 'default'}
            onSelect={item.action}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuAction;
