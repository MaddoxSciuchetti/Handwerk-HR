import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useEffect } from 'react';
import useFetchTask from '../hooks/useFetchTask';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import AddTemplateModal from './AddTemplateModal';
import EditTemplateModal from './EditTemplateModal';
import TabsFooter from './TabsFooter';
import TabsHeader from './TabsHeader';
import Tasks from './Tasks';

function TemplateTasks() {
  const {
    filteredByType,
    taskLengthByTemplateType,
    isLoading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    postsPerPage,
    paginatedType,
  } = useFetchTask();

  const { modalState, closeTask, openCreateTask, openEditTask, tab, setTab } =
    useTemplateModalContext();

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, setCurrentPage]);

  const renderModal = () => {
    switch (modalState.kind) {
      case 'open-create':
        return (
          <ModalOverlay handleToggle={closeTask}>
            <AddTemplateModal />
          </ModalOverlay>
        );
      case 'open-edit':
        return (
          <ModalOverlay handleToggle={closeTask}>
            <EditTemplateModal />
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
      <TabsFooter
        currentPage={currentPage}
        tab={tab}
        postsPerPage={postsPerPage}
        taskLengthByTemplateType={taskLengthByTemplateType}
        setCurrentPage={setCurrentPage}
        totalPosts={filteredByType[tab].length}
      />
      {renderModal()}
    </div>
  );
}

export default TemplateTasks;
