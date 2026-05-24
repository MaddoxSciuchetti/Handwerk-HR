import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useAuth from '@/features/user-profile/hooks/useAuth';
import GreetingHeader from '@/features/worker-lifecycle/components/GreetingHeader';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
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

  const handleSetEditModeData: Dispatch<
    SetStateAction<{ taskNumber: string; taskTitle: string }[]>
  > = (action) => {
    setEditModeData((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      setLargeEditMode(next.length > 0);
      return next;
    });
  };

  if (isLoading) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col">
        <TaskSidebar key={sidebarKey} {...sidebarProps} />
        <GreetingHeader firstname={user?.firstName ?? ''} />
        <Card className="mt-5 flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
            <CardTitle className="text-base font-medium">Alle Aufgaben</CardTitle>
            <div className="flex shrink-0 items-center gap-3">
              <TaskSegmentToggle value={segment} onChange={setSegment} />
              <Button
                type="button"
                className="rounded-2xl"
                onClick={openForCreate}
              >
                Hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
            <ScrollableTableViewport>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="h-12 bg-card py-3 pl-10 pr-2">
                      Titel
                    </TableHead>
                    <TableHead className="bg-card py-3 px-2 text-right">
                      Beschreibung
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
                  {filteredTasks?.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isSelected={editModeData.some(
                        (item) => item.taskNumber === task.id
                      )}
                      onOpenEdit={openForEdit}
                      setLargeEditMode={setLargeEditMode}
                      setEditModeData={handleSetEditModeData}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollableTableViewport>
          </CardContent>
        </Card>
        {largeEditMode && (
          <LargeEditMode
            editModeData={editModeData}
            setLargeEditMode={setLargeEditMode}
            setEditModeData={handleSetEditModeData}
          />
        )}
      </div>
    </div>
  );
}

export default Tasks;
