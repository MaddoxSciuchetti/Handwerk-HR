import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import {
  Cell,
  CellHolder,
  GrowingItem,
  ItemHeader,
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import useAuth from '@/features/user-profile/hooks/useAuth';
import GreetingHeader from '@/features/worker-lifecycle/components/GreetingHeader';
import { useMemo, useState } from 'react';
import { useFetchTasks } from '../hooks/useFetchTasks';
import { TaskItem } from './TaskItem';
import { TaskSidebar } from './TaskSidebar';
import { Segment, TaskSegmentToggle } from './ui/taskHeader';

export type TaskEditState = {
  taskId: string;
  title: string;
  workerEngagementId: string;
  assigneeUserId: string;
  statusId: string;
};

const EMPTY_TASK_EDIT_STATE: TaskEditState = {
  taskId: '',
  title: '',
  workerEngagementId: '',
  assigneeUserId: '',
  statusId: '',
};

function Tasks() {
  const { user } = useAuth();
  const { data, isLoading } = useFetchTasks();
  const [segment, setSegment] = useState<Segment>('left');
  const [isOpen, setIsOpen] = useState(false);
  const [taskState, setTaskState] = useState<'create' | 'edit'>('create');
  const [taskEditState, setTaskEditState] = useState<TaskEditState>(
    EMPTY_TASK_EDIT_STATE
  );
  const [createOpenNonce, setCreateOpenNonce] = useState(0);
  const filteredTasks = useMemo(() => {
    if (segment === 'left') return data;
    return data?.filter((task) => task.assigneeUserId === user?.id);
  }, [data, segment, user?.id]);

  if (isLoading) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="flex h-full w-full flex-col">
        <TaskSidebar
          key={
            taskState === 'edit'
              ? `edit-${taskEditState.taskId}`
              : `create-${createOpenNonce}`
          }
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          taskState={taskState}
          taskEditState={taskEditState}
        />
        <GreetingHeader firstname={user?.firstName ?? ''} />
        <Table>
          <TableHeader>
            <GrowingItem>Alle Aufgaben</GrowingItem>
            <TaskSegmentToggle value={segment} onChange={setSegment} />
            <Button
              className="text-sm text-surface-page"
              type="button"
              onClick={() => {
                setTaskState('create');
                setTaskEditState(EMPTY_TASK_EDIT_STATE);
                setCreateOpenNonce((n) => n + 1);
                setIsOpen(true);
              }}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <ItemHeader className="p-0">
            <GrowingItem className="py-2 pl-10">
              <p className="typo-body-sm">Titel</p>
            </GrowingItem>
            <CellHolder>
              <Cell className="typo-body-sm">Beschreibung</Cell>
            </CellHolder>
          </ItemHeader>
          {filteredTasks?.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              setIsOpen={setIsOpen}
              setTaskState={setTaskState}
              setTaskEditState={setTaskEditState}
            />
          ))}
        </Table>
      </div>
    </div>
  );
}

export default Tasks;
