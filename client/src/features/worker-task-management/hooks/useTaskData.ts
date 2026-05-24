import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

function useTaskData(workerId: string) {
  const { data, error, isLoading, isError } = useQuery(
    workerQueries.taskData(workerId)
  );

  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export default useTaskData;
