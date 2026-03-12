import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { DescriptionField } from '@/types/api.types';
import { STATUS_MAP } from '../../utils/selectOptionTernary';

type TaskIndividualProps = {
  tasks: DescriptionField[];
  selectedTaskId: number | null;
  handleSelectTask: (id: number) => void;
};

const TaskIndividual = ({
  tasks,
  selectedTaskId,
  handleSelectTask,
}: TaskIndividualProps) => {
  return (
    <main className="flex-1 py-4">
      <ul className="space-y-1 max-w-4xl">
        {tasks.map((task, index) => {
          const isSelected = task.id === selectedTaskId;
          const statusConfig =
            STATUS_MAP[task.status as keyof typeof STATUS_MAP] ??
            STATUS_MAP.offen;
          return (
            <li key={task.id}>
              <Button
                onClick={() => handleSelectTask(task.id)}
                className={cn(
                  'text-left px-4 py-3 rounded-lg transition-all flex items-center gap-4 group w-full',
                  isSelected
                    ? 'bg-(--dropdown-surface) text-foreground'
                    : 'hover:bg-(--hover-bg)'
                )}
              >
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

                {/* Title */}
                <span
                  className={cn(
                    'flex-1 text-sm truncate font-semibold',
                    isSelected
                      ? 'text-foreground font-semibold'
                      : 'text-foreground'
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
                  {task.is_substitute
                    ? task.substituteOwner
                    : task.officialOwner}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default TaskIndividual;
