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
import { useState } from 'react';
import { useCreateTask } from '../hooks/useCreateTask';
import { useFetchTasks } from '../hooks/useFetchTasks';
import { TaskItem } from './TaskItem';
import { TaskSidebar } from './TaskSidebar';
import { Segment, TaskSegmentToggle } from './ui/taskHeader';

function Tasks() {
  const { user } = useAuth();
  const { data, isLoading } = useFetchTasks();
  const { mutate: createTask } = useCreateTask();
  const [segment, setSegment] = useState<Segment>('left');
  const [isOpen, setIsOpen] = useState(false);

  const tasks = Array.isArray(data) ? data : [];

  if (isLoading) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="flex h-full w-full flex-col">
        <TaskSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <GreetingHeader firstname={user?.firstName ?? ''} />
        <Table>
          <TableHeader>
            <GrowingItem>Alle Aufgaben</GrowingItem>
            <TaskSegmentToggle value={segment} onChange={setSegment} />
            <Button
              className="text-sm text-surface-page"
              type="button"
              onClick={() => {
                setIsOpen(true);
                createTask({});
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
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </Table>
      </div>
    </div>
  );
}

export default Tasks;
