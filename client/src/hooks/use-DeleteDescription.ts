import { deleteDescriptionData } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
