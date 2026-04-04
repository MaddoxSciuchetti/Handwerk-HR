import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import useFilteredData from '../../hooks/useFilteredData';
import useTaskData from '../../hooks/useTaskData';
import useTasks from '../../hooks/useTasks';
import useTaskSubmit from '../../hooks/useTaskSubmit';
import { LifecycleType } from '../../types/index.types';
import WorkerFileUploads from '../files/WorkerFileUploads';
import FilterByUser from '../header/filters/Filter.ByUser';
import WorkerHeader from '../header/WorkerHeader';
import ApplyFromTemplateModal from './ApplyFromTemplateModal';
import CreateIssueShortcutModal from './CreateIssueShortcutModal';
import TaskSidebar from './task-sidebar/TaskSidebar';
import TaskIndividual from './TaskIndividual';

type TaskManagementProps = {
  workerId: string;
  lifecycleType: LifecycleType;
};

const TaskManagement = ({ workerId, lifecycleType }: TaskManagementProps) => {
  const {
    activeTab,
    setActiveTab,
    fileDescriptionSearch,
    setFileDescriptionSearch,
    createIssueOpen,
    setCreateIssueOpen,
    applyTemplateOpen,
    setApplyTemplateOpen,
  } = useTasks();
  const { data, isLoading } = useTaskData(workerId, lifecycleType);
  const {
    descriptionSearch,
    setDescriptionSearch,
    showMyItems,
    handleMeFilter,
    displayData,
  } = useFilteredData(data);

  const { handleSubmit, selectedTaskId, setSelectedTaskId } = useTaskSubmit(
    workerId,
    lifecycleType,
    String(data?.form?.id ?? '')
  );

  const selectedTask =
    displayData.find((field) => field.id === selectedTaskId) ?? null;

  const searchValue =
    activeTab === 'files' ? fileDescriptionSearch : descriptionSearch;
  const setSearchValue =
    activeTab === 'files' ? setFileDescriptionSearch : setDescriptionSearch;
  const searchPlaceholder =
    activeTab === 'files' ? 'Dateiname suchen' : 'Beschreibung suchen';

  if (isLoading) return <LoadingAlert />;
  if (!data)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  return (
    <div className="flex flex-col w-5xl rounded-2xl mx-auto overflow-hidden p-6 h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)] md:max-w-8xl">
      <>
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'form' || value === 'files') {
              setActiveTab(value);
            }
          }}
        >
          <WorkerHeader
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            searchPlaceholder={searchPlaceholder}
            onCreateIssue={() => setCreateIssueOpen(true)}
            showApplyFromTemplate={activeTab === 'form'}
            onApplyFromTemplate={() => setApplyTemplateOpen(true)}
          />
          <TabsContent value="form">
            <FilterByUser
              showMyItems={showMyItems}
              handleMeFilter={handleMeFilter}
            />
            <TaskIndividual
              workerId={workerId}
              tasks={displayData}
              selectedTaskId={selectedTaskId}
              handleSelectTask={setSelectedTaskId}
            />
            <TaskSidebar
              workerId={workerId}
              selectedTask={selectedTask}
              setSelectedTaskId={setSelectedTaskId}
              handleSubmit={handleSubmit}
            />
          </TabsContent>
          <TabsContent value="files">
            <WorkerFileUploads
              workerId={workerId}
              fileDescriptionSearch={fileDescriptionSearch}
            />
          </TabsContent>
        </Tabs>

        {createIssueOpen && (
          <ModalOverlay handleToggle={() => setCreateIssueOpen(false)}>
            <CreateIssueShortcutModal
              workerId={workerId}
              lifecycleType={lifecycleType}
              onClose={() => setCreateIssueOpen(false)}
            />
          </ModalOverlay>
        )}

        {applyTemplateOpen && (
          <ModalOverlay handleToggle={() => setApplyTemplateOpen(false)}>
            <ApplyFromTemplateModal
              workerId={workerId}
              workerEngagementId={String(data.form.id)}
              lifecycleType={lifecycleType}
              onClose={() => setApplyTemplateOpen(false)}
            />
          </ModalOverlay>
        )}
      </>
    </div>
  );
};

export default TaskManagement;
