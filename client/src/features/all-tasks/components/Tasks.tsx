import { TableSelectAllCheckbox } from '@/components/ui/table-select-all-checkbox';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ScrollableTableViewport,
  stickyTableHeadClassName,
} from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useAuth from '@/features/user-profile/hooks/useAuth';
import GreetingHeader from '@/features/worker-lifecycle/components/GreetingHeader';
import {
  clearContractSendReturn,
  peekContractSendReturn,
} from '@/features/worker-task-management/contractSendReturn';
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useFetchTasks } from '../hooks/useFetchTasks';
import { useTaskSidebar } from '../hooks/useTaskSidebar';
import { LargeEditMode } from './LargeEditMode';
import { ContractConfirmDialog } from '@/features/worker-task-management/components/files/ContractConfirmDialog';
import { ContractSendDialog } from '@/features/worker-task-management/components/files/ContractSendDialog';
import { ArbeitszeugnisSendDialog } from '@/features/worker-task-management/components/files/ArbeitszeugnisSendDialog';
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
    const visibleTasks =
      segment === 'left'
        ? (data ?? [])
        : (data?.filter(
            (task) => task.assigneeUserId === user?.id || task.mentioned
          ) ?? []);

    return visibleTasks;
  }, [data, segment, user?.id]);

  const [contractSend, setContractSend] = useState<{
    workerId: string;
    engagementId: string;
    issueId: string;
  } | null>(null);
  const [contractConfirm, setContractConfirm] = useState<{
    workerId: string;
    engagementId: string;
    issueId: string;
  } | null>(null);

  const [zeugnisIssueId, setZeugnisIssueId] = useState<string | null>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const pending = peekContractSendReturn();
    if (!pending || pending.returnTo !== 'tasks') return;
    if (pending.kind === 'arbeitszeugnis') {
      setZeugnisIssueId(pending.issueId);
    } else {
      setContractSend({
        workerId: pending.workerId,
        engagementId: pending.engagementId,
        issueId: pending.issueId,
      });
    }
    const timeout = window.setTimeout(() => clearContractSendReturn(), 0);
    return () => window.clearTimeout(timeout);
  }, []);
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
  const selectVisibleTasks = (checked: boolean) => {
    const visibleIds = new Set(filteredTasks.map((task) => task.id));
    handleSetEditModeData((previous) => {
      const remaining = previous.filter(
        (item) => !visibleIds.has(item.taskNumber)
      );
      if (!checked) return remaining;
      return [
        ...remaining,
        ...filteredTasks.map((task) => ({
          taskNumber: task.id,
          taskTitle: task.title,
        })),
      ];
    });
  };

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col">
        <TaskSidebar
          key={sidebarKey}
          {...sidebarProps}
          taskEditState={{
            ...sidebarProps.taskEditState,
            status:
              data?.find(
                (task) => task.id === sidebarProps.taskEditState.taskId
              )?.status ?? sidebarProps.taskEditState.status,
          }}
          onOpenArbeitszeugnis={setZeugnisIssueId}
        />
        {contractSend ? (
          <ContractSendDialog
            workerId={contractSend.workerId}
            engagementId={contractSend.engagementId}
            issueId={contractSend.issueId}
            onClose={() => setContractSend(null)}
          />
        ) : null}
        {zeugnisIssueId ? (
          <ArbeitszeugnisSendDialog
            issueId={zeugnisIssueId}
            onClose={() => setZeugnisIssueId(null)}
            onSent={() => setZeugnisIssueId(null)}
          />
        ) : null}
        {contractConfirm ? (
          <ContractConfirmDialog
            workerId={contractConfirm.workerId}
            engagementId={contractConfirm.engagementId}
            issueId={contractConfirm.issueId}
            onClose={() => setContractConfirm(null)}
          />
        ) : null}
        <GreetingHeader firstname={user?.firstName ?? ''} />
        <Card className="mt-5 flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-4 px-6 py-3">
            <CardTitle className="text-base font-medium">
              Alle Aufgaben
            </CardTitle>
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
            <ScrollableTableViewport onScrolledChange={setHeaderScrolled}>
              <Table
                aria-busy={isLoading}
                className="border-separate border-spacing-0"
              >
                <TableHeader className="[&_tr]:border-0">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead
                      className={`relative h-12 w-px py-3 pl-12 pr-2 ${stickyTableHeadClassName(headerScrolled)}`}
                    >
                      <div className="absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                        <TableSelectAllCheckbox
                          ids={filteredTasks.map((task) => task.id)}
                          selectedIds={editModeData.map(
                            (item) => item.taskNumber
                          )}
                          disabled={isLoading}
                          selectLabel="Alle Aufgaben auswählen"
                          clearLabel="Alle Aufgaben abwählen"
                          onCheckedChange={selectVisibleTasks}
                        />
                      </div>
                      Titel
                    </TableHead>
                    <TableHead
                      className={`py-3 px-2 text-right ${stickyTableHeadClassName(headerScrolled)}`}
                    >
                      Beschreibung
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
                  {isLoading ? (
                    <TableSkeletonRows variant="tasks" />
                  ) : (
                    filteredTasks?.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isSelected={editModeData.some(
                          (item) => item.taskNumber === task.id
                        )}
                        onOpenEdit={openForEdit}
                        onOpenContractSend={(task) => {
                          const taskWorkerId = task.workerEngagement?.workerId;
                          if (!taskWorkerId) return;
                          setContractSend({
                            workerId: taskWorkerId,
                            engagementId: task.workerEngagementId,
                            issueId: task.id,
                          });
                        }}
                        onOpenContractConfirm={(task) => {
                          const taskWorkerId = task.workerEngagement?.workerId;
                          if (!taskWorkerId) return;
                          setContractConfirm({
                            workerId: taskWorkerId,
                            engagementId: task.workerEngagementId,
                            issueId: task.id,
                          });
                        }}
                        setLargeEditMode={setLargeEditMode}
                        setEditModeData={handleSetEditModeData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollableTableViewport>
          </CardContent>
        </Card>
        {largeEditMode ? (
          <LargeEditMode
            editModeData={editModeData}
            setLargeEditMode={setLargeEditMode}
            setEditModeData={handleSetEditModeData}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Tasks;
