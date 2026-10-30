import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import type { ExtraWorkerColumnOption } from '../consts/extra-worker-columns';

export function AddWorkerColumn({
  options,
  onAdd,
}: {
  options: ExtraWorkerColumnOption[];
  onAdd: (id: ExtraWorkerColumnOption['id']) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="group/add-column absolute inset-y-0 right-0 flex w-10 items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Add column"
            className="opacity-0 group-hover/add-column:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onSelect={() => onAdd(option.id)}
            >
              {option.menuLabel}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
