import { TApiResponse } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { fetchProcessData } from '../api/employee-overview.api';

function useFetchProcessData(id: number, form_type: string) {
  const queryResult = useQuery<TApiResponse>({
    queryKey: ['processData', id, form_type],
    queryFn: () => fetchProcessData(id, form_type),
  });

  return { queryResult };
}

export default useFetchProcessData;
