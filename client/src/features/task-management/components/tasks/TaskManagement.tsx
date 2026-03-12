import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import useFilteredData from '../../hooks/useFilteredData';
import useTaskData from '../../hooks/useTaskData';
import useTaskSubmit from '../../hooks/useTaskSubmit';
import WorkerFileUploads from '../files/WorkerFileUploads';
import FilterByUser from '../header/filters/Filter.ByUser';
import WorkerHeader from '../header/WorkerHeader';
import TaskSidebar from './task-sidebar/TaskSidebar';
import TaskIndividual from './TaskIndividual';

type TaskManagementProps = {
  workerId: number;
  lifecycleType: string;
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
  if (!data) return <ErrorAlert />;

  return (
    <div className="flex flex-col w-5xl h-150 rounded-2xl mx-auto  overflow-auto p-6 md:max-w-8xl md:h-300">
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
