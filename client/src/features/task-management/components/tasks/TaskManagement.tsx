import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import { useToggleModal } from '@/hooks/use-toggleModal';
import React, { useState } from 'react';
import useEditModal from '../../hooks/use-editModal';
import useTaskData from '../../hooks/use-fetchTasks';
import useFilteredData from '../../hooks/use-filteredData';
import useTaskSubmit from '../../hooks/use-taskSubmit';
import WorkerFileUploads from '../modal/files/WorkerFileUploads';
import TaskModal from '../modal/TaskModal';
import FilteredTasks from './FilteredTasks';
import TaskHeader from './TaskHeader';
import WorkerTasks from './WorkerTasks';

type OffboardingFormProps = {
  id: number;
  search: { param1: string }; // match validateSearch
};

const TaskManagement: React.FC<OffboardingFormProps> = ({ id, search }) => {
  const { user } = useAuth();
  const [activetab, setActiveTab] = useState<string>('form');
  const { toggleModal } = useToggleModal();
  const numericId = parseInt(String(id));

  const { data, isLoading } = useTaskData(numericId, search);
  const {
    descriptionSearch,
    setDescriptionSearch,
    showMyItems,
    handleMeFilter,
    displayData,
  } = useFilteredData(data);

  const { modalState, openEditModal, closeModal } = useEditModal(toggleModal);

  const { handleSubmit } = useTaskSubmit(numericId, user, closeModal);

  if (isLoading) return <Spinner />;
  if (!data) return <div>Daten Laden</div>;

  return (
    <div className="flex flex-col w-full h-150 rounded-2xl mx-auto  shadow-gray-200 shadow-lg overflow-auto p-6 md:max-w-8xl md:h-300">
      <>
        <Tabs defaultValue="form" className="">
          <TaskHeader
            descriptionSearch={descriptionSearch}
            setDescriptionSearch={setDescriptionSearch}
            activetab={activetab}
            setActiveTab={setActiveTab}
          />
          <TabsContent value="form">
            <TaskModal
              modalState={modalState}
              closeModal={closeModal}
              handleSubmit={handleSubmit}
            />
            <FilteredTasks
              showMyItems={showMyItems}
              handleMeFilter={handleMeFilter}
            />
            <WorkerTasks
              displayData={displayData}
              data={data}
              openEditModal={openEditModal}
              handleSubmit={handleSubmit}
            />
          </TabsContent>
          <TabsContent value="files">
            <WorkerFileUploads id={id} />
          </TabsContent>
        </Tabs>
      </>
    </div>
  );
};

export default TaskManagement;
