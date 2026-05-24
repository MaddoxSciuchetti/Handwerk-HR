import { cn } from '@/lib/trycatch';
import '../../../../globals.css';

type Variant = 'default' | 'pressed';
const variants: Record<Variant, string> = {
  default: 'bg-transparent text-foreground',
  pressed: 'bg-background text-foreground',
};

type ToggleButtonProps = {
  label: string;
  variant: Variant;
};
export function ToggleButton({ label, variant }: ToggleButtonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-10 w-40 rounded-lg p-2 shadow-sm',
        variants[variant],
        variant === 'default' ? '' : 'shadow-[0_2px_4px_0_rgba(0,0,0,0.25)]'
      )}
    >
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ToggleSwitch() {
  return (
    <div className="flex items-center p-1 gap-2 rounded-lg bg-interactive-secondary-bg">
      <ToggleButton label="Toggle" variant="pressed" />
      <ToggleButton label="Toggle" variant="default" />
    </div>
  );
}
