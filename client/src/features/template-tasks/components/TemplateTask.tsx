import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import ModalOverlay from '@/components/modal/ModalOverlay';
import useEditDescription from '../hooks/useEditDescription';
import useFetchTask from '../hooks/useFetchTask';
import usePostTask from '../hooks/usePostTask';
import Pagination from './Pagination';
import TabsHeader from './TabsHeader';
import Tasks from './Tasks';
import TemplateModal from './TemplateModal';

function TemplateTasks() {
  const {
    handleAddSubmitMutation,
    modal,
    tab,
    setTab,
    mode,
    setMode,
    toggleModal,
  } = usePostTask();
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

  const {
    editDescriptionMutation,
    modalState,
    setModalState,
    openDescriptionModal,
  } = useEditDescription(toggleModal);
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
        openModal={openDescriptionModal}
        action={() => setMode('ADD')}
      />
      <TabsHeader tab={tab} setTab={setTab} />
      <Tasks
        items={paginatedType[tab]}
        openDescriptionModal={openDescriptionModal}
        mode={mode}
        setMode={setMode}
      />
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
      {modalState.selectedItem && modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <TemplateModal
            setModalState={setModalState}
            toggleModal={toggleModal}
            editDescriptionMutation={editDescriptionMutation}
            handleAddSubmitMutation={handleAddSubmitMutation}
            form_field_id={modalState.selectedItem.form_field_id}
            description={modalState.selectedItem.description}
            owner={modalState.selectedItem.owner}
            template_type={tab}
            OnboardingData={tasksByTemplateType.ONBOARDING}
            OffboardingData={tasksByTemplateType.OFFBOARDING}
            mode={mode}
            setMode={setMode}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

export default TemplateTasks;
