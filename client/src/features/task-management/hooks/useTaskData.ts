import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';
import { LifecycleType } from '../types/index.types';

function useTaskData(workerId: number, lifecycleType: LifecycleType) {
  const { data, error, isLoading, isError } = useQuery(
    workerQueries.taskData(workerId, lifecycleType)
  );

  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export default useTaskData;
