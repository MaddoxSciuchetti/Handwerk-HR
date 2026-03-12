import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import useAuth from '@/features/user-profile/hooks/useAuth';
import React, { useState } from 'react';
import useFilteredData from '../../hooks/useFilteredData';
import useTaskData from '../../hooks/useTaskData';
import useTaskSubmit from '../../hooks/useTaskSubmit';
import WorkerFileUploads from '../modal/files/WorkerFileUploads';
import FilteredTasks from './FilteredTasks';
import NewWorkerTask from './NewWorkerTask';
import TaskHeader from './TaskHeader';
import TaskSidebar from './task-sidebar/TaskSidebar';

type OffboardingFormProps = {
  workerId: number;
  lifecycleType: string; // match validateSearch
};

const TaskManagement: React.FC<OffboardingFormProps> = ({
  workerId,
  lifecycleType,
}) => {
  const { user } = useAuth();
  const [activetab, setActiveTab] = useState<string>('form');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const numericId = parseInt(String(workerId));
  const { data, isLoading } = useTaskData(numericId, lifecycleType);
  const {
    descriptionSearch,
    setDescriptionSearch,
    showMyItems,
    handleMeFilter,
    displayData,
  } = useFilteredData(data);
  const closeSidebar = () => setSelectedTaskId(null);
  const { handleSubmit } = useTaskSubmit(numericId, user, closeSidebar);
  const selectedTask =
    displayData.find((field) => field.id === selectedTaskId) ?? null;

  if (isLoading)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );
  if (!data) return <div>Daten Laden</div>;

  return (
    <div className="flex flex-col w-5xl h-150 rounded-2xl mx-auto  overflow-auto p-6 md:max-w-8xl md:h-300">
      <>
        <Tabs defaultValue="form" className="">
          <TaskHeader
            descriptionSearch={descriptionSearch}
            setDescriptionSearch={setDescriptionSearch}
            activetab={activetab}
            setActiveTab={setActiveTab}
          />
          <TabsContent value="form">
            <FilteredTasks
              showMyItems={showMyItems}
              handleMeFilter={handleMeFilter}
            />
            <NewWorkerTask
              tasks={displayData}
              selectedTaskId={selectedTaskId}
              handleSelectTask={setSelectedTaskId}
            />
            <TaskSidebar
              selectedTask={selectedTask}
              setSelectedTaskId={setSelectedTaskId}
              handleSubmit={handleSubmit}
            />
          </TabsContent>
          <TabsContent value="files">
            <WorkerFileUploads workerId={workerId} />
          </TabsContent>
        </Tabs>
      </>
    </div>
  );
};

export default TaskManagement;
