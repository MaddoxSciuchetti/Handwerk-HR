import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import useFilteredData from '../../hooks/useFilteredData';
import useTaskData from '../../hooks/useTaskData';
import useTaskSubmit from '../../hooks/useTaskSubmit';
import { LifecycleType } from '../../types/index.types';
import WorkerFileUploads from '../files/WorkerFileUploads';
import FilterByUser from '../header/filters/Filter.ByUser';
import WorkerHeader from '../header/WorkerHeader';
import TaskSidebar from './task-sidebar/TaskSidebar';
import TaskIndividual from './TaskIndividual';

type TaskManagementProps = {
  workerId: number;
  lifecycleType: LifecycleType;
};

const TaskManagement = ({ workerId, lifecycleType }: TaskManagementProps) => {
  const { data, isLoading } = useTaskData(workerId, lifecycleType);
  const {
    descriptionSearch,
    setDescriptionSearch,
    showMyItems,
    handleMeFilter,
    displayData,
  } = useFilteredData(data);

  const { handleSubmit, selectedTaskId, setSelectedTaskId } =
    useTaskSubmit(workerId);

  const selectedTask =
    displayData.find((field) => field.id === selectedTaskId) ?? null;

  if (isLoading) return <LoadingAlert />;
  if (!data)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  return (
    <div className="flex flex-col w-5xl rounded-2xl mx-auto overflow-hidden p-6 h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)] md:max-w-8xl">
      <>
        <Tabs defaultValue="form" className="">
          <WorkerHeader
            descriptionSearch={descriptionSearch}
            setDescriptionSearch={setDescriptionSearch}
          />
          <TabsContent value="form">
            <FilterByUser
              showMyItems={showMyItems}
              handleMeFilter={handleMeFilter}
            />
            <TaskIndividual
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
