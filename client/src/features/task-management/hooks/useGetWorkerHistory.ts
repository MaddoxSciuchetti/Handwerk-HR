import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

export type TAuth_User = {
  id: string;
  email: string;
  verified: boolean;
  cloud_url: string;
};

export const useGetWorkerHistory = (id: number) => {
  const { data, isLoading, error, refetch } = useQuery(
    workerQueries.getHistory(id)
  );

  return {
    historyData: data,
    isLoading,
    error,
    refetchHistory: refetch,
  };
};
