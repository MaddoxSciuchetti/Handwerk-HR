import { useMutation } from '@tanstack/react-query';
import { workerLifecycleMutations } from '../query-options/mutations/worker-lifycycle.mutations';

function useWorkerMutations() {
  const { mutate: deleteTaskMutation } = useMutation(
    workerLifecycleMutations.deleteWorker()
  );

  const { mutate: deleteWorkersMutation, isPending: isDeletingWorkers } =
    useMutation(workerLifecycleMutations.deleteWorkers());

  const { mutate: archiveWorkerMutation } = useMutation(
    workerLifecycleMutations.archiveWorker()
  );

  const { mutate: unarchiveWorkerMutation } = useMutation(
    workerLifecycleMutations.unarchiveWorker()
  );

  return {
    deleteTaskMutation,
    deleteWorkersMutation,
    isDeletingWorkers,
    archiveWorkerMutation,
    unarchiveWorkerMutation,
  };
}

export default useWorkerMutations;
