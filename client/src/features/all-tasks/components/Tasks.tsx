import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import {
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
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full w-full flex-col">
        <TaskSidebar key={sidebarKey} {...sidebarProps} />
        <GreetingHeader firstname={user?.firstName ?? ''} />
        <Table>
          <TableHeader className="px-6 py-2">
            <GrowingItem className="py-2">Alle Aufgaben</GrowingItem>
            <TaskSegmentToggle value={segment} onChange={setSegment} />
            <Button
              size="small"
              className="border-0 bg-interactive-primary-bg text-xs text-interactive-primary-text hover:bg-interactive-primary-hover"
              type="button"
              onClick={openForCreate}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <ItemHeader className="flex w-full min-w-0 items-center gap-0 px-4 py-0">
            <div className="shrink-0 py-1.5 pl-10">
              <p className="text-xs font-medium text-foreground">Titel</p>
            </div>
            <div className="min-w-0 flex-1" />
            <div className="shrink-0 py-1.5 text-right">
              <p className="text-xs font-medium text-foreground">
                Beschreibung
              </p>
            </div>
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
