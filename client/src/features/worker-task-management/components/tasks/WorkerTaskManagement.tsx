import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TaskSidebar } from '@/features/all-tasks/components/TaskSidebar';
import { LargeEditMode } from '@/features/all-tasks/components/LargeEditMode';
import { TaskItem } from '@/features/all-tasks/components/TaskItem';
import { useTaskSidebar } from '@/features/all-tasks/hooks/useTaskSidebar';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import useFilteredData from '../../hooks/useFilteredData';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import useTaskData from '../../hooks/useTaskData';
import handleZipExport from '../../utils/handleZipExport';
import { WorkerTab } from '../../types/index.types';
import WorkerFileUploads from '../files/WorkerFileUploads';
import WorkerHeader from '../header/WorkerHeader';
import { WorkerTabButtons } from '../header/WorkerTabButtons';

type TaskManagementProps = {
  workerId: string;
};

const sectionHeaderClassName = 'h-12 py-3 pl-10 pr-2 text-sm font-medium';

const TaskManagement = ({ workerId }: TaskManagementProps) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('form');
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
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

  const { data, isLoading } = useTaskData(workerId);
  const { displayData } = useFilteredData(data);
  const { fetchFiles } = useGetWorkerFiles(workerId);
  const { sidebarKey, sidebarProps, openForEdit, openForCreate, patchTaskEditState } =
    useTaskSidebar();

  useEffect(() => {
    if (!sidebarProps.isOpen || sidebarProps.taskState !== 'edit') return;

    const task = displayData.find(
      (item) => item.id === sidebarProps.taskEditState.taskId
    );
    if (!task || task.status === sidebarProps.taskEditState.status) return;

    patchTaskEditState({ status: task.status });
  }, [
    displayData,
    patchTaskEditState,
    sidebarProps.isOpen,
    sidebarProps.taskEditState.status,
    sidebarProps.taskEditState.taskId,
    sidebarProps.taskState,
  ]);

  if (isLoading) return <LoadingAlert />;
  if (!data)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <TaskSidebar key={sidebarKey} {...sidebarProps} />

      <Tabs
        value={activeTab}
        defaultValue="form"
        onValueChange={(value) => {
          if (value === 'form' || value === 'files') {
            setActiveTab(value);
          }
        }}
        className="flex h-full flex-col"
      >
        <WorkerTabButtons activeTab={activeTab} onTabChange={setActiveTab} />
        <Card className="mt-3 flex h-full flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex min-h-14 flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
            <WorkerHeader
              activeTab={activeTab}
              openForCreate={openForCreate}
              onOpenFileUpload={() => setIsFileUploadOpen(true)}
              onExportFiles={() => void handleZipExport(fetchFiles)}
            />
          </CardHeader>
          <CardContent className="px-2 pb-0">
            <TabsContent value="form" className="mt-0">
              <Table>
                <TableHeader className="[&_tr]:border-0">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className={sectionHeaderClassName}>
                      Titel
                    </TableHead>
                    <TableHead className="h-12 py-3 px-2 text-right">
                      Beschreibung
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
                  {displayData.length ? (
                    displayData.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        workerId={workerId}
                        isSelected={editModeData.some(
                          (item) => item.taskNumber === task.id
                        )}
                        onOpenEdit={openForEdit}
                        setLargeEditMode={setLargeEditMode}
                        setEditModeData={handleSetEditModeData}
                      />
                    ))
                  ) : (
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableCell
                        colSpan={2}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Keine Aufgaben gefunden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <div className={sectionHeaderClassName}>Name</div>
              <WorkerFileUploads
                workerId={workerId}
                isUploadModalOpen={isFileUploadOpen}
                setIsUploadModalOpen={setIsFileUploadOpen}
              />
            </TabsContent>
          </CardContent>
        </Card>
        {largeEditMode ? (
          <LargeEditMode
            editModeData={editModeData}
            setLargeEditMode={setLargeEditMode}
            setEditModeData={handleSetEditModeData}
          />
        ) : null}
      </Tabs>
    </div>
  );
};

export default TaskManagement;
