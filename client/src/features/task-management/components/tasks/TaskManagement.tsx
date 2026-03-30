import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import useFilteredData from '../../hooks/useFilteredData';
import useTaskData from '../../hooks/useTaskData';
import useTaskSubmit from '../../hooks/useTaskSubmit';
import { LifecycleType, WorkerTab } from '../../types/index.types';
import WorkerFileUploads from '../files/WorkerFileUploads';
import FilterByUser from '../header/filters/Filter.ByUser';
import WorkerHeader from '../header/WorkerHeader';
import AddWorkerTaskModal from './AddWorkerTaskModal';
import CreateIssueShortcutModal from './CreateIssueShortcutModal';
import TaskSidebar from './task-sidebar/TaskSidebar';
import TaskIndividual from './TaskIndividual';

type TaskManagementProps = {
  workerId: string;
  lifecycleType: LifecycleType;
};

const TaskManagement = ({ workerId, lifecycleType }: TaskManagementProps) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('form');
  const [fileDescriptionSearch, setFileDescriptionSearch] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (createIssueOpen || isAddTaskModalOpen) return;
      if (!e.metaKey || e.key.toLowerCase() !== 'c' || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)
        return;
      if (t instanceof HTMLElement && t.isContentEditable) return;
      e.preventDefault();
      setCreateIssueOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createIssueOpen, isAddTaskModalOpen]);

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
            handleAddTask={() => setIsAddTaskModalOpen(true)}
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

        {isAddTaskModalOpen && (
          <ModalOverlay handleToggle={() => setIsAddTaskModalOpen(false)}>
            <AddWorkerTaskModal
              workerId={workerId}
              lifecycleType={lifecycleType}
              onClose={() => setIsAddTaskModalOpen(false)}
            />
          </ModalOverlay>
        )}

        {createIssueOpen && (
          <ModalOverlay handleToggle={() => setCreateIssueOpen(false)}>
            <CreateIssueShortcutModal
              workerId={workerId}
              lifecycleType={lifecycleType}
              onClose={() => setCreateIssueOpen(false)}
            />
          </ModalOverlay>
        )}
      </>
    </div>
  );
};

export default TaskManagement;
