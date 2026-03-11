import ErrorAlert from '@/components/alerts/ErrorAlert';
import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import useAuth from '@/features/user-profile/hooks/useAuth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import LifeCycleTable from '@/features/worker-lifecycle/components/LifeCycleTable';
import useHome from '@/features/worker-lifecycle/hooks/useHome';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  const {
    deleteTaskMutation,
    error,
    filtered,
    handleNavigate,
    modal,
    addWorkerMutation,
    search,
    setSearch,
    toggleModal,
  } = useHome();

  if (isLoading)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );

  if (isError || !user) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col">
        <SearchHeaderResuable
          toggleModal={toggleModal}
          search={search}
          setSearch={setSearch}
          description="Handwerker hinzufügen"
        />
        <LifeCycleTable
          filtered={filtered}
          onRemove={deleteTaskMutation}
          gotopage={handleNavigate}
        />
        <LifeCycleModal
          modal={modal}
          toggleModal={toggleModal}
          addWorkerMutation={addWorkerMutation}
        />
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
