import SearchHeader from '@/components/SearchHeader';
import HandwerkerTable from '@/components/HandwerkerTable';
import useAuth from '@/hooks/use-Auth';
import HomeModal from '@/components/home/HomeModal';
import useHome from '@/hooks/use-home';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import SuccessAlert from '@/components/alerts/SuccessAlert';

function OnOf_Home() {
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

  if (isLoading) {
    return <LoadingAlert />;
  }

  if (isError || !user) {
    return <ErrorAlert />;
  }

  if (error) return <ErrorAlert message={error.message} />;
  if (isEmpty) return <SuccessAlert />;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <SearchHeader
        toggleModal={toggleModal}
        search={search}
        setSearch={setSearch}
      />
      <HandwerkerTable
        filtered={filtered}
        onRemove={deleteTaskMutation.mutate}
        gotopage={handleNavigate}
      />
      <HomeModal
        modal={modal}
        toggleModal={toggleModal}
        createEmployeeMutation={createEmployeeMutation}
      />
    </div>
  );
}

export default OnOf_Home;
