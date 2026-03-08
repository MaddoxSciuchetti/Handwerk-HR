import { useMutation } from '@tanstack/react-query';
import { templateMutations } from '../query-options/mutations/template.mutations';

function useDeleteDescription() {
  const { mutate: deleteDescription } = useMutation(templateMutations.delete());
  return {
    deleteDescription,
  };
}

export default useDeleteDescription;
