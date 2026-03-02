import { useQuery } from '@tanstack/react-query';
import { getHistoryData } from '../api/index.api';
import { THistoryData } from '../types/index.types';

export type TAuth_User = {
  id: string;
  email: string;
  verified: boolean;
};

export const useGetHistory = (id: number) => {
  const { data, isLoading, error, refetch } = useQuery<THistoryData[]>({
    queryKey: ['formHistory', id],
    queryFn: () => getHistoryData(id),
    enabled: !!id,
  });

  return {
    historyData: data,
    isLoading,
    error,
    refetchHistory: refetch,
  };
};
