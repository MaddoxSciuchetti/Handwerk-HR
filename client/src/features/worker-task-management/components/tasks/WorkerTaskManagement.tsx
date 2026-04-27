import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import {
  ItemHeader,
  Table,
  TableDivider,
} from '@/components/ui/selfmade/table/Table';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TaskSidebar } from '@/features/all-tasks/components/TaskSidebar';
import { useTaskSidebar } from '@/features/all-tasks/hooks/useTaskSidebar';
import { useState } from 'react';
import useFilteredData from '../../hooks/useFilteredData';
import useTaskData from '../../hooks/useTaskData';
import { WorkerTab } from '../../types/index.types';
import WorkerFileUploads from '../files/WorkerFileUploads';
import WorkerHeader from '../header/WorkerHeader';
import AddWorkerTaskModal from './AddWorkerTaskModal';
import { WorkerTaskRow } from './WorkerTaskRow';

type TaskManagementProps = {
  workerId: string;
};

const TaskManagement = ({ workerId }: TaskManagementProps) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('form');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const { data, isLoading } = useTaskData(workerId);

  const { displayData } = useFilteredData(data);

  const { sidebarKey, sidebarProps, openForEdit, openForCreate } =
    useTaskSidebar();

  if (isLoading) return <LoadingAlert />;
  if (!data)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)] w-5xl flex-col overflow-hidden rounded-2xl p-6 text-foreground md:max-w-8xl">
      <TaskSidebar key={sidebarKey} {...sidebarProps} />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === 'form' || value === 'files') {
            setActiveTab(value);
          }
        }}
      >
        <WorkerHeader openForCreate={openForCreate} />
        <TabsContent value="form">
          <Table>
            <TableDivider />
            <ItemHeader className="flex w-full min-w-0 items-center gap-0 px-4 py-0">
              <div className="shrink-0 py-2 pl-10">
                <p className="typo-body-sm text-foreground">Titel</p>
              </div>
              <div className="min-w-0 flex-1" />
              <div className="shrink-0 py-2 text-right">
                <p className="typo-body-sm text-foreground">Beschreibung</p>
              </div>
            </ItemHeader>
            {displayData.map((task) => (
              <WorkerTaskRow
                key={task.id}
                task={task}
                onOpenEdit={openForEdit}
              />
            ))}
          </Table>
        </TabsContent>
        <TabsContent value="files">
          <WorkerFileUploads workerId={workerId} />
        </TabsContent>
      </Tabs>

      {isAddTaskModalOpen && (
        <ModalOverlay handleToggle={() => setIsAddTaskModalOpen(false)}>
          <AddWorkerTaskModal
            workerId={workerId}
            onClose={() => setIsAddTaskModalOpen(false)}
          />
        </ModalOverlay>
      )}
    </div>
  );
};

export default TaskManagement;
