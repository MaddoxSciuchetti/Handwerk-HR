import { useMutation } from '@tanstack/react-query';
import { taskMutations } from '../query-options/mutations/tasks.mutations';

export function useDeleteTasks() {
  return useMutation(taskMutations.deleteTasks());
}
