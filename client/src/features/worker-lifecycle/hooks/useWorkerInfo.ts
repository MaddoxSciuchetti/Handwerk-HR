import { useQuery } from '@tanstack/react-query';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { FormType } from '../types/index.types';

function useWorkerInfo(
  isOpen: boolean,
  workerId: number,
  lifecycleType: FormType
) {
  const {
    data: workerInfo,
    isLoading,
    isError,
  } = useQuery({
    ...workerLifecycleQueries.workerById(workerId, lifecycleType),
    enabled: isOpen,
  });

  return {
    workerInfo,
    isLoading,
    isError,
  };
}

export default useWorkerInfo;
