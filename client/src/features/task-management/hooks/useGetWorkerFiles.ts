import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

function useGetWorkerFiles(workerId: number) {
  const {
    data: fetchFiles,
    isLoading,
    isError,
    error,
  } = useQuery(workerQueries.getFiles(workerId));

  return { fetchFiles, isLoading, isError, error };
}

export default useGetWorkerFiles;
