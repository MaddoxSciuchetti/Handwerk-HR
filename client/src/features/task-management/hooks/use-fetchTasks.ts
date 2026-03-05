import { DescriptionFieldResponse } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { getWorkerById } from '../api/index.api';
import { WORKERBYID } from '../consts/query-key.consts';

function useTaskData(id: number, search: { param1: string }) {
  const { data, error, isLoading, isError } =
    useQuery<DescriptionFieldResponse>({
      queryKey: [WORKERBYID, id],
      queryFn: () => getWorkerById(id, search.param1),
    });
  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export default useTaskData;
