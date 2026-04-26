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
import { useTaskSidebar } from '../hooks/useTaskSidebar';
import { LargeEditMode } from './LargeEditMode';
import { TaskItem } from './TaskItem';
import { TaskSidebar } from './TaskSidebar';
import { Segment, TaskSegmentToggle } from './ui/taskHeader';

function Tasks() {
  const { user } = useAuth();
  const { data, isLoading } = useFetchTasks();
  const [segment, setSegment] = useState<Segment>('left');
  const { sidebarKey, sidebarProps, openForEdit, openForCreate } =
    useTaskSidebar();
  const filteredTasks = useMemo(() => {
    if (segment === 'left') return data;
    return data?.filter((task) => task.assigneeUserId === user?.id);
  }, [data, segment, user?.id]);

  const [largeEditMode, setLargeEditMode] = useState(false);
  const [editModeData, setEditModeData] = useState<
    { taskNumber: string; taskTitle: string }[]
  >([]);

  if (isLoading) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="flex h-full w-full flex-col">
        <TaskSidebar key={sidebarKey} {...sidebarProps} />
        <GreetingHeader firstname={user?.firstName ?? ''} />
        <Table>
          <TableHeader>
            <GrowingItem>Alle Aufgaben</GrowingItem>
            <TaskSegmentToggle value={segment} onChange={setSegment} />
            <Button
              className="text-sm text-surface-page"
              type="button"
              onClick={openForCreate}
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
              isSelected={editModeData.some(
                (item) => item.taskNumber === task.id
              )}
              onOpenEdit={openForEdit}
              setLargeEditMode={setLargeEditMode}
              setEditModeData={setEditModeData}
            />
          ))}
        </Table>
        {largeEditMode && (
          <LargeEditMode
            editModeData={editModeData}
            setLargeEditMode={setLargeEditMode}
            setEditModeData={setEditModeData}
          />
        )}
      </div>
    </div>
  );
}

export default Tasks;
