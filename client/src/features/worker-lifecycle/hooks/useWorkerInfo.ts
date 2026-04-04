
import { useQuery } from '@tanstack/react-query';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';

function useWorkerInfo(
  isOpen: boolean,
  workerId: string,
) {
  const {
    data: workerInfo,
    isLoading,
    isError,
  } = useQuery({
    ...workerLifecycleQueries.workerById(workerId),
    enabled: isOpen,
  });

  return {
    workerInfo,
    isLoading,
    isError,
  };
}

export default useWorkerInfo;
