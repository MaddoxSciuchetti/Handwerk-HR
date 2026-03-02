import { DescriptionFieldResponse } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { formattedData } from '../api/index.api';

function useTaskData(id: number, search: { param1: string }) {
  const { data, error, isLoading, isError } =
    useQuery<DescriptionFieldResponse>({
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
