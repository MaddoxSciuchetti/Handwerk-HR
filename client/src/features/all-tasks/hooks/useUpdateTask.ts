import { useMutation } from '@tanstack/react-query';
import { taskMutations } from '../query-options/mutations/tasks.mutations';

export function useUpdateTask() {
  return useMutation(taskMutations.updateTask());
}
