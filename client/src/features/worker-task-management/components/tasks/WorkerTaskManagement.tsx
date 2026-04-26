import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import {
  Cell,
  CellHolder,
  GrowingItem,
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
import FilterByUser from '../header/filters/Filter.ByUser';
import WorkerHeader from '../header/WorkerHeader';
import AddWorkerTaskModal from './AddWorkerTaskModal';
import { WorkerTaskRow } from './WorkerTaskRow';

type TaskManagementProps = {
  workerId: string;
};

const TaskManagement = ({ workerId }: TaskManagementProps) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('form');
  const [fileDescriptionSearch, setFileDescriptionSearch] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const { data, isLoading } = useTaskData(workerId);

  const {
    descriptionSearch,
    setDescriptionSearch,
    showMyItems,
    handleMeFilter,
    displayData,
  } = useFilteredData(data);

  const { sidebarKey, sidebarProps, openForEdit } = useTaskSidebar();

  if (isLoading) return <LoadingAlert />;
  if (!data)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  const searchValue =
    activeTab === 'files' ? fileDescriptionSearch : descriptionSearch;
  const setSearchValue =
    activeTab === 'files' ? setFileDescriptionSearch : setDescriptionSearch;
  const searchPlaceholder =
    activeTab === 'files' ? 'Dateiname suchen' : 'Beschreibung suchen';

  return (
    <div className="flex flex-col w-5xl rounded-2xl mx-auto overflow-hidden p-6 h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)] md:max-w-8xl">
      <TaskSidebar key={sidebarKey} {...sidebarProps} />
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
          <Table>
            <TableDivider />
            <ItemHeader className="p-0">
              <GrowingItem className="py-2 pl-10">
                <p className="typo-body-sm">Titel</p>
              </GrowingItem>
              <CellHolder>
                <Cell className="typo-body-sm">Beschreibung</Cell>
              </CellHolder>
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
            onClose={() => setIsAddTaskModalOpen(false)}
          />
        </ModalOverlay>
      )}
    </div>
  );
};

export default TaskManagement;
