import { useMutation } from '@tanstack/react-query';
import { taskMutations } from '../query-options/mutations/task.mutations';

export function useDeleteTemplateTask() {
  const { mutate: deleteTemplateTask } = useMutation(
    taskMutations.deleteTask()
  );
  return {
    deleteTemplateTask,
  };
}
