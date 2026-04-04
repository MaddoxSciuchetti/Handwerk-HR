import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { DescriptionField } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../../query-options/queries/worker.queries';
import { STATUS_MAP } from '../../utils/selectOptionTernary';
import TaskStatusBar from './TaskStatusBar';

type TaskIndividualProps = {
  workerId: string;
  tasks: DescriptionField[];
  selectedTaskId: string | number | null;
  handleSelectTask: (id: string | number) => void;
};

const TaskIndividual = ({
  workerId,
  tasks,
  selectedTaskId,
  handleSelectTask,
}: TaskIndividualProps) => {
  const { data: issueStatuses = [] } = useQuery(
    workerQueries.issueStatuses(workerId)
  );

  return (
    <main className="flex-1 py-4">
      <ul className="max-w-4xl space-y-1">
        {tasks.map((task, index) => {
          const isSelected = task.id === selectedTaskId;
          const orgMeta = task.statusId
            ? issueStatuses.find((s) => s.id === task.statusId)
            : undefined;
          const statusConfig =
            task.statusId && orgMeta?.color
              ? { className: '', dotClassName: '' }
              : (STATUS_MAP[task.status as keyof typeof STATUS_MAP] ??
                STATUS_MAP.offen);
          const dotColor = task.statusId ? orgMeta?.color : undefined;

          return (
            <li key={task.id}>
              <Button
                onClick={() => handleSelectTask(task.id)}
                className={cn(
                  'group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition-all',
                  isSelected
                    ? 'bg-[var(--dropdown-surface)] text-foreground'
                    : 'hover:bg-[var(--hover-bg)]'
                )}
              >
                <TaskStatusBar
                  isSelected={isSelected}
                  index={index}
                  statusConfig={statusConfig}
                  dotColor={dotColor}
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
