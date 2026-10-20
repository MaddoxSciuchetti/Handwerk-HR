import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { ENGAGEMENT_TYPE_OPTIONS } from '../consts/engagement-type.consts';
import type { EngagementType } from '../types/index.types';

type EngagementTypeSwitchProps = {
  value: EngagementType;
  workerName: string;
  disabled: boolean;
  onSwitch: (type: EngagementType) => void;
};

function EngagementTypeSwitch({
  value,
  workerName,
  disabled,
  onSwitch,
}: EngagementTypeSwitchProps) {
  const label = ENGAGEMENT_TYPE_OPTIONS.find(
    (option) => option.value === value
  )?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Typ für ${workerName} ändern`}
          disabled={disabled}
          className="-ml-2 gap-2 rounded-lg border-border bg-muted px-2 font-normal shadow-none hover:bg-muted focus-visible:border-border focus-visible:ring-0 aria-expanded:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted"
        >
          {label}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const option = ENGAGEMENT_TYPE_OPTIONS.find(
              (item) => item.value === next
            );
            if (option && option.value !== value) onSwitch(option.value);
          }}
        >
          {ENGAGEMENT_TYPE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default EngagementTypeSwitch;
