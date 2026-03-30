import { useSidebar } from '@/components/ui/sidebar';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { WorkerRecordMode } from '../types/index.types';

function useHome() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<boolean>(false);
  const [mode, setMode] = useState<WorkerRecordMode>('active');
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  const { data, error, isSuccess, isPending, isError } = useQuery(
    workerLifecycleQueries.workerData(mode)
  );

  const isEmpty = isSuccess && data?.length === 0;

  const filtered = data?.filter((item) => {
    const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesMode =
      mode === 'archived'
        ? item.status === 'archived'
        : item.status !== 'archived';

    return matchesSearch && matchesMode;
  });

  const handleNavigate = (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => {
    navigate({
      to: '/user/$Id',
      params: { Id: taskId },
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
    handleNavigate,
    modal,
    mode,
    setMode,
    setSearch,
    search,
    error,
    isError,
    isPending,
    toggleModal,
  };
}
export default useHome;
