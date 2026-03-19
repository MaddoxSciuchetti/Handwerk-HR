import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import ModalOverlay from '@/components/modal/ModalOverlay';
import useEditDescription from '../hooks/useEditDescription';
import useFetchTask from '../hooks/useFetchTask';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import AddTemplateModal from './AddTemplateModal';
import EditTemplateModal from './EditTemplateModal';
import Pagination from './Pagination';
import TabsHeader from './TabsHeader';
import Tasks from './Tasks';

function TemplateTasks() {
  const { tab, setTab } = useEditDescription();
  const {
    filteredByType,
    taskLengthByTemplateType,
    tasksByTemplateType,
    isLoading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    postsPerPage,
    paginatedType,
  } = useFetchTask();

  const { modalState, closeTask, openCreateTask, openEditTask } =
    useTemplateModalContext();

  const renderModal = () => {
    switch (modalState.kind) {
      case 'open-create':
        return (
          <ModalOverlay handleToggle={closeTask}>
            <AddTemplateModal tab={tab} />
          </ModalOverlay>
        );
      case 'open-edit':
        return (
          <ModalOverlay handleToggle={closeTask}>
            <EditTemplateModal tab={tab} />
          </ModalOverlay>
        );
    }
  };
  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div
      role="region"
      aria-label="Template Aufgaben Verwaltung"
      className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl"
    >
      <SearchHeaderResuable
        search={search}
        setSearch={setSearch}
        description="Add Task"
        openModal={openCreateTask}
      />
      <TabsHeader tab={tab} setTab={setTab} />
      <Tasks items={paginatedType[tab]} openEditTask={openEditTask} />
      <div className="flex justify-between mt-2 items-center">
        <Pagination
          postsPerPage={postsPerPage}
          totalPosts={filteredByType[tab].length}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        />
        {tab === 'OFFBOARDING' ? (
          <p className="font-light text-xs text-(--muted-foreground)">
            {taskLengthByTemplateType.OFFBOARDING} Aufgaben in Offboarding
            template
          </p>
        ) : (
          <p className="font-light text-xs text-(--muted-foreground)">
            {taskLengthByTemplateType.ONBOARDING} Aufgaben in Onboarding
            template
          </p>
        )}
      </div>
      {renderModal()}
    </div>
  );
}

export default TemplateTasks;
