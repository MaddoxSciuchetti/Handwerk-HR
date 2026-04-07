import { cn } from '@/lib/trycatch';
import { LucideIcon } from 'lucide-react';
import '../../../../globals.css';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarVariant = 'image' | 'initials';
type AvatarColor = 'blue' | 'purple' | 'teal' | 'coral' | 'amber';

interface AvatarProps {
  variant: AvatarVariant;
  size?: AvatarSize;
  initials?: string;
  src?: string;
  alt?: string;
  color?: AvatarColor;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
};

const colors: Record<AvatarColor, string> = {
  blue: 'bg-interactive-primary-bg text-blue-800',
  purple: 'bg-purple-50 text-purple-800',
  teal: 'bg-teal-50 text-teal-800',
  coral: 'bg-orange-50 text-orange-800',
  amber: 'bg-amber-50 text-amber-800',
};

export function Avatar({
  variant,
  size = 'md',
  initials,
  src,
  alt,
  color = 'blue',
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full border-1 bg-interactive-disabled-text flex items-center justify-center font-medium overflow-hidden shrink-0',
        sizes[size],
        variant === 'initials' && colors[color],
        variant === 'image' && 'border border-border',
        className
      )}
    >
      {variant === 'image' && src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-surface-page">{initials}</span>
      )}
    </div>
  );
}

type State = 'Default' | 'Hover';
type Transparent = 'Default' | 'Transparent';

interface SlotProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: State;
  transparent?: Transparent;
  className?: string;
  src?: string;
  alt?: string;
  initials?: string;
}

const transparency: Record<Transparent, string> = {
  Default: 'bg-background',
  Transparent: 'bg-interactive-secondary-bg',
};

const states: Record<State, string> = {
  Default: 'bg-background',
  Hover:
    'hover:bg-interactive-primary-active hover:text-text-inverse hover:border-none',
};

export function Slot({
  state = 'Default',
  transparent = 'Transparent',
  className,
  src,
  alt,
  initials,
  ...props
}: SlotProps) {
  return (
    <div
      className={cn(
        `rounded-md p-2 flex w-8 h-8 items-center justify-center border-1 border-interactive-ghost-border ${src ? 'hover:border-interactive-primary-active hover:bg-interactive-secondary-hover' : ''}`,
        states[state],
        transparency[transparent],
        className
      )}
      {...props}
    >
      <div>
        {src ? (
          <img src={src} alt={alt} className="h-4 w-4 object-cover" />
        ) : (
          <span className={cn(states[state], 'text-label-sm')}>{initials}</span>
        )}
      </div>
    </div>
  );
}

interface IconProps {
  src: string;
  alt?: string;
  icon: LucideIcon;
}

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const logosizes: Record<LogoSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
};

type LogoProps = {
  src: string;
  size: LogoSize;
  alt?: string;
};
export function Logo({ src, size, alt }: LogoProps) {
  return <img src={src} alt={alt} className={cn(logosizes[size])} />;
}
