import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, type LucideIcon } from 'lucide-react';

export type DropdownOption = {
  label: string;
  value: string;
  action?: () => void;
  subOptions?: DropdownOption[];
  icon?: LucideIcon;
};

type NestedDropdownProps = {
  options: DropdownOption[];
  value: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  onSubSelect?: (sub: DropdownOption, parent: DropdownOption) => void;
  className?: string;
};

export function NestedDropdown({
  options,
  value,
  placeholder = 'Select Option',
  onSelect,
  onSubSelect,
  className,
}: NestedDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-60 justify-between rounded-2xl font-normal', className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {options.map((option) => {
          if (option.value === '__divider__') {
            return <DropdownMenuSeparator key={option.value} />;
          }

          if (option.subOptions?.length) {
            return (
              <DropdownMenuSub key={option.value}>
                <DropdownMenuSubTrigger>
                  {option.icon ? (
                    <option.icon className="size-4" aria-hidden />
                  ) : null}
                  {option.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {option.subOptions.map((sub) => (
                    <DropdownMenuItem
                      key={sub.value}
                      onClick={() => {
                        onSubSelect?.(sub, option);
                        sub.action?.();
                      }}
                    >
                      {sub.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                option.action?.();
              }}
            >
              {option.icon ? (
                <option.icon className="size-4" aria-hidden />
              ) : null}
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
