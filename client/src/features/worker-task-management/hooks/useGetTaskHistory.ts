import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

export const useGetTaskHistory = (taskId: string) => {
  const { data, isLoading, error, refetch } = useQuery(
    workerQueries.getTaskHistory(taskId)
  );

  return {
    historyData: data,
    isLoading,
    error,
    refetchHistory: refetch,
  };
};
