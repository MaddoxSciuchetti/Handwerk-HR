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
          `rounded-2xl px-3 py-1 text-sm cursor-pointer group`,
          className
        )}
      >
        {badgeDescription}
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 ">
          {tooltip}
        </div>
      </span>
    </div>
  );
};

export default StatusBadge;
