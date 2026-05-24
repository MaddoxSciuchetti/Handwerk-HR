import { useMutation } from '@tanstack/react-query';
import { taskMutations } from '../query-options/mutations/tasks.mutations';

export function useSaveTaskComment() {
  return useMutation(taskMutations.saveTaskComment());
}
