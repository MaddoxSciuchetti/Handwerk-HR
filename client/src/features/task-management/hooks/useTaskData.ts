import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

function useTaskData(id: number, lifecycleType: string) {
  const { data, error, isLoading, isError } = useQuery(
    workerQueries.taskData(id, lifecycleType)
  );

  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export default useTaskData;
