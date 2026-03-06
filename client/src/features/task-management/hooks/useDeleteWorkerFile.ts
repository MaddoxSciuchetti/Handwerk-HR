import { useMutation } from '@tanstack/react-query';
import { workerMutations } from '../query-options/mutations/worker.mutations';

function useDeleteWorkerFile(id: number) {
  const { mutate: deleteFiles, ...options } = useMutation(
    workerMutations.deleteWorker(id)
  );

  return { deleteFiles, options };
}
export default useDeleteWorkerFile;
