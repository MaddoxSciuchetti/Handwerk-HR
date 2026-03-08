import { useSuspenseQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

function useGetWorkerFiles(workerId: number) {
  const { data: fetchFiles, isPending } = useSuspenseQuery(
    workerQueries.getFiles(workerId)
  );

  return { fetchFiles, isPending };
}

export default useGetWorkerFiles;
