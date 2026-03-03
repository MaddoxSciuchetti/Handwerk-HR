import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTemplateTask } from '../api';

function useDeleteDescription() {
  const queryClient = useQueryClient();

  const { mutate: deleteDescription } = useMutation({
    mutationFn: deleteTemplateTask,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['description_root'] }),
  });

  return {
    deleteDescription,
  };
}

export default useDeleteDescription;
