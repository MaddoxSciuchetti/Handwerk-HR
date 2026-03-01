import { useQuery } from '@tanstack/react-query';
import { getHistoryData } from '../api/index.api';

export type Response = {
  id: number;
  form_input_id: number;
  status: string;
  edit: string;
  timestamp: string;
  changed_by: string;
  auth_user: {
    id: string;
    email: string;
    verified: boolean;
  };
};

export const useGetHistory = (id: number) => {
  const { data, isLoading, error, refetch } = useQuery<Response[]>({
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
