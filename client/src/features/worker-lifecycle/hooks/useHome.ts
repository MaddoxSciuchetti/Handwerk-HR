import { LifecycleType } from '@/features/task-management/types/index.types';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { WorkerListMode } from '../types/index.types';

function useHome() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<boolean>(false);
  const [mode, setMode] = useState<WorkerListMode>('active');

  const navigate = useNavigate({ from: '/' });

  const toggleModal = () => {
    setModal((prev) => !prev);
  };

  const { data: workers, error } = useQuery(
    workerLifecycleQueries.workerData()
  );

  const handleNavigate = (
    taskId: string,
    form_type: LifecycleType,
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
    workers,
    handleNavigate,
    modal,
    mode,
    setMode,
    setSearch,
    search,
    error,
    toggleModal,
  };
}
export default useHome;
