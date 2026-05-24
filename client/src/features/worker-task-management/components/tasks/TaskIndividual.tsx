import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { DescriptionField } from '@/types/api.types';
import { STATUS_MAP } from '../../utils/selectOptionTernary';
import TaskStatusBar from './TaskStatusBar';

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
                  'text-left px-4 py-3 bg-white rounded-lg transition-all flex items-center gap-4 group w-full'
                )}
              >
                <TaskStatusBar
                  isSelected={isSelected}
                  index={index}
                  statusConfig={statusConfig}
                  task={task}
                />
              </Button>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default TaskIndividual;
