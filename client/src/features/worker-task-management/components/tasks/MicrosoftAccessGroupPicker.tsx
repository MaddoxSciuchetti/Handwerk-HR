import { useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getMicrosoftAccessGroups } from '../../api/microsoftAccessGroups.api';

type MicrosoftAccessGroupPickerProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** When true (default), show that groups are optional at account creation. */
  showOptionalNote?: boolean;
};

function selectionLabel(labels: string[]) {
  if (labels.length === 0) return 'Gruppen auswählen';
  if (labels.length === 1) return labels[0];
  return `${labels.length} Gruppen ausgewählt`;
}

export function MicrosoftAccessGroupPicker({
  selectedIds,
  onChange,
  disabled,
  showOptionalNote = true,
}: MicrosoftAccessGroupPickerProps) {
  const [open, setOpen] = useState(false);
  const groups = useQuery({
    queryKey: ['microsoft-access-groups'],
    queryFn: getMicrosoftAccessGroups,
  });

  const options = groups.data?.groups ?? [];
  const error = groups.isError
    ? 'Microsoft-Gruppen konnten nicht geladen werden.'
    : groups.data?.error;
  const selected = new Set(selectedIds);
  const selectedLabels = options
    .filter((group) => selected.has(group.id))
    .map((group) => group.displayName);

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
    <div className="flex w-full min-w-0 items-center gap-1.5">
      {showOptionalNote ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Hinweis zu Microsoft-Gruppen"
              >
                <CircleHelp className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-left">
              Optional. Ohne Auswahl startet der Benutzer ohne Gruppenrechte.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-8 min-w-0 flex-1 justify-between px-2 text-xs font-normal"
            aria-label="Microsoft-Gruppen"
            title={
              selectedLabels.length === 1 ? selectedLabels[0] : undefined
            }
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {selectionLabel(selectedLabels)}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-1"
        >
          <div
            className="max-h-40 overflow-y-auto"
            role="group"
            aria-label="Microsoft-Gruppen"
          >
            {options.map((group) => {
              const isSelected = selected.has(group.id);
              return (
                <label
                  key={group.id}
                  className="flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 py-2 hover:bg-muted/50"
                  title={group.displayName}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={disabled}
                    className="shrink-0"
                    aria-label={group.displayName}
                    onCheckedChange={(value) =>
                      toggle(group.id, value === true)
                    }
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {group.displayName}
                  </span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
