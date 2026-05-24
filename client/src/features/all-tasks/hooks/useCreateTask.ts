import { useMutation } from '@tanstack/react-query';
import { taskMutations } from '../query-options/mutations/tasks.mutations';

export function useCreateTask() {
  return useMutation(taskMutations.createTask());
}
