import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit } from 'lucide-react';

type DropDownResuableProps = {
  disabled?: boolean;
  description: string;
  action: () => void;
};

const DropDownResuable = ({
  description,
  disabled,
  action,
}: DropDownResuableProps) => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Edit />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-40 rounded-xl border border-border bg-(--dropdown-surface) p-1.5 text-popover-foreground shadow-md"
          align="start"
          sideOffset={8}
          collisionPadding={16}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={disabled}
              className="cursor-pointer rounded-lg text-sm font-medium focus:bg-accent focus:text-accent-foreground"
              onClick={(e) => {
                e.stopPropagation();
                action();
              }}
            >
              {description}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default DropDownResuable;
