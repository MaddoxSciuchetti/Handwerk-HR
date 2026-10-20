import { cn } from '@/lib/trycatch';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function SquareIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0', className)}
      {...props}
    >
      <rect x={3} y={3} width={18} height={18} rx={2} />
    </svg>
  );
}

export function SquareDashedIcon(props: IconProps) {
  return <SquareIcon strokeDasharray="3 3" {...props} />;
}

export function SquareCheckIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0', className)}
      {...props}
    >
      <rect x={3} y={3} width={18} height={18} rx={2} />
      <path d="M 6 12.5 L 10 16.5 L 18 8" />
    </svg>
  );
}
