import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDescriptionData } from '../api';

function useDeleteDescription() {
  const queryClient = useQueryClient();

  const { mutate: deleteDescription } = useMutation({
    mutationFn: deleteDescriptionData,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['description_root'] }),
  });

  return {
    deleteDescription,
  };
}

export default useDeleteDescription;
