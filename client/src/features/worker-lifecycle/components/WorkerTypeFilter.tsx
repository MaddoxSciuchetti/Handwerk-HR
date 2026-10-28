import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
import { ENGAGEMENT_TYPE_OPTIONS } from '../consts/engagement-type.consts';
import type { EngagementType } from '../types/index.types';

export function WorkerTypeFilter({
  selectedTypes,
  onToggle,
  disabled,
}: {
  selectedTypes: EngagementType[];
  onToggle: (type: EngagementType) => void;
  disabled?: boolean;
}) {
  const selectedLabels = ENGAGEMENT_TYPE_OPTIONS.filter((option) =>
    selectedTypes.includes(option.value)
  ).map((option) => option.label);
  const label =
    selectedTypes.length === ENGAGEMENT_TYPE_OPTIONS.length
      ? 'Typ'
      : selectedLabels.join(', ') || 'Typ (keine)';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={`Typ filtern: ${selectedLabels.join(', ') || 'keine'}`}
          className="w-28 shrink-0 justify-between rounded-2xl border-border bg-muted font-normal shadow-none hover:bg-muted focus-visible:border-border focus-visible:ring-0 aria-expanded:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted"
        >
          <span className="truncate">{label}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Typ</DropdownMenuLabel>
        {ENGAGEMENT_TYPE_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedTypes.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
            onSelect={(event) => event.preventDefault()}
            className="py-2 pr-3 pl-8 [&>span]:left-2 [&>span]:right-auto [&>span]:size-4 [&>span]:rounded-sm [&>span]:border [&>span]:border-input"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
