import ErrorAlert from '@/components/alerts/ErrorAlert';
import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import useAuth from '@/features/user-profile/hooks/useAuth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import LifeCycleTable from '@/features/worker-lifecycle/components/LifeCycleTable';
import useHome from '@/features/worker-lifecycle/hooks/useHome';
import SearchHeader from './SearchHeader';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  const {
    isEmpty,
    deleteTaskMutation,
    error,
    filtered,
    handleNavigate,
    modal,
    createEmployeeMutation,
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

  // if (isError || !user) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <div className="h-full w-full flex flex-col">
        <SearchHeader
          toggleModal={toggleModal}
          search={search}
          setSearch={setSearch}
        />
        <LifeCycleTable
          filtered={filtered}
          onRemove={deleteTaskMutation.mutate}
          gotopage={handleNavigate}
        />
        <LifeCycleModal
          modal={modal}
          toggleModal={toggleModal}
          createEmployeeMutation={createEmployeeMutation}
        />
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
