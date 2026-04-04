import { cn } from '@/lib/trycatch';

type TaskStatusBarProps = {
  isSelected: boolean;
  index: number;
  statusConfig: { className: string; dotClassName?: string };
  /** When set (V2 issue org color), overrides dotClassName. */
  dotColor?: string | null;
  task: {
    description: string;
    is_substitute: boolean;
    substituteOwner: string;
    officialOwner: string;
  };
};

const TaskStatusBar = ({
  isSelected,
  index,
  statusConfig,
  dotColor,
  task,
}: TaskStatusBarProps) => {
  return (
    <>
      <span
        className={cn(
          'w-5 shrink-0 text-sm',
          isSelected
            ? 'text-[var(--foreground)] opacity-60'
            : 'text-[var(--muted-foreground)]'
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full transition-all',
          !dotColor &&
            (statusConfig.dotClassName ?? statusConfig.className),
          isSelected && 'h-2.5 w-2.5'
        )}
        style={
          dotColor
            ? { backgroundColor: dotColor }
            : undefined
        }
      />
      <span
        className={cn(
          'flex-1 truncate text-sm font-semibold',
          isSelected
            ? 'font-semibold text-[var(--foreground)]'
            : 'text-[var(--foreground)]'
        )}
      >
        {task.description}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            'rounded-full bg-[var(--muted)] px-2 py-1 text-sm',
            task.is_substitute
              ? 'text-[var(--muted-foreground)] opacity-50'
              : isSelected
                ? 'text-[var(--foreground)] opacity-70'
                : 'text-[var(--muted-foreground)]'
          )}
        >
          {task.officialOwner}
        </span>

        {task.is_substitute && (
          <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-sm font-semibold text-[var(--foreground)]">
            {task.substituteOwner}
          </span>
        )}
      </div>
    </>
  );
};

export default TaskStatusBar;
