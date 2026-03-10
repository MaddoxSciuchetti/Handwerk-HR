import { cn } from '@/lib/trycatch';

type StatusBadgeProps = {
  badgeDescription: string;
  tooltip?: string;
  className?: string;
};

const StatusBadge = ({
  badgeDescription,
  tooltip,
  className,
}: StatusBadgeProps) => {
  return (
    <div className="relative">
      <span
        className={cn(
          'group cursor-pointer rounded-2xl px-3 py-1 text-sm text-foreground',
          className
        )}
      >
        {badgeDescription}
        <div className="invisible absolute bottom-full left-0 z-10 mb-2 whitespace-nowrap rounded-lg border border-border bg-(--dropdown-surface) p-3 text-popover-foreground opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
          {tooltip}
        </div>
      </span>
    </div>
  );
};

export default StatusBadge;
