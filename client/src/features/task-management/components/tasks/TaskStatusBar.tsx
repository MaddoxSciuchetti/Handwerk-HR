import { cn } from '@/lib/trycatch';

type TaskStatusBarProps = {
  isSelected: boolean;
  index: number;
  statusConfig: { className: string };
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
  task,
}: TaskStatusBarProps) => {
  return (
    <>
      <span
        className={cn(
          'text-sm w-5 shrink-0',
          isSelected ? 'text-foreground/60' : 'text-muted-foreground'
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <span
        className={cn(
          'h-2 w-2 rounded-full shrink-0 transition-all',
          statusConfig.className,
          isSelected && 'h-2.5 w-2.5'
        )}
      />
      <span
        className={cn(
          'flex-1 text-sm truncate font-semibold',
          isSelected ? 'text-foreground font-semibold' : 'text-foreground'
        )}
      >
        {task.description}
      </span>
      <span
        className={cn(
          'text-sm shrink-0',
          isSelected ? 'text-foreground/70' : 'text-muted-foreground'
        )}
      >
        {task.is_substitute ? task.substituteOwner : task.officialOwner}
      </span>
    </>
  );
};

export default TaskStatusBar;
