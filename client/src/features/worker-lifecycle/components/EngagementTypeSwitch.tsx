import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowRightLeft } from 'lucide-react';
import { switchableEngagementTypes } from '../consts/engagement-type.consts';
import type { EngagementType } from '../types/index.types';

type EngagementTypeSwitchProps = {
  selectedTypes: EngagementType[];
  disabled: boolean;
  onSwitch: (type: EngagementType) => void;
};

function EngagementTypeSwitch({
  selectedTypes,
  disabled,
  onSwitch,
}: EngagementTypeSwitchProps) {
  const options = switchableEngagementTypes(selectedTypes);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Typ wechseln"
          disabled={disabled || selectedTypes.length === 0}
          className="rounded-full p-1 hover:bg-muted disabled:opacity-50"
        >
          <ArrowRightLeft className="h-4 w-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onSwitch(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default EngagementTypeSwitch;
