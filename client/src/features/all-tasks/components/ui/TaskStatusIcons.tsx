import { cn } from '@/lib/utils';
import type { ComponentType, SVGProps } from 'react';
import type { IssueStatusValue } from '../../consts/issue-status.consts';

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn('size-4 shrink-0', className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function TaskStatusOpenIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="7" cy="7" r="6.25" stroke="#8C9196" strokeWidth="1.5" />
    </IconFrame>
  );
}

export function TaskStatusInProgressIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M7 14C5.14348 14 3.36301 13.2625 2.05025 11.9497C0.737498 10.637 0 8.85652 0 7C0 5.14348 0.737498 3.36301 2.05025 2.05025C3.36301 0.737498 5.14348 0 7 0L7 7L7 14Z"
        fill="#E8C247"
      />
      <circle cx="7" cy="7" r="6.25" stroke="#E8C247" strokeWidth="1.5" />
    </IconFrame>
  );
}

export function TaskStatusDoneIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="7" cy="7" r="7" fill="#7075E8" />
      <path
        d="M4.2 7L6.3 9.2L9.8 4.8"
        stroke="white"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

export function TaskStatusCancelledIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="7" cy="7" r="7" fill="#8C99AD" />
      <path
        d="M4.2 4.2L9.8 9.8M9.8 4.2L4.2 9.8"
        stroke="white"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

const STATUS_ICON_MAP = {
  open: TaskStatusOpenIcon,
  in_progress: TaskStatusInProgressIcon,
  done: TaskStatusDoneIcon,
  cancelled: TaskStatusCancelledIcon,
} as const satisfies Record<IssueStatusValue, ComponentType<IconProps>>;

export function TaskStatusIcon({
  status,
  className,
  ...props
}: IconProps & { status: IssueStatusValue }) {
  const Icon = STATUS_ICON_MAP[status];
  return <Icon className={className} {...props} />;
}
