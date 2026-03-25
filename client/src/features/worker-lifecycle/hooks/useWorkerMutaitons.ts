import { useMutation } from '@tanstack/react-query';
import { workerLifecycleMutations } from '../query-options/mutations/worker-lifycycle.mutations';

function useWorkerMutations() {
  const { mutate: deleteTaskMutation } = useMutation(
    workerLifecycleMutations.deleteWorker()
  );

  const { mutate: archiveWorkerMutation } = useMutation(
    workerLifecycleMutations.archiveWorker()
  );

  const { mutate: unarchiveWorkerMutation } = useMutation(
    workerLifecycleMutations.unarchiveWorker()
  );

  return {
    deleteTaskMutation,
    archiveWorkerMutation,
    unarchiveWorkerMutation,
  };
}

export default useWorkerMutations;
