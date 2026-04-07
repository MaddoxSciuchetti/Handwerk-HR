import { cn } from '@/lib/trycatch';
import { LucideIcon } from 'lucide-react';

type State = 'Default' | 'Open';
const DropdownStates: Record<State, string> = {
  Default: 'bg-transparent',
  Open: 'bg-transparent border-1 border-border-default',
};
type Size = 'sm' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'h-8',
  lg: 'h-9 w-60',
};

type SelectDropdownProps = {
  state: State;
  size: Size;
  icon: LucideIcon;
};

export function SelectDropdown({
  state,
  size,
  icon: Icon,
}: SelectDropdownProps) {
  return (
    <div
      className={cn(
        'rounded-lg px-3 flex items-center w-full',
        DropdownStates[state],
        sizes[size]
      )}
    >
      <p className="text-body-sm flex-grow text-text-disabled">Maddox</p>
      <Icon
        className={cn(
          `w-6 h-6 text-text-disabled transition-transform duration-200`,
          state === 'Open' ? 'rotate-90' : 'rotate-0'
        )}
      />
    </div>
  );
}
