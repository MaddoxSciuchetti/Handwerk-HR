import { useQuery } from '@tanstack/react-query';
import { formattedData } from '../api/index.api';
import { api_Response } from '../types/index.type';

function useTaskData(id: number, search: { param1: string }) {
  console.log('id in submit:', id, typeof id);
  const { data, error, isLoading, isError } = useQuery<api_Response>({
    queryKey: ['somethingelse', id],
    queryFn: () => formattedData(id, search.param1),
  });
  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export default useTaskData;
