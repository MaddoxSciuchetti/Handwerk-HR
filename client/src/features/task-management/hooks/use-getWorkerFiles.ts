import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';

function useGetWorkerFiles(id: number) {
  const { data: fetchFiles, isPending } = useQuery(workerQueries.getFiles(id));

  return { fetchFiles, isPending };
}

export default useGetWorkerFiles;
