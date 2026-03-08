import { useSidebar } from '@/components/ui/sidebar';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { workerLifecycleMutations } from '../query-options/mutations/worker-lifycycle.mutations';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { FormType, WorkerItem } from '../types/index.types';

function useHome() {
  const [search, setSearch] = useState('');
  const { toggleSidebar } = useSidebar();
  const [modal, setModal] = useState<boolean>(false);
  const navigate = useNavigate({ from: '/' });

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  const { data, error, isSuccess } = useQuery<WorkerItem[]>(
    workerLifecycleQueries.workerData()
  );

  const isEmpty = isSuccess && data?.length === 0;

  const filtered = data?.filter((item) =>
    item.vorname.toLowerCase().includes(search.toLowerCase())
  );

  const { mutate: deleteTaskMutation } = useMutation(
    workerLifecycleMutations.deleteWorker()
  );

  const { mutate: addWorkerMutation } = useMutation(
    workerLifecycleMutations.addWorker()
  );

  const handleNavigate = (taskId: number, form_type: FormType) => {
    navigate({
      to: '/user/$Id',
      params: { Id: String(taskId) },
      search: { lifecycleType: form_type },
    });
  };

  return {
    isEmpty,
    filtered,
    deleteTaskMutation,
    addWorkerMutation,
    handleNavigate,
    modal,
    setSearch,
    search,
    error,
    toggleModal,
  };
}
export default useHome;
