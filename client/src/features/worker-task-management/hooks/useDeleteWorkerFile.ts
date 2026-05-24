import { useMutation } from '@tanstack/react-query';
import { workerMutations } from '../query-options/mutations/worker.mutations';

function useDeleteWorkerFile(workerId: string) {
  const { mutate: deleteFiles, ...options } = useMutation(
    workerMutations.deleteWorker(workerId)
  );

  return { deleteFiles, options };
}
export default useDeleteWorkerFile;
