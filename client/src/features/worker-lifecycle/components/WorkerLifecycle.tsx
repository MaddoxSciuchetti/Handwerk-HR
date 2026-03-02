import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import SuccessAlert from '@/components/alerts/SuccessAlert';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import LifeCycleTable from '@/features/worker-lifecycle/components/LifeCycleTable';
import useHome from '@/features/worker-lifecycle/hooks/use-home';
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

  if (isLoading) return <LoadingAlert />;
  if (isError || !user) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;
  if (isEmpty) return <SuccessAlert />;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
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
  );
}

export default WorkerLifeCycle;
