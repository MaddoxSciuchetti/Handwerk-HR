import { useSidebar } from '@/components/ui/sidebar';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { workerLifecycleMutations } from '../query-options/mutations/worker-lifycycle.mutations';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { FormType } from '../types/index.types';

function useHome() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<boolean>(false);
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate({ from: '/' });

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  const { data, error, isSuccess } = useQuery(
    workerLifecycleQueries.workerData()
  );

  const isEmpty = isSuccess && data?.length === 0;

  const filtered = data?.filter((item) =>
    item.vorname.toLowerCase().includes(search.toLowerCase())
  );

  const { mutate: deleteTaskMutation } = useMutation(
    workerLifecycleMutations.deleteWorker()
  );

  const handleNavigate = (
    taskId: number,
    form_type: FormType,
    workerName: string
  ) => {
    navigate({
      to: '/user/$Id',
      params: { Id: String(taskId) },
      search: {
        lifecycleType: form_type,
        workerName,
        prevPage: 'Worker Lifecycle',
      },
    });
  };

  return {
    isEmpty,
    filtered,
    deleteTaskMutation,
    handleNavigate,
    modal,
    setSearch,
    search,
    error,
    toggleModal,
  };
}
export default useHome;
